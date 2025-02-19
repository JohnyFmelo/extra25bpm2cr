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
    <div className="container mx-auto p-6 max-w-5xl min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="relative mb-8">
        <button 
          onClick={() => navigate('/')} 
          className="absolute right-0 top-0 p-2.5 rounded-full hover:bg-white/90 transition-colors text-primary bg-white shadow-sm"
          aria-label="Voltar para home"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-3 mb-10 bg-white p-1.5 rounded-2xl shadow-sm max-w-xl mx-auto">
        <Button 
          onClick={() => setActiveConsult('individual')}
          className={`flex-1 py-6 rounded-xl text-base font-medium tracking-wide transition-all ${
            activeConsult === 'individual' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-transparent text-gray-600 hover:bg-gray-50'
          }`}
        >
          Consulta Individual
        </Button>
        {userData?.userType === 'admin' && (
          <Button 
            onClick={() => setActiveConsult('general')}
            className={`flex-1 py-6 rounded-xl text-base font-medium tracking-wide transition-all ${
              activeConsult === 'general' 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            Consulta Geral
          </Button>
        )}
      </div>

      {activeConsult === 'individual' && (
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Consulta Individual</h2>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-1">
              <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
            </div>

            <Button 
              onClick={handleConsult} 
              disabled={loading || !userData?.registration} 
              className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 text-white text-base font-medium shadow-sm transition-colors"
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
              <p className="text-sm text-red-500 text-center">
                Você precisa cadastrar sua matrícula para consultar as horas.
              </p>
            )}

            {data && <UserHoursDisplay data={data} onClose={() => setData(null)} />}
          </div>
        </div>
      )}

      {activeConsult === 'general' && userData?.userType === 'admin' && (
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Consulta Geral</h2>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-1">
              <UserSelector users={users} value={selectedUser} onChange={setSelectedUser} />
            </div>

            <div className="bg-gray-50 rounded-xl p-1">
              <MonthSelector value={selectedGeneralMonth} onChange={setSelectedGeneralMonth} />
            </div>

            <Button 
              onClick={handleGeneralConsult} 
              disabled={loadingGeneral} 
              className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 text-white text-base font-medium shadow-sm transition-colors"
            >
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
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
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
      )}
    </div>
  );
};

export default Hours;
