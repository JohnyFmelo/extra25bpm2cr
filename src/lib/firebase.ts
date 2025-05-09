
// This file is kept for reference or potential rollback, but functionality has been moved to Supabase
// You can safely delete this file if no other parts of the app are using Firebase

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

// ⚠️ Legacy Firebase code - kept for reference
// The functionality has been migrated to Supabase
export const dataOperations = {
  fetch: async () => [],
  insert: async () => ({ success: false, message: "Using Supabase instead of Firebase" }),
  update: async () => ({ success: false, message: "Using Supabase instead of Firebase" }),
  delete: async () => ({ success: false, message: "Using Supabase instead of Firebase" }),
  clear: async () => ({ success: false, message: "Using Supabase instead of Firebase" })
};
