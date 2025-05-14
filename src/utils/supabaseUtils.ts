
import { supabase } from "@/lib/supabaseClient";

/**
 * Checks if a bucket exists in Supabase Storage and creates it if it doesn't.
 * @param bucketName The name of the bucket to check/create
 * @param options Options for bucket creation (e.g., public, fileSizeLimit)
 * @returns A promise resolving to true if the bucket exists or was created
 */
export const ensureBucketExists = async (
  bucketName: string, 
  options: { public: boolean; fileSizeLimit?: number } = { public: true }
): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Erro ao listar buckets:", listError);
      throw listError;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket ${bucketName} já existe`);
      return true;
    }
    
    // Create the bucket if it doesn't exist
    console.log(`Criando bucket ${bucketName}...`);
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: options.public,
      fileSizeLimit: options.fileSizeLimit
    });
    
    if (createError) {
      console.error(`Erro ao criar bucket ${bucketName}:`, createError);
      throw createError;
    }
    
    console.log(`Bucket ${bucketName} criado com sucesso`);
    return true;
  } catch (error) {
    console.error(`Falha ao garantir que o bucket ${bucketName} existe:`, error);
    throw error;
  }
};

/**
 * Checks if a table exists in the Supabase database
 * @param tableName The name of the table to check
 * @returns A promise resolving to true if the table exists, false otherwise
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    // Use a safer approach - try to get the schema
    const { data, error } = await supabase.rpc('get_schema_for_table', { 
      table_name: tableName 
    });
    
    if (error) {
      console.log(`Tabela ${tableName} não existe ou erro ao verificar:`, error);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`Tabela ${tableName} existe`);
      return true;
    }
    
    console.log(`Tabela ${tableName} não existe`);
    return false;
  } catch (error) {
    console.error(`Falha ao verificar se a tabela ${tableName} existe:`, error);
    // Assumimos que não existe em caso de erros inesperados
    return false;
  }
};

/**
 * Cria a tabela tco_pdfs no Supabase se ela não existir
 */
export const createTcoPdfsTable = async (): Promise<boolean> => {
  try {
    const tableExists = await checkTableExists('tco_pdfs');
    
    if (tableExists) {
      console.log('Tabela tco_pdfs já existe');
      return true;
    }
    
    console.log('Criando tabela tco_pdfs...');
    // Execute a SQL query to create the table
    const { error } = await supabase.rpc('exec_sql', { 
      sql: TCO_PDFS_TABLE_SQL 
    });
    
    if (error) {
      console.error('Erro ao criar tabela tco_pdfs:', error);
      throw error;
    }
    
    console.log('Tabela tco_pdfs criada com sucesso');
    return true;
  } catch (error) {
    console.error('Falha ao criar tabela tco_pdfs:', error);
    throw error;
  }
};

/**
 * SQL script to create the tco_pdfs table
 */
export const TCO_PDFS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS public.tco_pdfs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "tcoNumber" text NOT NULL,
  natureza text NOT NULL,
  policiais jsonb NOT NULL,
  "pdfPath" text NOT NULL,
  "pdfUrl" text NOT NULL,
  "createdBy" uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add RLS policies for table security
ALTER TABLE public.tco_pdfs ENABLE ROW LEVEL SECURITY;

-- Allow individual users to see and manage their own TCOs
CREATE POLICY "Users can view their own TCOs" ON public.tco_pdfs
  FOR SELECT USING (auth.uid() = "createdBy" OR auth.uid() IN (
    SELECT auth.uid() FROM auth.users WHERE auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  ));

CREATE POLICY "Users can create their own TCOs" ON public.tco_pdfs
  FOR INSERT WITH CHECK (auth.uid() = "createdBy" OR auth.uid() IS NULL);
`;
