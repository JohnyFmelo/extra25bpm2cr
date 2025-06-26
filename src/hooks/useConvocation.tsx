
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
  const [isWithinDeadline, setIsWithinDeadline] = useState(false);

  console.log('useConvocation called with email:', userEmail);

  useEffect(() => {
    const checkActiveConvocation = async () => {
      if (!userEmail) {
        console.log('No user email provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Checking for active convocation...');
        
        // Buscar convocação ativa
        const convocationsRef = collection(db, 'convocations');
        const activeQuery = query(
          convocationsRef, 
          where('is_active', '==', true),
          orderBy('created_at', 'desc'),
          limit(1)
        );
        
        const convocationsSnapshot = await getDocs(activeQuery);
        console.log('Convocations found:', convocationsSnapshot.size);

        if (convocationsSnapshot.empty) {
          console.log('No active convocation found');
          setActiveConvocation(null);
          setShouldShowDialog(false);
          setLoading(false);
          return;
        }

        const convocationDoc = convocationsSnapshot.docs[0];
        const convocationData = {
          id: convocationDoc.id,
          ...convocationDoc.data(),
          created_at: convocationDoc.data().created_at?.toDate() || new Date(),
          updated_at: convocationDoc.data().updated_at?.toDate() || new Date()
        } as Convocation;
        
        console.log('Active convocation found:', convocationData);
        setActiveConvocation(convocationData);

        // Verificar se está dentro do prazo
        const now = new Date();
        const createdAt = convocationData.created_at;
        const deadlineDate = new Date(createdAt);
        deadlineDate.setDate(deadlineDate.getDate() + convocationData.deadline_days);
        
        const withinDeadline = now <= deadlineDate;
        console.log('Deadline check:', {
          now: now.toISOString(),
          createdAt: createdAt.toISOString(),
          deadlineDate: deadlineDate.toISOString(),
          withinDeadline
        });
        
        setIsWithinDeadline(withinDeadline);

        if (!withinDeadline) {
          console.log('Convocation is past deadline');
          setShouldShowDialog(false);
          setLoading(false);
          return;
        }

        // Verificar se o usuário já respondeu
        const responsesRef = collection(db, 'convocation_responses');
        const responseQuery = query(
          responsesRef,
          where('convocation_id', '==', convocationDoc.id),
          where('user_email', '==', userEmail)
        );
        
        const responsesSnapshot = await getDocs(responseQuery);
        const hasResponded = !responsesSnapshot.empty;
        
        console.log('User response check:', {
          userEmail,
          convocationId: convocationDoc.id,
          hasResponded,
          responsesCount: responsesSnapshot.size
        });
        
        setHasUserResponded(hasResponded);
        
        // Mostrar dialog apenas se não respondeu e está dentro do prazo
        const shouldShow = !hasResponded && withinDeadline;
        console.log('Should show dialog:', shouldShow);
        setShouldShowDialog(shouldShow);
        
      } catch (error) {
        console.error('Erro ao verificar convocação:', error);
      } finally {
        setLoading(false);
      }
    };

    checkActiveConvocation();
  }, [userEmail]);

  const dismissDialog = () => {
    console.log('Dismissing convocation dialog');
    setShouldShowDialog(false);
  };

  return {
    activeConvocation,
    hasUserResponded,
    shouldShowDialog,
    loading,
    isWithinDeadline,
    dismissDialog
  };
};
