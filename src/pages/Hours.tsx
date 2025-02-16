
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthSelector } from "@/components/hours/MonthSelector";
import { UserSelector } from "@/components/hours/UserSelector";
import { UserHoursDisplay } from "@/components/hours/UserHoursDisplay";
import { AllUsersHours } from "@/components/hours/AllUsersHours";
import { fetchUserHours, fetchAllUsers } from "@/services/hoursService";
import type { HoursData, UserOption } from "@/types/hours";

const Hours = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedGeneralMonth, setSelectedGeneralMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [data, setData] = useState<HoursData | null>(null);
  const [allUsersData, setAllUsersData] = useState<HoursData[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
      fetchUsersList();
      fetchAllUsersData();
    }
  }, [userData?.userType, selectedGeneralMonth]);

  const fetchUsersList = async () => {
    try {
      const fetchedUsers = await fetchAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar lista de usuários.",
      });
    }
  };

  const fetchAllUsersData = async () => {
    if (!selectedGeneralMonth) return;
    
    setLoadingGeneral(true);
    try {
      const promises = users.map(user => fetchUserHours(selectedGeneralMonth, user.registration));
      const results = await Promise.all(promises);
      const validResults = results.flatMap(result => result.length ? [result[0]] : []);
      setAllUsersData(validResults);
    } catch (error) {
      console.error('Error fetching all users data:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao consultar dados dos usuários.",
      });
    } finally {
      setLoadingGeneral(false);
    }
  };

  const handleConsult = async () => {
    if (!userData?.registration) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado ou sem matrícula cadastrada.",
      });
      return;
    }

    if (!selectedMonth) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um mês",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await fetchUserHours(selectedMonth, userData.registration);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.length) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Matrícula não localizada",
        });
        setData(null);
        return;
      }

      setData(result[0]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao consultar dados.",
      });
    } finally {
      setLoading(false);
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

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Consulta Individual</TabsTrigger>
          <TabsTrigger value="general">Consulta Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-primary mb-4">Consulta Individual</h2>
            <div className="space-y-4">
              <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

              <Button 
                onClick={handleConsult} 
                disabled={loading || !userData?.registration} 
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  "Consultar"
                )}
              </Button>

              {!userData?.registration && (
                <p className="text-sm text-red-500">
                  Você precisa cadastrar sua matrícula para consultar as horas.
                </p>
              )}

              {data && <UserHoursDisplay data={data} onClose={() => setData(null)} />}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="general">
          {userData?.userType === 'admin' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-primary mb-4">Consulta Geral</h2>
              {loadingGeneral ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <AllUsersHours 
                  users={allUsersData}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Hours;
