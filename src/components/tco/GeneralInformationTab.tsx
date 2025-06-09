
import React, { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GeneralInformationTabProps {
  natureza: string;
  setNatureza: (value: string) => void;
  tipificacao: string;
  setTipificacao: (value: string) => void;
  isCustomNatureza: boolean;
  setIsCustomNatureza: (value: boolean) => void;
  customNatureza: string;
  setCustomNatureza: (value: string) => void;
  dataFato: string;
  setDataFato: (value: string) => void;
  horaFato: string;
  setHoraFato: (value: string) => void;
  localFato: string;
  setLocalFato: (value: string) => void;
  municipio: string;
  setMunicipio: (value: string) => void;
  observacoes: string;
  setObservacoes: (value: string) => void;
  flagranteDelito: string;
  setFlagranteDelito: (value: string) => void;
  juizadoEspecialData: string;
  setJuizadoEspecialData: (value: string) => void;
  juizadoEspecialHora: string;
  setJuizadoEspecialHora: (value: string) => void;
  condutorNome: string;
  setCondutorNome: (value: string) => void;
  condutorPosto: string;
  setCondutorPosto: (value: string) => void;
  condutorRg: string;
  setCondutorRg: (value: string) => void;
  horaInicioRegistro: string;
  setHoraInicioRegistro: (value: string) => void;
}

const naturezasDisponiveis = [
  "Vias de fato",
  "Ameaça",
  "Lesão corporal",
  "Porte de drogas para consumo",
  "Perturbação do trabalho ou do sossego alheios",
  "Outros"
];

const tipificacoesLegais: { [key: string]: string } = {
  "Vias de fato": "Art. 21 da Lei de Contravenções Penais (Decreto-Lei nº 3.688/1941)",
  "Ameaça": "Art. 147 do Código Penal",
  "Lesão corporal": "Art. 129 do Código Penal",
  "Porte de drogas para consumo": "Art. 28 da Lei nº 11.343/2006",
  "Perturbação do trabalho ou do sossego alheios": "Art. 42 da Lei de Contravenções Penais (Decreto-Lei nº 3.688/1941)",
  "Outros": ""
};

export const GeneralInformationTab: React.FC<GeneralInformationTabProps> = ({
  natureza,
  setNatureza,
  tipificacao,
  setTipificacao,
  isCustomNatureza,
  setIsCustomNatureza,
  customNatureza,
  setCustomNatureza,
  dataFato,
  setDataFato,
  horaFato,
  setHoraFato,
  localFato,
  setLocalFato,
  municipio,
  setMunicipio,
  observacoes,
  setObservacoes,
  flagranteDelito,
  setFlagranteDelito,
  juizadoEspecialData,
  setJuizadoEspecialData,
  juizadoEspecialHora,
  setJuizadoEspecialHora,
  condutorNome,
  setCondutorNome,
  condutorPosto,
  setCondutorPosto,
  condutorRg,
  setCondutorRg,
  horaInicioRegistro,
  setHoraInicioRegistro
}) => {
  // Registra automaticamente a hora de início quando o componente é montado
  useEffect(() => {
    if (!horaInicioRegistro) {
      const agora = new Date();
      const horaFormatada = agora.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setHoraInicioRegistro(horaFormatada);
    }
  }, [horaInicioRegistro, setHoraInicioRegistro]);

  const handleNaturezaChange = (value: string) => {
    setNatureza(value);
    setIsCustomNatureza(value === "Outros");
    
    // Atualiza automaticamente a tipificação legal
    if (value !== "Outros") {
      setTipificacao(tipificacoesLegais[value] || "");
      setCustomNatureza("");
    } else {
      setTipificacao("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="natureza">Natureza da Ocorrência</Label>
          <Select value={natureza} onValueChange={handleNaturezaChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a natureza" />
            </SelectTrigger>
            <SelectContent>
              {naturezasDisponiveis.map((nat) => (
                <SelectItem key={nat} value={nat}>
                  {nat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isCustomNatureza && (
          <div>
            <Label htmlFor="customNatureza">Especifique a Natureza</Label>
            <Input
              id="customNatureza"
              value={customNatureza}
              onChange={(e) => setCustomNatureza(e.target.value)}
              placeholder="Digite a natureza específica"
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="tipificacao">Tipificação Legal</Label>
        <Textarea
          id="tipificacao"
          value={tipificacao}
          onChange={(e) => setTipificacao(e.target.value)}
          placeholder="Tipificação legal será preenchida automaticamente ou digite manualmente"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dataFato">Data do Fato</Label>
          <Input
            id="dataFato"
            type="date"
            value={dataFato}
            onChange={(e) => setDataFato(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="horaFato">Hora do Fato</Label>
          <Input
            id="horaFato"
            type="time"
            value={horaFato}
            onChange={(e) => setHoraFato(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="localFato">Local do Fato</Label>
        <Input
          id="localFato"
          value={localFato}
          onChange={(e) => setLocalFato(e.target.value)}
          placeholder="Endereço completo onde ocorreu o fato"
        />
      </div>

      <div>
        <Label htmlFor="municipio">Município</Label>
        <Input
          id="municipio"
          value={municipio}
          onChange={(e) => setMunicipio(e.target.value)}
          placeholder="Município onde ocorreu o fato"
        />
      </div>

      <div>
        <Label htmlFor="flagranteDelito">Flagrante Delito</Label>
        <Select value={flagranteDelito} onValueChange={setFlagranteDelito}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Sim">Sim</SelectItem>
            <SelectItem value="Não">Não</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="juizadoEspecialData">Data de Apresentação no Juizado</Label>
          <Input
            id="juizadoEspecialData"
            type="date"
            value={juizadoEspecialData}
            onChange={(e) => setJuizadoEspecialData(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="juizadoEspecialHora">Hora de Apresentação no Juizado</Label>
          <Input
            id="juizadoEspecialHora"
            type="time"
            value={juizadoEspecialHora}
            onChange={(e) => setJuizadoEspecialHora(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="horaInicioRegistro">Hora de Início do Registro</Label>
        <Input
          id="horaInicioRegistro"
          type="time"
          value={horaInicioRegistro}
          onChange={(e) => setHoraInicioRegistro(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="condutorNome">Nome do Condutor</Label>
          <Input
            id="condutorNome"
            value={condutorNome}
            onChange={(e) => setCondutorNome(e.target.value)}
            placeholder="Nome do condutor da ocorrência"
          />
        </div>

        <div>
          <Label htmlFor="condutorPosto">Posto/Graduação</Label>
          <Input
            id="condutorPosto"
            value={condutorPosto}
            onChange={(e) => setCondutorPosto(e.target.value)}
            placeholder="Posto ou graduação"
          />
        </div>

        <div>
          <Label htmlFor="condutorRg">RG PMMT</Label>
          <Input
            id="condutorRg"
            value={condutorRg}
            onChange={(e) => setCondutorRg(e.target.value)}
            placeholder="RG da Polícia Militar"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações adicionais sobre a ocorrência"
          rows={4}
        />
      </div>
    </div>
  );
};
