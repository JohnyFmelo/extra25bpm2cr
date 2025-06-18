import React, { useState, useEffect, useCallback, useMemo } from "react";
import { collection, addDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, differenceInYears, differenceInMonths, differenceInDays, parseISO } from "date-fns";
import { AlertTriangle, Save, FileText, Clock, Users, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import GeneralInformationTab from "./tco/GeneralInformationTab";
import PessoasEnvolvidasTab from "./tco/PessoasEnvolvidasTab";
import GuarnicaoTab from "./tco/GuarnicaoTab";
import HistoricoTab from "./tco/HistoricoTab";
import DrugVerificationTab from "./tco/DrugVerificationTab";
import TCOTimer from "./tco/TCOTimer";

interface Autor {
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
}

interface Vitima {
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
}

interface Testemunha {
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
}

interface Condutor {
  nome: string;
  posto: string;
  rg: string;
}

interface ComponenteGuarnicao {
  nome: string;
  posto: string;
  rg: string;
}

interface PreenchimentoAutomatico {
  guarnicao: string;
  componentesGuarnicao: ComponenteGuarnicao[];
  condutor: Condutor;
}

const naturezasDisponiveis = [
  "Ameaça", "Vias de Fato", "Lesão Corporal", "Dano", "Injúria", "Difamação", "Calúnia",
  "Perturbação do Sossego", "Porte de drogas para consumo", 
  "Conduzir veículo sem CNH gerando perigo de dano", "Entregar veículo automotor a pessoa não habilitada",
  "Trafegar em velocidade incompatível com segurança", "Omissão de socorro", "Rixa",
  "Invasão de domicílio", "Fraude em comércio", "Ato obsceno", "Falsa identidade",
  "Resistência", "Desobediência", "Desacato", "Exercício arbitrário das próprias razões",
  "Outros"
];

const estadosCivil = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];
const estadosNaturalidade = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "Espírito Santo",
  "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba",
  "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul",
  "Rondônia", "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
];

const TCOForm: React.FC = () => {
  // Form state
  const [natureza, setNatureza] = useState("");
  const [customNatureza, setCustomNatureza] = useState("");
  const [tipificacao, setTipificacao] = useState("");
  const [dataFato, setDataFato] = useState("");
  const [horaFato, setHoraFato] = useState("");
  const [dataInicioRegistro, setDataInicioRegistro] = useState("");
  const [horaInicioRegistro, setHoraInicioRegistro] = useState("");
  const [dataTerminoRegistro, setDataTerminoRegistro] = useState("");
  const [horaTerminoRegistro, setHoraTerminoRegistro] = useState("");
  const [localFato, setLocalFato] = useState("");
  const [endereco, setEndereco] = useState("");
  const [municipio, setMunicipio] = useState("Sonora-MS");
  const [comunicante, setComunicante] = useState("");
  const [guarnicao, setGuarnicao] = useState("");
  const [operacao, setOperacao] = useState("");

  // People involved
  const [autores, setAutores] = useState<Autor[]>([{
    nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", dataNascimento: "",
    naturalidade: "", filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "", celular: "", email: "", laudoPericial: "Não"
  }]);
  const [vitimas, setVitimas] = useState<Vitima[]>([{
    nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", dataNascimento: "",
    naturalidade: "", filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "", celular: "", email: "", laudoPericial: "Não"
  }]);
  const [testemunhas, setTestemunhas] = useState<Testemunha[]>([{
    nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", dataNascimento: "",
    naturalidade: "", filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "", celular: "", email: "", laudoPericial: "Não"
  }]);
  const [componentesGuarnicao, setComponentesGuarnicao] = useState<ComponenteGuarnicao[]>([
    { nome: "", posto: "", rg: "" }
  ]);
  const [condutorSelecionado, setCondutorSelecionado] = useState("");
  const [condutor, setCondutor] = useState<Condutor>({ nome: "", posto: "", rg: "" });

  // History and drug verification
  const [historico, setHistorico] = useState("");
  const [isDrugRelated, setIsDrugRelated] = useState(false);
  const [drugDetails, setDrugDetails] = useState({
    tipo: "",
    quantidade: "",
    apresentacao: "",
    cor: "",
    odor: "",
    origem: "",
    destinatario: "",
    localApreensao: ""
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showPersonalFields, setShowPersonalFields] = useState(false);
  const [preenchimentoAutomatico, setPreenchimentoAutomatico] = useState<PreenchimentoAutomatico | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const initializeData = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      const formattedDate = `${year}-${month}-${day}`;
      const formattedTime = `${hours}:${minutes}`;
      
      setDataInicioRegistro(formattedDate);
      setHoraInicioRegistro(formattedTime);
      
      if (!dataFato) setDataFato(formattedDate);
      if (!horaFato) setHoraFato(formattedTime);
    };

    initializeData();
  }, []);

  useEffect(() => {
    const loadPreenchimentoAutomatico = async () => {
      try {
        const userDataString = localStorage.getItem('user');
        if (!userDataString) return;

        const userData = JSON.parse(userDataString);
        if (!userData.email) return;

        const q = query(
          collection(db, "preenchimento_automatico"),
          where("email", "==", userData.email)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data() as PreenchimentoAutomatico;
          setPreenchimentoAutomatico(data);
          
          if (data.guarnicao) {
            setGuarnicao(data.guarnicao);
          }
          if (data.componentesGuarnicao && data.componentesGuarnicao.length > 0) {
            setComponentesGuarnicao(data.componentesGuarnicao);
          }
          if (data.condutor) {
            setCondutor(data.condutor);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar preenchimento automático:", error);
      }
    };

    loadPreenchimentoAutomatico();
  }, []);

  const hasMinorAuthor = useMemo(() => {
    const today = new Date();
    
    for (let i = 0; i < autores.length; i++) {
      const autor = autores[i];
      if (autor.dataNascimento && autor.nome) {
        try {
          const birthDate = parseISO(autor.dataNascimento);
          const years = differenceInYears(today, birthDate);
          const months = differenceInMonths(today, birthDate) % 12;
          const days = differenceInDays(today, new Date(today.getFullYear(), today.getMonth(), birthDate.getDate()));
          
          if (years < 18) {
            return {
              isMinor: true,
              details: `O autor ${autor.nome} possui ${years} anos, ${months} meses e ${days} dias. Não é permitido registrar TCO para menores de 18 anos.`
            };
          }
        } catch (error) {
          console.error("Erro ao calcular idade:", error);
        }
      }
    }
    
    return { isMinor: false, details: null };
  }, [autores]);

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasMinorAuthor.isMinor) {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: "Não é possível registrar TCO com autor menor de idade."
      });
      return;
    }

    if (!natureza || !dataFato || !horaFato || !localFato || !endereco || !comunicante || !guarnicao) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios marcados com *"
      });
      return;
    }

    if (!historico.trim()) {
      toast({
        variant: "destructive",
        title: "Histórico obrigatório",
        description: "Por favor, preencha o histórico da ocorrência."
      });
      return;
    }

    setIsLoading(true);

    try {
      const userDataString = localStorage.getItem('user');
      const userData = userDataString ? JSON.parse(userDataString) : null;
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      const completionDate = `${year}-${month}-${day}`;
      const completionTime = `${hours}:${minutes}`;

      const validAutores = autores.filter(autor => autor.nome.trim() !== '');
      const validVitimas = vitimas.filter(vitima => vitima.nome.trim() !== '');
      const validTestemunhas = testemunhas.filter(testemunha => testemunha.nome.trim() !== '');

      console.log("Autores array completo:", autores);
      console.log("Valid autores encontrados:", validAutores);
      console.log("Número de autores válidos:", validAutores.length);

      const tcoData = {
        natureza: natureza.split(' + ')[0] === "Outros" ? customNatureza : natureza,
        tipificacao,
        dataFato,
        horaFato,
        dataInicioRegistro,
        horaInicioRegistro,
        dataTerminoRegistro: completionDate,
        horaTerminoRegistro: completionTime,
        localFato,
        endereco,
        municipio,
        comunicante,
        guarnicao,
        operacao,
        autores: validAutores,
        vitimas: validVitimas,
        testemunhas: validTestemunhas,
        componentesGuarnicao,
        condutor,
        historico,
        isDrugRelated,
        drugDetails: isDrugRelated ? drugDetails : null,
        registradoPor: userData?.warName || userData?.email || 'Usuário não identificado',
        emailRegistrador: userData?.email || '',
        criadoEm: new Date(),
        status: 'ativo'
      };

      await addDoc(collection(db, "tcos"), tcoData);

      toast({
        title: "TCO registrado com sucesso!",
        description: "O Termo Circunstanciado de Ocorrência foi salvo no sistema."
      });

      // Reset form
      window.location.reload();

    } catch (error) {
      console.error("Erro ao salvar TCO:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar o TCO. Tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const condutorParaDisplay = useMemo(() => {
    if (condutorSelecionado && condutorSelecionado !== "Outro") {
      const componenteSelecionado = componentesGuarnicao.find(
        comp => `${comp.posto} ${comp.nome}` === condutorSelecionado
      );
      if (componenteSelecionado) {
        return componenteSelecionado;
      }
    }
    return condutor;
  }, [condutorSelecionado, componentesGuarnicao, condutor]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-900">
                Registro de TCO - Termo Circunstanciado de Ocorrência
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Preencha todos os campos obrigatórios (*) para registrar a ocorrência
              </CardDescription>
            </div>
            <TCOTimer />
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6" noValidate>
        {hasMinorAuthor.isMinor && hasMinorAuthor.details && (
          <div className="bg-red-100 border-l-4 border-red-600 text-red-700 p-4 rounded-md mb-6 shadow-md">
            <p className="font-semibold">Atenção: Autor Menor de Idade Detectado</p>
            <p className="text-sm">{hasMinorAuthor.details}</p>
          </div>
        )}

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <h2 className="text-xl font-semibold mb-4">Seleção de Natureza</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {naturezasDisponiveis.map((nat) => (
              <label key={nat} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <Checkbox
                  checked={natureza.includes(nat)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setNatureza(prev => prev ? `${prev} + ${nat}` : nat);
                    } else {
                      setNatureza(prev => prev.split(' + ').filter(n => n !== nat).join(' + '));
                    }
                  }}
                />
                <span className="text-sm font-medium">{nat}</span>
              </label>
            ))}
          </div>
          {natureza.includes("Outros") && (
            <div className="mt-4">
              <Label htmlFor="customNatureza">Especifique a natureza *</Label>
              <Input
                id="customNatureza"
                placeholder="Digite a natureza específica da ocorrência"
                value={customNatureza}
                onChange={(e) => setCustomNatureza(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <h2 className="text-xl font-semibold mb-4">Informações Gerais da Ocorrência</h2>
          <GeneralInformationTab 
            natureza={natureza} 
            tipificacao={tipificacao} 
            setTipificacao={setTipificacao} 
            isCustomNatureza={natureza.split(' + ')[0] === "Outros"} 
            customNatureza={customNatureza} 
            dataFato={dataFato} 
            setDataFato={setDataFato} 
            horaFato={horaFato} 
            setHoraFato={setHoraFato} 
            dataInicioRegistro={dataInicioRegistro} 
            horaInicioRegistro={horaInicioRegistro} 
            setHoraInicioRegistro={setHoraInicioRegistro} 
            dataTerminoRegistro={dataTerminoRegistro} 
            horaTerminoRegistro={horaTerminoRegistro} 
            localFato={localFato} 
            setLocalFato={setLocalFato} 
            endereco={endereco} 
            setEndereco={setEndereco} 
            municipio={municipio} 
            comunicante={comunicante} 
            setComunicante={setComunicante} 
            guarnicao={guarnicao} 
            setGuarnicao={setGuarnicao} 
            operacao={operacao} 
            setOperacao={setOperacao} 
            condutorNome={condutorParaDisplay?.nome || ""} 
            condutorPosto={condutorParaDisplay?.posto || ""} 
            condutorRg={condutorParaDisplay?.rg || ""} 
          />
        </div>

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <PessoasEnvolvidasTab
            autores={autores}
            setAutores={setAutores}
            vitimas={vitimas}
            setVitimas={setVitimas}
            testemunhas={testemunhas}
            setTestemunhas={setTestemunhas}
            estadosCivil={estadosCivil}
            estadosNaturalidade={estadosNaturalidade}
            showPersonalFields={showPersonalFields}
            setShowPersonalFields={setShowPersonalFields}
          />
        </div>

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <GuarnicaoTab
            componentesGuarnicao={componentesGuarnicao}
            setComponentesGuarnicao={setComponentesGuarnicao}
            condutorSelecionado={condutorSelecionado}
            setCondutorSelecionado={setCondutorSelecionado}
            condutor={condutor}
            setCondutor={setCondutor}
          />
        </div>

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <DrugVerificationTab
            isDrugRelated={isDrugRelated}
            setIsDrugRelated={setIsDrugRelated}
            drugDetails={drugDetails}
            setDrugDetails={setDrugDetails}
          />
        </div>

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <HistoricoTab
            historico={historico}
            setHistorico={setHistorico}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="submit"
            disabled={isLoading || hasMinorAuthor.isMinor}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Registrar TCO</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TCOForm;
