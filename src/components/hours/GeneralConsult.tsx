
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MonthSelector } from "./MonthSelector";
import { UserSelector } from "./UserSelector";
import { UserHoursDisplay } from "./UserHoursDisplay";
import { fetchUserHours } from "@/services/hoursService";
import { useToast } from "@/hooks/use-toast";
import type { HoursData, UserOption } from "@/types/hours";

interface GeneralConsultProps {
  users: UserOption[];
}

export const GeneralConsult = ({ users }: GeneralConsultProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [generalData, setGeneralData] = useState<HoursData | null>(null);
  const [allUsersData, setAllUsersData] = useState<HoursData[]>([]);
  const { toast } = useToast();

  const handleGeneralConsult = async () => {
    if (!selectedMonth) {
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
    setLoading(true);
    try {
      if (selectedUser === 'all') {
        const allUsersResults = [];
        for (const user of users) {
          try {
            const result = await fetchUserHours(selectedMonth, user.registration);
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
        const result = await fetchUserHours(selectedMonth, selectedUser);
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
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 col-span-2">
      <h2 className="text-xl font-bold text-primary mb-4">Consulta Geral</h2>
      <div className="space-y-4">
        <UserSelector users={users} value={selectedUser} onChange={setSelectedUser} />
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

        <Button onClick={handleGeneralConsult} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Consultando...
            </>
          ) : (
            "Consultar"
          )}
        </Button>

        {selectedUser === 'all' && allUsersData.map((userData, index) => (
          <div key={index} className="mb-4 p-4 rounded-md shadow-sm bg-orange-100">
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
  );
};
