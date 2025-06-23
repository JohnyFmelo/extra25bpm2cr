
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Convocation {
  id: string;
  month_year: string;
  start_date: string;
  end_date: string;
  deadline_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ConvocationResponse {
  id: string;
  convocation_id: string;
  user_email: string;
  user_name: string;
  is_volunteer: boolean;
  responded_at: string;
}

export const useConvocation = (userEmail: string) => {
  const [activeConvocation, setActiveConvocation] = useState<Convocation | null>(null);
  const [userResponse, setUserResponse] = useState<ConvocationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldShowDialog, setShouldShowDialog] = useState(false);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    checkActiveConvocation();
  }, [userEmail]);

  const checkActiveConvocation = async () => {
    try {
      // Buscar convocação ativa
      const { data: convocation, error: convocationError } = await supabase
        .from('convocations')
        .select('*')
        .eq('is_active', true)
        .single();

      if (convocationError) {
        if (convocationError.code !== 'PGRST116') { // Not found is ok
          console.error('Error fetching active convocation:', convocationError);
        }
        setActiveConvocation(null);
        setLoading(false);
        return;
      }

      setActiveConvocation(convocation);

      // Verificar se o usuário já respondeu esta convocação
      const { data: response, error: responseError } = await supabase
        .from('convocation_responses')
        .select('*')
        .eq('convocation_id', convocation.id)
        .eq('user_email', userEmail)
        .single();

      if (responseError) {
        if (responseError.code !== 'PGRST116') { // Not found is ok
          console.error('Error fetching user response:', responseError);
        }
        setUserResponse(null);
        // Se há convocação ativa e o usuário não respondeu, mostrar o diálogo
        setShouldShowDialog(true);
      } else {
        setUserResponse(response);
        setShouldShowDialog(false);
      }

    } catch (error) {
      console.error('Exception checking convocation:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsResponded = () => {
    setShouldShowDialog(false);
    // Recarregar os dados para pegar a resposta salva
    checkActiveConvocation();
  };

  return {
    activeConvocation,
    userResponse,
    loading,
    shouldShowDialog,
    setShouldShowDialog,
    markAsResponded,
    refetch: checkActiveConvocation
  };
};
