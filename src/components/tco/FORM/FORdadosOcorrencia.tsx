import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, CalendarClock, ShieldCheck, Users } from "lucide-react";

interface FORdadosOcorrenciaProps {
  natureza: string; // Para exibir
  tipificacao: string;
  setTipificacao: (value: string) => void;
  isCustomNatureza: boolean; // natureza === "Outros"
  customNatureza: string; // Para exibir
  dataFato: string;
  setDataFato: (value: string) => void;
  horaFato: string;
  setHoraFato: (value: string) => void;
  dataInicioRegistro: string; // Apenas para display, não editável aqui
  horaInicioRegistro: string; // Apenas para display, não editável aqui
  // dataTerminoRegistro: string; // Será setado no submit
  // horaTerminoRegistro: string; // Será setado no submit
  localFato: string;
  setLocalFato: (value: string) => void;
  endereco: string;
  setEndereco: (value: string) => void;
  municipio: string; // Não editável, fixo
  comunicante: string;
  setComunicante: (value: string) => void;
  guarnicao: string;
  setGuarnicao: (value: string) => void;
  operacao: string;
  setOperacao: (value: string) => void;
  condutorNome: string; // Display only
  condutorPosto: string; // Display only
  condutorRg: string; // Display only
}

const FORdadosOcorrencia: React.FC<FORdadosOcorrenciaProps> = ({
  natureza, tipificacao, setTipificacao, isCustomNatureza, customNatureza,
  dataFato, setDataFato, horaFato, setHoraFato,
  dataInicioRegistro, horaInicioRegistro,
  localFato, setLocalFato, endereco, setEndereco, municipio,
  comunicante, setComunicante, guarnicao, setGuarnicao,
  operacao, setOperacao,
  condutorNome, condutorPosto, condutorRg
}) => {
  const displayNatureza = isCustomNatureza ? customNatureza : natureza;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Informações Gerais da Ocorrência</CardTitle>
        <CardDescription>Detalhes sobre o fato, local, data e equipe policial.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center"><ShieldCheck className="mr-2 text-blue-600" /> Tipificação e Natureza</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Natureza da Ocorrência (Confirmada)</Label>
              <Input value={displayNatureza} readOnly disabled />
            </div>
            <div>
              <Label htmlFor="tipificacao">Tipificação Legal</Label>
              <Textarea id="tipificacao" value={tipificacao} onChange={(e) => setTipificacao(e.target.value)} placeholder="Ex: Art. 147 do Código Penal" disabled={!isCustomNatureza} />
              {!isCustomNatureza && <p className="text-xs text-muted-foreground mt-1">Preenchido automaticamente. Edite apenas se a natureza for "Outros".</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center"><CalendarClock className="mr-2 text-blue-600" /> Data e Hora</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataFato">Data do Fato</Label>
              <Input id="dataFato" type="date" value={dataFato} onChange={(e) => setDataFato(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="horaFato">Hora do Fato</Label>
              <Input id="horaFato" type="time" value={horaFato} onChange={(e) => setHoraFato(e.target.value)} />
            </div>
            <div>
              <Label>Data Início do Registro</Label>
              <Input type="date" value={dataInicioRegistro} readOnly disabled />
            </div>
            <div>
              <Label>Hora Início do Registro</Label>
              <Input type="time" value={horaInicioRegistro} readOnly disabled />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center"><MapPin className="mr-2 text-blue-600" /> Localização</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="localFato">Local do Fato</Label>
              <Input id="localFato" value={localFato} onChange={(e) => setLocalFato(e.target.value)} placeholder="Ex: Residência, Via pública, Comércio" />
            </div>
            <div>
              <Label>Município</Label>
              <Input value={municipio} readOnly disabled />
            </div>
          </div>
          <div>
            <Label htmlFor="endereco">Endereço Completo</Label>
            <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, Número, Bairro, Ponto de Referência" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center"><Users className="mr-2 text-blue-600" /> Equipe e Acionamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="comunicante">Comunicante/Acionamento</Label>
              <Input id="comunicante" value={comunicante} onChange={(e) => setComunicante(e.target.value)} placeholder="Ex: CIOSP, Vítima no local" />
            </div>
            <div>
              <Label htmlFor="guarnicaoPM">Viatura/Guarnição Responsável</Label>
              <Input id="guarnicaoPM" value={guarnicao} onChange={(e) => setGuarnicao(e.target.value)} placeholder="Ex: VTR 3.9012" />
            </div>
            <div>
              <Label htmlFor="operacao">Operação Policial (se houver)</Label>
              <Input id="operacao" value={operacao} onChange={(e) => setOperacao(e.target.value)} placeholder="Ex: Operação Sossego" />
            </div>
          </div>
          {condutorNome && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p><strong>Condutor/Chefe de Guarnição (1º da lista):</strong> {condutorPosto} {condutorNome} - RG: {condutorRg || "Não informado"}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FORdadosOcorrencia;
