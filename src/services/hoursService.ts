
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const fetchAllUsers = async () => {
  try {
    const usersCollection = collection(db, "users");
    const querySnapshot = await getDocs(usersCollection);
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        registration: data.registration || '',
        name: `${data.rank || ''} ${data.warName || ''}`.trim(),
        rank: data.rank || '',
        warName: data.warName || '',
      };
    });

    console.log('Fetched users from Firebase:', users);
    return users;
  } catch (error) {
    console.error("Error fetching users from Firebase:", error);
    throw error;
  }
};
