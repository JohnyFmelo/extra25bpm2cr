
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

    // Get the public URL of the uploaded file
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return { url: urlData?.publicUrl || null, error: null };
  } catch (error) {
    console.error('Exception uploading PDF:', error);
    return { url: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Saves TCO metadata to Supabase database
 * @param tcoMetadata The metadata to save
 */
export async function saveTCOMetadata(tcoMetadata: any) {
  const TABLE_NAME = 'tco_pdfs';

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([tcoMetadata])
      .select('id')
      .single();

    if (error) {
      throw error;
    }

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
    const { data: buckets } = await supabase.storage.listBuckets();
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
