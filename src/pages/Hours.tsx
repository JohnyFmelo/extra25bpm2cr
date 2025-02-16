
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthSelector } from "@/components/hours/MonthSelector";
import { UserHoursDisplay } from "@/components/hours/UserHoursDisplay";
import { AllUsersHours } from "@/components/hours/AllUsersHours";
import { fetchAllUsers } from "@/services/hoursService";

const Hours = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [allUsersData, setAllUsersData] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(storedUser);

    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUserData(updatedUser);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
          description: "Nenhum usuário encontrado.",
        });
        return;
      }

      setAllUsersData(users);
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

  return (
    <div className="container mx-auto p-4">
      <div className="relative h-12">
        <div className="absolute right-0 top-0">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary"
            aria-label="Voltar para home"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="general">Usuários Cadastrados</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          {userData?.userType === 'admin' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-primary mb-4">
                Usuários Cadastrados no Sistema
              </h2>
              {loadingGeneral ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <AllUsersHours users={allUsersData} />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Hours;
