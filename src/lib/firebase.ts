import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

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

export const dataOperations = {
  async fetch() {
    try {
      const timeSlotCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  },

  async insert(newSlot: any) {
    try {
      const timeSlotCollection = collection(db, 'timeSlots');
      await addDoc(timeSlotCollection, newSlot);
      return { success: true };
    } catch (error) {
      console.error('Error inserting data:', error);
      return { success: false };
    }
  },

  async update(updatedSlot: any, conditions: any) {
    try {
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
        await updateDoc(docRef, updatedSlot);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Error updating data:', error);
      return { success: false };
    }
  },

  async delete(conditions: any) {
    try {
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
    } catch (error) {
      console.error('Error deleting data:', error);
      return { success: false };
    }
  },

  async clear() {
    try {
      const timeSlotCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      return { success: true };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { success: false };
    }
  }
};