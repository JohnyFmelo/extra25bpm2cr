
import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ApreensaoTabProps {
  houveApreensao: string;
  setHouveApreensao: (value: string) => void;
  descricaoApreensao: string;
  setDescricaoApreensao: (value: string) => void;
}

const ApreensaoTab: React.FC<ApreensaoTabProps> = ({
  houveApreensao,
  setHouveApreensao,
  descricaoApreensao,
  setDescricaoApreensao,
}) => {
  return (
    <div className="space-y-4">
      <div className="mt-2 p-4 border rounded-md bg-white">
        <Label className="font-bold mb-2 block">Houve apreensão?</Label>
        <RadioGroup value={houveApreensao} onValueChange={setHouveApreensao} className="mt-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="apreensao-sim" />
            <Label htmlFor="apreensao-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="apreensao-nao" />
            <Label htmlFor="apreensao-nao">Não</Label>
          </div>
        </RadioGroup>
      </div>

      {houveApreensao === "sim" && (
        <div className="p-4 border rounded-md bg-white">
          <Label htmlFor="descricaoApreensao" className="font-bold mb-2 block">Descrição do Material Apreendido</Label>
          <Textarea
            id="descricaoApreensao"
            placeholder="Descreva detalhadamente o material apreendido"
            value={descricaoApreensao}
            onChange={(e) => setDescricaoApreensao(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      )}
    </div>
  );
};

export default ApreensaoTab;
