import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Download, FileText, Users, MapPin, Calendar, AlertTriangle } from "lucide-react";
import { GeneralInformationTab } from './tco/GeneralInformationTab';
import PessoasEnvolvidasTab from './tco/PessoasEnvolvidasTab';
import HistoricoTab from './tco/HistoricoTab';
import GuarnicaoTab from './tco/GuarnicaoTab';
import DrugVerificationTab from './tco/DrugVerificationTab';
import TCOTimer from './tco/TCOTimer';
import { generateTCOPDF } from './tco/pdfGenerator';

interface PersonalInfo {
  nome: string;
  sexo: string;
  estadoCivil: string;
  profissao: string;
  endereco: string;
  dataNascimento: string;
  naturalidade: string;
  filiacaoMae: string;
  filiacaoPai: string;
  rg: string;
  cpf: string;
  celular: string;
  email: string;
  laudoPericial: string;
  relato?: string;
  representacao?: string;
  fielDepositario?: string;
  objetoDepositado?: string;
}

interface ComponenteGuarnicao {
  nome: string;
  posto: string;
  rg: string;
  apoio?: boolean;
}

interface TCOFormProps {
  selectedTco?: any;
}

const TCOForm: React.FC<TCOFormProps> = ({ selectedTco }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("geral");

  // Estados para as informações gerais
  const [tcoNumber, setTcoNumber] = useState("");
  const [natureza, setNatureza] = useState("");
  const [customNatureza, setCustomNatureza] = useState("");
  const [tipificacao, setTipificacao] = useState("");
  const [dataFato, setDataFato] = useState("");
  const [horaFato, setHoraFato] = useState("");
  const [localFato, setLocalFato] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [flagranteDelito, setFlagranteDelito] = useState("");
  const [juizadoEspecialData, setJuizadoEspecialData] = useState("");
  const [juizadoEspecialHora, setJuizadoEspecialHora] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [condutorNome, setCondutorNome] = useState("");
  const [condutorPosto, setCondutorPosto] = useState("");
  const [condutorRg, setCondutorRg] = useState("");
  const [horaInicioRegistro, setHoraInicioRegistro] = useState("");

  // Estados para pessoas envolvidas
  const [autores, setAutores] = useState<PersonalInfo[]>([{
    nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", 
    dataNascimento: "", naturalidade: "", filiacaoMae: "", filiacaoPai: "",
    rg: "", cpf: "", celular: "", email: "", laudoPericial: "Não",
    relato: "", representacao: "", fielDepositario: "Não", objetoDepositado: ""
  }]);
  const [vitimas, setVitimas] = useState<PersonalInfo[]>([{
    nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", 
    dataNascimento: "", naturalidade: "", filiacaoMae: "", filiacaoPai: "",
    rg: "", cpf: "", celular: "", email: "", laudoPericial: "Não",
    relato: "", representacao: "", fielDepositario: "Não", objetoDepositado: ""
  }]);
  const [testemunhas, setTestemunhas] = useState<PersonalInfo[]>([{
    nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", 
    dataNascimento: "", naturalidade: "", filiacaoMae: "", filiacaoPai: "",
    rg: "", cpf: "", celular: "", email: "", laudoPericial: "Não",
    relato: "", representacao: "", fielDepositario: "Não", objetoDepositado: ""
  }]);

  // Estados para histórico e outras informações
  const [historico, setHistorico] = useState("");
  const [apreensoes, setApreensoes] = useState("");
  const [documentosAnexos, setDocumentosAnexos] = useState("");
  const [videoLinks, setVideoLinks] = useState<string[]>([""]);

  // Estados para guarnição
  const [componentesGuarnicao, setComponentesGuarnicao] = useState<ComponenteGuarnicao[]>([{
    nome: "", posto: "", rg: "", apoio: false
  }]);
  const [localEncerramento, setLocalEncerramento] = useState("");

  // Estados para drogas
  const [quantidade, setQuantidade] = useState("");
  const [substancia, setSubstancia] = useState("");
  const [cor, setCor] = useState("");
  const [odor, setOdor] = useState("");
  const [indicios, setIndicios] = useState("");
  const [customMaterialDesc, setCustomMaterialDesc] = useState("");
  const [lacreNumero, setLacreNumero] = useState("");

  const isUnknownMaterial = substancia && cor && !["Verde", "Amarelada", "Branca"].includes(cor);

  const [isCustomNatureza, setIsCustomNatureza] = useState(false);

  // Gerar número TCO automaticamente
  useEffect(() => {
    const generateTCONumber = () => {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      return `${timestamp}/${year}`;
    };
    
    setTcoNumber(generateTCONumber());
  }, []);

  // Registrar hora de início automaticamente
  useEffect(() => {
    if (!horaInicioRegistro) {
      const agora = new Date();
      const horaFormatada = agora.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setHoraInicioRegistro(horaFormatada);
    }
  }, [horaInicioRegistro]);

  // Timer states
  const [startTime] = useState<Date>(new Date());
  const [isRunning] = useState<boolean>(true);

  // Handler functions for pessoas envolvidas
  const handleVitimaChange = (index: number, field: string, value: string) => {
    const newVitimas = [...vitimas];
    newVitimas[index] = { ...newVitimas[index], [field]: value };
    setVitimas(newVitimas);
  };

  const handleAddVitima = () => {
    setVitimas([...vitimas, {
      nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", 
      dataNascimento: "", naturalidade: "", filiacaoMae: "", filiacaoPai: "",
      rg: "", cpf: "", celular: "", email: "", laudoPericial: "Não",
      relato: "", representacao: "", fielDepositario: "Não", objetoDepositado: ""
    }]);
  };

  const handleRemoveVitima = (index: number) => {
    if (vitimas.length > 1) {
      setVitimas(vitimas.filter((_, i) => i !== index));
    }
  };

  const handleTestemunhaChange = (index: number, field: string, value: string) => {
    const newTestemunhas = [...testemunhas];
    newTestemunhas[index] = { ...newTestemunhas[index], [field]: value };
    setTestemunhas(newTestemunhas);
  };

  const handleAddTestemunha = () => {
    setTestemunhas([...testemunhas, {
      nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", 
      dataNascimento: "", naturalidade: "", filiacaoMae: "", filiacaoPai: "",
      rg: "", cpf: "", celular: "", email: "", laudoPericial: "Não",
      relato: "", representacao: "", fielDepositario: "Não", objetoDepositado: ""
    }]);
  };

  const handleRemoveTestemunha = (index: number) => {
    if (testemunhas.length > 1) {
      setTestemunhas(testemunhas.filter((_, i) => i !== index));
    }
  };

  const handleAutorDetalhadoChange = (index: number, field: string, value: string) => {
    const newAutores = [...autores];
    newAutores[index] = { ...newAutores[index], [field]: value };
    setAutores(newAutores);
  };

  const handleAddAutor = () => {
    setAutores([...autores, {
      nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", 
      dataNascimento: "", naturalidade: "", filiacaoMae: "", filiacaoPai: "",
      rg: "", cpf: "", celular: "", email: "", laudoPericial: "Não",
      relato: "", representacao: "", fielDepositario: "Não", objetoDepositado: ""
    }]);
  };

  const handleRemoveAutor = (index: number) => {
    if (autores.length > 1) {
      setAutores(autores.filter((_, i) => i !== index));
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const tcoData = {
        tcoNumber,
        natureza,
        customNatureza,
        tipificacao,
        dataFato,
        horaFato,
        localFato,
        municipio,
        flagranteDelito,
        juizadoEspecialData,
        juizadoEspecialHora,
        observacoes,
        autores,
        vitimas,
        testemunhas,
        historico,
        apreensoes,
        componentesGuarnicao,
        localEncerramento,
        documentosAnexos,
        videoLinks,
        condutorNome,
        condutorPosto,
        condutorRg,
        horaInicioRegistro,
        drogaTipo: substancia,
        drogaCor: cor,
        drogaOdor: odor,
        drogaQuantidade: quantidade,
        lacreNumero,
        downloadLocal: true
      };

      await generateTCOPDF(tcoData);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "O documento TCO foi criado e baixado.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao criar o documento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getTabIcon = (tabValue: string) => {
    switch (tabValue) {
      case "geral": return <FileText className="w-4 h-4" />;
      case "pessoas": return <Users className="w-4 h-4" />;
      case "historico": return <Calendar className="w-4 h-4" />;
      case "guarnicao": return <MapPin className="w-4 h-4" />;
      case "drogas": return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCompletionStatus = () => {
    const requiredFields = [
      natureza, dataFato, horaFato, localFato, municipio,
      autores[0]?.nome, historico, componentesGuarnicao[0]?.nome
    ];
    
    const filledFields = requiredFields.filter(field => field && field.trim() !== '').length;
    const percentage = Math.round((filledFields / requiredFields.length) * 100);
    
    return { percentage, filled: filledFields, total: requiredFields.length };
  };

  const completionStatus = getCompletionStatus();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">
                Termo Circunstanciado de Ocorrência
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="text-sm">
                  TCO Nº {tcoNumber}/25ºBPM/2ºCR/{new Date().getFullYear()}
                </Badge>
                <Badge 
                  variant={completionStatus.percentage >= 80 ? "default" : "secondary"}
                  className="text-sm"
                >
                  {completionStatus.percentage}% completo ({completionStatus.filled}/{completionStatus.total} campos)
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <TCOTimer startTime={startTime} isRunning={isRunning} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="geral" className="flex items-center gap-2">
                {getTabIcon("geral")}
                <span className="hidden sm:inline">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="pessoas" className="flex items-center gap-2">
                {getTabIcon("pessoas")}
                <span className="hidden sm:inline">Pessoas</span>
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex items-center gap-2">
                {getTabIcon("historico")}
                <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
              <TabsTrigger value="guarnicao" className="flex items-center gap-2">
                {getTabIcon("guarnicao")}
                <span className="hidden sm:inline">Guarnição</span>
              </TabsTrigger>
              <TabsTrigger value="drogas" className="flex items-center gap-2">
                {getTabIcon("drogas")}
                <span className="hidden sm:inline">Drogas</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="geral">
                <GeneralInformationTab
                  natureza={natureza}
                  setNatureza={setNatureza}
                  tipificacao={tipificacao}
                  setTipificacao={setTipificacao}
                  isCustomNatureza={isCustomNatureza}
                  setIsCustomNatureza={setIsCustomNatureza}
                  customNatureza={customNatureza}
                  setCustomNatureza={setCustomNatureza}
                  dataFato={dataFato}
                  setDataFato={setDataFato}
                  horaFato={horaFato}
                  setHoraFato={setHoraFato}
                  localFato={localFato}
                  setLocalFato={setLocalFato}
                  municipio={municipio}
                  setMunicipio={setMunicipio}
                  observacoes={observacoes}
                  setObservacoes={setObservacoes}
                  flagranteDelito={flagranteDelito}
                  setFlagranteDelito={setFlagranteDelito}
                  juizadoEspecialData={juizadoEspecialData}
                  setJuizadoEspecialData={setJuizadoEspecialData}
                  juizadoEspecialHora={juizadoEspecialHora}
                  setJuizadoEspecialHora={setJuizadoEspecialHora}
                  condutorNome={condutorNome}
                  setCondutorNome={setCondutorNome}
                  condutorPosto={condutorPosto}
                  setCondutorPosto={setCondutorPosto}
                  condutorRg={condutorRg}
                  setCondutorRg={setCondutorRg}
                  horaInicioRegistro={horaInicioRegistro}
                  setHoraInicioRegistro={setHoraInicioRegistro}
                />
              </TabsContent>

              <TabsContent value="pessoas">
                <PessoasEnvolvidasTab
                  vitimas={vitimas}
                  handleVitimaChange={handleVitimaChange}
                  handleAddVitima={handleAddVitima}
                  handleRemoveVitima={handleRemoveVitima}
                  testemunhas={testemunhas}
                  handleTestemunhaChange={handleTestemunhaChange}
                  handleAddTestemunha={handleAddTestemunha}
                  handleRemoveTestemunha={handleRemoveTestemunha}
                  autores={autores}
                  handleAutorDetalhadoChange={handleAutorDetalhadoChange}
                  handleAddAutor={handleAddAutor}
                  handleRemoveAutor={handleRemoveAutor}
                  natureza={natureza}
                />
              </TabsContent>

              <TabsContent value="historico">
                <HistoricoTab
                  historico={historico}
                  setHistorico={setHistorico}
                  apreensoes={apreensoes}
                  setApreensoes={setApreensoes}
                  documentosAnexos={documentosAnexos}
                  setDocumentosAnexos={setDocumentosAnexos}
                  videoLinks={videoLinks}
                  setVideoLinks={setVideoLinks}
                />
              </TabsContent>

              <TabsContent value="guarnicao">
                <GuarnicaoTab
                  componentesGuarnicao={componentesGuarnicao}
                  setComponentesGuarnicao={setComponentesGuarnicao}
                  localEncerramento={localEncerramento}
                  setLocalEncerramento={setLocalEncerramento}
                />
              </TabsContent>

              <TabsContent value="drogas">
                <DrugVerificationTab
                  quantidade={quantidade}
                  setQuantidade={setQuantidade}
                  substancia={substancia}
                  setSubstancia={setSubstancia}
                  cor={cor}
                  setCor={setCor}
                  odor={odor}
                  setOdor={setOdor}
                  indicios={indicios}
                  customMaterialDesc={customMaterialDesc}
                  setCustomMaterialDesc={setCustomMaterialDesc}
                  isUnknownMaterial={isUnknownMaterial}
                  lacreNumero={lacreNumero}
                  setLacreNumero={setLacreNumero}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleGeneratePDF}
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Gerar PDF
              </Button>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span>Progresso:</span>
                  <span>{completionStatus.percentage}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${completionStatus.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs">
                  {completionStatus.filled} de {completionStatus.total} campos obrigatórios preenchidos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TCOForm;
