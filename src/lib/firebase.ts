import { initializeApp } from 'firebase/app';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
export const storage = getStorage(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Time slot operations for WeeklyCalendar component
export const dataOperations = {
  fetch: async () => {
    const timeSlots = localStorage.getItem('timeSlots');
    return timeSlots ? JSON.parse(timeSlots) : [];
  },
  insert: async (slot: any) => {
    const timeSlots = await dataOperations.fetch();
    timeSlots.push(slot);
    localStorage.setItem('timeSlots', JSON.stringify(timeSlots));
    return timeSlots;
  },
  update: async (slot: any) => {
    const timeSlots = await dataOperations.fetch();
    const index = timeSlots.findIndex((s: any) => s.id === slot.id);
    if (index !== -1) {
      timeSlots[index] = slot;
      localStorage.setItem('timeSlots', JSON.stringify(timeSlots));
    }
    return timeSlots;
  },
};
