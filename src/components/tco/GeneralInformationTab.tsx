import React from "react";
import { InputField } from "@/components/ui/input-field"; // Assuming InputField is here
import { FieldsetContainer } from "@/components/ui/fieldset-container"; // Assuming FieldsetContainer is here

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
  guarnicao: string;
  setGuarnicao: (value: string) => void;
  operacao: string;
  setOperacao: (value: string) => void;
  condutorNome: string; // Display only
  condutorPosto: string; // Display only
  condutorRg: string; // Display only

  // Added props for Juizado Special Presentation
  juizadoDate: string;
  setJuizadoDate: (value: string) => void;
  juizadoTime: string;
  setJuizadoTime: (value: string) => void;
}

const GeneralInformationTab: React.FC<GeneralInformationTabProps> = ({
  natureza,
  tipificacao, setTipificacao,
  isCustomNatureza, customNatureza,
  dataFato, setDataFato,
  horaFato, setHoraFato,
  dataInicioRegistro, horaInicioRegistro,
  dataTerminoRegistro, horaTerminoRegistro,
  localFato, setLocalFato,
  endereco, setEndereco,
  municipio,
  comunicante, setComunicante,
  guarnicao, setGuarnicao,
  operacao, setOperacao,
  // condutorNome, condutorPosto, condutorRg, // These props are available if needed for display
  // Destructure new props
  juizadoDate, setJuizadoDate,
  juizadoTime, setJuizadoTime,
}) => {

  const displayNaturezaReal = isCustomNatureza ? customNatureza || "[NATUREZA NÃO ESPECIFICADA]" : natureza;

  return (
    <FieldsetContainer title="INFORMAÇÕES GERAIS DA OCORRÊNCIA">
      <div className="space-y-6"> {/* Main layout for sections within this tab */}

        {/* Section for Natureza, Tipificação, and Juizado Presentation */}
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-3 pb-1 border-b">Dados da Infração e Encaminhamento Judicial</h3>
          <div className="grid md:grid-cols-2 gap-x-4 gap-y-4"> {/* Inner grid for this section's fields */}
            
            {/* Natureza Display */}
            <div className="md:col-span-2">
              <InputField
                label="Natureza da Ocorrência (Conforme Selecionado)"
                id="displayNaturezaGenInfoTab"
                value={displayNaturezaReal}
                readOnly
                disabled 
                tooltip="Natureza da ocorrência conforme selecionado na aba 'Informações Básicas'."
              />
            </div>

            {/* Tipificação */}
            <div className="md:col-span-2">
              <InputField
                label="Tipificação Legal (Infração Penal)"
                id="tipificacaoGenInfoTab"
                value={tipificacao}
                onChange={(e) => setTipificacao(e.target.value)}
                disabled={!isCustomNatureza}
                readOnly={!isCustomNatureza} // Usually true if not custom, for better UX
                required={isCustomNatureza}
                tooltip="Artigo de lei infringido. Preenchido automaticamente com base na Natureza. Editável apenas se a natureza for 'Outros'."
              />
            </div>
            
            {/* Juizado Section (Added as per request) */}
            <div className="md:col-span-2 mt-2 pt-3 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Apresentação em Juizado Especial VG</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <InputField
                  label="Data da Apresentação"
                  id="juizadoDateGenInfoTab" // Unique ID for this tab context
                  type="date"
                  value={juizadoDate}
                  onChange={(e) => setJuizadoDate(e.target.value)}
                  tooltip="Data para comparecimento da parte ao Juizado Especial Criminal de Várzea Grande."
                />
                <InputField
                  label="Hora da Apresentação"
                  id="juizadoTimeGenInfoTab" // Unique ID for this tab context
                  type="time"
                  value={juizadoTime}
                  onChange={(e) => setJuizadoTime(e.target.value)}
                  tooltip="Hora para comparecimento da parte ao Juizado Especial Criminal de Várzea Grande."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Data, Hora e Local do Fato */}
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-3 pb-1 border-b">Data, Hora e Local do Fato</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
            <InputField label="Data do Fato" id="dataFatoGenInfoTab" type="date" value={dataFato} onChange={(e) => setDataFato(e.target.value)} required />
            <InputField label="Hora do Fato" id="horaFatoGenInfoTab" type="time" value={horaFato} onChange={(e) => setHoraFato(e.target.value)} required />
            <InputField label="Município do Fato" id="municipioGenInfoTab" value={municipio} readOnly disabled />
            <InputField label="Comunicante Inicial" id="comunicanteGenInfoTab" value={comunicante} onChange={(e) => setComunicante(e.target.value)} />
          </div>
          <div className="grid md:grid-cols-1 gap-4 mt-4"> {/* Local and Endereço might need more space */}
            <InputField label="Local do Fato (Ex: Av. Filinto Müller, em frente ao Posto Shell)" id="localFatoGenInfoTab" value={localFato} onChange={(e) => setLocalFato(e.target.value)} required placeholder="Ex: Praça Central, Escola Estadual..." />
            <InputField label="Endereço Completo (Ex: Rua das Palmeiras, Nº 123, Bairro Jardim Primavera)" id="enderecoGenInfoTab" value={endereco} onChange={(e) => setEndereco(e.target.value)} required placeholder="Ex: Rua A, Qd. B, Lt. C, Bairro..." />
          </div>
        </div>
        
        {/* Section: Datas de Registro do TCO (Display Only in this tab context) */}
        <div>
            <h3 className="text-md font-semibold text-gray-700 mb-3 pb-1 border-b">Período de Registro do TCO</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                <InputField label="Data Início Registro" id="dataInicioRegistroGenInfoTab" value={dataInicioRegistro} readOnly disabled />
                <InputField label="Hora Início Registro" id="horaInicioRegistroGenInfoTab" value={horaInicioRegistro} readOnly disabled />
                <InputField label="Data Término Registro" id="dataTerminoRegistroGenInfoTab" value={dataTerminoRegistro} readOnly disabled />
                <InputField label="Hora Término Registro" id="horaTerminoRegistroGenInfoTab" value={horaTerminoRegistro} readOnly disabled />
            </div>
        </div>

        {/* Section: Viatura e Operação Policial */}
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-3 pb-1 border-b">Viatura e Operação Policial</h3>
          <div className="grid md:grid-cols-2 gap-x-4 gap-y-4">
            <InputField
              label="Viatura (Prefixo)"
              id="guarnicaoGenInfoTab"
              value={guarnicao}
              onChange={(e) => setGuarnicao(e.target.value)}
              placeholder="Ex: QB-4501 / 99-1234"
              tooltip="Prefixo da viatura principal que atendeu a ocorrência."
            />
            <InputField
              label="Operação Policial (Se Houver)"
              id="operacaoGenInfoTab"
              value={operacao}
              onChange={(e) => setOperacao(e.target.value)}
              placeholder="Ex: Operação Tolerância Zero"
              tooltip="Nome da operação policial em curso durante a ocorrência, se aplicável."
            />
          </div>
        </div>
      </div>
    </FieldsetContainer>
  );
};

export default GeneralInformationTab;
