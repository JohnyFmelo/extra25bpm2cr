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
  indicios: string; // Indícios para a Droga 1, vindo do pai
  setIndicios?: (value: string) => void; // Para atualizar indícios da Droga 1 no pai
  customMaterialDesc: string;
  setCustomMaterialDesc: (value: string) => void;
  isUnknownMaterial: boolean; // Usado APENAS para a Droga 1
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
  indicios, // Renomeado para clareza: indiciosPropForFirstDrug
  setIndicios, // Renomeado para clareza: setIndiciosForFirstDrug
  customMaterialDesc,
  setCustomMaterialDesc,
  isUnknownMaterial,
  lacreNumero,
  setLacreNumero,
}) => {

  const [internalDrugs, setInternalDrugs] = useState<DrugItem[]>(() => [
    {
      id: "drug-1",
      quantidade,
      substancia,
      cor,
      odor,
      indicios, // Inicializa com a prop indicios do pai
      customMaterialDesc,
    },
  ]);

  // Função auxiliar para gerar a descrição de indícios
  const generateIndiciosDescription = (substanciaVal: string, corVal: string, odorVal: string): string => {
    if (substanciaVal && corVal && odorVal) {
      return `Material ${substanciaVal.toLowerCase()} de cor ${corVal.toLowerCase()}, com odor ${odorVal.toLowerCase()}.`;
    }
    if (substanciaVal && corVal) {
      return `Material ${substanciaVal.toLowerCase()} de cor ${corVal.toLowerCase()}.`;
    }
    // Adicione mais combinações ou retorne um valor padrão se necessário
    return "";
  };

  // Efeito para sincronizar as props da Droga 1 (PAI -> FILHO)
  useEffect(() => {
    setInternalDrugs(currentDrugs => {
      const firstDrug = currentDrugs[0];
      if (!firstDrug) return currentDrugs; // Segurança, mas deve sempre existir

      // Se as props relevantes da Droga 1 mudaram, atualize-a.
      // E recalcule seus indicios se não for uma mudança direta na prop 'indicios'.
      let updatedIndiciosForFirstDrug = indicios; // Começa com a prop do pai

      // Verifica se houve uma mudança em substancia, cor ou odor da Droga 1 (vindas das props)
      // E se essas mudanças são diferentes do que já está na Droga 1
      // para evitar recalcular indicios desnecessariamente se apenas a prop `indicios` mudou.
      if (
        (firstDrug.substancia !== substancia ||
         firstDrug.cor !== cor ||
         firstDrug.odor !== odor) &&
        // Se a prop 'indicios' não é a causa da mudança, ou se ela está vazia e pode ser gerada
        (indicios === firstDrug.indicios || indicios === "" || firstDrug.indicios === generateIndiciosDescription(firstDrug.substancia, firstDrug.cor, firstDrug.odor))
      ) {
         // Não sobrescreve se `indicios` da prop do pai já tem um valor customizado
         // A menos que `generateIndiciosDescription` produza o mesmo valor de `indicios` da prop,
         // ou se a prop `indicios` esteja vazia, permitindo a geração.
         // Esta condição é para evitar que uma mudança em `substancia` (prop)
         // sobrescreva uma `indicios` (prop) que foi editada manualmente no pai.
         const generatedIndicios = generateIndiciosDescription(substancia, cor, odor);
         if(indicios === "" || indicios === generateIndiciosDescription(firstDrug.substancia, firstDrug.cor, firstDrug.odor) || firstDrug.indicios === "") {
            updatedIndiciosForFirstDrug = generatedIndicios;
         }
      }


      const updatedFirstDrug = {
        ...firstDrug,
        quantidade,
        substancia,
        cor,
        odor,
        indicios: updatedIndiciosForFirstDrug,
        customMaterialDesc,
      };

      // Se a droga atualizada for diferente da que está no estado, atualize.
      if (JSON.stringify(updatedFirstDrug) !== JSON.stringify(firstDrug)) {
        return [updatedFirstDrug, ...currentDrugs.slice(1)];
      }
      return currentDrugs;
    });
  }, [quantidade, substancia, cor, odor, indicios, customMaterialDesc]);


  const addNewDrug = () => {
    const newDrugId = `drug-${Date.now()}`;
    const newDrug: DrugItem = {
      id: newDrugId,
      quantidade: "",
      substancia: "",
      cor: "",
      odor: "",
      indicios: "", // Inicia vazio, será preenchido se substancia/cor/odor forem definidos
      customMaterialDesc: ""
    };
    setInternalDrugs(prev => [...prev, newDrug]);
  };

  const removeDrug = (drugId: string) => {
    if (internalDrugs.length <= 1) return;
    setInternalDrugs(prev => prev.filter(drug => drug.id !== drugId));
  };

  const updateDrug = (drugId: string, field: keyof DrugItem, value: string) => {
    setInternalDrugs(prev =>
      prev.map(drug => {
        if (drug.id === drugId) {
          const updatedDrug = { ...drug, [field]: value };

          // SE o campo alterado NÃO FOR 'indicios' DIRETAMENTE,
          // E FOR um dos campos que compõem os indícios (substancia, cor, odor),
          // ENTÃO recalcula os indicios para ESTA droga.
          if (field !== 'indicios' && ['substancia', 'cor', 'odor'].includes(field)) {
            updatedDrug.indicios = generateIndiciosDescription(
              updatedDrug.substancia,
              updatedDrug.cor,
              updatedDrug.odor
            );
          }
          // Se o campo alterado for 'indicios', o valor 'value' (manual) já foi atribuído acima.

          // Sincroniza com o PAI APENAS para a Droga 1
          if (drugId === "drug-1" && setIndicios) {
            switch (field) {
              case 'quantidade': setQuantidade(value); break;
              case 'substancia':
                setSubstancia(value);
                setIndicios(updatedDrug.indicios); // Atualiza indicios no pai com o valor gerado/manual
                break;
              case 'cor':
                setCor(value);
                setIndicios(updatedDrug.indicios); // Atualiza indicios no pai
                break;
              case 'odor':
                setOdor(value);
                setIndicios(updatedDrug.indicios); // Atualiza indicios no pai
                break;
              case 'indicios': // Se indicios foi editado manualmente
                setIndicios(value); // Atualiza indicios no pai com o valor manual
                break;
              case 'customMaterialDesc': setCustomMaterialDesc(value); break;
            }
          }
          return updatedDrug;
        }
        return drug;
      })
    );
  };

  const shouldShowDescriptionFor = (drug: DrugItem, index: number): boolean => {
    if (index === 0) {
      return isUnknownMaterial && drug.substancia !== "" && drug.cor !== "";
    }
    const isKnownCombination = drug.substancia === 'Vegetal' && drug.cor === 'Verde';
    return drug.substancia !== "" && drug.cor !== "" && !isKnownCombination;
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
                  onValueChange={(val) => updateDrug(drug.id, 'substancia', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de substância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vegetal">Vegetal</SelectItem>
                    <SelectItem value="Artificial">Artificial</SelectItem>
                    {/* Adicione mais opções se necessário */}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`cor-${drug.id}`}>Cor *</Label>
                <Select
                  value={drug.cor}
                  onValueChange={(val) => updateDrug(drug.id, 'cor', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cor da substância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Verde">Verde</SelectItem>
                    <SelectItem value="Amarelada">Amarelada</SelectItem>
                    <SelectItem value="Branca">Branca</SelectItem>
                     {/* Adicione mais opções se necessário */}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`odor-${drug.id}`}>Odor *</Label>
                <Select
                  value={drug.odor}
                  onValueChange={(val) => updateDrug(drug.id, 'odor', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o odor da substância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Característico">Característico</SelectItem>
                    <SelectItem value="Forte">Forte</SelectItem>
                    <SelectItem value="Suave">Suave</SelectItem>
                    {/* Adicione mais opções se necessário */}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`indicios-${drug.id}`}>Indícios</Label>
                <Input
                  id={`indicios-${drug.id}`}
                  placeholder="Descreva os indícios encontrados" // ou "Gerado automaticamente"
                  value={drug.indicios} // Sempre reflete o estado interno de 'indicios' da droga
                  onChange={e => updateDrug(drug.id, 'indicios', e.target.value)}
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
