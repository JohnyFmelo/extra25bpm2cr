import React from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FilePlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BasicInformationTabProps {
  tcoNumber: string;
  setTcoNumber: (value: string) => void;
  dataFato: string;
  setDataFato: (value: string) => void;
  horaFato: string;
  setHoraFato: (value: string) => void;
  municipio: string;
  setMunicipio: (value: string) => void;
  bairro: string;
  setBairro: (value: string) => void;
  endereco: string;
  setEndereco: (value: string) => void;
  complemento: string;
  setComplemento: (value: string) => void;
  dataAudiencia: string;
  setDataAudiencia: (value: string) => void;
  horaAudiencia: string;
  setHoraAudiencia: (value: string) => void;
  customNatureza: string;
  setCustomNatureza: (value: string) => void;
  municipios?: string[];
  natureza: string;
  setNatureza: (value: string) => void;
}

const BasicInformationTab: React.FC<BasicInformationTabProps> = ({
  tcoNumber, setTcoNumber,
  dataFato, setDataFato,
  horaFato, setHoraFato,
  municipio, setMunicipio,
  bairro, setBairro,
  endereco, setEndereco,
  complemento, setComplemento,
  dataAudiencia, setDataAudiencia,
  horaAudiencia, setHoraAudiencia,
  customNatureza, setCustomNatureza,
  municipios = [],
  natureza, setNatureza,
}) => {
  // Handle TCO number to ensure only digits are allowed
  const handleTcoNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Filter out non-numeric characters
    const numericValue = e.target.value.replace(/\D/g, '');
    
    // Normalize the number (remove leading zeros but keep a single zero)
    const normalizedValue = numericValue === '' ? '' : String(parseInt(numericValue, 10) || '0');
    
    setTcoNumber(normalizedValue);
  };

  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FilePlus className="mr-2 h-5 w-5" />
          DADOS BÁSICOS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Reorganized layout with TCO number beside nature selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TCO Number - Resized and accepts only numbers */}
            <div className="w-full">
              <Label htmlFor="tcoNumber">Número do TCO *</Label>
              <Input
                id="tcoNumber"
                className="w-full"
                placeholder="Apenas números"
                value={tcoNumber}
                onChange={handleTcoNumberChange}
                inputMode="numeric"
                maxLength={6}
              />
            </div>
            
            {/* Nature selection - takes 2/3 of the space */}
            <div className="w-full md:col-span-2">
              <Label htmlFor="natureza">Natureza *</Label>
              <Select value={natureza} onValueChange={setNatureza}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a natureza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lesão corporal leve">Lesão corporal leve</SelectItem>
                  <SelectItem value="Vias de fato">Vias de fato</SelectItem>
                  <SelectItem value="Ameaça">Ameaça</SelectItem>
                  <SelectItem value="Porte de drogas para consumo">Porte de drogas para consumo</SelectItem>
                  <SelectItem value="Contravenções Penais">Contravenções Penais</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Custom nature input - only show if "Outros" is selected */}
          {natureza === "Outros" && (
            <div>
              <Label htmlFor="customNatureza">Especifique a natureza *</Label>
              <Input
                id="customNatureza"
                placeholder="Digite a natureza específica"
                value={customNatureza}
                onChange={(e) => setCustomNatureza(e.target.value)}
              />
            </div>
          )}

          {/* Date and time section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataFato">Data do fato *</Label>
              <Input
                id="dataFato"
                type="date"
                placeholder="DD/MM/AAAA"
                value={dataFato}
                onChange={(e) => setDataFato(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="horaFato">Hora do fato *</Label>
              <Input
                id="horaFato"
                type="time"
                placeholder="HH:MM"
                value={horaFato}
                onChange={(e) => setHoraFato(e.target.value)}
              />
            </div>
          </div>

          {/* Location section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="municipio">Município *</Label>
              <Select value={municipio} onValueChange={setMunicipio}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o município" />
                </SelectTrigger>
                <SelectContent>
                  {municipios.length > 0 ? (
                    municipios.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Várzea Grande">Várzea Grande</SelectItem>
                      <SelectItem value="Cuiabá">Cuiabá</SelectItem>
                      <SelectItem value="Rondonópolis">Rondonópolis</SelectItem>
                      <SelectItem value="Sinop">Sinop</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                placeholder="Digite o bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="endereco">Endereço *</Label>
            <Input
              id="endereco"
              placeholder="Digite o endereço"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              placeholder="Digite o complemento"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
            />
          </div>

          {/* Court hearing section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataAudiencia">Data de apresentação ao JEC *</Label>
              <Input
                id="dataAudiencia"
                type="date"
                placeholder="DD/MM/AAAA"
                value={dataAudiencia}
                onChange={(e) => setDataAudiencia(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="horaAudiencia">Hora de apresentação ao JEC *</Label>
              <Input
                id="horaAudiencia"
                type="time"
                placeholder="HH:MM"
                value={horaAudiencia}
                onChange={(e) => setHoraAudiencia(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};

export default BasicInformationTab;
