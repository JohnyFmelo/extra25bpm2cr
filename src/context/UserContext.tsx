
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
    // Ao iniciar, carrega do localStorage (pode ser adaptado para buscar direto do backend se desejado)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
