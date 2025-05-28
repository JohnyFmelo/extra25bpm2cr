
import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const useUserBlockListener = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.id) return;

    // Listener para mudanças no documento do usuário
    const userDocRef = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        
        // Se o usuário foi bloqueado, fazer logout imediato
        if (userData.blocked) {
          localStorage.removeItem('user');
          toast({
            title: "Acesso Bloqueado",
            description: "Sua conta foi bloqueada. Contate o administrador.",
            variant: "destructive",
          });
          navigate('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, toast]);
};
