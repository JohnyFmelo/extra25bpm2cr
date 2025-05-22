// supabaseStorage.ts
import { supabase } from './supabaseClient';

const BUCKET_NAME = 'tco-pdfs';

/**
 * Uploads a PDF file to Supabase Storage
 * @param filePath The path where the file will be stored in the bucket
 * @param fileBlob The file blob to be uploaded
 * @param fileMetadata Optional file-level metadata for the storage object (different from DB metadata)
 */
export async function uploadPDF(filePath: string, fileBlob: Blob, fileMetadata?: Record<string, string>): Promise<{
  url: string | null; // Public URL of the uploaded file
  path: string | null; // Path of the uploaded file in storage
  error: Error | null;
}> {
  try {
    console.log('Starting PDF upload to path:', filePath);
    
    await ensureBucketExists();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBlob, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
        ...(fileMetadata ? { metadata: fileMetadata } : {}), // This is storage object metadata
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return { url: null, path: null, error: uploadError };
    }

    console.log('PDF uploaded successfully to storage path:', uploadData.path);

    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path); // Use path from uploadData for consistency

    console.log('Generated public URL:', urlData?.publicUrl);
    return { url: urlData?.publicUrl || null, path: uploadData.path, error: null };
  } catch (error) {
    console.error('Exception uploading PDF:', error);
    return { url: null, path: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Deletes a PDF file from Supabase Storage
 * @param filePath The path of the file to be deleted
 */
export async function deletePDFFromStorage(filePath: string): Promise<{ // Renomeado para clareza
  success: boolean;
  error: Error | null;
}> {
  if (!filePath) {
    const err = new Error('Invalid filepath provided for PDF deletion from storage');
    console.error(err.message, filePath);
    return { success: false, error: err };
  }

  try {
    console.log('Deleting PDF from storage, filepath:', filePath);
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
    console.error('Exception deleting PDF from storage:', error);
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Saves the TCO metadata to the 'tco_pdfs' database table
 */
export async function saveTCOMetadata(metadata: {
  tconumber: string;
  natureza: string;
  policiais: Array<{ nome?: string; rgpm: string; posto?: string; apoio?: boolean }>;
  pdfpath: string; // Path no storage
  pdfurl?: string; // URL pública, opcional
  createdby: string | null; // User ID
  userfacingfilename?: string; // Nome do arquivo gerado
  // id e created_at são gerados pelo DB
}): Promise<{ data?: any; error: any | null }> {
  console.log('Attempting to save TCO metadata to database:', metadata);
  try {
    const { data, error } = await supabase
      .from('tco_pdfs') // NOME DA SUA TABELA DE METADADOS
      .insert([metadata]) // Supabase pode lidar com createdby sendo null
      .select()
      .single(); // Espera um único registro de volta

    if (error) {
      console.error('Error saving TCO metadata to DB:', error);
      return { error };
    }
    console.log('TCO metadata saved successfully to DB:', data);
    return { data, error: null };
  } catch (e: any) {
    console.error('Exception during saveTCOMetadata:', e);
    return { error: e };
  }
}


/**
 * Deletes TCO from both the database and Supabase Storage
 * @param tcoData Must contain 'id' (for DB) and 'pdfPath' (for Storage)
 */
export async function deleteTCO(tcoData: { id: string; pdfPath: string }): Promise<{
  success: boolean;
  error: Error | null;
}> {
  console.log('Starting TCO deletion process (DB & Storage):', tcoData);
  
  if (!tcoData.id || !tcoData.pdfPath) {
      const errMsg = "ID do TCO e Caminho do PDF são obrigatórios para exclusão.";
      console.error(errMsg, tcoData);
      return { success: false, error: new Error(errMsg) };
  }

  let dbError: Error | null = null;
  let storageError: Error | null = null;

  // 1. Excluir do banco de dados
  try {
    const { error } = await supabase
      .from('tco_pdfs') // NOME DA SUA TABELA DE METADADOS
      .delete()
      .eq('id', tcoData.id);

    if (error) {
      console.error('Error deleting TCO from database:', error);
      dbError = error;
    } else {
      console.log('TCO metadata deleted from DB successfully for ID:', tcoData.id);
    }
  } catch (e: any) {
      console.error('Exception deleting TCO from DB:', e);
      dbError = e;
  }

  // 2. Excluir do Storage (tentar mesmo se o DB falhar, para evitar arquivos órfãos)
  try {
    const { success: sSuccess, error: sError } = await deletePDFFromStorage(tcoData.pdfPath);
    if (!sSuccess || sError) {
      storageError = sError || new Error("Falha ao deletar do storage por motivo desconhecido.");
    } else {
        console.log('TCO PDF deleted from storage successfully:', tcoData.pdfPath);
    }
  } catch (e:any) {
    console.error('Exception deleting TCO from storage:', e);
    storageError = e;
  }
  
  // Determinar sucesso geral e mensagem de erro combinada
  if (dbError || storageError) {
    let combinedErrorMessage = "";
    if (dbError) combinedErrorMessage += `DB Error: ${dbError.message}. `;
    if (storageError) combinedErrorMessage += `Storage Error: ${storageError.message}.`;
    console.error("TCO Deletion failed with errors:", combinedErrorMessage.trim());
    return { success: false, error: new Error(combinedErrorMessage.trim()) };
  }

  console.log("TCO deleted successfully from both DB and Storage.");
  return { success: true, error: null };
}


/**
 * Ensures the required storage bucket exists
 */
export async function ensureBucketExists(): Promise<boolean> {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log(`Bucket '${BUCKET_NAME}' not found, attempting to create it...`);
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true // ou false, dependendo da sua necessidade de URLs públicas diretas
      });
      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }
      console.log(`Bucket '${BUCKET_NAME}' created successfully`);
    } else {
      // console.log(`Bucket '${BUCKET_NAME}' already exists`); // Menos verboso
    }
    return true;
  } catch (error) {
    console.error('Error checking/creating bucket:', error);
    return false;
  }
}
