
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
  loading: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ao iniciar, carrega do localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Se tem um usuário, escuta mudanças em tempo real do Firebase
        if (userData?.id) {
          const userDocRef = doc(db, "users", userData.id);
          const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              const firebaseData = doc.data();
              
              // Só atualiza se não estiver bloqueado - deixa o useUserBlockListener lidar com bloqueios
              if (!firebaseData.blocked) {
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
                  blocked: firebaseData.blocked || false,
                };
                
                // Atualiza tanto o estado quanto o localStorage
                setUser(updatedUserData);
                localStorage.setItem('user', JSON.stringify(updatedUserData));
                
                console.log("UserContext - Real-time update from Firebase:", updatedUserData);
              }
            }
            // Se o documento não existir, mantém os dados locais - não limpa automaticamente
          }, (error) => {
            // Em caso de erro, mantém os dados locais e apenas loga o erro
            console.error("UserContext - Firebase listener error:", error);
          });

          setLoading(false);
          return () => unsubscribe();
        }
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
