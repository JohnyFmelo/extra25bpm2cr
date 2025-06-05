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
import { format as formatDateFns, parseISO, isValid as isValidDate } from 'date-fns'; // isValidDate para checagem

// Interface que representa a estrutura de dados como ela é no Firestore
interface FirestoreSchema {
    date: string;
    start_time: string;
    end_time: string;
    total_slots: number;
    slots_used: number;
    description?: string;
    allowed_military_types?: string[];
    is_weekly?: boolean;
    volunteers?: string[];
    // Adicionar outros campos que existem no Firestore.
}

// Tipagem para os dados que podem vir da aplicação (podem ser mistos).
// `any` é usado aqui, a transformação lida com a estrutura.
type AppInputDataType = any;

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

// Função central de transformação: App Data -> Firestore Document
const transformToFirestoreDocument = (appData: AppInputDataType): Partial<FirestoreSchema> => {
    const firestoreDoc: Partial<FirestoreSchema> = {};

    // 1. Date (string 'yyyy-MM-dd')
    if (appData.date !== undefined) {
        if (appData.date instanceof Date && isValidDate(appData.date)) {
            firestoreDoc.date = formatDateFns(appData.date, 'yyyy-MM-dd');
        } else if (typeof appData.date === 'string') {
            try {
                const parsed = parseISO(appData.date);
                if (isValidDate(parsed)) {
                    firestoreDoc.date = formatDateFns(parsed, 'yyyy-MM-dd');
                } else {
                     firestoreDoc.date = appData.date; // Assume que string já está correta se não parseável como ISO
                }
            } catch {
                firestoreDoc.date = appData.date; // Mantém a string original
            }
        }
    }

    // 2. start_time
    if (appData.startTime !== undefined) firestoreDoc.start_time = String(appData.startTime);
    else if (appData.start_time !== undefined) firestoreDoc.start_time = String(appData.start_time);

    // 3. end_time
    if (appData.endTime !== undefined) firestoreDoc.end_time = String(appData.endTime);
    else if (appData.end_time !== undefined) firestoreDoc.end_time = String(appData.end_time);

    // 4. total_slots
    if (appData.slots !== undefined) firestoreDoc.total_slots = Number(appData.slots);
    else if (appData.total_slots !== undefined) firestoreDoc.total_slots = Number(appData.total_slots);

    // 5. slots_used
    if (appData.slotsUsed !== undefined) firestoreDoc.slots_used = Number(appData.slotsUsed);
    else if (appData.slots_used !== undefined) firestoreDoc.slots_used = Number(appData.slots_used);

    // 6. description
    if (appData.description !== undefined) firestoreDoc.description = String(appData.description);

    // 7. allowed_military_types
    if (appData.allowedMilitaryTypes !== undefined && Array.isArray(appData.allowedMilitaryTypes)) {
        firestoreDoc.allowed_military_types = appData.allowedMilitaryTypes.map(String);
    } else if (appData.allowed_military_types !== undefined && Array.isArray(appData.allowed_military_types)) {
        firestoreDoc.allowed_military_types = appData.allowed_military_types.map(String);
    }
    // Se não presente, não será adicionado, preservando valor no update ou usando default no insert.

    // 8. is_weekly
    if (appData.isWeekly !== undefined) firestoreDoc.is_weekly = Boolean(appData.isWeekly);
    else if (appData.is_weekly !== undefined) firestoreDoc.is_weekly = Boolean(appData.is_weekly);

    // 9. volunteers
    if (appData.volunteers !== undefined && Array.isArray(appData.volunteers)) {
        firestoreDoc.volunteers = appData.volunteers.map(String);
    }

    // Remove explicitamente undefined, null não é removido aqui, Firestore os trata diferente.
    const cleanedDoc: Partial<FirestoreSchema> = {};
    for (const key of Object.keys(firestoreDoc)) {
        const typedKey = key as keyof FirestoreSchema;
        if (firestoreDoc[typedKey] !== undefined) {
            cleanedDoc[typedKey] = firestoreDoc[typedKey];
        }
    }
    return cleanedDoc;
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
    async insert(appInput: AppInputDataType) {
        return handleFirestoreOperation(async (firestoreDb) => {
            const timeSlotCollection = collection(firestoreDb, 'timeSlots');
            let docToInsert = transformToFirestoreDocument(appInput);

            // Defaults for new documents
            if (docToInsert.date === undefined) throw new Error("Date is required for new time slot.");
            if (docToInsert.start_time === undefined) throw new Error("Start time is required for new time slot.");
            if (docToInsert.end_time === undefined) throw new Error("End time is required for new time slot.");
            if (docToInsert.total_slots === undefined || isNaN(docToInsert.total_slots)) {
                throw new Error("Total slots (number) is required for new time slot.");
            }

            if (docToInsert.slots_used === undefined || isNaN(docToInsert.slots_used)) {
                 docToInsert.slots_used = 0;
            }
            if (docToInsert.allowed_military_types === undefined) {
                docToInsert.allowed_military_types = [];
            }
            if (docToInsert.volunteers === undefined) {
                docToInsert.volunteers = [];
            }
            if (docToInsert.description === undefined) {
                docToInsert.description = "";
            }
             if (docToInsert.is_weekly === undefined) {
                docToInsert.is_weekly = false;
            }


            await addDoc(timeSlotCollection, docToInsert);
            return { success: true, data: docToInsert };
        }).catch(error => {
            console.error('[FIREBASE INSERT ERROR]', error, { appInput, transformed: transformToFirestoreDocument(appInput) });
            return { success: false, error };
        });
    },

    async update(appInput: AppInputDataType, conditions: { date: string; start_time: string; end_time: string }) {
        return handleFirestoreOperation(async (firestoreDb) => {
            const timeSlotCollection = collection(firestoreDb, 'timeSlots');
            // Conditions are based on Firestore field names (snake_case)
            const q = query(
                timeSlotCollection,
                where('date', '==', conditions.date),
                where('start_time', '==', conditions.start_time),
                where('end_time', '==', conditions.end_time)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = doc(firestoreDb, 'timeSlots', querySnapshot.docs[0].id);
                const docToUpdate = transformToFirestoreDocument(appInput);

                if (Object.keys(docToUpdate).length === 0) {
                    console.warn("Update called with no actual data to update after transformation for doc ID:", querySnapshot.docs[0].id, { appInput });
                    return { success: true, message: "No changes detected to apply." };
                }
                
                await updateDoc(docRef, docToUpdate);
                return { success: true, data: docToUpdate };
            }
            console.warn("No document found for update.", { conditions, appInput });
            return { success: false, message: "Document not found for update." };
        }).catch(error => {
            console.error('[FIREBASE UPDATE ERROR]', error, { appInput, conditions, transformed: transformToFirestoreDocument(appInput) });
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
                await deleteDoc(doc(firestoreDb, 'timeSlots', querySnapshot.docs[0].id));
                return { success: true };
            }
            console.warn("No document found for deletion.", { conditions });
            return { success: false, message: "Document not found for deletion." };
        }).catch(error => {
            console.error('[FIREBASE DELETE ERROR]', error, { conditions });
            return { success: false, error };
        });
    },

    async clear() { // Esta função apaga TODOS os timeSlots, use com cautela.
        return handleFirestoreOperation(async (firestoreDb) => {
            const timeSlotCollection = collection(firestoreDb, 'timeSlots');
            const querySnapshot = await getDocs(timeSlotCollection);
            const BATCH_SIZE = 400; // Firestore batch limit is 500
            let i = 0;
            let batch = []; // Firestore WriteBatch can be used here for larger deletes
            
            for (const docSnapshot of querySnapshot.docs) {
                batch.push(deleteDoc(doc(firestoreDb, 'timeSlots', docSnapshot.id)));
                i++;
                if (i % BATCH_SIZE === 0) {
                    await Promise.all(batch);
                    batch = [];
                }
            }
            if (batch.length > 0) {
                await Promise.all(batch);
            }
            return { success: true, count: querySnapshot.size };
        }).catch(error => {
            console.error('[FIREBASE CLEAR ERROR]', error);
            return { success: false, error };
        });
    }
};
