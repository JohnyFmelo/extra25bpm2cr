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
import { format as formatDateFns, parseISO } from 'date-fns';

// Interface representando os dados como devem ser no Firestore
interface FirestoreTimeSlotSchema {
    date: string;
    start_time: string;
    end_time: string;
    total_slots: number;
    slots_used: number;
    description?: string;
    allowed_military_types?: string[]; // Este é o nome no Firestore
    is_weekly?: boolean;
    volunteers?: string[];
}

type AppSlotDataType = any; // Tipo genérico para dados vindos da aplicação

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

// Função de transformação CRÍTICA: prepara os dados para o Firestore
const transformToFirestoreDocument = (appData: AppSlotDataType): Partial<FirestoreTimeSlotSchema> => {
    const firestoreDoc: Partial<FirestoreTimeSlotSchema> = {};

    // 1. Date (string 'yyyy-MM-dd')
    if (appData.date) {
        if (appData.date instanceof Date) {
            firestoreDoc.date = formatDateFns(appData.date, 'yyyy-MM-dd');
        } else if (typeof appData.date === 'string') {
            try {
                // Tenta normalizar se for uma string ISO completa
                firestoreDoc.date = formatDateFns(parseISO(appData.date), 'yyyy-MM-dd');
            } catch {
                firestoreDoc.date = appData.date; // Assume que já está no formato yyyy-MM-dd
            }
        }
    }

    // 2. start_time (string)
    // TimeSlotsList.tsx espera ler 'start_time'. TimeSlotDialog.tsx envia 'startTime'.
    if (appData.startTime !== undefined) firestoreDoc.start_time = appData.startTime;
    else if (appData.start_time !== undefined) firestoreDoc.start_time = appData.start_time;

    // 3. end_time (string)
    // TimeSlotsList.tsx espera ler 'end_time'. TimeSlotDialog.tsx envia 'endTime'.
    if (appData.endTime !== undefined) firestoreDoc.end_time = appData.endTime;
    else if (appData.end_time !== undefined) firestoreDoc.end_time = appData.end_time;

    // 4. total_slots (number)
    // TimeSlotsList.tsx espera ler 'total_slots'. TimeSlotDialog.tsx envia 'slots'.
    if (appData.slots !== undefined) firestoreDoc.total_slots = Number(appData.slots); // Garante que é número
    else if (appData.total_slots !== undefined) firestoreDoc.total_slots = Number(appData.total_slots);

    // 5. slots_used (number)
    // TimeSlotsList.tsx espera ler 'slots_used'. TimeSlotDialog.tsx envia 'slotsUsed'.
    if (appData.slotsUsed !== undefined) firestoreDoc.slots_used = Number(appData.slotsUsed);
    else if (appData.slots_used !== undefined) firestoreDoc.slots_used = Number(appData.slots_used);

    // 6. description (string, opcional)
    if (appData.description !== undefined) firestoreDoc.description = appData.description;

    // 7. allowed_military_types (array de strings, opcional)
    // TimeSlotsList.tsx espera ler 'allowed_military_types' e converte para 'allowedMilitaryTypes'.
    // Ambos os componentes (Dialog e List) trabalham com 'allowedMilitaryTypes' internamente.
    // Então, quando vem 'allowedMilitaryTypes' do app, salvamos como 'allowed_military_types'.
    if (appData.allowedMilitaryTypes !== undefined && Array.isArray(appData.allowedMilitaryTypes)) {
        firestoreDoc.allowed_military_types = appData.allowedMilitaryTypes;
    } else if (appData.allowed_military_types !== undefined && Array.isArray(appData.allowed_military_types)) {
        // Fallback se já vier como snake_case (menos provável agora)
        firestoreDoc.allowed_military_types = appData.allowed_military_types;
    }
    // Se não vier nem 'allowedMilitaryTypes' nem 'allowed_military_types', mas for um insert,
    // um default de [] pode ser aplicado na função insert diretamente.
    // Para update, se o campo não estiver no objeto appData, ele não será incluído no update,
    // preservando o valor existente no Firestore (a menos que seja intencionalmente enviado como [] para limpar).

    // 8. is_weekly (boolean, opcional)
    // TimeSlotDialog.tsx envia 'isWeekly'. Salvar como 'is_weekly'.
    if (appData.isWeekly !== undefined) firestoreDoc.is_weekly = appData.isWeekly;
    else if (appData.is_weekly !== undefined) firestoreDoc.is_weekly = appData.is_weekly; // fallback

    // 9. volunteers (array de strings, opcional)
    if (appData.volunteers !== undefined) firestoreDoc.volunteers = appData.volunteers;

    // Remover chaves com valor undefined ANTES de retornar,
    // para que `updateDoc` não apague campos que não foram intencionalmente modificados.
    const cleanedFirestoreDoc: Partial<FirestoreTimeSlotSchema> = {};
    for (const key in firestoreDoc) {
        if (firestoreDoc[key as keyof FirestoreTimeSlotSchema] !== undefined) {
            cleanedFirestoreDoc[key as keyof FirestoreTimeSlotSchema] = firestoreDoc[key as keyof FirestoreTimeSlotSchema];
        }
    }
    return cleanedFirestoreDoc;
};

const handleFirestoreOperation = async <T>(
    operation: (dbInstance: Firestore) => Promise<T>
): Promise<T> => {
    try {
        return await operation(db);
    } catch (error) {
        console.error('Firestore operation error:', error);
        throw error;
    }
};

export const dataOperations = {
    async insert(newSlotAppInput: AppSlotDataType) {
        return handleFirestoreOperation(async (firestoreDb) => {
            const timeSlotCollection = collection(firestoreDb, 'timeSlots');
            let documentToInsert = transformToFirestoreDocument(newSlotAppInput);

            // Defaults para novos documentos, se não definidos pela transformação
            if (documentToInsert.slots_used === undefined) {
                documentToInsert.slots_used = 0;
            }
            if (documentToInsert.allowed_military_types === undefined) {
                documentToInsert.allowed_military_types = [];
            }
            if (documentToInsert.volunteers === undefined) {
                documentToInsert.volunteers = [];
            }
            // Garantir que total_slots exista
            if (documentToInsert.total_slots === undefined) {
                 // Você precisa de um default sensato se não vier nem 'slots' nem 'total_slots'
                documentToInsert.total_slots = 0; // Ou lançar um erro se for obrigatório
                console.warn("Inserting new slot without total_slots. Defaulting to 0. Input:", newSlotAppInput);
            }


            await addDoc(timeSlotCollection, documentToInsert);
            return { success: true };
        }).catch(error => {
            console.error('Error inserting data:', error, 'Input:', newSlotAppInput, 'Transformed:', transformToFirestoreDocument(newSlotAppInput));
            return { success: false, error };
        });
    },

    async update(updatedSlotAppInput: AppSlotDataType, conditions: { date: string; start_time: string; end_time: string }) {
        return handleFirestoreOperation(async (firestoreDb) => {
            const timeSlotCollection = collection(firestoreDb, 'timeSlots');
            // Conditions usam os nomes de campo como estão no Firestore (snake_case)
            const q = query(
                timeSlotCollection,
                where('date', '==', conditions.date),
                where('start_time', '==', conditions.start_time),
                where('end_time', '==', conditions.end_time)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = doc(firestoreDb, 'timeSlots', querySnapshot.docs[0].id);
                // Transformar os dados do app para o formato do Firestore
                // A limpeza de 'undefined' já ocorre em transformToFirestoreDocument
                const documentToUpdate = transformToFirestoreDocument(updatedSlotAppInput);

                if (Object.keys(documentToUpdate).length === 0) {
                    console.warn("Update called with no data to update after transformation. Input:", updatedSlotAppInput);
                    return { success: true, message: "No changes to apply." }; // Ou false se isso for um erro
                }
                
                await updateDoc(docRef, documentToUpdate);
                return { success: true };
            }
            console.warn('No document found for update. Conditions:', conditions, 'Input:', updatedSlotAppInput);
            return { success: false, message: "Document not found for update." };
        }).catch(error => {
            console.error('Error updating data:', error, 'Input:', updatedSlotAppInput, 'Conditions:', conditions, 'Transformed:', transformToFirestoreDocument(updatedSlotAppInput));
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
