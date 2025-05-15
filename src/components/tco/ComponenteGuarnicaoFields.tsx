
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ComponenteGuarnicaoFieldsProps {
  data: {
    nome: string;
    posto: string;
    rg: string;
  };
  onChangeHandler: (index: number, field: string, value: string) => void;
  index: number;
}

const ComponenteGuarnicaoFields: React.FC<ComponenteGuarnicaoFieldsProps> = ({ 
  data, 
  onChangeHandler, 
  index 
}) => (
  <div className="space-y-4 border p-4 rounded-md border-green-200 bg-green-50/30 hover:border-green-300 transition-colors duration-200">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor={`componente_nome_${index}`} className="text-green-700">Nome completo</Label>
        <Input 
          id={`componente_nome_${index}`} 
          value={data.nome} 
          onChange={(e) => onChangeHandler(index, 'nome', e.target.value)}
          className="border-green-200 focus:border-green-500 focus:ring-green-500"
        />
      </div>
      
      <div>
        <Label htmlFor={`componente_posto_${index}`} className="text-green-700">Posto/Graduação</Label>
        <Input 
          id={`componente_posto_${index}`} 
          value={data.posto} 
          onChange={(e) => onChangeHandler(index, 'posto', e.target.value)}
          className="border-green-200 focus:border-green-500 focus:ring-green-500"
        />
      </div>
    </div>
    
    <div>
      <Label htmlFor={`componente_rg_${index}`} className="text-green-700">RG PMMT</Label>
      <Input 
        id={`componente_rg_${index}`} 
        value={data.rg} 
        onChange={(e) => onChangeHandler(index, 'rg', e.target.value)}
        className="border-green-200 focus:border-green-500 focus:ring-green-500"
      />
    </div>
  </div>
);

export default ComponenteGuarnicaoFields;
