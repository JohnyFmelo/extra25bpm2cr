
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type UserType = {
  id: string;
  email: string;
  userType: string;
  warName: string;
  registration: string;
  rank: string;
  blocked: boolean;
  service?: string;
  currentVersion?: string;
  lastVersionUpdate?: Date;
  rgpm?: string;
  isVolunteer?: boolean;
};

type UserContextType = {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    // Ao iniciar, carrega do localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Se tem um usuário, escuta mudanças em tempo real do Firebase
      if (userData?.id) {
        const userDocRef = doc(db, "users", userData.id);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const firebaseData = doc.data();
            const updatedUserData = {
              ...userData,
              warName: firebaseData.warName || userData.warName,
              rank: firebaseData.rank || userData.rank,
              service: firebaseData.service || userData.service,
              rgpm: firebaseData.rgpm,
              email: firebaseData.email || userData.email,
              registration: firebaseData.registration || userData.registration,
              currentVersion: firebaseData.currentVersion || userData.currentVersion,
              lastVersionUpdate: firebaseData.lastVersionUpdate || userData.lastVersionUpdate,
              isVolunteer: firebaseData.isVolunteer ?? false,
            };
            
            // Atualiza tanto o estado quanto o localStorage
            setUser(updatedUserData);
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            
            console.log("UserContext - Real-time update from Firebase:", updatedUserData);
          }
        });

        return () => unsubscribe();
      }
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
