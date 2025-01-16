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

const LOCAL_STORAGE_KEY = 'time_slots';

// Helper function to get time slots from localStorage
const getLocalTimeSlots = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Helper function to save time slots to localStorage
const saveLocalTimeSlots = (slots: any[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(slots));
};

// Helper function to sign in anonymously
export const signInAnonymously = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Anonymous auth error:', error);
      return { type: 'local' };
    }
    return { type: 'supabase', session };
  } catch (error) {
    console.error('Unexpected error during anonymous auth:', error);
    return { type: 'local' };
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
  } catch {
    return true; // Retorna true para permitir o uso do localStorage
  }
};

// Helper functions for data operations
export const dataOperations = {
  async fetch() {
    try {
      const { data, error } = await supabase.from('time_slots').select('*');
      if (error) throw error;
      return data;
    } catch (error) {
      console.log('Using localStorage fallback');
      return getLocalTimeSlots();
    }
  },

  async insert(newSlot: any) {
    try {
      const { error } = await supabase.from('time_slots').insert([newSlot]);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.log('Using localStorage fallback for insert');
      const slots = getLocalTimeSlots();
      slots.push({ ...newSlot, id: Date.now().toString() });
      saveLocalTimeSlots(slots);
      return { success: true };
    }
  },

  async update(updatedSlot: any, conditions: any) {
    try {
      const { error } = await supabase
        .from('time_slots')
        .update(updatedSlot)
        .eq('date', conditions.date)
        .eq('start_time', conditions.start_time)
        .eq('end_time', conditions.end_time);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.log('Using localStorage fallback for update');
      const slots = getLocalTimeSlots();
      const index = slots.findIndex((slot: any) => 
        slot.date === conditions.date && 
        slot.start_time === conditions.start_time && 
        slot.end_time === conditions.end_time
      );
      if (index !== -1) {
        slots[index] = { ...slots[index], ...updatedSlot };
        saveLocalTimeSlots(slots);
      }
      return { success: true };
    }
  },

  async delete(conditions: any) {
    try {
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('date', conditions.date)
        .eq('start_time', conditions.start_time)
        .eq('end_time', conditions.end_time);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.log('Using localStorage fallback for delete');
      const slots = getLocalTimeSlots();
      const filteredSlots = slots.filter((slot: any) => 
        !(slot.date === conditions.date && 
          slot.start_time === conditions.start_time && 
          slot.end_time === conditions.end_time)
      );
      saveLocalTimeSlots(filteredSlots);
      return { success: true };
    }
  }
};