// --- START OF FILE firebase.ts (ou @/lib/firebase/index.ts) ---

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
  DocumentData, // Mantido para compatibilidade com safeClone se você o readicionar
  QuerySnapshot // Mantido para compatibilidade com getDocsFromSnapshot se você o readicionar
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Importar a interface TimeSlot de TimeSlotsList para consistência com os dados do Firebase
// Se TimeSlotsList.tsx estiver em um local diferente, ajuste o path.
// Supondo que TimeSlotsList.tsx está em '@/components/TimeSlotsList.tsx' ou similar
// e exporta a interface TimeSlot.
// Se não puder importar diretamente, defina uma interface aqui que corresponda.
// import { TimeSlot as FirebaseTimeSlot } from '@/components/TimeSlotsList'; 
// Alternativamente, defina a interface aqui se a importação circular/direta for um problema:
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
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // Opcional
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Tipos para os dados que vêm do TimeSlotDialog para as operações de escrita
type NewSlotPayload = Omit<FirebaseTimeSlot, 'id' | 'volunteers' | 'slots_used'> & { slots_used?: number };
type UpdateSlotPayload = Partial<Omit<FirebaseTimeSlot, 'id'>> & { id: string }; // id é obrigatório para update

// Helper para operações Firestore (opcional, mas bom para logging/error handling centralizado)
const handleFirestoreOperation = async <T>(
  operation: () => Promise<T> // Simplificado para não passar 'db'
): Promise<T> => {
  try {
    const result = await operation();
    return result;
  } catch (error) {
    console.error('Firestore operation error:', error);
    // Você pode querer retornar um objeto de erro padronizado aqui
    throw error; // Re-lança para que a chamada original possa tratar
  }
};

export const dataOperations = {
  // Fetch não é mais usado por TimeSlotsList diretamente, que usa onSnapshot.
  // Mas pode ser útil para outras partes ou se onSnapshot for removido.
  async fetch(): Promise<FirebaseTimeSlot[]> {
    return handleFirestoreOperation(async () => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      return querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FirebaseTimeSlot, 'id'>), // Cast para o tipo base
        // Garantir fallbacks para campos cruciais se vierem undefined do DB
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
        allowed_military_types: newSlotData.allowed_military_types || [], // Garante array
        volunteers: [], // Novo slot começa sem voluntários
        slots_used: newSlotData.slots_used !== undefined ? newSlotData.slots_used : 0, // Padrão para slots_used
      };
      await addDoc(timeSlotCollection, slotToInsert);
      return { success: true };
    }).catch(error => {
      console.error('Error inserting data:', error);
      return { success: false, message: (error as Error).message || "Unknown error" };
    });
  },

  async update(updatedSlotData: UpdateSlotPayload, conditions?: any) { 
    // 'conditions' pode ser removido se o ID for sempre usado.
    // TimeSlotsList já envia 'id' em 'updatedSlotData' para handleVolunteer, etc.
    return handleFirestoreOperation(async () => {
      if (!updatedSlotData.id) {
        console.error('Update operation requires an ID.');
        return { success: false, message: "Update requires an ID." };
      }
      const docRef = doc(db, 'timeSlots', updatedSlotData.id);
      
      // Criar um objeto apenas com os campos a serem atualizados, excluindo o 'id'.
      const { id, ...dataToUpdate } = updatedSlotData;
      
      const slotToUpdate: Partial<FirebaseTimeSlot> = { ...dataToUpdate };

      // Garante que allowed_military_types seja um array se estiver sendo atualizado
      if (dataToUpdate.allowed_military_types !== undefined) {
        slotToUpdate.allowed_military_types = dataToUpdate.allowed_military_types || [];
      }

      await updateDoc(docRef, slotToUpdate);
      return { success: true };
    }).catch(error => {
      console.error('Error updating data:', error);
      return { success: false, message: (error as Error).message || "Unknown error" };
    });
  },

  async delete(conditions: { date: string; start_time: string; end_time: string; } | { id: string }) {
    return handleFirestoreOperation(async () => {
      const timeSlotCollection = collection(db, 'timeSlots');
      let docToDeleteId: string | undefined;

      if ('id' in conditions && conditions.id) {
        docToDeleteId = conditions.id;
      } else if ('date' in conditions) { // Fallback para lógica antiga se ID não for passado
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
      }

      if (docToDeleteId) {
        const docRef = doc(db, 'timeSlots', docToDeleteId);
        await deleteDoc(docRef);
        return { success: true };
      }
      return { success: false, message: "Document not found for deletion" };
    }).catch(error => {
      console.error('Error deleting data:', error);
      return { success: false, message: (error as Error).message || "Unknown error" };
    });
  },

  async clear() {
    return handleFirestoreOperation(async () => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      await Promise.all(querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref)));
      return { success: true };
    }).catch(error => {
      console.error('Error clearing data:', error);
      return { success: false, message: (error as Error).message || "Unknown error" };
    });
  }
};
// --- END OF FILE firebase.ts ---
