
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Headers para permitir requisições de outros domínios (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para a requisição que a função espera receber
interface ConvertRequest {
  pdfPath: string;
  fileName: string;
}

// Função de utilidade para criar pausas entre as chamadas de API
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Função principal do servidor Deno
serve(async (req) => {
  // Lida com a requisição CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfPath, fileName }: ConvertRequest = await req.json();
    
    if (!pdfPath || !fileName) {
      throw new Error('O caminho do PDF (pdfPath) e o nome do arquivo (fileName) são obrigatórios.');
    }

    // Inicializa o cliente do Supabase
    const supabaseUrl = 'https://evsfhznfnifmqlpktbdr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2c2Zoem5mbmlmbXFscGt0YmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNDY1MjMsImV4cCI6MjA1MjYyMjUyM30.5Khm1eXEsm8SCuN7VYEVRYSbKc0A-T_Xo4hUUvibkgM';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando conversão de PDF para Word para:', fileName);

    // Baixa o PDF do Supabase Storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('tco-pdfs')
      .download(pdfPath);

    if (downloadError || !pdfData) {
      throw new Error(`Falha ao baixar o PDF: ${downloadError?.message}`);
    }

    console.log('PDF baixado com sucesso, tamanho:', pdfData.size);

    // --- Início da Lógica da Adobe PDF Services ---

    // Pega as credenciais da Adobe das variáveis de ambiente
    const adobeClientId = Deno.env.get('ADOBE_CLIENT_ID');
    const adobeClientSecret = Deno.env.get('ADOBE_CLIENT_SECRET');
    
    if (!adobeClientId || !adobeClientSecret) {
      throw new Error('As credenciais da Adobe (ADOBE_CLIENT_ID e ADOBE_CLIENT_SECRET) não estão configuradas.');
    }

    // Passo 1: Obter token de acesso
    console.log('Adobe: Obtendo token de acesso...');
    const tokenResponse = await fetch('https://ims-na1.adobelogin.com/ims/token/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'client_id': adobeClientId,
        'client_secret': adobeClientSecret,
        'grant_type': 'client_credentials',
        'scope': 'openid,AdobeID,read_organizations,additional_info.projectedProductContext,additional_info.job_function'
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Falha ao obter token da Adobe: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('Adobe: Token obtido com sucesso');

    // Passo 2: Converter PDF para base64
    const pdfArrayBuffer = await pdfData.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfArrayBuffer)));

    // Passo 3: Criar job de conversão
    console.log('Adobe: Criando job de conversão...');
    const convertResponse = await fetch('https://cpf-ue1.adobe.io/ops/:create?respondWith=%7B%22reltype%22%3A%22http%3A//ns.adobe.com/rel/primary%22%7D', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': adobeClientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'assetID': 'urn:aaid:AS:UE1:' + crypto.randomUUID(),
        'input': {
          'cpf:inputs': {
            'documentIn': {
              'cpf:location': 'InputFile0',
              'dc:format': 'application/pdf'
            }
          },
          'cpf:engine': {
            'repo:assetId': 'urn:aaid:cpf:Service-1538ece812254acaac2a07799503a430'
          },
          'cpf:outputs': {
            'documentOut': {
              'cpf:location': 'multipartLabel',
              'dc:format': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
          }
        },
        'contentAnalyzerRequests': {
          'cpf:inputs': {
            'documentIn': {
              'cpf:location': 'InputFile0'
            }
          }
        }
      }),
    });

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      throw new Error(`Falha ao criar job na Adobe: ${errorText}`);
    }

    const jobData = await convertResponse.json();
    console.log('Adobe: Job criado com sucesso');

    // Passo 4: Upload do PDF
    console.log('Adobe: Fazendo upload do PDF...');
    const uploadResponse = await fetch(jobData.uploadUri, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': adobeClientId,
      },
      body: pdfData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Falha no upload para Adobe: ${errorText}`);
    }

    console.log('Adobe: Upload concluído');

    // Passo 5: Aguardar conclusão e baixar resultado
    console.log('Adobe: Aguardando conclusão da conversão...');
    let downloadUrl: string | null = null;
    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResponse = await fetch(jobData.downloadUri, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': adobeClientId,
        },
      });

      if (statusResponse.ok) {
        downloadUrl = jobData.downloadUri;
        break;
      }

      if (statusResponse.status === 202) {
        console.log('Adobe: Conversão ainda em andamento...');
        await delay(2000);
        continue;
      }

      if (attempt === maxAttempts - 1) {
        throw new Error('Adobe: Tempo limite excedido na conversão');
      }

      await delay(2000);
    }

    if (!downloadUrl) {
      throw new Error('Adobe: Não foi possível obter URL de download');
    }

    // Passo 6: Baixar o arquivo convertido
    console.log('Adobe: Baixando arquivo convertido...');
    const downloadResponse = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': adobeClientId,
      },
    });

    if (!downloadResponse.ok) {
      throw new Error('Adobe: Falha ao baixar arquivo convertido');
    }

    const convertedData = await downloadResponse.arrayBuffer();
    console.log('Adobe: Arquivo convertido baixado, tamanho:', convertedData.byteLength);

    // --- Fim da Lógica da Adobe PDF Services ---

    // Retorna o documento Word convertido
    const wordFileName = fileName.replace(/\.pdf$/i, '.docx');
    
    return new Response(convertedData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${wordFileName}"`,
        'Content-Length': convertedData.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Erro na função pdf-to-word-converter:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Falha ao converter PDF para Word',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
