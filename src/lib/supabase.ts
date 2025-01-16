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

const getLocalTimeSlots = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveLocalTimeSlots = (slots: any[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(slots));
};

export const signInAnonymously = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('Anonymous auth error, using localStorage:', error.message);
      return { type: 'local' };
    }
    return { type: 'supabase', session };
  } catch (error) {
    console.warn('Unexpected error during anonymous auth, using localStorage:', error);
    return { type: 'local' };
  }
};

export const isAuthenticated = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    console.warn('Error checking auth status, defaulting to localStorage');
    return false;
  }
};

export const dataOperations = {
  async fetch() {
    try {
      const { data, error } = await supabase.from('time_slots').select('*');
      if (error) {
        console.warn('Supabase fetch error, using localStorage:', error.message);
        return getLocalTimeSlots();
      }
      return data;
    } catch (error) {
      console.warn('Using localStorage fallback for fetch:', error);
      return getLocalTimeSlots();
    }
  },

  async insert(newSlot: any) {
    try {
      const { error } = await supabase.from('time_slots').insert([newSlot]);
      if (error) {
        console.warn('Supabase insert error, using localStorage:', error.message);
        const slots = getLocalTimeSlots();
        slots.push({ ...newSlot, id: Date.now().toString() });
        saveLocalTimeSlots(slots);
      }
      return { success: true };
    } catch (error) {
      console.warn('Using localStorage fallback for insert:', error);
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
      
      if (error) {
        console.warn('Supabase update error, using localStorage:', error.message);
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
      }
      return { success: true };
    } catch (error) {
      console.warn('Using localStorage fallback for update:', error);
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
      
      if (error) {
        console.warn('Supabase delete error, using localStorage:', error.message);
        const slots = getLocalTimeSlots();
        const filteredSlots = slots.filter((slot: any) => 
          !(slot.date === conditions.date && 
            slot.start_time === conditions.start_time && 
            slot.end_time === conditions.end_time)
        );
        saveLocalTimeSlots(filteredSlots);
      }
      return { success: true };
    } catch (error) {
      console.warn('Using localStorage fallback for delete:', error);
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