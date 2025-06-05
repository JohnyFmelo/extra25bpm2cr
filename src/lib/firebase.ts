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
import { format as formatDateFns, parseISO } from 'date-fns'; // Para formatar Date para string yyyy-MM-dd

// Interface para representar a estrutura de dados como ela é no Firestore
interface FirestoreTimeSlotData {
    date: string; // yyyy-MM-dd
    start_time: string;
    end_time: string;
    total_slots: number;
    slots_used: number;
    description?: string;
    allowed_military_types?: string[]; // snake_case no Firestore
    is_weekly?: boolean; // snake_case no Firestore
    volunteers?: string[];
    // outros campos que existem no firestore
}

// Tipagem para os dados que chegam das camadas da aplicação (componentes)
// Pode ser uma mistura, então usamos `any` aqui e a função de transformação cuida do resto.
type AppSlotDataType = any;


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

// Função de transformação para preparar dados para o Firestore
const transformToFirestoreDocument = (appData: AppSlotDataType): Partial<FirestoreTimeSlotData> => {
    const firestoreDoc: Partial<FirestoreTimeSlotData> = {};

    // Date: Vem como Date de TimeSlotDialog, ou string de TimeSlotsList (já formatada)
    if (appData.date) {
        if (appData.date instanceof Date) {
            firestoreDoc.date = formatDateFns(appData.date, 'yyyy-MM-dd');
        } else if (typeof appData.date === 'string') {
            // Assumindo que se for string, já está 'yyyy-MM-dd' ou pode ser parseada
            try {
                firestoreDoc.date = formatDateFns(parseISO(appData.date), 'yyyy-MM-dd');
            } catch {
                 firestoreDoc.date = appData.date; // Mantém se não parseável, assumindo formato correto
            }
        }
    }

    // Times (start_time, end_time)
    // TimeSlotsList usa start_time, TimeSlotDialog usa startTime
    if (appData.startTime !== undefined) firestoreDoc.start_time = appData.startTime;
    else if (appData.start_time !== undefined) firestoreDoc.start_time = appData.start_time;

    if (appData.endTime !== undefined) firestoreDoc.end_time = appData.endTime;
    else if (appData.end_time !== undefined) firestoreDoc.end_time = appData.end_time;

    // Slots (total_slots, slots_used)
    // TimeSlotsList usa total_slots, TimeSlotDialog usa slots
    if (appData.slots !== undefined) firestoreDoc.total_slots = appData.slots;
    else if (appData.total_slots !== undefined) firestoreDoc.total_slots = appData.total_slots;

    // TimeSlotsList usa slots_used, TimeSlotDialog usa slotsUsed
    if (appData.slotsUsed !== undefined) firestoreDoc.slots_used = appData.slotsUsed;
    else if (appData.slots_used !== undefined) firestoreDoc.slots_used = appData.slots_used;


    // Description (geralmente consistente)
    if (appData.description !== undefined) firestoreDoc.description = appData.description;

    // Volunteers (geralmente consistente)
    if (appData.volunteers !== undefined) firestoreDoc.volunteers = appData.volunteers;

    // allowedMilitaryTypes (camelCase nos componentes) -> allowed_military_types (snake_case no Firestore)
    if (appData.allowedMilitaryTypes !== undefined) {
        firestoreDoc.allowed_military_types = appData.allowedMilitaryTypes;
    } else if (appData.allowed_military_types !== undefined) { // Caso já venha em snake_case
        firestoreDoc.allowed_military_types = appData.allowed_military_types;
    } else {
        // Se a intenção é apagar o campo, deve ser tratado explicitamente,
        // caso contrário, não definir aqui evita sobrescrever com [] se não for intencional.
        // Para um novo documento, [] pode ser o padrão. Para update, omitir se não houver mudança.
        // No entanto, a lógica anterior nos componentes envia sempre, então:
        firestoreDoc.allowed_military_types = []; // Garante que é um array, como antes nos componentes
    }


    // isWeekly (camelCase do Dialog) -> is_weekly (snake_case no Firestore)
    if (appData.isWeekly !== undefined) firestoreDoc.is_weekly = appData.isWeekly;
    else if (appData.is_weekly !== undefined) firestoreDoc.is_weekly = appData.is_weekly;


    // Limpeza: remover chaves com valor undefined para não sobrescrever no Firestore indevidamente em updates.
    // O Firestore ignora chaves `undefined` em `addDoc` e `setDoc`, mas as remove em `updateDoc`.
    const cleanedFirestoreDoc: Partial<FirestoreTimeSlotData> = {};
    for (const key in firestoreDoc) {
        if (firestoreDoc[key as keyof FirestoreTimeSlotData] !== undefined) {
            cleanedFirestoreDoc[key as keyof FirestoreTimeSlotData] = firestoreDoc[key as keyof FirestoreTimeSlotData];
        }
    }
    return cleanedFirestoreDoc;
};


// Helper function to handle Firestore operations
const handleFirestoreOperation = async <T>(
    operation: (dbInstance: Firestore) => Promise<T>
): Promise<T> => {
    try {
        const result = await operation(db); // Usa a instância global `db`
        return result;
    } catch (error) {
        console.error('Firestore operation error:', error);
        throw error;
    }
};

export const dataOperations = {
    // fetch não é usado por TimeSlotsList, pois ele usa onSnapshot.
    // Se você precisar de uma função fetch que retorne os dados transformados para o formato do app (com camelCase para allowedMilitaryTypes),
    // ela precisaria de uma função `transformFromFirestoreDocument`.
    // Por ora, vou focar nas operações de escrita.
    
    /*
    async fetch(): Promise<any[]> { // O tipo de retorno dependeria da interface "AppTimeSlot"
        return handleFirestoreOperation(async (firestoreDb) => {
            const timeSlotCollection = collection(firestoreDb, 'timeSlots');
            const querySnapshot = await getDocs(timeSlotCollection);
            // Precisaria de uma função `transformFromFirestoreDocument` aqui
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }).catch(error => {
            console.error('Error fetching data:', error);
            return [];
        });
    },
    */

    async insert(newSlotAppInput: AppSlotDataType) {
        return handleFirestoreOperation(async (firestoreDb) => {
            const timeSlotCollection = collection(firestoreDb, 'timeSlots');
            const documentToInsert = transformToFirestoreDocument(newSlotAppInput);
            
            // Para 'insert', garantir campos essenciais mesmo que `transformToFirestoreDocument` os limpe se `undefined`
            // (isso é mais uma política de como novos documentos devem ser criados)
            if (documentToInsert.allowed_military_types === undefined) {
                 documentToInsert.allowed_military_types = []; // Default para novos
            }
             if (documentToInsert.slots_used === undefined) {
                 documentToInsert.slots_used = 0; // Default para novos
            }

            await addDoc(timeSlotCollection, documentToInsert);
            return { success: true };
        }).catch(error => {
            const transformed = transformToFirestoreDocument(newSlotAppInput);
            console.error('Error inserting data:', error, 'Input:', newSlotAppInput, 'Transformed:', transformed);
            return { success: false, error };
        });
    },

    async update(updatedSlotAppInput: AppSlotDataType, conditions: { date: string; start_time: string; end_time: string }) {
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
                const documentToUpdate = transformToFirestoreDocument(updatedSlotAppInput);

                // `updateDoc` só atualiza os campos fornecidos. Se um campo for `undefined` no `documentToUpdate`,
                // e ele tiver sido removido pela limpeza em `transformToFirestoreDocument`, ele não será enviado.
                // Se você quiser remover um campo, precisaria enviá-lo com `deleteField()` do Firestore.
                // A limpeza já garante que não enviamos `undefined`.
                await updateDoc(docRef, documentToUpdate);
                return { success: true };
            }
            console.warn('No document found for update. Conditions:', conditions, 'Input:', updatedSlotAppInput);
            return { success: false, message: "Document not found for update." };
        }).catch(error => {
            const transformed = transformToFirestoreDocument(updatedSlotAppInput);
            console.error('Error updating data:', error, 'Input:', updatedSlotAppInput, 'Conditions:', conditions, 'Transformed:', transformed);
            return { success: false, error };
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
            console.warn('No document found for deletion. Conditions:', conditions);
            return { success: false, message: "Document not found for deletion." };
        }).catch(error => {
            console.error('Error deleting data:', error, 'Conditions:', conditions);
            return { success: false, error };
        });
    },

    async clear() {
        return handleFirestoreOperation(async (firestoreDb) => {
            const timeSlotCollection = collection(firestoreDb, 'timeSlots');
            const querySnapshot = await getDocs(timeSlotCollection);

            const deletePromises: Promise<void>[] = [];
            querySnapshot.docs.forEach(docSnapshot => { // Renomeado `doc` para `docSnapshot`
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
