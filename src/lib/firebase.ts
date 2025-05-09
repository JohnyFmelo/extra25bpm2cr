
// This file is kept for reference or potential rollback, but functionality has been moved to Supabase
// You can safely delete this file if no other parts of the app are using Firebase

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Mock Firebase config for compatibility
const firebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "mock-auth-domain",
  projectId: "mock-project-id",
  storageBucket: "mock-storage-bucket",
  messagingSenderId: "mock-messaging-sender-id",
  appId: "mock-app-id"
};

// Initialize Firebase app with mock config
const app = initializeApp(firebaseConfig);

// Export the db object for compatibility with existing code
export const db = getFirestore(app);

const safeClone = (data: any): Record<string, any> => {
  const serializableData: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'function' || value instanceof ReadableStream) {
      continue;
    }
    
    if (value instanceof Date) {
      serializableData[key] = value.toISOString();
      continue;
    }
    
    if (Array.isArray(value)) {
      serializableData[key] = value.map(item => 
        typeof item === 'object' && item !== null ? safeClone(item) : item
      );
      continue;
    }
    
    if (typeof value === 'object' && value !== null) {
      serializableData[key] = safeClone(value);
      continue;
    }
    
    serializableData[key] = value;
  }
  
  return serializableData;
};

// Update dataOperations to use Supabase
import supabase from "./supabaseClient";

export const dataOperations = {
  fetch: async () => {
    try {
      const { data, error } = await supabase.from('timeSlots').select('*');
      
      if (error) {
        console.error("Error fetching data from Supabase:", error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error("Error in fetch operation:", error);
      return [];
    }
  },
  
  insert: async (data: any) => {
    try {
      const { data: insertedData, error } = await supabase
        .from('timeSlots')
        .insert([data])
        .select();
        
      if (error) {
        console.error("Error inserting data to Supabase:", error);
        return { success: false, message: error.message };
      }
      
      return { success: true, data: insertedData };
    } catch (error: any) {
      console.error("Error in insert operation:", error);
      return { success: false, message: error.message };
    }
  },
  
  update: async (newData: any, condition: any) => {
    try {
      let query = supabase.from('timeSlots').update(newData);
      
      // Apply conditions
      if (condition.date) {
        query = query.eq('date', condition.date);
      }
      if (condition.start_time) {
        query = query.eq('start_time', condition.start_time);
      }
      if (condition.end_time) {
        query = query.eq('end_time', condition.end_time);
      }
      
      const { data, error } = await query.select();
      
      if (error) {
        console.error("Error updating data in Supabase:", error);
        return { success: false, message: error.message };
      }
      
      return { success: true, data };
    } catch (error: any) {
      console.error("Error in update operation:", error);
      return { success: false, message: error.message };
    }
  },
  
  delete: async (condition: any) => {
    try {
      let query = supabase.from('timeSlots').delete();
      
      // Apply conditions
      if (condition.date) {
        query = query.eq('date', condition.date);
      }
      if (condition.start_time) {
        query = query.eq('start_time', condition.start_time);
      }
      if (condition.end_time) {
        query = query.eq('end_time', condition.end_time);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error("Error deleting data from Supabase:", error);
        return { success: false, message: error.message };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("Error in delete operation:", error);
      return { success: false, message: error.message };
    }
  },
  
  clear: async () => {
    try {
      const { error } = await supabase
        .from('timeSlots')
        .delete()
        .neq('id', 'placeholder'); // Delete all rows
        
      if (error) {
        console.error("Error clearing data from Supabase:", error);
        return { success: false, message: error.message };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("Error in clear operation:", error);
      return { success: false, message: error.message };
    }
  }
};
