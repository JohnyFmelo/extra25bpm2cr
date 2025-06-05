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
// Assumindo que TimeSlot aqui é a interface usada internamente pela app ANTES de ir pro Firebase,
// ou a interface que se espera retornar do Firebase APÓS conversão.
// Se TimeSlot aqui representa o que vem/vai pro Firebase, então ela deveria ter snake_case.
// Para esta correção, vamos assumir que o objeto que chega em insert/update pode ter camelCase
// para allowedMilitaryTypes, startTime, etc.
import { TimeSlot as AppTimeSlot } from '@/types/timeSlot'; // Exemplo de importação de um tipo camelCase
import { format as formatDateFns } from 'date-fns'; // Para formatar Data para string yyyy-MM-dd

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

// Helper function to safely clone Firestore data (mantida como estava, mas pode não ser ideal para transformações)
const safeClone = (data: DocumentData): Record<string, any> => {
  const serializableData: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'function' || value instanceof ReadableStream) {
      continue;
    }
    
    if (value instanceof Date) { // Se date for Date Object, será convertido para string ISO
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

// Helper para transformar o objeto da aplicação para o formato do Firebase
const transformToFirebaseFormat = (slotData: any): DocumentData => {
  const dataForFirebase: DocumentData = {};

  // Mapeia campos conhecidos, convertendo para snake_case onde necessário
  if (slotData.date) { // Se for Date Object do Dialog, formatar. Se for string de TimeSlotsList, usar direto.
    dataForFirebase.date = (slotData.date instanceof Date) ? formatDateFns(slotData.date, 'yyyy-MM-dd') : slotData.date;
  }
  dataForFirebase.start_time = slotData.startTime || slotData.start_time; // Prioriza camelCase
  dataForFirebase.end_time = slotData.endTime || slotData.end_time;     // Prioriza camelCase
  dataForFirebase.total_slots = slotData.slots || slotData.total_slots; // Prioriza 'slots' (do Dialog)
  dataForFirebase.slots_used = slotData.slotsUsed !== undefined ? slotData.slotsUsed : slotData.slots_used; // Prioriza camelCase
  
  if (slotData.description !== undefined) {
    dataForFirebase.description = slotData.description;
  }
  if (slotData.volunteers !== undefined) {
    dataForFirebase.volunteers = slotData.volunteers;
  }
  if (slotData.isWeekly !== undefined) { // Campo do Dialog
    dataForFirebase.is_weekly = slotData.isWeekly; // Salva como snake_case
  }
  
  // CORREÇÃO: Trata allowedMilitaryTypes e salva como allowed_military_types
  // Garante que sempre será um array, mesmo que vazio. Remove o fallback problemático.
  dataForFirebase.allowed_military_types = slotData.allowedMilitaryTypes || slotData.allowed_military_types || [];

  // Adiciona outros campos que não precisam de transformação, se existirem e forem seguros
  // Ex: id não é salvo diretamente, é o ID do documento.
  // Cuidado para não sobrescrever campos essenciais com undefined se não existirem no slotData.
  // Apenas campos que realmente devem ser atualizados.
  Object.keys(slotData).forEach(key => {
    if (!['id', 'date', 'startTime', 'endTime', 'slots', 'slotsUsed', 'allowedMilitaryTypes', 'start_time', 'end_time', 'total_slots', 'slots_used', 'allowed_military_types', 'isWeekly', 'description', 'volunteers'].includes(key)) {
      if (slotData[key] !== undefined) { // Só adiciona se existir
        dataForFirebase[key] = slotData[key];
      }
    }
  });
  
  return dataForFirebase;
};


// Helper function to safely get documents from a query snapshot (Não usada por TimeSlotsList para onSnapshot)
// Se usada, precisaria mapear snake_case do Firebase para camelCase da AppTimeSlot
const getDocsFromSnapshot = (snapshot: QuerySnapshot): AppTimeSlot[] => {
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      date: data.date ? parseISO(data.date) : new Date(), // Assume que data.date é string 'yyyy-MM-dd'
      startTime: data.start_time || '',
      endTime: data.end_time || '',
      slots: data.total_slots || 0,
      slotsUsed: data.slots_used || 0,
      description: data.description || '',
      allowedMilitaryTypes: data.allowed_military_types || [],
      isWeekly: data.is_weekly || false,
      // volunteers: data.volunteers || [], // Se AppTimeSlot tiver volunteers
    } as AppTimeSlot; // Type assertion
  });
};


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
  async fetch(): Promise<AppTimeSlot[]> { // Retorna o tipo da aplicação (camelCase)
    return handleFirestoreOperation(async (dbInstance) => {
      const timeSlotCollection = collection(dbInstance, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      return getDocsFromSnapshot(querySnapshot); // Usa o helper que converte
    }).catch(error => {
      console.error('Error fetching data:', error);
      return [];
    });
  },

  async insert(newSlotData: any) { // newSlotData vem do TimeSlotDialog (camelCase) ou TimeSlotsList
    return handleFirestoreOperation(async (dbInstance) => {
      const timeSlotCollection = collection(dbInstance, 'timeSlots');
      
      // CORREÇÃO: Transforma para o formato do Firebase (snake_case para certos campos)
      const slotToInsertFirebase = transformToFirebaseFormat(newSlotData);
      
      await addDoc(timeSlotCollection, slotToInsertFirebase);
      return { success: true };
    }).catch(error => {
      console.error('Error inserting data:', error);
      return { success: false, error };
    });
  },

  async update(updatedSlotData: any, conditions: any) { 
    // updatedSlotData vem de TimeSlotsList (majoritariamente snake_case mas com allowedMilitaryTypes camelCase)
    // ou de um fluxo que use AppTimeSlot (camelCase).
    // conditions (date, start_time, end_time) devem ser para campos do Firebase.
    return handleFirestoreOperation(async (dbInstance) => {
      const timeSlotCollection = collection(dbInstance, 'timeSlots');
      const q = query(
        timeSlotCollection,
        where('date', '==', conditions.date), // conditions.date deve ser string 'yyyy-MM-dd'
        where('start_time', '==', conditions.start_time),
        where('end_time', '==', conditions.end_time)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(dbInstance, 'timeSlots', querySnapshot.docs[0].id);
        
        // CORREÇÃO: Transforma para o formato do Firebase (snake_case para certos campos)
        // Remove campos que não devem ser atualizados ou que são indefinidos.
        const slotToUpdateFirebase = transformToFirebaseFormat(updatedSlotData);

        // Para garantir que não estamos enviando 'undefined' para campos que não queremos apagar
        const finalUpdateData: DocumentData = {};
        for (const key in slotToUpdateFirebase) {
            if (slotToUpdateFirebase[key] !== undefined) {
                finalUpdateData[key] = slotToUpdateFirebase[key];
            }
        }
        
        await updateDoc(docRef, finalUpdateData);
        return { success: true };
      }
      return { success: false, message: "Document not found for update" };
    }).catch(error => {
      console.error('Error updating data:', error);
      return { success: false, error };
    });
  },

  async delete(conditions: any) { // conditions para campos do Firebase
    return handleFirestoreOperation(async (dbInstance) => {
      const timeSlotCollection = collection(dbInstance, 'timeSlots');
      const q = query(
        timeSlotCollection,
        where('date', '==', conditions.date),
        where('start_time', '==', conditions.start_time),
        where('end_time', '==', conditions.end_time)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(dbInstance, 'timeSlots', querySnapshot.docs[0].id);
        await deleteDoc(docRef);
        return { success: true };
      }
      return { success: false, message: "Document not found for deletion" };
    }).catch(error => {
      console.error('Error deleting data:', error);
      return { success: false, error };
    });
  },

  async clear() {
    return handleFirestoreOperation(async (dbInstance) => {
      const timeSlotCollection = collection(dbInstance, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      
      const deletePromises: Promise<void>[] = [];
      querySnapshot.docs.forEach(docSnapshot => {
        deletePromises.push(deleteDoc(docSnapshot.ref));
      });
      await Promise.all(deletePromises);
      return { success: true };
    }).catch(error => {
      console.error('Error clearing data:', error);
      return { success: false, error };
    });
  }
};
