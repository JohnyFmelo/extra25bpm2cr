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
  QuerySnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
const db = getFirestore(app);
export const auth = getAuth(app);

// Helper function to safely clone Firestore data by removing non-serializable fields
const safeClone = (data: DocumentData) => {
  const cleaned = Object.entries(data).reduce((acc, [key, value]) => {
    // Skip functions and complex objects that can't be cloned
    if (typeof value !== 'function' && !(value instanceof ReadableStream)) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
  
  return JSON.parse(JSON.stringify(cleaned));
};

// Helper function to safely get documents from a query snapshot
const getDocsFromSnapshot = (snapshot: QuerySnapshot) => {
  return snapshot.docs.map(doc => ({
    id: doc.id,
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
  async fetch() {
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
  }
};