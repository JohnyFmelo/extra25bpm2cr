import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TCOTimer from "./TCOTimer";
import { useToast } from "@/hooks/use-toast";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
interface BasicInformationTabProps {
  tcoNumber: string;
  setTcoNumber: (value: string) => void;
  natureza: string;
  setNatureza: (value: string) => void;
  autor: string;
  setAutor: (value: string) => void;
  penaDescricao: string;
  naturezaOptions: string[];
  customNatureza: string;
  setCustomNatureza: (value: string) => void;
  startTime: Date | null;
  isTimerRunning: boolean;
  juizadoEspecialData: string;
  setJuizadoEspecialData: (value: string) => void;
  juizadoEspecialHora: string;
  setJuizadoEspecialHora: (value: string) => void;
}
const BasicInformationTab: React.FC<BasicInformationTabProps> = ({
  tcoNumber,
  setTcoNumber,
  natureza,
  setNatureza,
  penaDescricao,
  naturezaOptions,
  customNatureza,
  setCustomNatureza,
  startTime,
  isTimerRunning,
  juizadoEspecialData,
  setJuizadoEspecialData,
  juizadoEspecialHora,
  setJuizadoEspecialHora
}) => {
  const {
    toast
  } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const handleTcoNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite apenas números
    const numericValue = value.replace(/[^0-9]/g, '');
    setTcoNumber(numericValue);

    // Verifica duplicata imediatamente se tiver pelo menos 3 dígitos
    if (numericValue && numericValue.length >= 3) {
      await checkDuplicateTco(numericValue);
    }
  };
  const checkDuplicateTco = async (tcoNum: string) => {
    setIsChecking(true);
    try {
      // Busca na coleção de TCOs
      const tcosRef = collection(db, "tcos");
      const q = query(tcosRef, where("tcoNumber", "==", tcoNum));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const existingTco = querySnapshot.docs[0].data();
        const createdAt = existingTco.createdAt?.toDate?.() || new Date(existingTco.createdAt);
        const formattedDate = createdAt.toLocaleDateString('pt-BR');
        toast({
          variant: "destructive",
          title: "TCO Duplicado",
          description: `Já existe um TCO com a numeração ${tcoNum}. Registrado em ${formattedDate}, Natureza: ${existingTco.natureza || 'Não informada'}.`
        });
      }
    } catch (error) {
      console.error("Erro ao verificar TCO duplicado:", error);
    } finally {
      setIsChecking(false);
    }
  };

  // Verifica duplicatas quando o número do TCO muda (com debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tcoNumber) {
        checkDuplicateTco(tcoNumber);
      }
    }, 1000); // Aguarda 1 segundo após parar de digitar

    return () => clearTimeout(timeoutId);
  }, [tcoNumber]);
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>TCO</CardTitle>
            <CardDescription>
              Preencha os dados básicos do TCO
            </CardDescription>
          </div>
          <TCOTimer startTime={startTime} isRunning={isTimerRunning} />
        </div>
      </CardHeader>
      <CardContent className="px-[5px]">
        <div className="space-y-4">
          
          {/* Número do TCO */}
          <div>
            <Label htmlFor="tcoNumber">Número do TCO *</Label>
            <div className="relative">
              <Input id="tcoNumber" placeholder="Informe o número do TCO (apenas números)" value={tcoNumber} onChange={handleTcoNumberChange} className={isChecking ? "border-yellow-300" : ""} />
              {isChecking && <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                </div>}
            </div>
          </div>
          
          {/* Natureza */}
          <div>
            <Label htmlFor="natureza">Natureza *</Label>
            <Select value={natureza} onValueChange={setNatureza}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a natureza" />
              </SelectTrigger>
              <SelectContent>
                {naturezaOptions.map(option => <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Natureza Personalizada */}
          {natureza === "Outros" && <div>
              <Label htmlFor="customNatureza">Especifique a Natureza *</Label>
              <Input id="customNatureza" placeholder="Digite a natureza específica" value={customNatureza} onChange={e => setCustomNatureza(e.target.value)} />
            </div>}

          {/* Pena da Tipificação - Ocultada quando natureza é "Outros" */}
          {penaDescricao && natureza !== "Outros" && <div>
              <Label>Pena da Tipificação</Label>
              <Input readOnly value={penaDescricao} className="bg-gray-100" />
            </div>}

          {/* Apresentação em Juizado Especial VG */}
          <div className="space-y-2">
            <Label>Apresentação em Juizado Especial VG</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              
              {/* Campo Data */}
              <div className="space-y-1">
                <Label htmlFor="juizadoData">Data</Label>
                <Input id="juizadoData" type="date" value={juizadoEspecialData} onChange={e => setJuizadoEspecialData(e.target.value)} />
              </div>
              
              {/* Campo Hora */}
              <div className="space-y-1">
                <Label htmlFor="juizadoHora">Hora</Label>
                <Input id="juizadoHora" type="time" value={juizadoEspecialHora} onChange={e => setJuizadoEspecialHora(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {/* Conteúdo do rodapé, se houver */}
      </CardFooter>
    </Card>;
};
export default BasicInformationTab;