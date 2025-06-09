
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Download, Users, MapPin, Calendar, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { GeneralInformationTab } from './tco/GeneralInformationTab';
import { PessoasEnvolvidasTab } from './tco/PessoasEnvolvidasTab';
import { HistoricoTab } from './tco/HistoricoTab';
import { GuarnicaoTab } from './tco/GuarnicaoTab';
import { DrugVerificationTab } from './tco/DrugVerificationTab';
import { TCOTimer } from './tco/TCOTimer';
import { generateTCOPDF } from './tco/pdfGenerator';

interface Pessoa {
  nome: string;
  cpf: string;
  rg: string;
  profissao: string;
  endereco: string;
  telefone: string;
  relato: string;
}

interface ComponenteGuarnicao {
  nome: string;
  posto: string;
  rg: string;
}

interface TCOData {
  tcoNumber: string;
  natureza: string;
  customNatureza: string;
  tipificacao: string;
  dataFato: string;
  horaFato: string;
  localFato: string;
  municipio: string;
  flagranteDelito: string;
  juizadoEspecialData: string;
  juizadoEspecialHora: string;
  observacoes: string;
  autores: Pessoa[];
  vitimas: Pessoa[];
  testemunhas: Pessoa[];
  historico: string;
  apreensoes: string;
  componentesGuarnicao: ComponenteGuarnicao[];
  localEncerramento: string;
  documentosAnexos: string;
  videoLinks: string[];
  condutorNome: string;
  condutorPosto: string;
  condutorRg: string;
  horaInicioRegistro: string;
  drogas: {
    substancia: string;
    quantidade: string;
    peso: string;
    acondicionamento: string;
    origemApreensao: string;
    localApreensao: string;
    responsavelApreensao: string;
    destinoSubstancia: string;
    observacoes: string;
  };
}

export const TCOForm: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("geral");

  // Estados para as informações gerais
  const [natureza, setNatureza] = useState("");
  const [tipificacao, setTipificacao] = useState("");
  const [isCustomNatureza, setIsCustomNatureza] = useState(false);
  const [customNatureza, setCustomNatureza] = useState("");
  const [dataFato, setDataFato] = useState("");
  const [horaFato, setHoraFato] = useState("");
  const [localFato, setLocalFato] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [flagranteDelito, setFlagranteDelito] = useState("");
  const [juizadoEspecialData, setJuizadoEspecialData] = useState("");
  const [juizadoEspecialHora, setJuizadoEspecialHora] = useState("");
  const [condutorNome, setCondutorNome] = useState("");
  const [condutorPosto, setCondutorPosto] = useState("");
  const [condutorRg, setCondutorRg] = useState("");
  const [horaInicioRegistro, setHoraInicioRegistro] = useState("");

  // Estados para pessoas envolvidas
  const [autores, setAutores] = useState<Pessoa[]>([{
    nome: "", cpf: "", rg: "", profissao: "", endereco: "", telefone: "", relato: ""
  }]);
  const [vitimas, setVitimas] = useState<Pessoa[]>([{
    nome: "", cpf: "", rg: "", profissao: "", endereco: "", telefone: "", relato: ""
  }]);
  const [testemunhas, setTestemunhas] = useState<Pessoa[]>([{
    nome: "", cpf: "", rg: "", profissao: "", endereco: "", telefone: "", relato: ""
  }]);

  // Estados para histórico e outras informações
  const [historico, setHistorico] = useState("");
  const [apreensoes, setApreensoes] = useState("");
  const [documentosAnexos, setDocumentosAnexos] = useState("");
  const [videoLinks, setVideoLinks] = useState<string[]>([""]);

  // Estados para guarnição
  const [componentesGuarnicao, setComponentesGuarnicao] = useState<ComponenteGuarnicao[]>([{
    nome: "", posto: "", rg: ""
  }]);
  const [localEncerramento, setLocalEncerramento] = useState("");

  // Estados para drogas
  const [drogas, setDrogas] = useState({
    substancia: "",
    quantidade: "",
    peso: "",
    acondicionamento: "",
    origemApreensao: "",
    localApreensao: "",
    responsavelApreensao: "",
    destinoSubstancia: "",
    observacoes: ""
  });

  // Gerar número TCO automaticamente
  const [tcoNumber, setTcoNumber] = useState("");

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

  const handleGeneratePDF = async () => {
    try {
      const tcoData: TCOData = {
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
        drogas
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
              <TCOTimer horaInicio={horaInicioRegistro} />
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
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pessoas">
                <Card>
                  <CardHeader>
                    <CardTitle>Pessoas Envolvidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PessoasEnvolvidasTab
                      autores={autores}
                      setAutores={setAutores}
                      vitimas={vitimas}
                      setVitimas={setVitimas}
                      testemunhas={testemunhas}
                      setTestemunhas={setTestemunhas}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historico">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico e Relatos</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="guarnicao">
                <Card>
                  <CardHeader>
                    <CardTitle>Guarnição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GuarnicaoTab
                      componentesGuarnicao={componentesGuarnicao}
                      setComponentesGuarnicao={setComponentesGuarnicao}
                      localEncerramento={localEncerramento}
                      setLocalEncerramento={setLocalEncerramento}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="drogas">
                <Card>
                  <CardHeader>
                    <CardTitle>Verificação de Drogas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DrugVerificationTab
                      drogas={drogas}
                      setDrogas={setDrogas}
                    />
                  </CardContent>
                </Card>
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
