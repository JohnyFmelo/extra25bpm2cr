
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  Firestore,
  DocumentData,
  QuerySnapshot,
  orderBy
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { TimeSlot } from '@/types/user';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Helper function to safely clone Firestore data
const safeClone = (data: DocumentData): Record<string, any> => {
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

// Helper function to safely get documents from a query snapshot
const getDocsFromSnapshot = (snapshot: QuerySnapshot): any[] => {
  return snapshot.docs.map(doc => ({
    id: doc.id,
    title: doc.data().title || '',
    description: doc.data().description || '',
    date: doc.data().date || '',
    ...safeClone(doc.data())
  }));
};

// Helper function to handle Firestore operations with proper cleanup
const handleFirestoreOperation = async <T>(
  operation: (db: Firestore) => Promise<T>
): Promise<T> => {
  try {
    const result = await operation(db);
    return result;
  } catch (error) {
    console.error('Firestore operation error:', error);
    throw error;
  }
};

export const dataOperations = {
  async fetch(): Promise<any[]> {
    return handleFirestoreOperation(async (db) => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      return getDocsFromSnapshot(querySnapshot);
    }).catch(error => {
      console.error('Error fetching data:', error);
      return [];
    });
  },

  async insert(newSlot: any) {
    return handleFirestoreOperation(async (db) => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const clonedSlot = safeClone(newSlot);
      await addDoc(timeSlotCollection, clonedSlot);
      return { success: true };
    }).catch(error => {
      console.error('Error inserting data:', error);
      return { success: false };
    });
  },

  async update(updatedSlot: any, conditions: any) {
    return handleFirestoreOperation(async (db) => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const q = query(
        timeSlotCollection,
        where('date', '==', conditions.date),
        where('start_time', '==', conditions.start_time),
        where('end_time', '==', conditions.end_time)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'timeSlots', querySnapshot.docs[0].id);
        const clonedSlot = safeClone(updatedSlot);
        await updateDoc(docRef, clonedSlot);
        return { success: true };
      }
      return { success: false };
    }).catch(error => {
      console.error('Error updating data:', error);
      return { success: false };
    });
  },

  async delete(conditions: any) {
    return handleFirestoreOperation(async (db) => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const q = query(
        timeSlotCollection,
        where('date', '==', conditions.date),
        where('start_time', '==', conditions.start_time),
        where('end_time', '==', conditions.end_time)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'timeSlots', querySnapshot.docs[0].id);
        await deleteDoc(docRef);
        return { success: true };
      }
      return { success: false };
    }).catch(error => {
      console.error('Error deleting data:', error);
      return { success: false };
    });
  },

  async clear() {
    return handleFirestoreOperation(async (db) => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      
      await Promise.all(
        querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      );
      return { success: true };
    }).catch(error => {
      console.error('Error clearing data:', error);
      return { success: false };
    });
  },

  // New method specifically for budget operations
  async getBudget() {
    return handleFirestoreOperation(async (db) => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const q = query(
        timeSlotCollection,
        where('type', '==', 'budget_config'),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const budgetDoc = querySnapshot.docs[0];
        return { success: true, budget: budgetDoc.data().budget };
      }
      return { success: false, budget: null };
    }).catch(error => {
      console.error('Error fetching budget:', error);
      return { success: false, budget: null };
    });
  }
};
