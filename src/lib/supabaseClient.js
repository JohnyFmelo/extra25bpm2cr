
// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://evsfhznfnifmqlpktbdr.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2c2Zoem5mbmlmbXFscGt0YmRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA0NjUyMywiZXhwIjoyMDUyNjIyNTIzfQ.GQEz9xvQmTr0Chtjj1ndtq3WTAA8YMm_dFPvnAHMLuc'

const supabase = createClient(supabaseUrl, supabaseKey)

// Setup table if it doesn't exist
const setupTables = async () => {
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
};

// Run setup
setupTables().catch(console.error);

export default supabase;
export { supabase };
