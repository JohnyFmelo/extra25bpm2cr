
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface HoursData {
  Nome: string;
  "Horas 25° BPM": string;
  Sinfra: string;
  Sonora: string;
  "Total 25° BPM": string;
  "Total Geral": string;
}

const months = [
  { value: "janeiro", label: "Janeiro" },
  { value: "fevereiro", label: "Fevereiro" },
  { value: "marco", label: "Março" },
  { value: "abril", label: "Abril" },
  { value: "maio", label: "Maio" },
  { value: "junho", label: "Junho" },
  { value: "julho", label: "Julho" },
  { value: "agosto", label: "Agosto" },
  { value: "setembro", label: "Setembro" },
  { value: "outubro", label: "Outubro" },
  { value: "novembro", label: "Novembro" },
  { value: "dezembro", label: "Dezembro" },
];

const Hours = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(false);
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
      const apiUrl = `https://script.google.com/macros/s/AKfycbxmUSgKPVz_waNPHdKPT1y8x52xPNS9Yzqx_u1mlH83OabndJQ8Ie2ZZJVJnLIMNOb4/exec`;
      const params = new URLSearchParams({
        mes: selectedMonth,
        matricula: userData.registration
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
      console.log('Resultado da consulta:', result);

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

      // Se for admin, buscar dados de todos os usuários
      if (userData?.userType === 'admin') {
        await fetchAllUsersHours(selectedMonth);
      }
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

  const fetchAllUsersHours = async (month: string) => {
    try {
      const apiUrl = `https://script.google.com/macros/s/AKfycbxmUSgKPVz_waNPHdKPT1y8x52xPNS9Yzqx_u1mlH83OabndJQ8Ie2ZZJVJnLIMNOb4/exec`;
      const params = new URLSearchParams({
        mes: month,
        todos: 'true'
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
    }
  };

  const filteredUsers = allUsersData.filter(user => 
    user.Nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 max-w-2xl">
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          {data && (
            <div className="mt-6 space-y-4">
              <h2 className="text-center font-bold text-xl">{data.Nome}</h2>
              
              <div>
                <h3 className="font-bold mb-2">Dias trabalhados:</h3>
                {data["Horas 25° BPM"] && (
                  <p>25° BPM: {data["Horas 25° BPM"]}</p>
                )}
                {data.Sonora && <p>Sonora: {data.Sonora}</p>}
                {data.Sinfra && <p>Sinfra: {data.Sinfra}</p>}
              </div>

              <Separator />

              <div>
                <h3 className="font-bold mb-2">Horas:</h3>
                {data["Total 25° BPM"] && (
                  <p>25° BPM: {data["Total 25° BPM"]}</p>
                )}
                {data["Total Geral"] && (
                  <p className="font-bold text-green-600">
                    Total: {data["Total Geral"]}
                  </p>
                )}
              </div>

              <Button 
                variant="destructive" 
                className="w-full mt-4"
                onClick={() => setData(null)}
              >
                Fechar
              </Button>
            </div>
          )}

          {/* Admin Section - All Users Data */}
          {userData?.userType === 'admin' && allUsersData.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold text-primary">Todos os Usuários</h2>
              
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>25° BPM</TableHead>
                      <TableHead>Sonora</TableHead>
                      <TableHead>Sinfra</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{user.Nome}</TableCell>
                        <TableCell>{user["Horas 25° BPM"]}</TableCell>
                        <TableCell>{user.Sonora}</TableCell>
                        <TableCell>{user.Sinfra}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          {user["Total Geral"]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hours;
