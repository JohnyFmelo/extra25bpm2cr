
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
    console.log('=== INÍCIO DA CONVERSÃO PDF PARA WORD ===');
    
    // Validação da requisição
    let requestData;
    try {
      requestData = await req.json();
      console.log('Dados da requisição recebidos:', { 
        pdfPath: requestData.pdfPath, 
        fileName: requestData.fileName 
      });
    } catch (parseError) {
      console.error('Erro ao fazer parse da requisição JSON:', parseError);
      throw new Error('Formato de requisição inválido. Esperado JSON com pdfPath e fileName.');
    }

    const { pdfPath, fileName }: ConvertRequest = requestData;
    
    if (!pdfPath || !fileName) {
      console.error('Parâmetros faltando:', { pdfPath, fileName });
      throw new Error('O caminho do PDF (pdfPath) e o nome do arquivo (fileName) são obrigatórios.');
    }

    // Verificação das credenciais da Adobe
    console.log('=== VERIFICANDO CREDENCIAIS DA ADOBE ===');
    const adobeClientId = Deno.env.get('ADOBE_CLIENT_ID');
    const adobeClientSecret = Deno.env.get('ADOBE_CLIENT_SECRET');
    
    console.log('Adobe Client ID configurado:', adobeClientId ? 'SIM' : 'NÃO');
    console.log('Adobe Client Secret configurado:', adobeClientSecret ? 'SIM' : 'NÃO');
    
    if (!adobeClientId || !adobeClientSecret) {
      console.error('Credenciais da Adobe não encontradas nas variáveis de ambiente');
      throw new Error('As credenciais da Adobe (ADOBE_CLIENT_ID e ADOBE_CLIENT_SECRET) não estão configuradas nas variáveis de ambiente.');
    }

    // Inicialização do cliente Supabase
    console.log('=== INICIALIZANDO CLIENTE SUPABASE ===');
    const supabaseUrl = 'https://evsfhznfnifmqlpktbdr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2c2Zoem5mbmlmbXFscGt0YmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNDY1MjMsImV4cCI6MjA1MjYyMjUyM30.5Khm1eXEsm8SCuN7VYEVRYSbKc0A-T_Xo4hUUvibkgM';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando conversão de PDF para Word para:', fileName);
    console.log('Caminho do arquivo:', pdfPath);

    // Download do PDF do Supabase Storage
    console.log('=== BAIXANDO PDF DO STORAGE ===');
    let pdfData;
    try {
      const { data, error: downloadError } = await supabase.storage
        .from('tco-pdfs')
        .download(pdfPath);

      if (downloadError) {
        console.error('Erro detalhado do Storage:', downloadError);
        throw new Error(`Erro do Supabase Storage: ${downloadError.message} (Código: ${downloadError.statusCode || 'N/A'})`);
      }

      if (!data) {
        console.error('Dados do PDF retornaram null/undefined');
        throw new Error('Arquivo PDF não encontrado ou vazio no Storage');
      }

      pdfData = data;
      console.log('PDF baixado com sucesso, tamanho:', pdfData.size, 'bytes');
      
    } catch (storageError) {
      console.error('Erro crítico no acesso ao Storage:', storageError);
      throw new Error(`Falha ao acessar o arquivo no Storage: ${storageError.message}`);
    }

    // Obtenção do token de acesso da Adobe
    console.log('=== OBTENDO TOKEN DA ADOBE ===');
    let accessToken;
    try {
      console.log('Fazendo requisição de token para Adobe...');
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

      console.log('Status da resposta de token:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Erro da Adobe (Token):', errorText);
        throw new Error(`Falha na autenticação com Adobe (${tokenResponse.status}): ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      
      if (!accessToken) {
        console.error('Token recebido mas access_token está vazio:', tokenData);
        throw new Error('Adobe retornou resposta sem access_token válido');
      }
      
      console.log('Token da Adobe obtido com sucesso');
      
    } catch (tokenError) {
      console.error('Erro crítico na obtenção do token:', tokenError);
      throw new Error(`Falha ao obter token da Adobe: ${tokenError.message}`);
    }

    // Criação do job de conversão
    console.log('=== CRIANDO JOB DE CONVERSÃO NA ADOBE ===');
    let jobData;
    try {
      console.log('Enviando requisição de criação de job...');
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

      console.log('Status da resposta de criação de job:', convertResponse.status);

      if (!convertResponse.ok) {
        const errorText = await convertResponse.text();
        console.error('Erro da Adobe (Job Creation):', errorText);
        throw new Error(`Falha ao criar job na Adobe (${convertResponse.status}): ${errorText}`);
      }

      jobData = await convertResponse.json();
      console.log('Job criado com sucesso. Upload URI recebida:', jobData.uploadUri ? 'SIM' : 'NÃO');
      console.log('Download URI recebida:', jobData.downloadUri ? 'SIM' : 'NÃO');
      
      if (!jobData.uploadUri || !jobData.downloadUri) {
        console.error('Resposta da Adobe não contém URIs necessárias:', jobData);
        throw new Error('Adobe retornou resposta incompleta (URIs faltando)');
      }
      
    } catch (jobError) {
      console.error('Erro crítico na criação do job:', jobError);
      throw new Error(`Falha ao criar job na Adobe: ${jobError.message}`);
    }

    // Upload do PDF
    console.log('=== FAZENDO UPLOAD DO PDF ===');
    try {
      console.log('Iniciando upload para Adobe...');
      const uploadResponse = await fetch(jobData.uploadUri, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': adobeClientId,
        },
        body: pdfData,
      });

      console.log('Status do upload:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Erro da Adobe (Upload):', errorText);
        throw new Error(`Falha no upload para Adobe (${uploadResponse.status}): ${errorText}`);
      }

      console.log('Upload do PDF concluído com sucesso');
      
    } catch (uploadError) {
      console.error('Erro crítico no upload:', uploadError);
      throw new Error(`Falha no upload do PDF: ${uploadError.message}`);
    }

    // Aguardar conclusão e baixar resultado
    console.log('=== AGUARDANDO CONCLUSÃO DA CONVERSÃO ===');
    let downloadUrl: string | null = null;
    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`Tentativa ${attempt + 1}/${maxAttempts} de verificação do status...`);
      
      try {
        const statusResponse = await fetch(jobData.downloadUri, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-api-key': adobeClientId,
          },
        });

        console.log(`Status da verificação ${attempt + 1}:`, statusResponse.status);

        if (statusResponse.ok) {
          downloadUrl = jobData.downloadUri;
          console.log('Conversão concluída! Download disponível.');
          break;
        }

        if (statusResponse.status === 202) {
          console.log('Conversão ainda em andamento...');
          await delay(2000);
          continue;
        }

        // Outros códigos de erro
        const errorText = await statusResponse.text();
        console.error(`Erro inesperado na verificação (${statusResponse.status}):`, errorText);
        
        if (attempt === maxAttempts - 1) {
          throw new Error(`Adobe: Tempo limite excedido na conversão após ${maxAttempts} tentativas`);
        }

        await delay(2000);
        
      } catch (statusError) {
        console.error(`Erro na tentativa ${attempt + 1}:`, statusError);
        if (attempt === maxAttempts - 1) {
          throw new Error(`Falha na verificação do status: ${statusError.message}`);
        }
        await delay(2000);
      }
    }

    if (!downloadUrl) {
      throw new Error('Adobe: Não foi possível obter URL de download após todas as tentativas');
    }

    // Download do arquivo convertido
    console.log('=== BAIXANDO ARQUIVO CONVERTIDO ===');
    let convertedData;
    try {
      console.log('Baixando arquivo convertido da Adobe...');
      const downloadResponse = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': adobeClientId,
        },
      });

      console.log('Status do download:', downloadResponse.status);

      if (!downloadResponse.ok) {
        const errorText = await downloadResponse.text();
        console.error('Erro da Adobe (Download):', errorText);
        throw new Error(`Falha ao baixar arquivo convertido (${downloadResponse.status}): ${errorText}`);
      }

      convertedData = await downloadResponse.arrayBuffer();
      console.log('Arquivo convertido baixado com sucesso, tamanho:', convertedData.byteLength, 'bytes');
      
    } catch (downloadError) {
      console.error('Erro crítico no download:', downloadError);
      throw new Error(`Falha ao baixar arquivo convertido: ${downloadError.message}`);
    }

    // Retorno do documento Word convertido
    const wordFileName = fileName.replace(/\.pdf$/i, '.docx');
    console.log('=== CONVERSÃO CONCLUÍDA COM SUCESSO ===');
    console.log('Nome do arquivo Word gerado:', wordFileName);
    
    return new Response(convertedData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${wordFileName}"`,
        'Content-Length': convertedData.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('=== ERRO GERAL NA FUNÇÃO ===');
    console.error('Tipo do erro:', error.constructor.name);
    console.error('Mensagem do erro:', error.message);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Falha ao converter PDF para Word',
        details: error.toString(),
        timestamp: new Date().toISOString()
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
