
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Convocation {
  id: string;
  month_year: string;
  start_date: string;
  end_date: string;
  deadline_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
        const { data: convocations, error: convocationError } = await supabase
          .from('convocations')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (convocationError) {
          console.error('Erro ao buscar convocação:', convocationError);
          setLoading(false);
          return;
        }

        if (!convocations || convocations.length === 0) {
          setActiveConvocation(null);
          setShouldShowDialog(false);
          setLoading(false);
          return;
        }

        const convocation = convocations[0];
        setActiveConvocation(convocation);

        // Verificar se o usuário já respondeu
        const { data: responses, error: responseError } = await supabase
          .from('convocation_responses')
          .select('*')
          .eq('convocation_id', convocation.id)
          .eq('user_email', userEmail);

        if (responseError) {
          console.error('Erro ao verificar resposta:', responseError);
          setLoading(false);
          return;
        }

        const hasResponded = responses && responses.length > 0;
        setHasUserResponded(hasResponded);
        setShouldShowDialog(!hasResponded);
        
      } catch (error) {
        console.error('Erro inesperado:', error);
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
