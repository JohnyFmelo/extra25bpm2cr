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
import { TimeSlot } from '@/types/user'; // Assumindo que TimeSlot inclui allowedMilitaryTypes

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
// Esta função é genérica e pode permanecer como está,
// mas é importante como seus resultados são usados.
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
  return snapshot.docs.map(docSnapshot => {
    const firebaseData = docSnapshot.data();
    console.log('Document data from Firebase:', firebaseData);

    // Extrai allowed_military_types para evitar duplicação após o spread
    // e para mapear para a propriedade camelCase do tipo TimeSlot.
    const { allowed_military_types, ...restOfFirebaseData } = firebaseData;

    return {
      id: docSnapshot.id,
      // Mapeia explicitamente campos conhecidos do TimeSlot.
      // Se safeClone for usado para o resto, garante que não haverá conflito
      // com allowed_military_types, pois ele já foi extraído.
      title: firebaseData.title || '',
      description: firebaseData.description || '',
      date: firebaseData.date || '',
      allowedMilitaryTypes: allowed_military_types || [], // Mapeia snake_case para camelCase
      ...safeClone(restOfFirebaseData) // Espalha o restante dos dados clonados
      // Certifique-se de que TimeSlot possa acomodar essas propriedades extras se houver
      // ou seja mais específico sobre quais propriedades de restOfFirebaseData você deseja.
    } as TimeSlot; // Faz um type assertion para TimeSlot
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
    return handleFirestoreOperation(async (firestoreDb) => { // Renomeado db para firestoreDb para clareza
      const timeSlotCollection = collection(firestoreDb, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      return getDocsFromSnapshot(querySnapshot);
    }).catch(error => {
      console.error('Error fetching data:', error);
      return [];
    });
  },

  // Tipar newSlot como TimeSlot (ou um tipo específico para criação se for diferente)
  async insert(newSlot: TimeSlot) {
    return handleFirestoreOperation(async (firestoreDb) => {
      const timeSlotCollection = collection(firestoreDb, 'timeSlots');

      console.log('*** FIREBASE INSERT ***');
      console.log('Original slot received:', newSlot);
      console.log('allowedMilitaryTypes from slot:', newSlot.allowedMilitaryTypes);

      if (!newSlot.allowedMilitaryTypes || newSlot.allowedMilitaryTypes.length === 0) {
        console.error('ERROR: No allowedMilitaryTypes provided to Firebase insert!');
        return { success: false, error: 'No military types selected' };
      }

      // Desestrutura para separar allowedMilitaryTypes e o resto dos dados
      const { allowedMilitaryTypes, ...restOfSlotData } = newSlot;

      // Prepara os dados para inserção, mapeando allowedMilitaryTypes para allowed_military_types
      const slotToInsert = {
        ...safeClone(restOfSlotData as DocumentData), // Clona o resto dos dados
        allowed_military_types: allowedMilitaryTypes  // Adiciona a versão snake_case
      };
      // Não é mais necessário `delete slotToInsert.allowedMilitaryTypes;`

      console.log('Final slot to insert in Firebase:', slotToInsert);
      console.log('allowed_military_types field:', slotToInsert.allowed_military_types);

      await addDoc(timeSlotCollection, slotToInsert);
      return { success: true };
    }).catch(error => {
      console.error('Error inserting data:', error);
      return { success: false, error: (error as Error).message };
    });
  },

  // Tipar updatedSlot como Partial<TimeSlot> para permitir atualizações parciais
  async update(updatedSlot: Partial<TimeSlot>, conditions: { date: string; start_time: string; end_time: string }) {
    return handleFirestoreOperation(async (firestoreDb) => {
      const timeSlotCollection = collection(firestoreDb, 'timeSlots');
      const q = query(
        timeSlotCollection,
        where('date', '==', conditions.date),
        where('start_time', '==', conditions.start_time),
        where('end_time', '==', conditions.end_time)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(firestoreDb, 'timeSlots', querySnapshot.docs[0].id);

        console.log('*** FIREBASE UPDATE ***');
        console.log('Original slot received:', updatedSlot);
        // Acessar allowedMilitaryTypes de forma segura, pois updatedSlot pode ser parcial
        const currentAllowedMilitaryTypes = updatedSlot.allowedMilitaryTypes;
        console.log('allowedMilitaryTypes from slot:', currentAllowedMilitaryTypes);

        // Se allowedMilitaryTypes está presente e é inválido, retorna erro.
        // Se não estiver presente em updatedSlot, não o modificaremos (ou você pode ter lógica para removê-lo se for undefined).
        if (currentAllowedMilitaryTypes !== undefined && (!currentAllowedMilitaryTypes || currentAllowedMilitaryTypes.length === 0)) {
          console.error('ERROR: Empty allowedMilitaryTypes provided for Firebase update!');
          return { success: false, error: 'No military types selected for update' };
        }

        // Desestrutura para separar allowedMilitaryTypes e o resto dos dados
        // Apenas se allowedMilitaryTypes estiver definido em updatedSlot
        const { allowedMilitaryTypes, ...restOfSlotData } = updatedSlot;
        
        const slotToUpdate: DocumentData = { ...safeClone(restOfSlotData as DocumentData) };

        // Adiciona allowed_military_types apenas se allowedMilitaryTypes foi fornecido na atualização
        if (allowedMilitaryTypes !== undefined) {
            slotToUpdate.allowed_military_types = allowedMilitaryTypes;
        }
        // Não é mais necessário `delete slotToUpdate.allowedMilitaryTypes;`

        console.log('Final slot to update in Firebase:', slotToUpdate);
        if (slotToUpdate.allowed_military_types !== undefined) {
            console.log('allowed_military_types field:', slotToUpdate.allowed_military_types);
        }

        await updateDoc(docRef, slotToUpdate);
        return { success: true };
      }
      return { success: false, error: 'Document not found' };
    }).catch(error => {
      console.error('Error updating data:', error);
      return { success: false, error: (error as Error).message };
    });
  },

  async delete(conditions: { date: string; start_time: string; end_time: string }) {
    return handleFirestoreOperation(async (firestoreDb) => {
      const timeSlotCollection = collection(firestoreDb, 'timeSlots');
      const q = query(
        timeSlotCollection,
        where('date', '==', conditions.date),
        where('start_time', '==', conditions.start_time),
        where('end_time', '==', conditions.end_time)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(firestoreDb, 'timeSlots', querySnapshot.docs[0].id);
        await deleteDoc(docRef);
        return { success: true };
      }
      return { success: false, error: 'Document not found for deletion' }; // Adicionado error
    }).catch(error => {
      console.error('Error deleting data:', error);
      return { success: false, error: (error as Error).message }; // Adicionado error
    });
  },

  async clear() {
    return handleFirestoreOperation(async (firestoreDb) => {
      const timeSlotCollection = collection(firestoreDb, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);

      await Promise.all(
        querySnapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref))
      );
      return { success: true };
    }).catch(error => {
      console.error('Error clearing data:', error);
      return { success: false, error: (error as Error).message }; // Adicionado error
    });
  }
};
