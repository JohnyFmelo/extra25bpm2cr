import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { CustomUser } from "@/types/user";

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
  const { toast } = useToast();

  const handleConsult = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!storedUser?.registration) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado ou sem matrícula cadastrada",
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
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbxmUSgKPVz_waNPHdKPT1y8x52xPNS9Yzqx_u1mlH83OabndJQ8Ie2ZZJVJnLIMNOb4/exec?mes=${selectedMonth}&matricula=${storedUser.registration}`
      );
      const result = await response.json();

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
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao consultar dados",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
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
            disabled={loading} 
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
        </div>
      </div>
    </div>
  );
};

export default Hours;