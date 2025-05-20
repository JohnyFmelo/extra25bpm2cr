
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, X, UserPlus } from "lucide-react";
import ComponenteGuarnicaoFields from "./ComponenteGuarnicaoFields";

interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
}

interface GuarnicaoTabProps {
  currentGuarnicaoList: ComponenteGuarnicao[];
  onAddPolicial: (policial: ComponenteGuarnicao) => void;
  onRemovePolicial: (index: number) => void;
  apoioList?: ComponenteGuarnicao[];
  onAddApoio?: (policial: ComponenteGuarnicao) => void;
  onRemoveApoio?: (index: number) => void;
}

const GuarnicaoTab: React.FC<GuarnicaoTabProps> = ({
  currentGuarnicaoList,
  onAddPolicial,
  onRemovePolicial,
  apoioList = [],
  onAddApoio,
  onRemoveApoio
}) => {
  const [newPolicial, setNewPolicial] = useState<ComponenteGuarnicao>({
    rg: "",
    nome: "",
    posto: ""
  });
  
  const [newApoio, setNewApoio] = useState<ComponenteGuarnicao>({
    rg: "",
    nome: "",
    posto: ""
  });

  const handleAddPolicial = () => {
    const trimmedRG = newPolicial.rg.trim();
    const trimmedNome = newPolicial.nome.trim();
    const trimmedPosto = newPolicial.posto.trim();
    
    if (!trimmedRG || !trimmedNome || !trimmedPosto) {
      return; // Não adiciona se os campos estiverem vazios
    }
    
    onAddPolicial({
      rg: trimmedRG,
      nome: trimmedNome,
      posto: trimmedPosto
    });
    
    setNewPolicial({
      rg: "",
      nome: "",
      posto: ""
    });
  };
  
  const handleAddApoio = () => {
    if (!onAddApoio) return;
    
    const trimmedRG = newApoio.rg.trim();
    const trimmedNome = newApoio.nome.trim();
    const trimmedPosto = newApoio.posto.trim();
    
    if (!trimmedRG && !trimmedNome && !trimmedPosto) {
      return; // Não adiciona se os campos estiverem vazios
    }
    
    onAddApoio({
      rg: trimmedRG || "-",
      nome: trimmedNome || "-",
      posto: trimmedPosto || "-"
    });
    
    setNewApoio({
      rg: "",
      nome: "",
      posto: ""
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 border">
        <div className="mb-4">
          <Label className="text-lg font-semibold">Guarnição Principal</Label>
          <p className="text-sm text-gray-500">Adicione os militares que assinam o TCO.</p>
        </div>
        
        <div className="space-y-4">
          <ComponenteGuarnicaoFields
            rg={newPolicial.rg}
            setRg={(value) => setNewPolicial({ ...newPolicial, rg: value })}
            nome={newPolicial.nome}
            setNome={(value) => setNewPolicial({ ...newPolicial, nome: value })}
            posto={newPolicial.posto}
            setPosto={(value) => setNewPolicial({ ...newPolicial, posto: value })}
          />
          
          <Button
            onClick={handleAddPolicial}
            className="w-full"
            type="button"
            disabled={!newPolicial.rg.trim() || !newPolicial.nome.trim() || !newPolicial.posto.trim()}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar à Guarnição Principal
          </Button>
        </div>
        
        {currentGuarnicaoList.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Militares Adicionados:</h3>
            <div className="space-y-2">
              {currentGuarnicaoList.map((policial, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded bg-gray-50">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-blue-600" />
                    <span>
                      <strong>{policial.posto}</strong> {policial.nome} (RG: {policial.rg})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemovePolicial(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
      
      {/* Seção de Militares de Apoio */}
      {onAddApoio && onRemoveApoio && (
        <Card className="p-4 border">
          <div className="mb-4">
            <Label className="text-lg font-semibold">Militares de Apoio</Label>
            <p className="text-sm text-gray-500">Adicione os militares que deram apoio (não assinam o TCO).</p>
          </div>
          
          <div className="space-y-4">
            <ComponenteGuarnicaoFields
              rg={newApoio.rg}
              setRg={(value) => setNewApoio({ ...newApoio, rg: value })}
              nome={newApoio.nome}
              setNome={(value) => setNewApoio({ ...newApoio, nome: value })}
              posto={newApoio.posto}
              setPosto={(value) => setNewApoio({ ...newApoio, posto: value })}
              isOptional={true}
            />
            
            <Button
              onClick={handleAddApoio}
              className="w-full bg-green-600 hover:bg-green-700"
              type="button"
              disabled={!newApoio.nome.trim() || !newApoio.posto.trim()}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar como Apoio
            </Button>
          </div>
          
          {apoioList.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Militares de Apoio Adicionados:</h3>
              <div className="space-y-2">
                {apoioList.map((policial, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded bg-green-50">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-green-600" />
                      <span>
                        <strong>{policial.posto}</strong> {policial.nome}
                        {policial.rg && policial.rg !== "-" ? ` (RG: ${policial.rg})` : ""}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveApoio(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default GuarnicaoTab;
