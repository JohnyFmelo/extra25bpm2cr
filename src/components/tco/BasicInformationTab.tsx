import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TCOTimer from "./TCOTimer";

interface BasicInformationTabProps {
  tcoNumber: string;
  setTcoNumber: (value: string) => void;
  natureza: string;
  setNatureza: (value: string) => void;
  autor: string; // Mantido, embora não usado diretamente neste tab para input, pode ser útil para outros fins
  setAutor: (value: string) => void; // Mantido
  penaDescricao: string;
  naturezaOptions: string[];
  customNatureza: string;
  setCustomNatureza: (value: string) => void;
  startTime: Date | null;
  isTimerRunning: boolean;
  juizadoEspecialData: string; // Adicionado
  setJuizadoEspecialData: (value: string) => void; // Adicionado
  juizadoEspecialHora: string; // Adicionado
  setJuizadoEspecialHora: (value: string) => void; // Adicionado
}

const BasicInformationTab: React.FC<BasicInformationTabProps> = ({
  tcoNumber,
  setTcoNumber,
  natureza,
  setNatureza,
  // autor, // Removido dos parâmetros se não usado, mas mantido na interface por precaução
  // setAutor, // Removido dos parâmetros se não usado, mas mantido na interface por precaução
  penaDescricao,
  naturezaOptions,
  customNatureza,
  setCustomNatureza,
  startTime,
  isTimerRunning,
  juizadoEspecialData, // Adicionado
  setJuizadoEspecialData, // Adicionado
  juizadoEspecialHora, // Adicionado
  setJuizadoEspecialHora, // Adicionado
}) => {
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
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tcoNumber">Número do TCO *</Label>
            <Input id="tcoNumber" placeholder="Informe o número do TCO" value={tcoNumber} onChange={e => setTcoNumber(e.target.value)} />
          </div>
          
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

          {penaDescricao && (
            <div>
              <Label>Pena da Tipificação</Label>
              <Input readOnly value={penaDescricao} className="bg-gray-100" />
            </div>
          )}

          {/* Nova seção para Apresentação em Juizado Especial VG */}
          <div className="pt-2"> {/* Adicionado um pouco de espaço no topo */}
            <Label className="text-md font-semibold text-gray-700">Apresentação em Juizado Especial VG</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              <div>
                <Label htmlFor="juizadoData">Data</Label>
                <Input 
                  id="juizadoData" 
                  type="date" 
                  value={juizadoEspecialData} 
                  onChange={e => setJuizadoEspecialData(e.target.value)} 
                />
              </div>
              <div>
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
