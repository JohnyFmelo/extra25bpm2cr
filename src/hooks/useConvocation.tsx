
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Convocation {
  id: string;
  month_year: string;
  start_date: string;
  end_date: string;
  deadline_days: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const useConvocation = (userEmail: string) => {
  const [activeConvocation, setActiveConvocation] = useState<Convocation | null>(null);
  const [hasUserResponded, setHasUserResponded] = useState(false);
  const [shouldShowDialog, setShouldShowDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkActiveConvocation = async () => {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        // Buscar convocação ativa
        const convocationsRef = collection(db, 'convocations');
        const activeQuery = query(
          convocationsRef, 
          where('is_active', '==', true),
          orderBy('created_at', 'desc'),
          limit(1)
        );
        
        const convocationsSnapshot = await getDocs(activeQuery);

        if (convocationsSnapshot.empty) {
          setActiveConvocation(null);
          setShouldShowDialog(false);
          setLoading(false);
          return;
        }

        const convocationDoc = convocationsSnapshot.docs[0];
        const convocationData = {
          id: convocationDoc.id,
          ...convocationDoc.data()
        } as Convocation;
        
        setActiveConvocation(convocationData);

        // Verificar se o usuário já respondeu
        const responsesRef = collection(db, 'convocation_responses');
        const responseQuery = query(
          responsesRef,
          where('convocation_id', '==', convocationDoc.id),
          where('user_email', '==', userEmail)
        );
        
        const responsesSnapshot = await getDocs(responseQuery);
        const hasResponded = !responsesSnapshot.empty;
        
        setHasUserResponded(hasResponded);
        setShouldShowDialog(!hasResponded);
        
      } catch (error) {
        console.error('Erro ao verificar convocação:', error);
      } finally {
        setLoading(false);
      }
    };

    checkActiveConvocation();
  }, [userEmail]);

  const dismissDialog = () => {
    setShouldShowDialog(false);
  };

  return {
    activeConvocation,
    hasUserResponded,
    shouldShowDialog,
    loading,
    dismissDialog
  };
};
