
import { initializeApp } from 'firebase/app';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { getAuth } from 'firebase/auth';

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

/**
 * Upload PDF to Firebase Storage
 * @param pdfBlob PDF file blob
 * @param createdBy User ID of creator
 * @param tcoId TCO ID or number
 * @returns Object with download URL and file path
 */
export const uploadPDFToFirebase = async (pdfBlob: Blob, createdBy: string, tcoId: string): Promise<{url: string, path: string}> => {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const filePath = `tcos/${createdBy}/${tcoId}_${dateStr}.pdf`;
    const fileRef = storageRef(storage, filePath);
    
    console.log(`Enviando arquivo para Firebase Storage: ${filePath}`);
    const uploadResult = await uploadBytes(fileRef, pdfBlob);
    console.log('Upload concluído:', uploadResult);
    
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('URL do arquivo:', downloadURL);
    
    return {
      url: downloadURL,
      path: filePath
    };
  } catch (error) {
    console.error("Erro ao fazer upload do PDF no Firebase:", error);
    throw error;
  }
};
