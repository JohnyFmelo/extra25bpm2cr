
import { supabase } from './supabaseClient';

const BUCKET_NAME = 'tco-pdfs';

/**
 * Uploads a PDF file to Supabase Storage
 * @param filePath The path where the file will be stored in the bucket
 * @param fileBlob The file blob to be uploaded
 * @param metadata Optional metadata for the file
 */
export async function uploadPDF(filePath: string, fileBlob: Blob, metadata?: Record<string, string>): Promise<{
  url: string | null;
  error: Error | null;
}> {
  try {
    console.log('Starting PDF upload to path:', filePath);
    
    // Ensure bucket exists before uploading
    await ensureBucketExists();
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBlob, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
        ...(metadata ? { metadata } : {}),
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return { url: null, error: uploadError };
    }

    console.log('PDF uploaded successfully:', uploadData);

    // Get the public URL of the uploaded file
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('Generated public URL:', urlData?.publicUrl);
    return { url: urlData?.publicUrl || null, error: null };
  } catch (error) {
    console.error('Exception uploading PDF:', error);
    return { url: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Deletes a PDF file from Supabase Storage
 * @param filePath The path of the file to be deleted
 */
export async function deletePDF(filePath: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    console.log('Deleting PDF from storage:', filePath);
    
    // Delete the file from Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting PDF from storage:', error);
      return { success: false, error };
    }

    console.log('PDF deleted successfully from storage:', data);
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception deleting PDF:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
}

/**
 * Deletes TCO metadata from Supabase database
 * @param tcoId The ID of the TCO to delete
 */
export async function deleteTCOMetadata(tcoId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    console.log('Deleting TCO metadata from database, ID:', tcoId);
    
    const { error } = await supabase
      .from('tco_pdfs')
      .delete()
      .eq('id', tcoId);

    if (error) {
      console.error('Error deleting TCO metadata from database:', error);
      return { success: false, error };
    }

    console.log('TCO metadata deleted successfully from database');
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception deleting TCO metadata:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
}

/**
 * Saves TCO metadata to Supabase database
 * @param tcoMetadata The metadata to save
 */
export async function saveTCOMetadata(tcoMetadata: any) {
  const TABLE_NAME = 'tco_pdfs';

  try {
    console.log('Saving TCO metadata to database:', JSON.stringify(tcoMetadata, null, 2));
    
    // Make sure createdAt is properly formatted
    const formattedMetadata = {
      ...tcoMetadata,
      createdat: new Date().toISOString(),
    };

    // Ensure policiais field is properly structured
    if (!formattedMetadata.policiais && Array.isArray(formattedMetadata.componentesGuarnicao)) {
      formattedMetadata.policiais = formattedMetadata.componentesGuarnicao.map(comp => ({
        nome: comp.nome,
        rgpm: comp.rg,
        posto: comp.posto,
        apoio: !!comp.apoio
      }));
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([formattedMetadata])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving TCO metadata:', error);
      throw error;
    }

    console.log('TCO metadata saved successfully, returned ID:', data?.id);
    return { data, error: null };
  } catch (error) {
    console.error('Error saving TCO metadata:', error);
    return { data: null, error };
  }
}

/**
 * Ensures the required storage bucket exists
 */
export async function ensureBucketExists(): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log(`Bucket '${BUCKET_NAME}' not found, attempting to create it...`);
      // Create bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true // Make files publicly accessible
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }
      
      console.log(`Bucket '${BUCKET_NAME}' created successfully`);
    } else {
      console.log(`Bucket '${BUCKET_NAME}' already exists`);
    }
    
    return true;
  } catch (error) {
    console.error('Error checking/creating bucket:', error);
    return false;
  }
}
