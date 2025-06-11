
import React from "react";
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
  nomeComum: string;
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
  // New props for multiple drugs
  multipleDrugs?: DrugItem[];
  setMultipleDrugs?: (drugs: DrugItem[]) => void;
  drogaNomeComum?: string;
  setDrogaNomeComum?: (value: string) => void;
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
  customMaterialDesc,
  setCustomMaterialDesc,
  isUnknownMaterial,
  lacreNumero,
  setLacreNumero,
  multipleDrugs = [],
  setMultipleDrugs,
  drogaNomeComum = "",
  setDrogaNomeComum
}) => {
  
  // Create initial drug from current props
  const initialDrug: DrugItem = {
    id: "drug-1",
    quantidade,
    substancia,
    cor,
    odor,
    nomeComum: drogaNomeComum,
    customMaterialDesc
  };

  // Use multipleDrugs if available, otherwise use initial drug
  const drugs = multipleDrugs.length > 0 ? multipleDrugs : [initialDrug];

  const addNewDrug = () => {
    const newDrug: DrugItem = {
      id: `drug-${Date.now()}`,
      quantidade: "",
      substancia: "",
      cor: "",
      odor: "",
      nomeComum: "",
      customMaterialDesc: ""
    };
    
    const updatedDrugs = [...drugs, newDrug];
    if (setMultipleDrugs) {
      setMultipleDrugs(updatedDrugs);
    }
  };

  const removeDrug = (drugId: string) => {
    if (drugs.length <= 1) return; // Don't allow removing the last drug
    
    const updatedDrugs = drugs.filter(drug => drug.id !== drugId);
    if (setMultipleDrugs) {
      setMultipleDrugs(updatedDrugs);
    }
  };

  const updateDrug = (drugId: string, field: keyof DrugItem, value: string) => {
    const updatedDrugs = drugs.map(drug => 
      drug.id === drugId ? { ...drug, [field]: value } : drug
    );
    
    if (setMultipleDrugs) {
      setMultipleDrugs(updatedDrugs);
    }
    
    // Update main props for the first drug to maintain compatibility
    if (drugId === drugs[0].id) {
      switch (field) {
        case 'quantidade':
          setQuantidade(value);
          break;
        case 'substancia':
          setSubstancia(value);
          break;
        case 'cor':
          setCor(value);
          break;
        case 'odor':
          setOdor(value);
          break;
        case 'nomeComum':
          if (setDrogaNomeComum) setDrogaNomeComum(value);
          break;
        case 'customMaterialDesc':
          setCustomMaterialDesc(value);
          break;
      }
    }
  };

  return (
    <Card>
      <CardHeader className="my-0 py-[8px]">
        <CardTitle className="py-[10px]">Constatação Preliminar de Droga</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 my-0 px-0 mx-0 py-0">
          {drugs.map((drug, index) => (
            <div key={drug.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Droga {index + 1}</h4>
                {drugs.length > 1 && (
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
                <Label htmlFor={`nomeComum-${drug.id}`}>Nome Comum</Label>
                <Input
                  id={`nomeComum-${drug.id}`}
                  placeholder="Ex: maconha, cocaína, etc."
                  value={drug.nomeComum}
                  onChange={e => updateDrug(drug.id, 'nomeComum', e.target.value)}
                />
              </div>

              {/* O campo de descrição só aparece se isUnknownMaterial for true E ambos substancia e cor estiverem selecionados */}
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
            <Label htmlFor="indicios">Indícios</Label>
            <Input id="indicios" value={indicios} readOnly className="bg-gray-100" />
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
