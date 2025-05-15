
import { ensureBucketExists } from './supabaseStorage';

/**
 * Initialize Supabase resources needed by the application
 */
export async function initializeSupabase() {
  console.log('Initializing Supabase resources...');
  
  try {
    // Ensure the storage bucket exists
    const bucketCreated = await ensureBucketExists();
    if (!bucketCreated) {
      console.error('Failed to create or verify storage bucket');
    } else {
      console.log('Supabase storage initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }
}
