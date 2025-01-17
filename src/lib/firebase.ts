import { initializeApp } from 'firebase/app';
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
export const auth = getAuth(app);