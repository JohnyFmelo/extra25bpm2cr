// --- START OF FILE firebase.ts ---

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
  // Firestore, // Não usado diretamente
  // DocumentData, 
  // QuerySnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { format } from "date-fns"; // Adicionado para fallback em fetch

export interface FirebaseTimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[];
  description?: string;
  allowed_military_types?: string[];
  isWeekly?: boolean;
}

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

type NewSlotPayload = Omit<FirebaseTimeSlot, 'id' | 'volunteers' | 'slots_used'> & { slots_used?: number };
type UpdateSlotPayload = Partial<Omit<FirebaseTimeSlot, 'id'>> & { id: string };

const handleFirestoreOperation = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error('Firestore operation error:', error);
    throw error;
  }
};

export const dataOperations = {
  async fetch(): Promise<FirebaseTimeSlot[]> {
    return handleFirestoreOperation(async () => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      return querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FirebaseTimeSlot, 'id'>),
        date: docSnap.data().date || format(new Date(), 'yyyy-MM-dd'),
        start_time: docSnap.data().start_time || '00:00',
        end_time: docSnap.data().end_time || '00:00',
        total_slots: docSnap.data().total_slots || 0,
        slots_used: docSnap.data().slots_used || 0,
        allowed_military_types: docSnap.data().allowed_military_types || [],
        volunteers: docSnap.data().volunteers || [],
        description: docSnap.data().description || "",
        isWeekly: docSnap.data().isWeekly || false,
      }));
    });
  },

  async insert(newSlotData: NewSlotPayload) {
    return handleFirestoreOperation(async () => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const slotToInsert = {
        ...newSlotData,
        allowed_military_types: newSlotData.allowed_military_types || [],
        volunteers: [],
        slots_used: newSlotData.slots_used !== undefined ? newSlotData.slots_used : 0,
      };
      console.log('[Firebase] Inserting new slot:', JSON.parse(JSON.stringify(slotToInsert)));
      await addDoc(timeSlotCollection, slotToInsert);
      return { success: true };
    }).catch(error => {
      console.error('Error inserting data:', error);
      return { success: false, message: (error as Error).message || "Unknown error during insert" };
    });
  },

  async update(updatedSlotData: UpdateSlotPayload) { // Removido 'conditions'
    return handleFirestoreOperation(async () => {
      if (!updatedSlotData.id) {
        console.error('[Firebase] Update operation requires an ID in updatedSlotData.');
        return { success: false, message: "Update requires an ID." };
      }
      const docRef = doc(db, 'timeSlots', updatedSlotData.id);
      
      const { id, ...dataToUpdate } = updatedSlotData;
      
      const slotToUpdate: Partial<FirebaseTimeSlot> = { ...dataToUpdate };

      if (dataToUpdate.allowed_military_types !== undefined) {
        slotToUpdate.allowed_military_types = dataToUpdate.allowed_military_types || [];
      }

      console.log('[Firebase] dataOperations.update: Attempting to update doc ID:', updatedSlotData.id, 'with payload:', JSON.parse(JSON.stringify(slotToUpdate)));
      await updateDoc(docRef, slotToUpdate);
      return { success: true };
    }).catch(error => {
      console.error('Error updating data:', error);
      return { success: false, message: (error as Error).message || "Unknown error during update" };
    });
  },

  async delete(conditions: { date?: string; start_time?: string; end_time?: string; id?: string }) {
    return handleFirestoreOperation(async () => {
      const timeSlotCollection = collection(db, 'timeSlots');
      let docToDeleteId: string | undefined;

      if (conditions.id) {
        docToDeleteId = conditions.id;
      } else if (conditions.date && conditions.start_time && conditions.end_time) {
        const q = query(
          timeSlotCollection,
          where('date', '==', conditions.date),
          where('start_time', '==', conditions.start_time),
          where('end_time', '==', conditions.end_time)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          docToDeleteId = querySnapshot.docs[0].id;
        }
      } else {
        return { success: false, message: "Insufficient conditions for deletion." };
      }

      if (docToDeleteId) {
        console.log('[Firebase] Deleting document with ID:', docToDeleteId);
        const docRef = doc(db, 'timeSlots', docToDeleteId);
        await deleteDoc(docRef);
        return { success: true };
      }
      return { success: false, message: "Document not found for deletion" };
    }).catch(error => {
      console.error('Error deleting data:', error);
      return { success: false, message: (error as Error).message || "Unknown error during delete" };
    });
  },

  async clear() {
    return handleFirestoreOperation(async () => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      console.log(`[Firebase] Clearing ${querySnapshot.docs.length} documents.`);
      await Promise.all(querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref)));
      return { success: true };
    }).catch(error => {
      console.error('Error clearing data:', error);
      return { success: false, message: (error as Error).message || "Unknown error during clear" };
    });
  }
};
// --- END OF FILE firebase.ts ---
