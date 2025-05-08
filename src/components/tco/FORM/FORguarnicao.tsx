import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserPlus, Trash2, Shield } from "lucide-react";

// Re-declare or import if shared
interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
}

interface FORguarnicaoProps {
  currentGuarnicaoList: ComponenteGuarnicao[];
  onAddPolicial: (policial: ComponenteGuarnicao) => void;
  onRemovePolicial: (index: number) => void;
}

const FORguarnicao: React.FC<FORguarnicaoProps> = ({
  currentGuarnicaoList,
  onAddPolicial,
  onRemovePolicial
}) => {
  const [rg, setRg] = useState("");
  const [nome, setNome] = useState("");
  const [posto, setPosto] = useState("");

  const postos = ["SOLDADO", "CABO", "3º SGT", "2º SGT", "1º SGT", "SUB TEN", "ASP OF", "2º TEN", "1º TEN", "CAP", "MAJ", "TEN CEL", "CEL"];

  const handleAddClick = () => {
    if (rg && nome && posto) {
      onAddPolicial({ rg, nome: nome.toUpperCase(), posto });
      setRg("");
      setNome("");
      setPosto("");
    } else {
      // Simple alert, consider using toast from parent if available/passed
      alert("Preencha RG, Nome e Posto/Graduação.");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Composição da Guarnição</CardTitle>
        <CardDescription>Adicione os policiais militares que compõem a guarnição.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="policialRg">RG Funcional</Label>
            <Input id="policialRg" value={rg} onChange={(e) => setRg(e.target.value)} placeholder="RG do Policial" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="policialNome">Nome de Guerra</Label>
            <Input id="policialNome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome de Guerra" />
          </div>
          <div>
            <Label htmlFor="policialPosto">Posto/Graduação</Label>
            <Select value={posto} onValueChange={setPosto}>
              <SelectTrigger id="policialPosto">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {postos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddClick} className="md:col-start-4">
            <UserPlus className="mr-2 h-4 w-4" /> Adicionar à Guarnição
          </Button>
        </div>

        {currentGuarnicaoList.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center"><Shield className="mr-2 text-green-600"/> Componentes Adicionados:</h4>
            <ul className="space-y-2">
              {currentGuarnicaoList.map((policial, index) => (
                (policial.rg || policial.nome || policial.posto) && // Render only if not completely empty
                <li key={index} className="flex justify-between items-center p-2 border rounded-md bg-muted/50">
                  <span>{policial.posto} PM {policial.nome} - RG: {policial.rg}</span>
                  <Button variant="ghost" size="sm" onClick={() => onRemovePolicial(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FORguarnicao;
