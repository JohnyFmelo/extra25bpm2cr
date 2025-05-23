
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
  // autor, // Props mantidas na interface, mas não usadas diretamente aqui
  // setAutor,
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
  return <Card>
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
        <div className="space-y-4"> {/* Container principal para todos os campos, com espaçamento vertical */}
          
          {/* Número do TCO */}
          <div>
            <Label htmlFor="tcoNumber">Número do TCO *</Label>
            <Input id="tcoNumber" placeholder="Informe o número do TCO" value={tcoNumber} onChange={e => setTcoNumber(e.target.value)} />
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
          <div className="space-y-2"> {/* Cria um sub-grupo para o rótulo "Apresentação..." e seus campos, com um espaçamento interno menor */}
            <Label>Apresentação em Juizado Especial VG</Label> {/* Rótulo principal da seção */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4"> {/* Grid para os campos Data e Hora */}
              
              {/* Campo Data */}
              <div className="space-y-1"> {/* Agrupa o rótulo "Data" com seu input */}
                <Label htmlFor="juizadoData">Data</Label>
                <Input id="juizadoData" type="date" value={juizadoEspecialData} onChange={e => setJuizadoEspecialData(e.target.value)} />
              </div>
              
              {/* Campo Hora */}
              <div className="space-y-1"> {/* Agrupa o rótulo "Hora" com seu input */}
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
