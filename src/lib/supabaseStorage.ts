
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
    const userId = user?.id;
    
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
 * Deletes TCO metadata from Supabase database
 * @param tcoId The ID of the TCO to delete
 */
export async function deleteTCOMetadata(tcoId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  if (!tcoId) {
    console.error('Invalid TCO ID provided for deletion:', tcoId);
    return { 
      success: false, 
      error: new Error('Invalid TCO ID provided for deletion')
    };
  }

  try {
    console.log('Deleting TCO metadata from database, ID:', tcoId);
    
    // First attempt - standard approach with direct delete by ID
    const { error } = await supabase
      .from('tco_pdfs')
      .delete()
      .eq('id', tcoId);

    if (error) {
      console.error('Error deleting TCO metadata by ID:', error);
      return { success: false, error };
    }

    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabase
      .from('tco_pdfs')
      .select('id')
      .eq('id', tcoId)
      .maybeSingle();
      
    if (verifyError) {
      console.warn('Error verifying deletion:', verifyError);
    } else if (verifyData) {
      console.warn('Verification indicates record still exists after deletion');
      return { 
        success: false, 
        error: new Error('Failed to delete TCO from database. Record still exists.') 
      };
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
 * Deletes TCO by either ID, filepath, or multiple criteria
 * @param tcoData The TCO data containing id, pdfPath, or both
 */
export async function deleteTCO(tcoData: { id?: string; pdfPath?: string }): Promise<{
  success: boolean;
  error: Error | null;
}> {
  console.log('Starting full TCO deletion process:', tcoData);
  
  let dbDeletionSuccess = false;
  let storageDeletionSuccess = false;
  
  // 1. Delete from storage if path exists
  if (tcoData.pdfPath) {
    const { success, error } = await deletePDF(tcoData.pdfPath);
    storageDeletionSuccess = success;
    
    if (error) {
      console.error('Error deleting PDF from storage:', error);
    } else {
      console.log('Successfully deleted PDF from storage');
    }
  } else {
    console.warn('No PDF path provided for deletion');
  }
  
  // 2. Delete from database by ID if available
  if (tcoData.id) {
    const { success, error } = await deleteTCOMetadata(tcoData.id);
    
    if (error) {
      console.error('Error deleting TCO from database by ID:', error);
    } else {
      console.log('Successfully deleted TCO from database by ID');
      dbDeletionSuccess = true;
    }
  }
  
  // 3. If ID deletion failed or not available, try by pdfpath
  if (!dbDeletionSuccess && tcoData.pdfPath) {
    console.log('Attempting to delete TCO from database by pdfpath:', tcoData.pdfPath);
    
    // Try with lowercase field name
    const { error } = await supabase
      .from('tco_pdfs')
      .delete()
      .eq('pdfpath', tcoData.pdfPath);
    
    if (error) {
      console.error('Error deleting TCO from database by pdfpath:', error);
      
      // Final attempt
      console.log('Final attempt: trying alternative approaches');
      
      try {
        // Try direct query
        const { data: searchResult } = await supabase
          .from('tco_pdfs')
          .select('id, pdfpath')
          .ilike('pdfpath', `%${tcoData.pdfPath.split('/').pop() || ''}%`);
          
        if (searchResult && searchResult.length > 0) {
          console.log('Found matching records by filename:', searchResult);
          
          for (const record of searchResult) {
            const { error: finalError } = await supabase
              .from('tco_pdfs')
              .delete()
              .eq('id', record.id);
              
            if (!finalError) {
              console.log('Successfully deleted record with ID:', record.id);
              dbDeletionSuccess = true;
            }
          }
        }
      } catch (finalError) {
        console.error('All deletion attempts failed. Final error:', finalError);
      }
    } else {
      console.log('Successfully deleted TCO using pdfpath');
      dbDeletionSuccess = true;
    }
  }
  
  // 4. Final verification
  let verificationPassed = false;
  
  if (tcoData.pdfPath) {
    // Verify storage deletion
    try {
      const dirPath = tcoData.pdfPath.substring(0, tcoData.pdfPath.lastIndexOf('/'));
      const fileName = tcoData.pdfPath.substring(tcoData.pdfPath.lastIndexOf('/') + 1);
      
      const { data: filesData } = await supabase.storage
        .from(BUCKET_NAME)
        .list(dirPath);
        
      const fileExists = filesData?.some(file => file.name === fileName);
      
      if (fileExists) {
        console.warn('Verification failed: File still exists in storage');
      } else {
        console.log('Verification passed: File no longer exists in storage');
        verificationPassed = true;
      }
    } catch (error) {
      console.error('Error during storage verification:', error);
    }
    
    // Verify database deletion
    const { data: verifyData } = await supabase
      .from('tco_pdfs')
      .select('id')
      .eq('pdfpath', tcoData.pdfPath)
      .maybeSingle();
      
    if (verifyData) {
      console.warn('Verification failed: TCO still exists in database');
    } else {
      console.log('Verification passed: TCO no longer exists in database');
      verificationPassed = true;
    }
  }
  
  return { 
    success: storageDeletionSuccess || dbDeletionSuccess || verificationPassed, 
    error: !storageDeletionSuccess && !dbDeletionSuccess && !verificationPassed ? 
      new Error('Failed to delete TCO completely') : null
  };
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
