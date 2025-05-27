
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TCOTimer from "./TCOTimer";
import { 
  normalizeTcoNumber, 
  formatTcoNumberInput, 
  checkTcoDuplicate, 
  calculateDaysDifference 
} from "../../utils/tcoValidation";

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
  const { toast } = useToast();
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Função para verificar duplicatas quando o número do TCO muda
  useEffect(() => {
    const checkForDuplicate = async () => {
      if (!tcoNumber || tcoNumber.length < 1) {
        setDuplicateInfo(null);
        return;
      }

      setIsCheckingDuplicate(true);
      
      try {
        const duplicate = await checkTcoDuplicate(tcoNumber, supabase);
        setDuplicateInfo(duplicate);
      } catch (error) {
        console.error('Erro ao verificar duplicata:', error);
      } finally {
        setIsCheckingDuplicate(false);
      }
    };

    // Debounce para evitar muitas consultas
    const timeoutId = setTimeout(checkForDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [tcoNumber]);

  const handleTcoNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatTcoNumberInput(e.target.value);
    setTcoNumber(formattedValue);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Termo Circunstanciado de Ocorrência</CardTitle>
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
            <Input 
              id="tcoNumber" 
              placeholder="Informe apenas números (ex: 123)" 
              value={tcoNumber} 
              onChange={handleTcoNumberChange}
              className={duplicateInfo ? "border-yellow-500" : ""}
            />
            
            {/* Aviso de duplicata */}
            {duplicateInfo && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">
                      TCO já existe!
                    </p>
                    <p className="text-yellow-700 mt-1">
                      Já existe um TCO nº {duplicateInfo.tconumber}, natureza "{duplicateInfo.natureza}", 
                      registrado há {calculateDaysDifference(duplicateInfo.createdat)} dias 
                      em {new Date(duplicateInfo.createdat).toLocaleDateString('pt-BR')} às {' '}
                      {new Date(duplicateInfo.createdat).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}.
                    </p>
                    <p className="text-yellow-700 mt-1 font-medium">
                      Se prosseguir, o arquivo será substituído.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Indicador de verificação */}
            {isCheckingDuplicate && (
              <p className="text-xs text-gray-500 mt-1">Verificando duplicatas...</p>
            )}
          </div>
          
          {/* Natureza */}
          <div>
            <Label htmlFor="natureza">Natureza *</Label>
            <Select value={natureza} onValueChange={setNatureza}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a natureza" />
              </SelectTrigger>
              <SelectContent>
                {naturezaOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Natureza Personalizada */}
          {natureza === "Outros" && (
            <div>
              <Label htmlFor="customNatureza">Especifique a Natureza *</Label>
              <Input 
                id="customNatureza" 
                placeholder="Digite a natureza específica" 
                value={customNatureza} 
                onChange={e => setCustomNatureza(e.target.value)} 
              />
            </div>
          )}

          {/* Pena da Tipificação - Ocultada quando natureza é "Outros" */}
          {penaDescricao && natureza !== "Outros" && (
            <div>
              <Label>Pena da Tipificação</Label>
              <Input readOnly value={penaDescricao} className="bg-gray-100" />
            </div>
          )}

          {/* Apresentação em Juizado Especial VG */}
          <div className="space-y-2">
            <Label>Apresentação em Juizado Especial VG</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              
              {/* Campo Data */}
              <div className="space-y-1">
                <Label htmlFor="juizadoData">Data</Label>
                <Input 
                  id="juizadoData" 
                  type="date" 
                  value={juizadoEspecialData} 
                  onChange={e => setJuizadoEspecialData(e.target.value)} 
                />
              </div>
              
              {/* Campo Hora */}
              <div className="space-y-1">
                <Label htmlFor="juizadoHora">Hora</Label>
                <Input 
                  id="juizadoHora" 
                  type="time" 
                  value={juizadoEspecialHora} 
                  onChange={e => setJuizadoEspecialHora(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {/* Conteúdo do rodapé, se houver */}
      </CardFooter>
    </Card>
  );
};

export default BasicInformationTab;
