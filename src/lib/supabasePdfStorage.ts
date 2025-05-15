
import { supabase } from './supabaseClient';
import { toast } from '@/hooks/use-toast';

const BUCKET_NAME = 'tco-pdfs';

/**
 * Upload a PDF blob to Supabase storage
 * @param pdfBlob - The PDF blob to upload
 * @param filePath - The storage path for the file
 * @returns Promise with upload results
 */
export const uploadPdfToSupabase = async (pdfBlob: Blob, filePath: string) => {
  try {
    console.log(`Uploading PDF to Supabase at path: ${filePath}`);
    
    // Upload the PDF to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    console.log('PDF upload successful:', uploadData);

    // Get the public URL of the uploaded file
    const { data: publicUrlData } = await supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      path: filePath,
      url: publicUrlData?.publicUrl || '',
      error: null
    };
  } catch (error: any) {
    console.error('PDF upload operation failed:', error);
    return {
      success: false,
      path: '',
      url: '',
      error: error.message || 'Unknown error during PDF upload'
    };
  }
};

/**
 * Save TCO metadata to Supabase database
 * @param tcoMetadata - The TCO metadata object
 * @returns Promise with database operation results
 */
export const saveTCOMetadata = async (tcoMetadata: any) => {
  try {
    console.log('Saving TCO metadata to Supabase database:', tcoMetadata);
    
    const { data, error } = await supabase
      .from('tco_pdfs')
      .insert([tcoMetadata])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving TCO metadata:', error);
      throw new Error(`Failed to save TCO metadata: ${error.message}`);
    }

    console.log('TCO metadata saved successfully:', data);
    return {
      success: true,
      id: data?.id,
      error: null
    };
  } catch (error: any) {
    console.error('TCO metadata save operation failed:', error);
    return {
      success: false,
      id: null,
      error: error.message || 'Unknown error saving TCO metadata'
    };
  }
};

/**
 * Delete a PDF and its metadata from Supabase
 * @param tcoId - The TCO ID in the database
 * @param filePath - The storage path of the PDF file
 * @returns Promise with deletion results
 */
export const deleteTCOFromSupabase = async (tcoId: string, filePath: string) => {
  try {
    // First delete the PDF file from storage
    const { error: storageError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting PDF file:', storageError);
      toast({
        title: "Aviso",
        description: "O arquivo PDF não pôde ser excluído, mas os metadados serão removidos.",
        variant: "warning"
      });
    }

    // Then delete the metadata from the database
    const { error: dbError } = await supabase
      .from('tco_pdfs')
      .delete()
      .eq('id', tcoId);

    if (dbError) {
      console.error('Error deleting TCO metadata:', dbError);
      throw new Error(`Failed to delete TCO metadata: ${dbError.message}`);
    }

    return {
      success: true,
      error: null
    };
  } catch (error: any) {
    console.error('TCO deletion operation failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during TCO deletion'
    };
  }
};
