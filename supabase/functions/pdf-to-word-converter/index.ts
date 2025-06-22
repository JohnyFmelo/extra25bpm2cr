//
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Headers para permitir requisições de outros domínios (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para a requisição
interface ConvertRequest {
  pdfPath: string;
  fileName: string;
}

// Função de pausa
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Função principal do servidor Deno
serve(async (req) => {
  // Lida com a requisição CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== INÍCIO DA CONVERSÃO PDF PARA WORD ===');
    
    const { pdfPath, fileName }: ConvertRequest = await req.json();
    
    if (!pdfPath || !fileName) {
      throw new Error('O caminho do PDF (pdfPath) e o nome do arquivo (fileName) são obrigatórios.');
    }
    console.log('Dados da requisição recebidos:', { pdfPath, fileName });

    // Verificação das credenciais da Adobe
    console.log('=== VERIFICANDO CREDENCIAIS DA ADOBE ===');
    const adobeClientId = Deno.env.get('ADOBE_CLIENT_ID');
    const adobeClientSecret = Deno.env.get('ADOBE_CLIENT_SECRET');
    if (!adobeClientId || !adobeClientSecret) {
      throw new Error('As credenciais da Adobe (ADOBE_CLIENT_ID e ADOBE_CLIENT_SECRET) não estão configuradas.');
    }
    console.log('Credenciais da Adobe encontradas.');

    // Inicialização do cliente Supabase
    console.log('=== INICIALIZANDO CLIENTE SUPABASE ===');
    const supabaseUrl = 'https://evsfhznfnifmqlpktbdr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2c2Zoem5mbmlmbXFscGt0YmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNDY1MjMsImV4cCI6MjA1MjYyMjUyM30.5Khm1eXEsm8SCuN7VYEVRYSbKc0A-T_Xo4hUUvibkgM';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download do PDF do Supabase Storage
    console.log('=== BAIXANDO PDF DO STORAGE ===');
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('tco-pdfs')
      .download(pdfPath);
    if (downloadError) throw new Error(`Erro do Supabase Storage: ${downloadError.message}`);
    if (!pdfData) throw new Error('Arquivo PDF não encontrado ou vazio no Storage');
    console.log('PDF baixado com sucesso, tamanho:', pdfData.size, 'bytes');

    // Obtenção do token de acesso da Adobe
    console.log('=== OBTENDO TOKEN DA ADOBE ===');
    const tokenResponse = await fetch('https://ims-na1.adobelogin.com/ims/token/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'client_id': adobeClientId,
        'client_secret': adobeClientSecret,
        'grant_type': 'client_credentials',
        'scope': 'openid,AdobeID,DCAPI' // <-- CORRIGIDO!
      }),
    });
    if (!tokenResponse.ok) throw new Error(`Falha na autenticação com Adobe: ${await tokenResponse.text()}`);
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('Token da Adobe obtido com sucesso.');

    // --- INÍCIO DA LÓGICA DE CONVERSÃO ADOBE (AGORA COMPLETA) ---

    // Passo 1: Criar Asset para obter uma URL de upload
    console.log('Adobe Passo 1: Criando asset...');
    const createAssetResponse = await fetch('https://pdf-services.adobe.io/assets', {
      method: 'POST',
      headers: {
        'X-API-Key': adobeClientId,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 'mediaType': 'application/pdf' })
    });
    if (!createAssetResponse.ok) throw new Error(`Falha ao criar asset na Adobe: ${await createAssetResponse.text()}`);
    const assetData = await createAssetResponse.json();
    const assetID = assetData.assetID;
    console.log('Adobe Passo 1: Asset criado com sucesso.');

    // Passo 2: Fazer o upload do arquivo PDF para a URL fornecida
    console.log('Adobe Passo 2: Fazendo upload do PDF...');
    const uploadResponse = await fetch(assetData.uploadUri, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: pdfData
    });
    if (!uploadResponse.ok) throw new Error(`Falha no upload para Adobe: ${await uploadResponse.text()}`);
    console.log('Adobe Passo 2: Upload concluído.');

    // Passo 3: Iniciar o job de conversão
    console.log('Adobe Passo 3: Iniciando job de conversão...');
    const exportJobResponse = await fetch('https://pdf-services.adobe.io/operation/exportpdf', {
      method: 'POST',
      headers: {
        'X-API-Key': adobeClientId,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 'assetID': assetID, 'targetFormat': 'docx' })
    });
    if (exportJobResponse.status !== 201) throw new Error(`Falha ao iniciar job na Adobe: ${await exportJobResponse.text()}`);
    const statusUrl = exportJobResponse.headers.get('Location');
    console.log('Adobe Passo 3: Job iniciado com sucesso.');

    // Passo 4: Aguardar a conclusão do job
    console.log('Adobe Passo 4: Aguardando conclusão da conversão...');
    let downloadUri: string | null = null;
    const maxAttempts = 30; // ~60 segundos
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResponse = await fetch(statusUrl!, {
        headers: { 'X-API-Key': adobeClientId, 'Authorization': `Bearer ${accessToken}` },
      });
      if (!statusResponse.ok) throw new Error(`Erro ao verificar status do job: ${await statusResponse.text()}`);
      const statusData = await statusResponse.json();
      if (statusData.status === 'done') {
        downloadUri = statusData.asset.downloadUri;
        console.log('Adobe Passo 4: Conversão concluída com sucesso.');
        break;
      }
      if (statusData.status === 'failed') throw new Error(`Conversão na Adobe falhou: ${JSON.stringify(statusData.error)}`);
      console.log(`Adobe Passo 4: Conversão em andamento... (tentativa ${attempt + 1}/${maxAttempts})`);
      await delay(2000);
    }
    if (!downloadUri) throw new Error('Tempo limite excedido esperando a conversão da Adobe.');

    // Passo 5: Baixar o arquivo convertido
    console.log('Adobe Passo 5: Baixando arquivo convertido...');
    const downloadResponse = await fetch(downloadUri);
    if (!downloadResponse.ok) throw new Error('Falha ao baixar o arquivo convertido da Adobe.');
    const convertedData = await downloadResponse.arrayBuffer(); // <-- A variável 'convertedData' é criada aqui!
    console.log('Adobe Passo 5: Arquivo convertido baixado, tamanho:', convertedData.byteLength);

    // --- FIM DA LÓGICA DE CONVERSÃO ADOBE ---

    // Retorno do documento Word convertido
    const wordFileName = fileName.replace(/\.pdf$/i, '.docx');
    console.log('=== CONVERSÃO CONCLUÍDA COM SUCESSO ===');
    console.log('Retornando o arquivo:', wordFileName);
    
    return new Response(convertedData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${wordFileName}"`,
      },
    });

  } catch (error) {
    console.error('=== ERRO GERAL NA FUNÇÃO ===');
    console.error('Mensagem do erro:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Falha ao converter PDF para Word',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
