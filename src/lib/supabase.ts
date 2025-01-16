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
  // Since anonymous auth is disabled, we'll just use localStorage
  console.info('Using localStorage for data storage');
  return { type: 'local' };
};

export const isAuthenticated = async () => {
  // Since we're using localStorage, we'll always return false
  return false;
};

export const dataOperations = {
  async fetch() {
    try {
      // Skip Supabase attempt since we know it will fail
      return getLocalTimeSlots();
    } catch (error) {
      console.warn('Error fetching data:', error);
      return getLocalTimeSlots();
    }
  },

  async insert(newSlot: any) {
    try {
      // Skip Supabase attempt since we know it will fail
      const slots = getLocalTimeSlots();
      slots.push({ ...newSlot, id: Date.now().toString() });
      saveLocalTimeSlots(slots);
      return { success: true };
    } catch (error) {
      console.warn('Error inserting data:', error);
      return { success: false };
    }
  },

  async update(updatedSlot: any, conditions: any) {
    try {
      // Skip Supabase attempt since we know it will fail
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
    } catch (error) {
      console.warn('Error updating data:', error);
      return { success: false };
    }
  },

  async delete(conditions: any) {
    try {
      // Skip Supabase attempt since we know it will fail
      const slots = getLocalTimeSlots();
      const filteredSlots = slots.filter((slot: any) => 
        !(slot.date === conditions.date && 
          slot.start_time === conditions.start_time && 
          slot.end_time === conditions.end_time)
      );
      saveLocalTimeSlots(filteredSlots);
      return { success: true };
    } catch (error) {
      console.warn('Error deleting data:', error);
      return { success: false };
    }
  }
};