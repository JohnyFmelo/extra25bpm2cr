
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
      .from('tco-pdfs') // Seu bucket
      .download(pdfPath);

    if (downloadError || !pdfData) {
      throw new Error(`Falha ao baixar o PDF: ${downloadError?.message}`);
    }

    console.log('PDF baixado com sucesso, tamanho:', pdfData.size);

    // --- Início da Lógica da CloudConvert ---

    // Pega a chave da API da CloudConvert das variáveis de ambiente
    const cloudConvertApiKey = Deno.env.get('CLOUDCONVERT_API_KEY');
    if (!cloudConvertApiKey) {
      throw new Error('A chave da API da CloudConvert (CLOUDCONVERT_API_KEY) não está configurada.');
    }
    
    const apiBaseUrl = 'https://api.cloudconvert.com/v2';

    const headers = {
      'Authorization': `Bearer ${cloudConvertApiKey}`,
      'Content-Type': 'application/json',
    };

    // Passo 1: Criar o "Job" com o corpo da solicitação que você montou no Job Builder
    console.log('CloudConvert: Criando o Job...');
    const jobPayload = {
      "tasks": {
        // Sua Tarefa de Upload
        "converter-para-word": {
          "operation": "import/upload"
        },
        // Sua Tarefa de Conversão
        "task-1": {
          "operation": "convert",
          "output_format": "docx",
          "input": "converter-para-word", // Ligada à tarefa de upload
          "engine": "office" // Motor recomendado para melhor qualidade
        },
        // Sua Tarefa de Exportação
        "export-1": {
          "operation": "export/url",
          "input": "task-1", // Ligada à tarefa de conversão
          "inline": false,
          "archive_multiple_files": false
        }
      },
      "tag": "jobbuilder" // A tag que o Job Builder adiciona
    };

    const createJobResponse = await fetch(`${apiBaseUrl}/jobs`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(jobPayload),
    });

    if (!createJobResponse.ok) {
      const errorText = await createJobResponse.text();
      throw new Error(`Falha ao criar o Job na CloudConvert: ${errorText}`);
    }
    
    const jobData = (await createJobResponse.json()).data;
    const jobId = jobData.id;
    const uploadTask = jobData.tasks.find(task => task.operation === 'import/upload');
    
    console.log(`CloudConvert: Job criado com sucesso! ID: ${jobId}`);

    // Passo 2: Fazer o upload do arquivo PDF para a URL fornecida pela CloudConvert
    const uploadForm = uploadTask.result.form;
    const formData = new FormData();
    Object.entries(uploadForm.parameters).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append('file', pdfData, fileName);

    console.log('CloudConvert: Fazendo upload do arquivo...');
    const uploadResponse = await fetch(uploadForm.url, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Falha no upload para a CloudConvert: ${errorText}`);
    }
    console.log('CloudConvert: Upload concluído.');

    // Passo 3: Aguardar a finalização do Job (polling)
    console.log('CloudConvert: Aguardando a conclusão do Job...');
    let currentJobData;
    let jobStatus = '';
    const maxAttempts = 30; // Limite para evitar loop infinito (30 * 2s = 1 min)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const checkJobResponse = await fetch(`${apiBaseUrl}/jobs/${jobId}`, { headers });
        currentJobData = (await checkJobResponse.json()).data;
        jobStatus = currentJobData.status;

        console.log(`CloudConvert: Status do Job: ${jobStatus}`);
        
        if (jobStatus === 'finished') {
            break;
        }
        if (jobStatus === 'error') {
            throw new Error('O Job da CloudConvert falhou durante o processamento.');
        }
        
        await delay(2000); // Espera 2 segundos antes de verificar novamente
    }
    
    if (jobStatus !== 'finished') {
        throw new Error('O Job da CloudConvert excedeu o tempo limite.');
    }

    // Passo 4: Obter a URL de download do arquivo convertido
    console.log('CloudConvert: Job finalizado. Obtendo o link de download...');
    const exportTask = currentJobData.tasks.find(task => task.operation === 'export/url');
    const downloadUrl = exportTask.result.files[0].url;

    // Passo 5: Baixar o arquivo .docx final
    const downloadResponse = await fetch(downloadUrl);
    const convertedData = await downloadResponse.arrayBuffer();
    console.log('Arquivo convertido baixado, tamanho:', convertedData.byteLength);

    // --- Fim da Lógica da CloudConvert ---

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
