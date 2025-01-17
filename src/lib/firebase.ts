import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBH8Pb2Ew8Yx7Hn9LmGqHLRVVSVHYnqxhY",
  authDomain: "bpm-app-9b3e9.firebaseapp.com",
  projectId: "bpm-app-9b3e9",
  storageBucket: "bpm-app-9b3e9.appspot.com",
  messagingSenderId: "722055830047",
  appId: "1:722055830047:web:1c5b4e7b4d0c3f4f3b4b4b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);

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