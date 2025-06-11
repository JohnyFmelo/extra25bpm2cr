import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

// Interface da Droga permanece a mesma
export interface DrugItem {
  id: string;
  quantidade: string;
  substancia: string;
  cor: string;
  odor: string;
  indicios: string;
  customMaterialDesc: string;
}

// **MUDANÇA ARQUITETURAL**: As props foram simplificadas.
// O componente agora recebe a lista inicial e uma função para notificar o pai das mudanças.
interface DrugVerificationTabProps {
  initialDrugs: DrugItem[];
  onDrugsChange: (drugs: DrugItem[]) => void;
  lacreNumero: string;
  setLacreNumero: (value: string) => void;
}

// **LÓGICA CENTRALIZADA**: Função pura para determinar os indícios.
const getIndiciosFor = (substancia: string, cor: string): string => {
  if (substancia === 'Vegetal' && cor === 'Verde') return 'Maconha';
  if (substancia === 'Artificial' && cor === 'Amarelada') return 'Pasta base';
  if (substancia === 'Artificial' && cor === 'Branca') return 'Cocaína';
  if (substancia && cor) return 'Material desconhecido';
  return ''; // Retorna vazio se os campos não estiverem preenchidos
};


const DrugVerificationTab: React.FC<DrugVerificationTabProps> = ({
  initialDrugs,
  onDrugsChange,
  lacreNumero,
  setLacreNumero,
}) => {
  
  // O estado interno é a ÚNICA fonte da verdade. É inicializado com as props.
  const [internalDrugs, setInternalDrugs] = useState<DrugItem[]>(initialDrugs);

  // Efeito para notificar o componente pai sempre que a lista de drogas mudar.
  useEffect(() => {
    onDrugsChange(internalDrugs);
  }, [internalDrugs, onDrugsChange]);

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
    if (internalDrugs.length <= 1) return;
    setInternalDrugs(prev => prev.filter(drug => drug.id !== drugId));
  };

  const updateDrug = (drugId: string, field: keyof DrugItem, value: string) => {
    setInternalDrugs(currentDrugs => 
      currentDrugs.map(drug => {
        if (drug.id === drugId) {
          const updatedDrug = { ...drug, [field]: value };

          // **LÓGICA AUTOMÁTICA**: Se substância ou cor mudou, recalcula os indícios.
          // Isso funciona para QUALQUER droga na lista.
          if (field === 'substancia' || field === 'cor') {
            const newSubstancia = field === 'substancia' ? value : drug.substancia;
            const newCor = field === 'cor' ? value : drug.cor;
            updatedDrug.indicios = getIndiciosFor(newSubstancia, newCor);
          }
          return updatedDrug;
        }
        return drug;
      })
    );
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

              {/* Todos os campos agora funcionam de forma idêntica e consistente */}
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
                  placeholder="Indícios gerados automaticamente"
                  value={drug.indicios}
                  readOnly // O campo agora é apenas para leitura, pois é automático
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* **UI REATIVA CORRIGIDA**: A condição é simples e local para cada droga. */}
              {drug.indicios === 'Material desconhecido' && (
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
