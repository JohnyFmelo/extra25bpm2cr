
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConvertRequest {
  pdfPath: string;
  fileName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfPath, fileName }: ConvertRequest = await req.json();
    
    if (!pdfPath || !fileName) {
      throw new Error('PDF path and filename are required');
    }

    // Initialize Supabase client
    const supabaseUrl = 'https://evsfhznfnifmqlpktbdr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2c2Zoem5mbmlmbXFscGt0YmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNDY1MjMsImV4cCI6MjA1MjYyMjUyM30.5Khm1eXEsm8SCuN7VYEVRYSbKc0A-T_Xo4hUUvibkgM';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting PDF to Word conversion for:', fileName);

    // Download PDF from Supabase Storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('tco-pdfs')
      .download(pdfPath);

    if (downloadError || !pdfData) {
      throw new Error(`Failed to download PDF: ${downloadError?.message}`);
    }

    console.log('PDF downloaded successfully, size:', pdfData.size);

    // Get ILovePDF API key
    const ilovePdfApiKey = Deno.env.get('ILOVEPDF_API_KEY');
    if (!ilovePdfApiKey) {
      throw new Error('ILovePDF API key not configured');
    }

    // Convert PDF to ArrayBuffer for upload
    const pdfArrayBuffer = await pdfData.arrayBuffer();
    const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });

    console.log('Starting ILovePDF conversion process...');

    // Step 1: Start a new task
    const startResponse = await fetch('https://api.ilovepdf.com/v1/start/office', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ilovePdfApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`Failed to start ILovePDF task: ${errorText}`);
    }

    const startData = await startResponse.json();
    const taskId = startData.task;
    const serverUrl = startData.server;

    console.log('ILovePDF task started:', taskId);

    // Step 2: Upload the PDF file
    const formData = new FormData();
    formData.append('task', taskId);
    formData.append('file', pdfBlob, fileName);

    const uploadResponse = await fetch(`${serverUrl}/v1/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ilovePdfApiKey}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload PDF: ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    const serverFilename = uploadData.server_filename;

    console.log('PDF uploaded to ILovePDF:', serverFilename);

    // Step 3: Process the conversion
    const processResponse = await fetch(`${serverUrl}/v1/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ilovePdfApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: taskId,
        tool: 'office',
        files: [{ server_filename: serverFilename, filename: fileName }],
      }),
    });

    if (!processResponse.ok) {
      const errorText = await processResponse.text();
      throw new Error(`Failed to process conversion: ${errorText}`);
    }

    const processData = await processResponse.json();
    console.log('Conversion processed successfully');

    // Step 4: Download the converted file
    const downloadResponse = await fetch(`${serverUrl}/v1/download/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ilovePdfApiKey}`,
      },
    });

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      throw new Error(`Failed to download converted file: ${errorText}`);
    }

    const convertedData = await downloadResponse.arrayBuffer();
    console.log('Converted file downloaded, size:', convertedData.byteLength);

    // Return the converted Word document
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
    console.error('Error in pdf-to-word-converter:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to convert PDF to Word',
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
