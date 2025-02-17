
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AllUsersHours } from "./AllUsersHours";
import { fetchAllUsers } from "@/services/hoursService";

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
      const users = await fetchAllUsers();
      console.log('Retrieved users from Firebase:', users);
      
      if (!users.length) {
        console.log('No users found in Firebase');
        toast({
          title: "Aviso",
          description: "Nenhum usuário encontrado com matrícula cadastrada.",
        });
        return;
      }
      
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const promises = users.map(user => 
        fetchUserHours(currentMonth, user.registration)
          .then(result => {
            if (!result || !result.length) {
              console.log(`No data found for user ${user.registration}`);
              return null;
            }
            return result[0];
          })
          .catch(error => {
            console.error(`Error fetching data for user ${user.registration}:`, error);
            return null;
          })
      );

      const results = await Promise.all(promises);
      const validResults = results.filter(result => result !== null);
      
      if (!validResults.length) {
        toast({
          title: "Aviso",
          description: "Nenhum dado encontrado para o mês atual.",
        });
      }
      
      setAllUsersData(validResults);
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

  if (!userData?.userType === 'admin') return null;

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
