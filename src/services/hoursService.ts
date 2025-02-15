
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const fetchUserHours = async (month: string, registration: string) => {
  const apiUrl = `https://script.google.com/macros/s/AKfycbxmUSgKPVz_waNPHdKPT1y8x52xPNS9Yzqx_u1mlH83OabndJQ8Ie2ZZJVJnLIMNOb4/exec`;
  const params = new URLSearchParams({
    mes: month,
    matricula: registration
  });

  const response = await fetch(`${apiUrl}?${params.toString()}`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result;
};

export const fetchAllUsers = async () => {
  try {
    const usersCollection = collection(db, "users");
    const querySnapshot = await getDocs(usersCollection);
    
    const users = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          registration: data.registration || '',
          name: `${data.rank || ''} ${data.warName || ''}`.trim()
        };
      })
      .filter(user => user.registration) // Filtra apenas usuários com matrícula
      .sort((a, b) => a.name.localeCompare(b.name)); // Ordena por nome

    return users;
  } catch (error) {
    console.error("Error fetching users from Firebase:", error);
    throw error;
  }
};
