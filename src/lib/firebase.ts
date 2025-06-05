
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
const getDocsFromSnapshot = (snapshot: QuerySnapshot): TimeSlot[] => {
  return snapshot.docs.map(doc => {
    const data = doc.data();
    console.log('Document data from Firebase:', data);
    return {
      id: doc.id,
      title: data.title || '',
      description: data.description || '',
      date: data.date || '',
      allowedMilitaryTypes: data.allowed_military_types || [], // Mapear corretamente
      ...safeClone(doc.data())
    };
  });
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
  async fetch(): Promise<TimeSlot[]> {
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
      
      console.log('*** FIREBASE INSERT ***');
      console.log('Original slot received:', newSlot);
      console.log('allowedMilitaryTypes from slot:', newSlot.allowedMilitaryTypes);
      
      // Verificar se allowedMilitaryTypes existe e não está vazio
      if (!newSlot.allowedMilitaryTypes || newSlot.allowedMilitaryTypes.length === 0) {
        console.error('ERROR: No allowedMilitaryTypes provided to Firebase insert!');
        return { success: false, error: 'No military types selected' };
      }
      
      // Preparar os dados para inserção, mapeando allowedMilitaryTypes para allowed_military_types
      const slotToInsert = {
        ...safeClone(newSlot),
        allowed_military_types: newSlot.allowedMilitaryTypes
      };
      
      // Remover o campo allowedMilitaryTypes para evitar duplicação
      delete slotToInsert.allowedMilitaryTypes;
      
      console.log('Final slot to insert in Firebase:', slotToInsert);
      console.log('allowed_military_types field:', slotToInsert.allowed_military_types);
      
      await addDoc(timeSlotCollection, slotToInsert);
      return { success: true };
    }).catch(error => {
      console.error('Error inserting data:', error);
      return { success: false, error: error.message };
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
        
        console.log('*** FIREBASE UPDATE ***');
        console.log('Original slot received:', updatedSlot);
        console.log('allowedMilitaryTypes from slot:', updatedSlot.allowedMilitaryTypes);
        
        // Verificar se allowedMilitaryTypes existe
        if (!updatedSlot.allowedMilitaryTypes || updatedSlot.allowedMilitaryTypes.length === 0) {
          console.error('ERROR: No allowedMilitaryTypes provided to Firebase update!');
          return { success: false, error: 'No military types selected' };
        }
        
        // Preparar os dados para atualização, mapeando allowedMilitaryTypes para allowed_military_types
        const slotToUpdate = {
          ...safeClone(updatedSlot),
          allowed_military_types: updatedSlot.allowedMilitaryTypes
        };
        
        // Remover o campo allowedMilitaryTypes para evitar duplicação
        delete slotToUpdate.allowedMilitaryTypes;
        
        console.log('Final slot to update in Firebase:', slotToUpdate);
        console.log('allowed_military_types field:', slotToUpdate.allowed_military_types);
        
        await updateDoc(docRef, slotToUpdate);
        return { success: true };
      }
      return { success: false, error: 'Document not found' };
    }).catch(error => {
      console.error('Error updating data:', error);
      return { success: false, error: error.message };
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
