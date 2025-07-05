
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';

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

type ProfileType = {
  id: string;
  user_id: string;
  email: string;
  war_name: string;
  registration: string;
  rank: string;
  user_type: string;
  service?: string;
  rgpm?: string;
  is_volunteer: boolean;
  blocked: boolean;
  current_version?: string;
  last_version_update?: string;
};

type UserContextType = {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  loading: boolean;
  session: Session | null;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  session: null,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para transformar dados do profile em formato UserType
  const transformProfileToUser = (profile: ProfileType, userId: string): UserType => ({
    id: userId,
    email: profile.email,
    userType: profile.user_type,
    warName: profile.war_name,
    registration: profile.registration,
    rank: profile.rank,
    blocked: profile.blocked,
    service: profile.service,
    currentVersion: profile.current_version,
    lastVersionUpdate: profile.last_version_update ? new Date(profile.last_version_update) : undefined,
    rgpm: profile.rgpm,
    isVolunteer: profile.is_volunteer,
  });

  // Função para buscar dados do perfil
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil:", error);
        return null;
      }

      return profile as ProfileType;
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      return null;
    }
  };

  useEffect(() => {
    // Configurar listener de auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setSession(session);

        if (session?.user) {
          // Buscar dados do perfil do usuário
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            const userData = transformProfileToUser(profile, session.user.id);
            setUser(userData);
            console.log("Usuário logado:", userData);
          } else {
            console.error("Perfil não encontrado para o usuário:", session.user.id);
            setUser(null);
          }
        } else {
          setUser(null);
          console.log("Usuário deslogado");
        }

        setLoading(false);
      }
    );

    // Buscar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      // A lógica será executada pelo listener acima
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, session }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
