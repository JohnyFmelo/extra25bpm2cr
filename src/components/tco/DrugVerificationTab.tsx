import React, { useState, useEffect, useCallback } from "react";
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
  indicios: string; // This prop acts as an initial value for drug 1's indicios
  setIndicios?: (value: string) => void;
  customMaterialDesc: string;
  setCustomMaterialDesc: (value: string) => void;
  isUnknownMaterial: boolean; // Used APENAS para a Droga 1
  lacreNumero: string;
  setLacreNumero: (value: string) => void;
  onInternalDrugsChange?: (drugs: DrugItem[]) => void; // Callback to pass all drugs to parent
}

// Helper function to get the display name of a drug
const getDrugDisplayName = (substancia: string, cor: string): string => {
  if (substancia === "Vegetal" && cor === "Verde") return "MACONHA";
  if (substancia === "Artificial" && cor === "Branca") return "COCAÍNA";
  if (substancia === "Artificial" && cor === "Amarelada") return "PASTA BASE"; // Or CRACK
  return "SUBSTÂNCIA NÃO IDENTIFICADA"; // Default for unknown combinations
};

// Helper function to check if a drug is a standard, known type
const isStandardDrug = (substancia: string, cor: string): boolean => {
  if (substancia === "Vegetal" && cor === "Verde") return true; // Maconaha
  if (substancia === "Artificial" && cor === "Branca") return true; // Cocaína
  if (substancia === "Artificial" && cor === "Amarelada") return true; // Pasta Base/Crack
  return false;
};

const DrugVerificationTab: React.FC<DrugVerificationTabProps> = ({
  quantidade,
  setQuantidade,
  substancia,
  setSubstancia,
  cor,
  setCor,
  odor,
  setOdor,
  indicios, // Initial indicios for drug 1 from parent
  setIndicios,
  customMaterialDesc,
  setCustomMaterialDesc,
  isUnknownMaterial,
  lacreNumero,
  setLacreNumero,
  onInternalDrugsChange,
}) => {
  
  const generateIndiciosText = useCallback((q: string, s: string, c: string): string => {
    if (q && s && c) {
      const drugName = getDrugDisplayName(s, c);
      return `${q.toUpperCase()} DE SUBSTÂNCIA ANÁLOGA A ${drugName}, CONFORME FOTO EM ANEXO.`;
    }
    return "";
  }, []);

  const [internalDrugs, setInternalDrugs] = useState<DrugItem[]>(() => [
    {
      id: "drug-1",
      quantidade,
      substancia,
      cor,
      odor,
      indicios: generateIndiciosText(quantidade, substancia, cor) || indicios, // Initialize with generated or prop
      customMaterialDesc
    }
  ]);

  // Effect to synchronize props for Drug 1 to internal state and recalculate its indicios
  useEffect(() => {
    setInternalDrugs(currentDrugs => {
      const firstDrug = currentDrugs[0];
      if (!firstDrug) return currentDrugs; // Should not happen

      const newIndiciosForFirstDrug = generateIndiciosText(quantidade, substancia, cor);

      // If indicios for Drug 1 changed due to prop changes, notify parent
      if (setIndicios && newIndiciosForFirstDrug !== firstDrug.indicios) {
        setIndicios(newIndiciosForFirstDrug);
      }
      
      const updatedFirstDrug = {
        ...firstDrug,
        quantidade,
        substancia,
        cor,
        odor,
        indicios: newIndiciosForFirstDrug,
        customMaterialDesc,
      };

      // Avoid creating new array if no actual change to prevent potential loops
      if (JSON.stringify(firstDrug) === JSON.stringify(updatedFirstDrug) && currentDrugs.length === 1) {
        return currentDrugs;
      }
      return [updatedFirstDrug, ...currentDrugs.slice(1)];
    });
  }, [quantidade, substancia, cor, odor, customMaterialDesc, indicios, setIndicios, generateIndiciosText]);


  // Effect to notify parent about changes in internalDrugs array
  useEffect(() => {
    if (onInternalDrugsChange) {
      onInternalDrugsChange(internalDrugs);
    }
  }, [internalDrugs, onInternalDrugsChange]);


  const addNewDrug = () => {
    const newDrugId = `drug-${Date.now()}`;
    const newDrug: DrugItem = {
      id: newDrugId,
      quantidade: "",
      substancia: "",
      cor: "",
      odor: "",
      indicios: "", // Will be generated on update
      customMaterialDesc: ""
    };
    
    setInternalDrugs(prev => [...prev, newDrug]);
  };

  const removeDrug = (drugId: string) => {
    if (internalDrugs.length <= 1) return; // Keep at least one drug
    setInternalDrugs(prev => prev.filter(drug => drug.id !== drugId));
  };

  const updateDrug = (drugId: string, field: keyof DrugItem, value: string) => {
    let updatedDrugs = internalDrugs.map(drug => {
      if (drug.id === drugId) {
        const tempUpdatedDrug = { ...drug, [field]: value };
        
        // Auto-generate indicios if relevant fields change
        if (['quantidade', 'substancia', 'cor'].includes(field)) {
          tempUpdatedDrug.indicios = generateIndiciosText(tempUpdatedDrug.quantidade, tempUpdatedDrug.substancia, tempUpdatedDrug.cor);
        }
        return tempUpdatedDrug;
      }
      return drug;
    });
    
    setInternalDrugs(updatedDrugs);
    
    // If it's the first drug, notify the parent component to trigger automations
    const firstDrugUpdated = updatedDrugs.find(d => d.id === "drug-1");
    if (drugId === "drug-1" && firstDrugUpdated) {
      switch (field) {
        case 'quantidade': setQuantidade(value); break;
        case 'substancia': setSubstancia(value); break;
        case 'cor': setCor(value); break;
        case 'odor': setOdor(value); break;
        // indicios is auto-generated, so we update the parent with the generated value
        // case 'indicios': if (setIndicios) setIndicios(value); break;
        case 'customMaterialDesc': setCustomMaterialDesc(value); break;
      }
      // Always update parent's indicios for drug 1 if it changed
      if (setIndicios && firstDrugUpdated.indicios !== indicios ) {
         setIndicios(firstDrugUpdated.indicios);
      }
    }
  };
  
  const shouldShowDescriptionFor = (drug: DrugItem, index: number): boolean => {
    if (drug.substancia === "" || drug.cor === "") {
        return false; // Don't show if base fields are empty
    }
    // For the first drug, use the isUnknownMaterial prop from the parent.
    if (index === 0) {
      return isUnknownMaterial; // Parent dictates for Drug 1
    }
    // For other drugs, show if it's not a standard drug type.
    return !isStandardDrug(drug.substancia, drug.cor);
  };

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
                  <SelectTrigger id={`substancia-${drug.id}`}>
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
                  <SelectTrigger id={`cor-${drug.id}`}>
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
                  <SelectTrigger id={`odor-${drug.id}`}>
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
                  placeholder="Indícios gerados automaticamente"
                  value={drug.indicios} 
                  readOnly // Indícios are auto-generated
                />
              </div>

              {shouldShowDescriptionFor(drug, index) && (
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
