import { supabase } from './client';

// Ensure a storage bucket exists, creating it if necessary
export const ensureBucketExists = async (bucketName: string): Promise<void> => {
  try {
    // Check if bucket exists by attempting to list it
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      throw new Error(`Erro ao listar buckets: ${error.message}`);
    }

    const bucketExists = data.some(bucket => bucket.name === bucketName);
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} não encontrado. Criando...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true, // Adjust based on your needs
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB limit, adjust as needed
      });
      if (createError) {
        throw new Error(`Erro ao criar bucket ${bucketName}: ${createError.message}`);
      }
      console.log(`Bucket ${bucketName} criado com sucesso.`);
    }
  } catch (error) {
    throw new Error(`Falha ao garantir bucket ${bucketName}: ${error.message}`);
  }
};

// Ensure a database table exists with required columns, creating it if necessary
export const ensureTableExists = async (tableName: string, requiredColumns: string[]): Promise<void> => {
  try {
    // Check if table exists by attempting a simple query
    const { data, error } = await supabase.from(tableName).select('id').limit(1);
    if (error && error.code === '42P01') { // PostgreSQL error code for missing table
      console.log(`Tabela ${tableName} não encontrada. Criando...`);
      // Note: Supabase doesn't provide a direct API to create tables, so this assumes a migration or admin API
      // For production, you should run a migration to create the table with the correct schema
      // Placeholder: Assume a migration function or manual intervention
      throw new Error(`Tabela ${tableName} não existe. Execute a migração para criar a tabela com as colunas: ${requiredColumns.join(', ')}`);
    }

    // Verify columns (requires admin access or metadata query, simplified here)
    // In practice, you may need to use Supabase's admin API or a schema inspection query
    console.log(`Verificando colunas da tabela ${tableName}: ${requiredColumns.join(', ')}`);
    // Placeholder: Assume columns are correct or handle via migrations
  } catch (error) {
    throw new Error(`Falha ao garantir tabela ${tableName}: ${error.message}`);
  }
};
