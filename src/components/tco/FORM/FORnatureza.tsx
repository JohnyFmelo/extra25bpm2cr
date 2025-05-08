import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Timer, ShieldAlert } from "lucide-react";

interface FORnaturezaProps {
  tcoNumber: string;
  setTcoNumber: (value: string) => void;
  natureza: string;
  setNatureza: (value: string) => void;
  // autor: string; // autor simplificado não parece mais usado aqui diretamente, é derivado de 'autores'
  // setAutor: (value: string) => void; // idem
  penaDescricao: string;
  naturezaOptions: string[];
  customNatureza: string;
  setCustomNatureza: (value: string) => void;
  startTime: Date | null;
  isTimerRunning: boolean;

  // DrugVerificationTab props
  quantidade: string;
  setQuantidade: (value: string) => void;
  substancia: string;
  setSubstancia: (value: string) => void;
  cor: string;
  setCor: (value: string) => void;
  indicios: string;
  customMaterialDesc: string;
  setCustomMaterialDesc: (value: string) => void;
  isUnknownMaterial: boolean;
  lacreNumero: string;
  setLacreNumero: (value: string) => void;
}

const FORnatureza: React.FC<FORnaturezaProps> = ({
  tcoNumber, setTcoNumber,
  natureza, setNatureza,
  penaDescricao, naturezaOptions,
  customNatureza, setCustomNatureza,
  startTime, isTimerRunning,
  quantidade, setQuantidade,
  substancia, setSubstancia,
  cor, setCor,
  indicios,
  customMaterialDesc, setCustomMaterialDesc,
  isUnknownMaterial,
  lacreNumero, setLacreNumero
}) => {
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Informações Básicas do TCO</CardTitle>
          <CardDescription>Preencha os dados iniciais para identificação do TCO.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tcoNumber">Número do TCO</Label>
              <Input id="tcoNumber" value={tcoNumber} onChange={(e) => setTcoNumber(e.target.value)} placeholder="Ex: 2024.001" />
            </div>
            <div>
              <Label htmlFor="natureza">Natureza da Ocorrência</Label>
              <Select value={natureza} onValueChange={setNatureza}>
                <SelectTrigger id="natureza">
                  <SelectValue placeholder="Selecione a natureza" />
                </SelectTrigger>
                <SelectContent>
                  {naturezaOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {natureza === "Outros" && (
              <div>
                <Label htmlFor="customNatureza">Descreva a Natureza</Label>
                <Input id="customNatureza" value={customNatureza} onChange={(e) => setCustomNatureza(e.target.value)} placeholder="Descreva a natureza específica" />
              </div>
            )}
          </div>
          {penaDescricao && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p><strong>Pena prevista:</strong> {penaDescricao}</p>
            </div>
          )}
          {isTimerRunning && startTime && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Timer className="mr-2 h-4 w-4" />
              <span>Início do registro: {startTime.toLocaleTimeString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {natureza === "Porte de drogas para consumo" && (
         <Card className="w-full mt-6">
            <CardHeader>
                <CardTitle className="flex items-center"><ShieldAlert className="mr-2 text-orange-500" /> Verificação de Entorpecentes</CardTitle>
                <CardDescription>Detalhes sobre a substância apreendida.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="quantidadeDroga">Quantidade (ex: 1 porção, 2 trouxinhas)</Label>
                        <Input id="quantidadeDroga" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="Ex: 1 porção pequena"/>
                    </div>
                    <div>
                        <Label htmlFor="substanciaDroga">Natureza da Substância</Label>
                        <Select value={substancia} onValueChange={setSubstancia}>
                            <SelectTrigger id="substanciaDroga"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Vegetal">Vegetal</SelectItem>
                                <SelectItem value="Artificial">Artificial/Sintética</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="corDroga">Cor Predominante</Label>
                         <Select value={cor} onValueChange={setCor}>
                            <SelectTrigger id="corDroga"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Verde">Verde</SelectItem>
                                <SelectItem value="Amarelada">Amarelada</SelectItem>
                                <SelectItem value="Branca">Branca</SelectItem>
                                <SelectItem value="Outra">Outra</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="indiciosDroga">Indícios Apontam para</Label>
                        <Input id="indiciosDroga" value={indicios} readOnly disabled placeholder="Será preenchido automaticamente"/>
                    </div>
                    {isUnknownMaterial && (
                        <div>
                            <Label htmlFor="customMaterialDesc">Descrição do Material Desconhecido</Label>
                            <Input id="customMaterialDesc" value={customMaterialDesc} onChange={e => setCustomMaterialDesc(e.target.value)} placeholder="Descreva o material (cor, textura, etc.)"/>
                        </div>
                    )}
                </div>
                 <div>
                    <Label htmlFor="lacreNumeroDroga">Número do Lacre (se houver)</Label>
                    <Input id="lacreNumeroDroga" value={lacreNumero} onChange={e => setLacreNumero(e.target.value)} placeholder="Nº do Lacre"/>
                </div>
            </CardContent>
        </Card>
      )}
    </>
  );
};

export default FORnatureza;
