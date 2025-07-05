
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';

export const useUserBlockListener = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session } = useUser();

  useEffect(() => {
    if (!user?.id || !session) return;

    // Listener para mudanças em tempo real no perfil do usuário
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload);
          const newData = payload.new as any;
          
          // Se o usuário foi bloqueado, fazer logout imediato
          if (newData.blocked) {
            supabase.auth.signOut();
            toast({
              title: "Acesso Bloqueado",
              description: "Sua conta foi bloqueada. Contate o administrador.",
              variant: "destructive",
            });
            navigate('/login');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, session, navigate, toast]);
};
