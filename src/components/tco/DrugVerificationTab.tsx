import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface DrugVerificationTabProps {
  quantidade: string;
  setQuantidade: (value: string) => void;
  substancia: string;
  setSubstancia: (value: string) => void;
  cor: string;
  setCor: (value: string) => void;
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
  indicios,
  customMaterialDesc,
  setCustomMaterialDesc,
  isUnknownMaterial,
  lacreNumero,
  setLacreNumero
}) => {
  return (
    <Card>
      <CardHeader className="my-0 py-[8px]">
        <CardTitle className="py-[10px]">Constatação Preliminar de Droga</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 my-0 px-0 mx-0 py-0">
          <div>
            <Label htmlFor="quantidade">Porção (quantidade) *</Label>
            <Input
              id="quantidade"
              placeholder="Informe a quantidade (ex: 1 porção)"
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="substancia">Substância *</Label>
            <Select value={substancia} onValueChange={setSubstancia}>
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
            <Label htmlFor="cor">Cor *</Label>
            <Select value={cor} onValueChange={setCor}>
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
            <Label htmlFor="indicios">Indícios</Label>
            <Input id="indicios" value={indicios} readOnly className="bg-gray-100" />
          </div>

          {isUnknownMaterial && substancia !== "" && cor !== "" && (
            <div>
              <Label htmlFor="customMaterialDesc">Descrição do Material *</Label>
              <Textarea
                id="customMaterialDesc"
                placeholder="Descreva o tipo de material encontrado"
                value={customMaterialDesc}
                onChange={e => setCustomMaterialDesc(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <div>
            <Label htmlFor="lacreNumero">Número do Lacre *</Label>
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
