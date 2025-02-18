
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MonthSelector } from "./MonthSelector";
import { UserHoursDisplay } from "./UserHoursDisplay";
import { fetchUserHours } from "@/services/hoursService";
import { useToast } from "@/hooks/use-toast";
import type { HoursData } from "@/types/hours";

interface IndividualConsultProps {
  userData: any;
}

export const IndividualConsult = ({ userData }: IndividualConsultProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HoursData | null>(null);
  const { toast } = useToast();

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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 col-span-2">
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
  );
};
