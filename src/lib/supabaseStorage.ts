
// supabaseStorage.ts
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
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if file exists before uploading (for replacement)
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET_NAME)
      .list(filePath.substring(0, filePath.lastIndexOf('/')), {
        search: filePath.substring(filePath.lastIndexOf('/') + 1)
      });
      
    if (existingFiles && existingFiles.length > 0) {
      console.log('File already exists, will replace it:', existingFiles[0].name);
    }
    
    // Upload the file to Supabase Storage - use upsert to replace if exists
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
  if (!filePath) {
    console.error('Invalid filepath provided for PDF deletion:', filePath);
    return { 
      success: false, 
      error: new Error('Invalid filepath provided for PDF deletion') 
    };
  }

  try {
    console.log('Deleting PDF from storage, filepath:', filePath);
    
    // Delete the file from Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting PDF from storage:', error);
      
      // Try alternative approach by getting the file object first
      console.log('Attempting alternative approach for deleting file from storage...');
      
      // List all files in the directory to find the file
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
      
      const { data: filesData, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(dirPath);
      
      if (listError) {
        console.error('Error listing files in directory:', listError);
        return { success: false, error };
      }
      
      const fileExists = filesData?.some(file => file.name === fileName);
      if (!fileExists) {
        console.log('File does not exist in storage, considering deletion successful');
        return { success: true, error: null };
      }
      
      // Try direct deletion again with explicit path
      const { error: retryError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);
        
      if (retryError) {
        console.error('Retry failed when deleting PDF from storage:', retryError);
        return { success: false, error: retryError };
      }
    }

    console.log('PDF deletion result:', data);
    
    // Verify deletion by checking if the file still exists
    try {
      const { data: checkData } = await supabase.storage
        .from(BUCKET_NAME)
        .list(filePath.substring(0, filePath.lastIndexOf('/')));
        
      const fileStillExists = checkData?.some(file => 
        file.name === filePath.substring(filePath.lastIndexOf('/') + 1)
      );
      
      if (fileStillExists) {
        console.warn('File still exists after deletion attempt');
        return { 
          success: false, 
          error: new Error('File still exists after deletion attempt') 
        };
      }
    } catch (verifyError) {
      console.log('Error during verification, but deletion may have succeeded:', verifyError);
    }
    
    console.log('PDF deleted successfully from storage');
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
 * Deletes TCO by either ID, filepath, or multiple criteria
 * Simplified version that only handles storage
 * @param tcoData The TCO data containing id and pdfPath
 */
export async function deleteTCO(tcoData: { id?: string; pdfPath?: string }): Promise<{
  success: boolean;
  error: Error | null;
}> {
  console.log('Starting TCO deletion process:', tcoData);
  
  // No database operations, only storage
  if (tcoData.pdfPath) {
    return await deletePDF(tcoData.pdfPath);
  } else {
    console.error('No PDF path provided for deletion');
    return { 
      success: false, 
      error: new Error('No PDF path provided for deletion') 
    };
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

/**
 * Saves the TCO metadata to the database
 * This is a stub function since we're not using database metadata anymore
 * and instead extracting information from the filename
 */
export async function saveTCOMetadata(metadata: any): Promise<{ error: Error | null }> {
  console.log('saveTCOMetadata called, but metadata storage is not being used');
  console.log('Using filename for metadata extraction instead:', metadata);
  
  // Simply return success since we're not actually saving to a database
  return { error: null };
}
