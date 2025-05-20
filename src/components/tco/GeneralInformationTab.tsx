
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface GeneralInformationTabProps {
  natureza: string;
  tipificacao: string;
  setTipificacao: (value: string) => void;
  isCustomNatureza: boolean;
  customNatureza?: string;
  dataFato: string;
  setDataFato: (value: string) => void;
  horaFato: string;
  setHoraFato: (value: string) => void;
  dataInicioRegistro: string;
  horaInicioRegistro: string;
  dataTerminoRegistro: string;
  horaTerminoRegistro: string;
  localFato: string;
  setLocalFato: (value: string) => void;
  endereco: string;
  setEndereco: (value: string) => void;
  municipio: string;
  comunicante: string;
  setComunicante: (value: string) => void;
  guarnicao: string;
  setGuarnicao: (value: string) => void;
  operacao: string;
  setOperacao: (value: string) => void;
  condutorNome: string;
  condutorPosto: string;
  condutorRg: string;
}

const GeneralInformationTab: React.FC<GeneralInformationTabProps> = ({
  natureza,
  tipificacao,
  setTipificacao,
  isCustomNatureza,
  customNatureza,
  dataFato,
  setDataFato,
  horaFato,
  setHoraFato,
  dataInicioRegistro,
  horaInicioRegistro,
  dataTerminoRegistro,
  horaTerminoRegistro,
  localFato,
  setLocalFato,
  endereco,
  setEndereco,
  municipio,
  comunicante,
  setComunicante,
  guarnicao,
  setGuarnicao,
  operacao,
  setOperacao,
  condutorNome,
  condutorPosto,
  condutorRg
}) => {
  // Mostrar o nome da natureza adequado (natureza padrão ou customizada)
  const displayNatureza = isCustomNatureza ? customNatureza || "[PERSONALIZADA]" : natureza;

  return (
    <div className="space-y-6 px-[6px]">
      {/* Tipificação Legal e Pena */}
      <div className="grid gap-4 md:grid-cols-1">
        <div>
          <Label htmlFor="tipificacao" className="font-bold">
            Tipificação Legal {isCustomNatureza && "- Preencha para natureza personalizada"}
          </Label>
          <Textarea
            id="tipificacao"
            value={tipificacao}
            onChange={(e) => setTipificacao(e.target.value)}
            rows={2}
            className={cn(
              "mt-1 resize-none",
              isCustomNatureza ? "border-blue-400 focus:border-blue-600" : ""
            )}
            placeholder={isCustomNatureza ? "Digite a tipificação legal completa..." : ""}
          />
        </div>
        
        {/* Oculta a Pena quando natureza for "Outros" */}
        {natureza !== "Outros" && (
          <div>
            <Label htmlFor="pena" className="font-bold">
              Pena
            </Label>
            <Textarea
              id="pena"
              value={tipificacao ? "PENA: DETENÇÃO DE X A Y..." : ""}
              readOnly
              rows={2}
              className="mt-1 bg-gray-50 resize-none"
              placeholder="A pena será exibida automaticamente com base na tipificação."
            />
          </div>
        )}
      </div>

      {/* Data, Hora e Local do Fato */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="dataFato" className="font-bold">
            Data do Fato
          </Label>
          <Input
            id="dataFato"
            type="date"
            value={dataFato}
            onChange={(e) => setDataFato(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="horaFato" className="font-bold">
            Hora do Fato
          </Label>
          <Input
            id="horaFato"
            type="time"
            value={horaFato}
            onChange={(e) => setHoraFato(e.target.value)}
            className="mt-1"
            required
          />
        </div>
      </div>

      {/* Início e Término do Registro */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="dataInicioRegistro" className="font-bold">
            Data de Início do Registro
          </Label>
          <Input
            id="dataInicioRegistro"
            type="date"
            value={dataInicioRegistro}
            readOnly
            className="mt-1 bg-gray-50"
          />
        </div>
        <div>
          <Label htmlFor="horaInicioRegistro" className="font-bold">
            Hora de Início do Registro
          </Label>
          <Input
            id="horaInicioRegistro"
            type="time"
            value={horaInicioRegistro}
            readOnly
            className="mt-1 bg-gray-50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="dataTerminoRegistro" className="font-bold">
            Data de Término do Registro
          </Label>
          <Input
            id="dataTerminoRegistro"
            type="date"
            value={dataTerminoRegistro}
            readOnly
            className="mt-1 bg-gray-50"
            placeholder="Preenchido automaticamente"
          />
        </div>
        <div>
          <Label htmlFor="horaTerminoRegistro" className="font-bold">
            Hora de Término do Registro
          </Label>
          <Input
            id="horaTerminoRegistro"
            type="time"
            value={horaTerminoRegistro}
            readOnly
            className="mt-1 bg-gray-50"
            placeholder="Preenchido automaticamente"
          />
        </div>
      </div>

      {/* Local do Fato e Endereço */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="localFato" className="font-bold">
            Local do Fato
          </Label>
          <Input
            id="localFato"
            value={localFato}
            onChange={(e) => setLocalFato(e.target.value)}
            className="mt-1"
            placeholder="Ex: Residência, Via Pública, Estabelecimento Comercial..."
          />
        </div>
        <div>
          <Label htmlFor="endereco" className="font-bold">
            Endereço
          </Label>
          <Textarea
            id="endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="mt-1"
            placeholder="Logradouro, número, bairro..."
          />
        </div>
      </div>

      {/* Município e Meio de Acionamento */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="municipio" className="font-bold">
            Município
          </Label>
          <Input
            id="municipio"
            value={municipio}
            readOnly
            className="mt-1 bg-gray-50"
          />
        </div>
        <div>
          <Label htmlFor="comunicante" className="font-bold">
            Meio de Acionamento
          </Label>
          <Input
            id="comunicante"
            value={comunicante}
            onChange={(e) => setComunicante(e.target.value)}
            className="mt-1"
            placeholder="Ex: CIOSP, 190, Denúncia anônima..."
          />
        </div>
      </div>

      {/* Guarnição e Operação */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="guarnicao" className="font-bold">
            Guarnição
          </Label>
          <Input
            id="guarnicao"
            value={guarnicao}
            onChange={(e) => setGuarnicao(e.target.value)}
            className="mt-1"
            placeholder="Ex: RP-3022, PPE-223..."
          />
        </div>
        <div>
          <Label htmlFor="operacao" className="font-bold">
            Operação (Se houver)
          </Label>
          <Input
            id="operacao"
            value={operacao}
            onChange={(e) => setOperacao(e.target.value)}
            className="mt-1"
            placeholder="Ex: Operação Impacto, Operação Saturação..."
          />
        </div>
      </div>

      {/* Informações do Condutor (Somente leitura) */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h4 className="font-bold mb-2">Condutor da Ocorrência</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="condutorNome">Nome</Label>
            <Input
              id="condutorNome"
              value={condutorNome}
              readOnly
              className="mt-1 bg-gray-100"
              placeholder="Definido na seção de Guarnição"
            />
          </div>
          <div>
            <Label htmlFor="condutorPosto">Posto/Graduação</Label>
            <Input
              id="condutorPosto"
              value={condutorPosto}
              readOnly
              className="mt-1 bg-gray-100"
              placeholder="Definido na seção de Guarnição"
            />
          </div>
          <div>
            <Label htmlFor="condutorRg">RG PM</Label>
            <Input
              id="condutorRg"
              value={condutorRg}
              readOnly
              className="mt-1 bg-gray-100"
              placeholder="Definido na seção de Guarnição"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralInformationTab;
