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
  juizadoDate: string;
  setJuizadoDate: (value: string) => void;
  juizadoTime: string;
  setJuizadoTime: (value: string) => void;
}

const BasicInformationTab: React.FC<BasicInformationTabProps> = ({
  tcoNumber,
  setTcoNumber,
  natureza,
  setNatureza,
  autor,
  setAutor,
  penaDescricao,
  naturezaOptions,
  customNatureza,
  setCustomNatureza,
  startTime,
  isTimerRunning,
  juizadoDate,
  setJuizadoDate,
  juizadoTime,
  setJuizadoTime
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
                {naturezaOptions.map(option => <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>)}
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

          {penaDescricao && <div>
              <Label>Pena da Tipificação</Label>
              <Input readOnly value={penaDescricao} className="bg-gray-100" />
            </div>}

          <div>
            <Label>Apresentação no Juizado Criminal VG</Label>
            <div className="space-y-2 mt-2">
              <div>
                <Label htmlFor="juizadoDate">Data *</Label>
                <Input 
                  id="juizadoDate" 
                  type="date" 
                  value={juizadoDate} 
                  onChange={e => setJuizadoDate(e.target.value)} 
                />
              </div>
              <div>
                <Label htmlFor="juizadoTime">Horário *</Label>
                <Input 
                  id="juizadoTime" 
                  type="time" 
                  value={juizadoTime} 
                  onChange={e => setJuizadoTime(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        
      </CardFooter>
    </Card>;
};

export default BasicInformationTab;
