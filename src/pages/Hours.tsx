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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllUsersHours } from "@/components/hours/AllUsersHours";

const Hours = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedGeneralMonth, setSelectedGeneralMonth] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [data, setData] = useState<HoursData | null>(null);
  const [generalData, setGeneralData] = useState<HoursData | null>(null);
  const [allUsersData, setAllUsersData] = useState<HoursData[]>([]);
  const [generalSearchTerm, setGeneralSearchTerm] = useState('');
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
        const sortedResults = [...allUsersResults].sort((a, b) => {
          const totalA = a["Total Geral"] ? parseFloat(a["Total Geral"].toString().replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;
          const totalB = b["Total Geral"] ? parseFloat(b["Total Geral"].toString().replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;
          return totalB - totalA;
        });
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
  const getSelectedMonthYear = (selectedMonth: string) => {
    const monthMap: {
      [key: string]: number;
    } = {
      'janeiro': 1,
      'fevereiro': 2,
      'marco': 3,
      'abril': 4,
      'maio': 5,
      'junho': 6,
      'julho': 7,
      'agosto': 8,
      'setembro': 9,
      'outubro': 10,
      'novembro': 11,
      'dezembro': 12
    };
    const month = monthMap[selectedMonth] || new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    return `${month}/${year}`;
  };
  return <div className="bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <div className="pb-2 flex flex-col flex-grow w-full">
        <Tabs defaultValue="hours" className="space-y-6 flex flex-col flex-grow">
          <TabsList className="hidden">
            <TabsTrigger value="hours">Hours</TabsTrigger>
          </TabsList>

          <TabsContent value="hours" className="flex-grow">
            

            <Tabs defaultValue="individual" value={activeConsult} onValueChange={value => setActiveConsult(value as 'individual' | 'general')} className="w-full flex-grow">
              <TabsList className="grid w-full grid-cols-2 bg-white/50 rounded-xl mb-6">
                <TabsTrigger value="individual" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-primary rounded-lg transition-all duration-300">
                  Consulta Individual
                </TabsTrigger>
                {userData?.userType === 'admin' && <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-primary rounded-lg transition-all duration-300">
                    Consulta Geral
                  </TabsTrigger>}
              </TabsList>

              <TabsContent value="individual" className="flex-grow">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
                  <h2 className="text-xl font-bold text-primary mb-4">Consulta Individual</h2>
                  <div className="space-y-4">
                    <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

                    <Button onClick={handleConsult} disabled={loading || !userData?.registration} className="w-full">
                      {loading ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Consultando...
                        </> : "Consultar"}
                    </Button>

                    {!userData?.registration && <p className="text-sm text-red-500">
                        Você precisa cadastrar sua matrícula para consultar as horas.
                      </p>}

                    {data && <UserHoursDisplay data={data} onClose={() => setData(null)} isAdmin={userData?.userType === 'admin'} monthYear={getSelectedMonthYear(selectedMonth)} />}
                  </div>
                </div>
              </TabsContent>

              {userData?.userType === 'admin' && <TabsContent value="general" className="flex-grow">
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
                    <h2 className="text-xl font-bold text-primary mb-4">Consulta Geral</h2>
                    <div className="space-y-4">
                      <UserSelector users={users} value={selectedUser} onChange={setSelectedUser} />

                      <MonthSelector value={selectedGeneralMonth} onChange={setSelectedGeneralMonth} />

                      <Button onClick={handleGeneralConsult} disabled={loadingGeneral} className="w-full">
                        {loadingGeneral ? <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Consultando...
                          </> : "Consultar"}
                      </Button>

                      {selectedUser === 'all' && allUsersData.length > 0 && (
                        <AllUsersHours
                          users={allUsersData}
                          searchTerm={generalSearchTerm}
                          onSearchChange={setGeneralSearchTerm}
                          monthYear={getSelectedMonthYear(selectedGeneralMonth)}
                          onClose={(index) => {
                            const updatedData = [...allUsersData];
                            updatedData.splice(index, 1);
                            setAllUsersData(updatedData);
                          }}
                        />
                      )}

                      {generalData && <UserHoursDisplay data={generalData} onClose={() => setGeneralData(null)} isAdmin={true} monthYear={getSelectedMonthYear(selectedGeneralMonth)} />}
                    </div>
                  </div>
                </TabsContent>}
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default Hours;
