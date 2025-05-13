
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Info as InfoCircle, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Fix the interface to correctly define the component props
interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
}

interface GuarnicaoTabProps {
  currentGuarnicaoList: ComponenteGuarnicao[];
  onAddPolicial: (policial: ComponenteGuarnicao) => void;
  onRemovePolicial: (index: number) => void;
}

const GuarnicaoTab: React.FC<GuarnicaoTabProps> = ({
  currentGuarnicaoList = [],
  onAddPolicial,
  onRemovePolicial
}) => {
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [posto, setPosto] = useState("");
  const [rg, setRg] = useState("");

  // Fix using 'destructive' instead of 'warning' for toast variants
  const handleAddPolicial = () => {
    // Validations
    if (!nome.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Nome do policial é obrigatório." });
      return;
    }
    if (!posto) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Posto/Graduação é obrigatório." });
      return;
    }
    if (!rg.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "RG é obrigatório." });
      return;
    }

    onAddPolicial({ nome: nome.trim(), posto, rg: rg.trim() });
    // Reset form
    setNome("");
    setPosto("");
    setRg("");
  };

  // Handle key press in inputs to submit on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPolicial();
    }
  };
  
  // Fix InfoCircle usage to use aria-label instead of title
  return (
    <div className="space-y-6">
      {/* Add New Police Officer Form */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="posto" className="text-sm font-medium">Posto/Graduação</Label>
                <InfoCircle 
                  className="ml-1 h-4 w-4 text-gray-500" 
                  aria-label="Informações sobre postos e graduações" 
                />
              </div>
              <Select value={posto} onValueChange={setPosto}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CEL">Coronel</SelectItem>
                  <SelectItem value="TEN CEL">Tenente-Coronel</SelectItem>
                  <SelectItem value="MAJ">Major</SelectItem>
                  <SelectItem value="CAP">Capitão</SelectItem>
                  <SelectItem value="1º TEN">1º Tenente</SelectItem>
                  <SelectItem value="2º TEN">2º Tenente</SelectItem>
                  <SelectItem value="ASP OF">Aspirante a Oficial</SelectItem>
                  <SelectItem value="SUB TEN">Subtenente</SelectItem>
                  <SelectItem value="1º SGT">1º Sargento</SelectItem>
                  <SelectItem value="2º SGT">2º Sargento</SelectItem>
                  <SelectItem value="3º SGT">3º Sargento</SelectItem>
                  <SelectItem value="CB">Cabo</SelectItem>
                  <SelectItem value="SD">Soldado</SelectItem>
                  <SelectItem value="AL SGT">Aluno Sargento</SelectItem>
                  <SelectItem value="AL CB">Aluno Cabo</SelectItem>
                  <SelectItem value="AL SD">Aluno Soldado</SelectItem>
                  <SelectItem value="AG">Agente</SelectItem>
                  <SelectItem value="GM">Guarda Municipal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">Nome</Label>
              <Input
                id="nome"
                placeholder="Nome do Policial"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rg" className="text-sm font-medium">RG</Label>
              <div className="flex space-x-2">
                <Input
                  id="rg"
                  placeholder="RG do Policial"
                  value={rg}
                  onChange={(e) => setRg(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button 
                  onClick={handleAddPolicial} 
                  type="button" 
                  size="icon" 
                  className="shrink-0"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Police Officers List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Componentes da Guarnição ({currentGuarnicaoList.length})</h3>
        
        {currentGuarnicaoList.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Nenhum componente adicionado.</p>
        ) : (
          <div className="space-y-2">
            {currentGuarnicaoList.map((policial, index) => (
              <div key={`${policial.rg}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 border rounded-md">
                <div className="flex-1">
                  <p className="font-medium">{policial.posto} {policial.nome}</p>
                  <p className="text-sm text-gray-600">RG: {policial.rg}</p>
                </div>
                <Button 
                  onClick={() => onRemovePolicial(index)} 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuarnicaoTab;
