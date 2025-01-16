import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables for Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TimeSlotRow = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  created_at: string;
  updated_at: string;
};

// Helper function to sign in anonymously
export const signInAnonymously = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Anonymous auth error:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Unexpected error during anonymous auth:', error);
    return null;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
};