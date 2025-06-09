import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  setHoraInicioRegistro: (value: string) => void;
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

// Mapeamento de naturezas para tipificações
const naturezaTipificacoes: Record<string, string> = {
  "Ameaça": "ART. 147 DO CÓDIGO PENAL",
  "Vias de Fato": "ART. 21 DA LEI DE CONTRAVENÇÕES PENAIS",
  "Lesão Corporal": "ART. 129 DO CÓDIGO PENAL",
  "Dano": "ART. 163 DO CÓDIGO PENAL",
  "Injúria": "ART. 140 DO CÓDIGO PENAL",
  "Difamação": "ART. 139 DO CÓDIGO PENAL",
  "Calúnia": "ART. 138 DO CÓDIGO PENAL",
  "Perturbação do Sossego": "ART. 42 DA LEI DE CONTRAVENÇÕES PENAIS",
  "Porte de drogas para consumo": "ART. 28 DA LEI Nº 11.343/2006 (LEI DE DROGAS)",
  "Conduzir veículo sem CNH gerando perigo de dano": "ART. 309 DO CÓDIGO DE TRÂNSITO BRASILEIRO",
  "Entregar veículo automotor a pessoa não habilitada": "ART. 310 DO CÓDIGO DE TRÂNSITO BRASILEIRO",
  "Trafegar em velocidade incompatível com segurança": "ART. 311 DO CÓDIGO DE TRÂNSITO BRASILEIRO",
  "Omissão de socorro": "ART. 135 DO CÓDIGO PENAL",
  "Rixa": "ART. 137 DO CÓDIGO PENAL",
  "Invasão de domicílio": "ART. 150 DO CÓDIGO PENAL",
  "Fraude em comércio": "ART. 176 DO CÓDIGO PENAL",
  "Ato obsceno": "ART. 233 DO CÓDIGO PENAL",
  "Falsa identidade": "ART. 307 DO CÓDIGO PENAL",
  "Resistência": "ART. 329 DO CÓDIGO PENAL",
  "Desobediência": "ART. 330 DO CÓDIGO PENAL",
  "Desacato": "ART. 331 DO CÓDIGO PENAL",
  "Exercício arbitrário das próprias razões": "ART. 345 DO CÓDIGO PENAL",
};

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
  setHoraInicioRegistro,
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
  
  // Registrar horário de início automaticamente quando o componente é montado
  useEffect(() => {
    if (!horaInicioRegistro) {
      const agora = new Date();
      const horaAtual = agora.toTimeString().slice(0, 5); // HH:MM
      setHoraInicioRegistro(horaAtual);
    }
  }, [horaInicioRegistro, setHoraInicioRegistro]);
  
  // Função para calcular a tipificação baseada nas naturezas selecionadas
  const getTipificacaoCompleta = () => {
    if (!natureza) return "";
    
    // Se for natureza personalizada, usar a tipificação editável
    if (isCustomNatureza) {
      return tipificacao || "[TIPIFICAÇÃO LEGAL A SER INSERIDA]";
    }
    
    // Para naturezas múltiplas, dividir e mapear
    const naturezas = natureza.split(" + ");
    const tipificacoes = naturezas.map(nat => {
      return naturezaTipificacoes[nat.trim()] || "[TIPIFICAÇÃO NÃO MAPEADA]";
    });
    
    // Formato da tipificação: usar vírgulas e "E" apenas antes do último item
    if (tipificacoes.length === 1) {
      return tipificacoes[0];
    } else if (tipificacoes.length === 2) {
      return tipificacoes.join(" E ");
    } else if (tipificacoes.length > 2) {
      const ultimoItem = tipificacoes.pop();
      return tipificacoes.join(", ") + " E " + ultimoItem;
    }
    
    return "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da Ocorrência</CardTitle>
        <CardDescription>
          Informações gerais sobre a ocorrência registrada
        </CardDescription>
      </CardHeader>
      <CardContent className="px-[5px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Natureza da Ocorrência */}
          <div className="md:col-span-2">
            <Label htmlFor="naturezaDisplay">Natureza da Ocorrência</Label>
            <Input 
              id="naturezaDisplay" 
              readOnly 
              value={isCustomNatureza ? customNatureza : natureza} 
              className="bg-gray-100" 
              placeholder="Nenhuma natureza selecionada"
            />
          </div>

          {/* Tipificação Legal */}
          <div className="md:col-span-2">
            <Label htmlFor="tipificacao">Tipificação Legal</Label>
            {isCustomNatureza ? (
              <Input 
                id="tipificacao" 
                placeholder="Digite a tipificação legal" 
                value={tipificacao} 
                onChange={(e) => setTipificacao(e.target.value)} 
              />
            ) : (
              <Input 
                id="tipificacao" 
                readOnly 
                value={getTipificacaoCompleta()} 
                className="bg-gray-100" 
                placeholder="Tipificação será gerada automaticamente"
              />
            )}
          </div>

          {/* Data do Fato */}
          <div>
            <Label htmlFor="dataFato">Data do Fato *</Label>
            <Input 
              id="dataFato" 
              type="date" 
              value={dataFato} 
              onChange={(e) => setDataFato(e.target.value)} 
            />
          </div>

          {/* Hora do Fato */}
          <div>
            <Label htmlFor="horaFato">Hora do Fato *</Label>
            <Input 
              id="horaFato" 
              type="time" 
              value={horaFato} 
              onChange={(e) => setHoraFato(e.target.value)} 
            />
          </div>

          {/* Data de Início do Registro */}
          <div>
            <Label htmlFor="dataInicioRegistro">Data de Início do Registro</Label>
            <Input 
              id="dataInicioRegistro" 
              type="date" 
              readOnly 
              value={dataInicioRegistro} 
              className="bg-gray-100" 
            />
          </div>

          {/* Hora de Início do Registro */}
          <div>
            <Label htmlFor="horaInicioRegistro">Hora de Início do Registro</Label>
            <Input 
              id="horaInicioRegistro" 
              type="time" 
              readOnly 
              value={horaInicioRegistro} 
              className="bg-gray-100" 
            />
          </div>

          {/* Campos de Data e Hora de Término removidos conforme solicitado */}

          {/* Local do Fato */}
          <div className="md:col-span-2">
            <Label htmlFor="localFato">Local do Fato *</Label>
            <Input 
              id="localFato" 
              placeholder="Ex: Residência, Via pública, Estabelecimento comercial..." 
              value={localFato} 
              onChange={(e) => setLocalFato(e.target.value)} 
            />
          </div>

          {/* Endereço */}
          <div className="md:col-span-2">
            <Label htmlFor="endereco">Endereço Completo *</Label>
            <Input 
              id="endereco" 
              placeholder="Rua, número, bairro..." 
              value={endereco} 
              onChange={(e) => setEndereco(e.target.value)} 
            />
          </div>

          {/* Município */}
          <div>
            <Label htmlFor="municipio">Município</Label>
            <Input 
              id="municipio" 
              readOnly 
              value={municipio} 
              className="bg-gray-100" 
            />
          </div>

          {/* Comunicante */}
          <div>
            <Label htmlFor="comunicante">Comunicante *</Label>
            <Select value={comunicante} onValueChange={setComunicante}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o comunicante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CIOSP">CIOSP</SelectItem>
                <SelectItem value="190">190</SelectItem>
                <SelectItem value="Patrulhamento">Patrulhamento</SelectItem>
                <SelectItem value="Denúncia Anônima">Denúncia Anônima</SelectItem>
                <SelectItem value="Populares">Populares</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Guarnição */}
          <div className="md:col-span-2">
            <Label htmlFor="guarnicao">Guarnição *</Label>
            <Input 
              id="guarnicao" 
              placeholder="Ex: ROTAM 01, FORÇA TÁTICA 02, RADIOPATRULHA 15..." 
              value={guarnicao} 
              onChange={(e) => setGuarnicao(e.target.value)} 
            />
          </div>

          {/* Operação */}
          <div className="md:col-span-2">
            <Label htmlFor="operacao">Operação (Opcional)</Label>
            <Input 
              id="operacao" 
              placeholder="Ex: Operação Saturação, Operação Cidade Segura..." 
              value={operacao} 
              onChange={(e) => setOperacao(e.target.value)} 
            />
          </div>

          {/* Dados do Condutor */}
          {condutorNome && (
            <>
              <div className="md:col-span-2">
                <Label className="text-md font-semibold">Condutor da Viatura</Label>
              </div>
              
              <div>
                <Label htmlFor="condutorNome">Nome do Condutor</Label>
                <Input 
                  id="condutorNome" 
                  readOnly 
                  value={condutorNome} 
                  className="bg-gray-100" 
                />
              </div>

              <div>
                <Label htmlFor="condutorPosto">Posto/Graduação</Label>
                <Input 
                  id="condutorPosto" 
                  readOnly 
                  value={condutorPosto} 
                  className="bg-gray-100" 
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="condutorRg">RG do Condutor</Label>
                <Input 
                  id="condutorRg" 
                  readOnly 
                  value={condutorRg} 
                  className="bg-gray-100" 
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralInformationTab;
