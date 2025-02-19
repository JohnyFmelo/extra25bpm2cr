import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MonthSelector } from "@/components/hours/MonthSelector";
import { UserSelector } from "@/components/hours/UserSelector";
import { UserHoursDisplay } from "@/components/hours/UserHoursDisplay";
import { fetchUserHours, fetchAllUsers } from "@/services/hoursService";
import type { HoursData, UserOption } from "@/types/hours";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Importe os componentes Tabs

const Hours = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedGeneralMonth, setSelectedGeneralMonth] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [data, setData] = useState<HoursData | null>(null);
  const [generalData, setGeneralData] = useState<HoursData | null>(null);
  const [allUsersData, setAllUsersData] = useState<HoursData[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [activeConsult, setActiveConsult] = useState<'individual' | 'general'>('individual');
  const {
    toast
  } = useToast();
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
    }
  }, [userData?.userType]);

  const fetchUsersList = async () => {
    try {
      const fetchedUsers = await fetchAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar lista de usuários."
      });
    }
  };

  const handleConsult = async () => {
    if (!userData?.registration) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado ou sem matrícula cadastrada. Por favor, atualize seu cadastro."
      });
      return;
    }
    if (!selectedMonth) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um mês"
      });
      return;
    }
    setLoading(true);
    try {
      const result = await fetchUserHours(selectedMonth, userData.registration);
      if (result.error) {
        throw new Error(result.error);
      }
      if (!result || result.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Matrícula não localizada"
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
        description: error instanceof Error ? error.message : "Erro ao consultar dados. Por favor, tente novamente mais tarde."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralConsult = async () => {
    if (!selectedGeneralMonth) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um mês"
      });
      return;
    }
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um usuário"
      });
      return;
    }
    setLoadingGeneral(true);
    try {
      if (selectedUser === 'all') {
        const allUsersResults = [];
        for (const user of users) {
          try {
            const result = await fetchUserHours(selectedGeneralMonth, user.registration);
            if (result && result.length > 0) {
              allUsersResults.push(result[0]);
            }
          } catch (error) {
            console.error(`Error fetching data for user ${user.registration}:`, error);
          }
        }
        if (allUsersResults.length === 0) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Nenhum dado encontrado para o período selecionado"
          });
          setAllUsersData([]);
          return;
        }
        const sortedResults = [...allUsersResults].sort((a, b) => (b["Total Geral"] || 0) - (a["Total Geral"] || 0));
        setAllUsersData(sortedResults);
        setGeneralData(null);
      } else {
        const result = await fetchUserHours(selectedGeneralMonth, selectedUser);
        if (result.error) {
          throw new Error(result.error);
        }
        if (!result || result.length === 0) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Matrícula não localizada"
          });
          setGeneralData(null);
          return;
        }
        setGeneralData(result[0]);
        setAllUsersData([]);
      }
    } catch (error) {
      console.error('Error fetching general data:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao consultar dados."
      });
    } finally {
      setLoadingGeneral(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="relative h-12">
        <div className="absolute right-0 top-0">
          <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary" aria-label="Voltar para home">
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>
      </div>

      <Tabs defaultValue="individual" value={activeConsult} onValueChange={setActiveConsult} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/50 rounded-xl mb-6"> {/* Ajuste o mb-6 para dar espaço abaixo das abas */}
          <TabsTrigger
            value="individual"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-primary rounded-lg transition-all duration-300"
          >
            Consulta Individual
          </TabsTrigger>
          {userData?.userType === 'admin' && (
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-primary rounded-lg transition-all duration-300"
            >
              Consulta Geral
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="individual">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-primary mb-4">Consulta Individual</h2>
            <div className="space-y-4">
              <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

              <Button onClick={handleConsult} disabled={loading || !userData?.registration} className="w-full">
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

        {userData?.userType === 'admin' && (
          <TabsContent value="general">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-primary mb-4">Consulta Geral</h2>
              <div className="space-y-4">
                <UserSelector users={users} value={selectedUser} onChange={setSelectedUser} />

                <MonthSelector value={selectedGeneralMonth} onChange={setSelectedGeneralMonth} />

                <Button onClick={handleGeneralConsult} disabled={loadingGeneral} className="w-full">
                  {loadingGeneral ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    "Consultar"
                  )}
                </Button>

                {selectedUser === 'all' && allUsersData.map((userData, index) => (
                  <div key={index} className="mb-4 p-4 rounded-md shadow-sm bg-amber-50">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {users.find(user => user.registration === userData.matricula)?.label}
                    </h3>
                    <UserHoursDisplay
                      data={userData}
                      onClose={() => {
                        const updatedData = [...allUsersData];
                        updatedData.splice(index, 1);
                        setAllUsersData(updatedData);
                      }}
                    />
                  </div>
                ))}

                {generalData && <UserHoursDisplay data={generalData} onClose={() => setGeneralData(null)} />}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Hours;
