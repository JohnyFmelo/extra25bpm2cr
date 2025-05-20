
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ComponenteGuarnicaoFieldsProps {
  rg: string;
  setRg: (value: string) => void;
  nome: string;
  setNome: (value: string) => void;
  posto: string;
  setPosto: (value: string) => void;
  isOptional?: boolean;
}

const ComponenteGuarnicaoFields: React.FC<ComponenteGuarnicaoFieldsProps> = ({
  rg,
  setRg,
  nome,
  setNome,
  posto,
  setPosto,
  isOptional = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="posto">
          Posto/Graduação{!isOptional && " *"}
        </Label>
        <Input
          id="posto"
          placeholder="SD, CB, SGT, TEN, CAP..."
          value={posto}
          onChange={(e) => setPosto(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="nome">
          Nome Completo{!isOptional && " *"}
        </Label>
        <Input
          id="nome"
          placeholder="Nome do policial"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="rg">
          RG PM{!isOptional && " *"}
          {isOptional && <span className="text-xs text-gray-500 ml-1">(opcional)</span>}
        </Label>
        <Input
          id="rg"
          placeholder="RG do policial"
          value={rg}
          onChange={(e) => setRg(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ComponenteGuarnicaoFields;
