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
// Importando TimeSlot de '@/types/user', assumindo que ele pode ter campos em camelCase ou snake_case.
// O ideal seria ter uma interface específica para o que é enviado/recebido do Firebase e outra para a app.
// Por agora, a função transformToFirebaseFormat cuidará da conversão.
import { TimeSlot as AppTimeSlotType } from '@/types/user'; // Esta é a TimeSlot do seu app
import { format as formatDateFns, parseISO } from 'date-fns'; // Para formatar Date para string yyyy-MM-dd e parse

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


// Helper function to transform application slot data to Firebase format
// Input: Pode ser um objeto com campos mistos (camelCase/snake_case)
// Output: Objeto com campos snake_case para o Firebase
const transformToFirebaseFormat = (slotData: any): DocumentData => {
    const dataForFirebase: DocumentData = {};

    // Date: Garante que seja string 'yyyy-MM-dd'
    if (slotData.date) {
        if (slotData.date instanceof Date) {
            dataForFirebase.date = formatDateFns(slotData.date, 'yyyy-MM-dd');
        } else if (typeof slotData.date === 'string') {
            // Tenta normalizar caso venha em formato diferente, mas o ideal é que TimeSlotDialog já envie Date object
            try {
                dataForFirebase.date = formatDateFns(parseISO(slotData.date), 'yyyy-MM-dd');
            } catch (e) {
                dataForFirebase.date = slotData.date; // Mantém se não conseguir parsear (pode já estar correto)
            }
        }
    }

    // Time and Slot counts (prioriza camelCase do Dialog, fallback para snake_case)
    if (slotData.startTime !== undefined || slotData.start_time !== undefined) {
        dataForFirebase.start_time = slotData.startTime || slotData.start_time;
    }
    if (slotData.endTime !== undefined || slotData.end_time !== undefined) {
        dataForFirebase.end_time = slotData.endTime || slotData.end_time;
    }
    if (slotData.slots !== undefined || slotData.total_slots !== undefined) { // `slots` do Dialog, `total_slots` do TimeSlotsList/DB
        dataForFirebase.total_slots = slotData.slots !== undefined ? slotData.slots : slotData.total_slots;
    }
    if (slotData.slotsUsed !== undefined || slotData.slots_used !== undefined) {
        dataForFirebase.slots_used = slotData.slotsUsed !== undefined ? slotData.slotsUsed : slotData.slots_used;
    }

    // Description
    if (slotData.description !== undefined) {
        dataForFirebase.description = slotData.description;
    }

    // Volunteers
    if (slotData.volunteers !== undefined) {
        dataForFirebase.volunteers = slotData.volunteers;
    }

    // isWeekly (do Dialog)
    if (slotData.isWeekly !== undefined) {
        dataForFirebase.is_weekly = slotData.isWeekly;
    }

    // allowedMilitaryTypes (camelCase do Dialog/TimeSlotsList) para allowed_military_types (snake_case no Firebase)
    // Garante que é um array, mesmo que vazio. Remove o fallback problemático.
    dataForFirebase.allowed_military_types = slotData.allowedMilitaryTypes || slotData.allowed_military_types || [];


    // Para outros campos que possam existir no slotData e não foram explicitamente mapeados,
    // mas precisam ser mantidos (cuidado para não adicionar o 'id' ou sobrescrever com undefined)
    // Este loop pode ser perigoso se não controlado. A abordagem explícita acima é mais segura.
    // Por exemplo, se slotData tiver um `id`, ele não deve ir para dentro do objeto de dados do Firebase.
    // Vamos evitar adicionar campos não explicitamente definidos para a transformação para Firebase.

    // Remove undefined fields to prevent overwriting existing Firebase fields with undefined during updates
    const cleanDataForFirebase: DocumentData = {};
    for (const key in dataForFirebase) {
        if (dataForFirebase[key] !== undefined) {
            cleanDataForFirebase[key] = dataForFirebase[key];
        }
    }

    return cleanDataForFirebase;
};

// Helper function to transform Firebase data to application format
// Input: Objeto do Firebase (snake_case)
// Output: Objeto no formato esperado pela aplicação (TimeSlotsList/TimeSlotDialog - camelCase para alguns campos)
// Nota: TimeSlotsList faz sua própria transformação no onSnapshot, mas para fetch direto, isso é útil.
const transformFromFirebaseFormat = (firebaseData: DocumentData, id: string): AppTimeSlotType => {
    // O tipo AppTimeSlotType de @/types/user precisa ser flexível ou este mapeamento
    // deve ser preciso para coincidir com ele.
    // A interface `TimeSlot` dentro de TimeSlotsList.tsx já tem `allowedMilitaryTypes` (camelCase)
    return {
        id: id,
        date: firebaseData.date, // Firebase já tem string 'yyyy-MM-dd'
        // Mapeando snake_case para camelCase se AppTimeSlotType usar camelCase
        startTime: firebaseData.start_time,
        start_time: firebaseData.start_time, // Para compatibilidade com TimeSlotsList

        endTime: firebaseData.end_time,
        end_time: firebaseData.end_time, // Para compatibilidade com TimeSlotsList

        slots: firebaseData.total_slots,       // `slots` é esperado por TimeSlotDialog
        total_slots: firebaseData.total_slots, // Para compatibilidade com TimeSlotsList

        slotsUsed: firebaseData.slots_used,
        slots_used: firebaseData.slots_used, // Para compatibilidade com TimeSlotsList
        
        description: firebaseData.description || "",
        allowedMilitaryTypes: firebaseData.allowed_military_types || [], // Para TimeSlotsList e TimeSlotDialog
        isWeekly: firebaseData.is_weekly || false,
        volunteers: firebaseData.volunteers || [],
        // title: firebaseData.title || '', // Se `title` existir e for parte de AppTimeSlotType

        // Incluindo campos que possam não estar na definição estrita de AppTimeSlotType mas existem no firebaseData
        // ...firebaseData // Isso pode ser arriscado se AppTimeSlotType for estrito.
    } as AppTimeSlotType; // Type assertion, use with caution or make AppTimeSlotType more generic
};


const handleFirestoreOperation = async <T>(
    operation: (db: Firestore) => Promise<T>
): Promise<T> => {
    try {
        const result = await operation(db); // db aqui é a instância global
        return result;
    } catch (error) {
        console.error('Firestore operation error:', error);
        throw error;
    }
};

export const dataOperations = {
    async fetch(): Promise<AppTimeSlotType[]> { // Retorna o tipo da aplicação
        return handleFirestoreOperation(async (firestoreDb) => { // dbInstance para evitar conflito
            const timeSlotCollection = collection(firestoreDb, 'timeSlots');
            const querySnapshot = await getDocs(timeSlotCollection);
            return querySnapshot.docs.map(docSnapshot => transformFromFirebaseFormat(docSnapshot.data(), docSnapshot.id));
        }).catch(error => {
            console.error('Error fetching data:', error);
            return [];
        });
    },

    async insert(newSlotData: any) { // newSlotData vem dos componentes (pode ser misto)
        return handleFirestoreOperation(async (firestoreDb) => {
            const timeSlotCollection = collection(firestoreDb, 'timeSlots');
            const slotToInsertFirebase = transformToFirebaseFormat(newSlotData);
            
            await addDoc(timeSlotCollection, slotToInsertFirebase);
            return { success: true };
        }).catch(error => {
            console.error('Error inserting data:', error, 'Data:', newSlotData, 'Transformed:', transformToFirebaseFormat(newSlotData));
            return { success: false, error };
        });
    },

    async update(updatedSlotData: any, conditions: { date: string; start_time: string; end_time: string }) {
        // updatedSlotData vem dos componentes (pode ser misto).
        // conditions devem ser para campos snake_case do Firebase.
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
                const slotToUpdateFirebase = transformToFirebaseFormat(updatedSlotData);
                
                // Não incluir o 'id' nos dados de atualização do documento
                const { id, ...dataForUpdate } = slotToUpdateFirebase; 

                await updateDoc(docRef, dataForUpdate);
                return { success: true };
            }
            console.warn('No document found for update with conditions:', conditions);
            return { success: false, message: "Document not found for update" };
        }).catch(error => {
            console.error('Error updating data:', error, 'Data:', updatedSlotData, 'Conditions:', conditions, 'Transformed:', transformToFirebaseFormat(updatedSlotData));
            return { success: false, error };
        });
    },

    async delete(conditions: { date: string; start_time: string; end_time: string }) {
        // conditions devem ser para campos snake_case do Firebase.
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
            console.warn('No document found for deletion with conditions:', conditions);
            return { success: false, message: "Document not found for deletion" };
        }).catch(error => {
            console.error('Error deleting data:', error);
            return { success: false, error };
        });
    },

    async clear() {
        return handleFirestoreOperation(async (firestoreDb) => {
            const timeSlotCollection = collection(firestoreDb, 'timeSlots');
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
