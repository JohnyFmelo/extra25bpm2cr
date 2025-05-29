
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OperacoesManager from "./OperacoesManager";

interface GeneralInformationTabProps {
  natureza: string;
  tipificacao: string;
  setTipificacao: (value: string) => void;
  isCustomNatureza: boolean;
  customNatureza: string;
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
  condutorNome: string;
  condutorPosto: string;
  condutorRg: string;
  guarnicao: string;
  setGuarnicao: (value: string) => void;
  operacao: string;
  setOperacao: (value: string) => void;
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
  condutorNome,
  condutorPosto,
  condutorRg,
  guarnicao,
  setGuarnicao,
  operacao,
  setOperacao
}) => {
  const displayNatureza = isCustomNatureza ? customNatureza || "Outros" : natureza;

  // Set default time to current time if empty
  useEffect(() => {
    if (!horaFato) {
      const now = new Date();
      setHoraFato(now.toTimeString().slice(0, 5));
    }
  }, [horaFato, setHoraFato]);

  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center">Dados da Ocorrência</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-[5px]">
        <div>
          <Label htmlFor="naturezaOcorrencia">NATUREZA DA OCORRÊNCIA</Label>
          {isCustomNatureza ? <Input id="naturezaOcorrencia" placeholder="Informe a natureza da ocorrência" value={customNatureza} /> : <Input id="naturezaOcorrencia" readOnly value={displayNatureza} />}
        </div>
        
        <div>
          <Label htmlFor="tipificacaoLegal">TIPIFICAÇÃO LEGAL</Label>
          {isCustomNatureza ? <Input id="tipificacaoLegal" placeholder="Informe a tipificação legal" value={tipificacao} onChange={e => setTipificacao(e.target.value)} /> : <Input id="tipificacaoLegal" readOnly value={tipificacao} />}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dataFato">DATA DO FATO</Label>
            <Input id="dataFato" type="date" value={dataFato} onChange={e => setDataFato(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="horaFato">HORA DO FATO</Label>
            <Input id="horaFato" type="time" value={horaFato} onChange={e => setHoraFato(e.target.value)} />
          </div>
        </div>
        
        {/* Hidden registration date/time fields - they exist but are not displayed to users */}
        <input type="hidden" id="dataInicioRegistro" value={dataInicioRegistro} />
        <input type="hidden" id="horaInicioRegistro" value={horaInicioRegistro} />
        <input type="hidden" id="dataTerminoRegistro" value={dataTerminoRegistro} />
        <input type="hidden" id="horaTerminoRegistro" value={horaTerminoRegistro} />
        
        <div>
          <Label htmlFor="localFato">LOCAL DO FATO</Label>
          <Input id="localFato" placeholder="RESIDENCIA, VIA PÚBLICA, PRAÇA..." value={localFato} onChange={e => setLocalFato(e.target.value)} />
        </div>
        
        <div>
          <Label htmlFor="endereco">ENDEREÇO</Label>
          <Input id="endereco" placeholder="RUA, NÚMERO/QUADRA/LOTE, BAIRRO, COORDENADAS" value={endereco} onChange={e => setEndereco(e.target.value)} />
        </div>
        
        <div>
          <Label htmlFor="municipio">MUNICÍPIO</Label>
          <Input id="municipio" readOnly value={municipio} />
        </div>
        
        <div>
          <Label htmlFor="comunicante">COMUNICANTE</Label>
          <Select value={comunicante} onValueChange={setComunicante}>
            <SelectTrigger id="comunicante">
              <SelectValue placeholder="Selecione o comunicante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CIOSP">CIOSP</SelectItem>
              <SelectItem value="Adjunto">Adjunto</SelectItem>
              <SelectItem value="Patrulhamento">Patrulhamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="guarnicao">GUARNIÇÃO</Label>
          <Input id="guarnicao" placeholder="Ex: Viatura Duster ABC-1234" value={guarnicao} onChange={e => setGuarnicao(e.target.value)} />
        </div>

        <OperacoesManager 
          onSelectOperacao={setOperacao}
          valorAtual={operacao}
        />
      </CardContent>
    </Card>;
};

export default GeneralInformationTab;
