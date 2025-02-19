
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
  const [data, setData] = useState<HoursData | null>(null);
  const { toast } = useToast();

  const handleConsult = async () => {
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um usuário"
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
      const result = await fetchUserHours(selectedMonth, selectedUser);
      if (result.error) {
        throw new Error(result.error);
      }
      if (!result || result.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não encontrado"
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
        description: error instanceof Error ? error.message : "Erro ao consultar dados"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 col-span-2">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Consulta Geral</h2>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm">
          <UserSelector users={users} value={selectedUser} onChange={setSelectedUser} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm">
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
        </div>

        <Button 
          onClick={handleConsult} 
          disabled={loading} 
          className="w-full h-14 rounded-2xl bg-gray-400 hover:bg-gray-500 text-white text-lg font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Consultando...
            </>
          ) : (
            "Consultar"
          )}
        </Button>

        {data && <UserHoursDisplay data={data} onClose={() => setData(null)} />}
      </div>
    </div>
  );
};
