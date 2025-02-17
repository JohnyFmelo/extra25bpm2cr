
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AllUsersHours } from "./AllUsersHours";

interface GeneralConsultationProps {
  userData: any;
}

export const GeneralConsultation = ({ userData }: GeneralConsultationProps) => {
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [allUsersData, setAllUsersData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (userData?.userType === 'admin') {
      console.log('Admin user detected, fetching all users data');
      fetchAllUsersData();
    }
  }, [userData?.userType]);

  const fetchAllUsersData = async () => {
    setLoadingGeneral(true);
    try {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const apiUrl = `https://script.google.com/macros/s/AKfycbxmUSgKPVz_waNPHdKPT1y8x52xPNS9Yzqx_u1mlH83OabndJQ8Ie2ZZJVJnLIMNOb4/exec`;
      const params = new URLSearchParams({
        mes: currentMonth,
        matricula: 'all' // Indicador especial para buscar todos os registros
      });

      const response = await fetch(`${apiUrl}?${params.toString()}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Retrieved all users data:', result);
      
      if (!result || !result.length) {
        console.log('No data found');
        toast({
          title: "Aviso",
          description: "Nenhum dado encontrado para o mês atual.",
        });
        return;
      }
      
      setAllUsersData(result);
    } catch (error) {
      console.error('Error in fetchAllUsersData:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao consultar dados dos usuários.",
      });
    } finally {
      setLoadingGeneral(false);
    }
  };

  if (userData?.userType !== 'admin') return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-primary mb-4">
        Consulta Geral - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      </h2>
      {loadingGeneral ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <AllUsersHours users={allUsersData} />
      )}
    </div>
  );
};
