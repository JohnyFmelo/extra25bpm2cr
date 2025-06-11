import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface DrugItem {
  id: string;
  quantidade: string;
  substancia: string;
  cor: string;
  odor: string;
  indicios: string;
  customMaterialDesc: string;
}

interface DrugVerificationTabProps {
  quantidade: string;
  setQuantidade: (value: string) => void;
  substancia: string;
  setSubstancia: (value: string) => void;
  cor: string;
  setCor: (value: string) => void;
  odor: string;
  setOdor: (value: string) => void;
  indicios: string;
  setIndicios?: (value: string) => void;
  customMaterialDesc: string;
  setCustomMaterialDesc: (value: string) => void;
  isUnknownMaterial: boolean;
  lacreNumero: string;
  setLacreNumero: (value: string) => void;
}

const DrugVerificationTab: React.FC<DrugVerificationTabProps> = ({
  quantidade,
  setQuantidade,
  substancia,
  setSubstancia,
  cor,
  setCor,
  odor,
  setOdor,
  indicios,
  setIndicios,
  customMaterialDesc,
  setCustomMaterialDesc,
  isUnknownMaterial,
  lacreNumero,
  setLacreNumero,
}) => {
  
  // Estado interno para gerenciar múltiplas drogas.
  // As props são usadas APENAS para inicializar a primeira droga.
  const [internalDrugs, setInternalDrugs] = useState<DrugItem[]>([
    {
      id: `drug-${Date.now()}`, // ID único para a primeira droga também
      quantidade,
      substancia,
      cor,
      odor,
      indicios,
      customMaterialDesc
    }
  ]);

  // REMOVIDO: O useEffect estava causando inconsistência, pois sincronizava
  // as props apenas com o primeiro item da lista.

  const addNewDrug = () => {
    const newDrug: DrugItem = {
      id: `drug-${Date.now()}`,
      quantidade: "",
      substancia: "",
      cor: "",
      odor: "",
      indicios: "",
      customMaterialDesc: ""
    };
    
    setInternalDrugs(prev => [...prev, newDrug]);
  };

  const removeDrug = (drugId: string) => {
    // Não permitir a remoção da última droga, para manter sempre ao menos uma.
    if (internalDrugs.length <= 1) return;
    
    setInternalDrugs(prev => prev.filter(drug => drug.id !== drugId));
  };

  const updateDrug = (drugId: string, field: keyof DrugItem, value: string) => {
    setInternalDrugs(prev => 
      prev.map(drug => 
        drug.id === drugId ? { ...drug, [field]: value } : drug
      )
    );
    
    // REMOVIDO: A lógica de atualização das props foi removida.
    // O componente agora gerencia seu estado de forma interna e consistente.
    // Isso garante que todos os campos de todas as drogas funcionem da mesma maneira.
    // NOTA: Para comunicar as alterações de volta ao pai, seria ideal
    // ter uma prop como onDrugsChange={(allDrugs) => ...}
  };

  // Efeito para sincronizar as alterações da primeira droga de volta para o pai,
  // mantendo a compatibilidade com a estrutura de props original.
  useEffect(() => {
    const firstDrug = internalDrugs[0];
    if (firstDrug) {
      if (firstDrug.quantidade !== quantidade) setQuantidade(firstDrug.quantidade);
      if (firstDrug.substancia !== substancia) setSubstancia(firstDrug.substancia);
      if (firstDrug.cor !== cor) setCor(firstDrug.cor);
      if (firstDrug.odor !== odor) setOdor(firstDrug.odor);
      if (setIndicios && firstDrug.indicios !== indicios) setIndicios(firstDrug.indicios);
      if (firstDrug.customMaterialDesc !== customMaterialDesc) setCustomMaterialDesc(firstDrug.customMaterialDesc);
    }
  }, [internalDrugs]); // Dispara sempre que a lista de drogas mudar.

  return (
    <Card>
      <CardHeader className="my-0 py-[8px]">
        <CardTitle className="py-[10px]">Constatação Preliminar de Droga</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 my-0 px-0 mx-0 py-0">
          {internalDrugs.map((drug, index) => (
            <div key={drug.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Droga {index + 1}</h4>
                {internalDrugs.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDrug(drug.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div>
                <Label htmlFor={`quantidade-${drug.id}`}>Porção (quantidade) *</Label>
                <Input
                  id={`quantidade-${drug.id}`}
                  placeholder="Informe a quantidade (ex: 1 porção)"
                  value={drug.quantidade}
                  onChange={e => updateDrug(drug.id, 'quantidade', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor={`substancia-${drug.id}`}>Substância *</Label>
                <Select 
                  value={drug.substancia} 
                  onValueChange={(value) => updateDrug(drug.id, 'substancia', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de substância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vegetal">Vegetal</SelectItem>
                    <SelectItem value="Artificial">Artificial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`cor-${drug.id}`}>Cor *</Label>
                <Select 
                  value={drug.cor} 
                  onValueChange={(value) => updateDrug(drug.id, 'cor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cor da substância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Verde">Verde</SelectItem>
                    <SelectItem value="Amarelada">Amarelada</SelectItem>
                    <SelectItem value="Branca">Branca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`odor-${drug.id}`}>Odor *</Label>
                <Select 
                  value={drug.odor} 
                  onValueChange={(value) => updateDrug(drug.id, 'odor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o odor da substância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Característico">Característico</SelectItem>
                    <SelectItem value="Forte">Forte</SelectItem>
                    <SelectItem value="Suave">Suave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`indicios-${drug.id}`}>Indícios</Label>
                <Input 
                  id={`indicios-${drug.id}`} 
                  placeholder="Descreva os indícios encontrados"
                  value={drug.indicios} 
                  onChange={e => updateDrug(drug.id, 'indicios', e.target.value)}
                />
              </div>

              {isUnknownMaterial && drug.substancia !== "" && drug.cor !== "" && (
                <div>
                  <Label htmlFor={`customMaterialDesc-${drug.id}`}>Descrição do Material *</Label>
                  <Textarea
                    id={`customMaterialDesc-${drug.id}`}
                    placeholder="Descreva o tipo de material encontrado"
                    value={drug.customMaterialDesc}
                    onChange={e => updateDrug(drug.id, 'customMaterialDesc', e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={addNewDrug}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Outro Tipo de Droga
            </Button>
          </div>

          <div>
            <Label htmlFor="lacreNumero">Número do Lacre (único para todas as drogas) *</Label>
            <Input
              id="lacreNumero"
              placeholder="Informe o número do lacre (ex: 00000000)"
              value={lacreNumero}
              onChange={e => setLacreNumero(e.target.value)}
              maxLength={8}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DrugVerificationTab;
