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
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(slots));
    console.log('Slots saved to localStorage:', slots);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const signInAnonymously = async () => {
  console.info('Using localStorage for data storage');
  return { type: 'local' };
};

export const isAuthenticated = async () => {
  return false;
};

export const dataOperations = {
  async fetch() {
    try {
      const slots = getLocalTimeSlots();
      console.log('Fetched slots from localStorage:', slots);
      return slots;
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  },

  async insert(newSlot: any) {
    try {
      const slots = getLocalTimeSlots();
      const slotWithTimestamp = {
        ...newSlot,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      slots.push(slotWithTimestamp);
      saveLocalTimeSlots(slots);
      console.log('New slot inserted:', slotWithTimestamp);
      return { success: true };
    } catch (error) {
      console.error('Error inserting data:', error);
      return { success: false };
    }
  },

  async update(updatedSlot: any, conditions: any) {
    try {
      const slots = getLocalTimeSlots();
      const index = slots.findIndex((slot: any) => 
        slot.date === conditions.date && 
        slot.start_time === conditions.start_time && 
        slot.end_time === conditions.end_time
      );
      if (index !== -1) {
        slots[index] = {
          ...slots[index],
          ...updatedSlot,
          updated_at: new Date().toISOString()
        };
        saveLocalTimeSlots(slots);
        console.log('Slot updated:', slots[index]);
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating data:', error);
      return { success: false };
    }
  },

  async delete(conditions: any) {
    try {
      const slots = getLocalTimeSlots();
      const filteredSlots = slots.filter((slot: any) => 
        !(slot.date === conditions.date && 
          slot.start_time === conditions.start_time && 
          slot.end_time === conditions.end_time)
      );
      saveLocalTimeSlots(filteredSlots);
      console.log('Slot deleted, remaining slots:', filteredSlots);
      return { success: true };
    } catch (error) {
      console.error('Error deleting data:', error);
      return { success: false };
    }
  }
};