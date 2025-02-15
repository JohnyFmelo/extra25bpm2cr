
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MonthSelector } from "@/components/hours/MonthSelector";
import { UserHoursDisplay } from "@/components/hours/UserHoursDisplay";
import { AllUsersHours } from "@/components/hours/AllUsersHours";
import { fetchUserHours, fetchAllUsersHours } from "@/services/hoursService";
import type { HoursData } from "@/types/hours";

const Hours = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedGeneralMonth, setSelectedGeneralMonth] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [data, setData] = useState<HoursData | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [allUsersData, setAllUsersData] = useState<HoursData[]>([]);
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

  const handleConsult = async () => {
    if (!userData?.registration) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado ou sem matrícula cadastrada. Por favor, atualize seu cadastro.",
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
        description: error instanceof Error ? error.message : "Erro ao consultar dados. Por favor, tente novamente mais tarde.",
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
        description: "Selecione um mês para a consulta geral",
      });
      return;
    }

    setLoadingGeneral(true);
    try {
      const result = await fetchAllUsersHours(selectedGeneralMonth);
      if (Array.isArray(result)) {
        setAllUsersData(result);
      }
    } catch (error) {
      console.error('Error fetching all users data:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar dados de todos os usuários.",
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

      <div className={`grid ${userData?.userType === 'admin' ? 'md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Consulta Individual */}
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

        {/* Consulta Geral (apenas para admin) */}
        {userData?.userType === 'admin' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-primary mb-4">Consulta Geral</h2>
            <div className="space-y-4">
              <MonthSelector value={selectedGeneralMonth} onChange={setSelectedGeneralMonth} />

              <Button 
                onClick={handleGeneralConsult} 
                disabled={loadingGeneral} 
                className="w-full"
              >
                {loadingGeneral ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  "Consultar Todos"
                )}
              </Button>

              {allUsersData.length > 0 && (
                <AllUsersHours
                  users={allUsersData}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hours;
