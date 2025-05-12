
// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://evsfhznfnifmqlpktbdr.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2c2Zoem5mbmlmbXFscGt0YmRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA0NjUyMywiZXhwIjoyMDUyNjIyNTIzfQ.GQEz9xvQmTr0Chtjj1ndtq3WTAA8YMm_dFPvnAHMLuc'

const supabase = createClient(supabaseUrl, supabaseKey)

// Setup table if it doesn't exist
const setupTables = async () => {
  try {
    // Check if the tcos table exists
    const { error: checkError } = await supabase
      .from('tcos')
      .select('id')
      .limit(1)
      .maybeSingle();

    // If the table doesn't exist, create it
    if (checkError && checkError.code === 'PGRST116') {
      console.log('Creating tcos table...');
      
      const { error } = await supabase.rpc('create_tcos_table');
      
      if (error) {
        console.error('Error creating tcos table:', error);
      } else {
        console.log('tcos table created successfully');
      }
    }

    // Ensure storage buckets exist
    await setupStorageBuckets();

  } catch (error) {
    console.error('Error during setup:', error);
  }
};

// Setup storage buckets for PDFs and images
const setupStorageBuckets = async () => {
  try {
    // Check if 'pdfs' bucket exists
    const { data: pdfBuckets, error: pdfError } = await supabase
      .storage
      .listBuckets();

    const pdfsExists = pdfBuckets?.some(bucket => bucket.name === 'pdfs');
    const imagesExists = pdfBuckets?.some(bucket => bucket.name === 'images');

    if (!pdfsExists) {
      console.log('Creating pdfs storage bucket...');
      const { error } = await supabase.storage.createBucket('pdfs', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      if (error) {
        console.error('Error creating pdfs bucket:', error);
      } else {
        console.log('pdfs bucket created successfully');
      }
    }

    if (!imagesExists) {
      console.log('Creating images storage bucket...');
      const { error } = await supabase.storage.createBucket('images', {
        public: true, 
        fileSizeLimit: 5242880, // 5MB
      });
      if (error) {
        console.error('Error creating images bucket:', error);
      } else {
        console.log('images bucket created successfully');
      }
    }
  } catch (error) {
    console.error('Error setting up storage buckets:', error);
  }
};

// Run setup
setupTables().catch(console.error);

export default supabase;
export { supabase };
