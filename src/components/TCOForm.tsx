import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter, // Added if needed for specific sections
} from "@/components/ui/card"; // Import Card components
import { Label } from "@/components/ui/label"; // Import Label for Anexos section
import { Input } from "@/components/ui/input"; // Import Input for Anexos section
import { FileText, Image as ImageIcon, Video as VideoIcon, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import BasicInformationTab from "./tco/BasicInformationTab";
import GeneralInformationTab from "./tco/GeneralInformationTab";
import PessoasEnvolvidasTab from "./tco/PessoasEnvolvidasTab";
import GuarnicaoTab from "./tco/GuarnicaoTab";
import HistoricoTab from "./tco/HistoricoTab";
import DrugVerificationTab from "./tco/DrugVerificationTab";
import { generatePDF } from "./tco/pdfGenerator"; // Assuming this returns a Blob
// Import the Supabase client
import { supabase } from "@/integrations/supabase/client";
import { ensureBucketExists, createTcoPdfsTable } from "@/utils/supabaseUtils";

// --- Keep Interfaces: ComponenteGuarnicao, Pessoa ---
interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
}

interface Pessoa {
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
// --- END OF Interfaces ---

// Define TCOForm props interface
interface TCOFormProps {
  selectedTco?: any; // You might want to define a more specific type here
  onClear?: () => void;
}

// --- Keep Helper Functions: initialPersonData, formatRepresentacao, formatCPF, formatPhone, validateCPF, formatarGuarnicao, formatarRelatoAutor, numberToText, fileToBase64 ---
const initialPersonData: Pessoa = {
  nome: "", sexo: "", estadoCivil: "", profissao: "",
  endereco: "", dataNascimento: "", naturalidade: "",
  filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
  celular: "", email: "", laudoPericial: "Não"
};

const formatRepresentacao = (representacao: string): string => {
  if (representacao === "Representa") return "representar";
  if (representacao === "Posteriormente") return "decidir_posteriormente";
  return "";
};

const formatCPF = (cpf: string) => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length <= 11) {
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return cpf;
};

const formatPhone = (phone: string) => {
  phone = phone.replace(/\D/g, '');
  if (phone.length === 11) {
    phone = phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (phone.length === 10) {
    phone = phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (phone.length > 6) {
    phone = phone.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (phone.length > 2) {
    phone = phone.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  }
  return phone;
};

const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) { sum += parseInt(cpf.charAt(i)) * (10 - i); }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) { sum += parseInt(cpf.charAt(i)) * (11 - i); }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digit2 === parseInt(cpf.charAt(10));
};

const formatarGuarnicao = (componentes: ComponenteGuarnicao[]): string => {
  if (!componentes || componentes.length === 0) return "[GUPM PENDENTE]";
  const nomesFormatados = componentes
    .filter(c => c.nome && c.posto)
    .map(c => `${c.posto} PM ${c.nome}`);
  if (nomesFormatados.length === 0) return "[GUPM PENDENTE]";
  if (nomesFormatados.length === 1) return nomesFormatados[0].toUpperCase();
  if (nomesFormatados.length === 2) return `${nomesFormatados[0]} E ${nomesFormatados[1]}`.toUpperCase();
  return `${nomesFormatados.slice(0, -1).join(", ")} E ${nomesFormatados[nomesFormatados.length - 1]}`.toUpperCase();
};

const formatarRelatoAutor = (autores: Pessoa[]): string => {
  if (autores.length === 0 || !autores.some(a => a.nome.trim() !== "")) {
    return "O AUTOR DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.";
  }
  const autoresValidos = autores.filter(a => a.nome.trim() !== "");
  if (autoresValidos.length === 1) {
    const sexo = autoresValidos[0].sexo.toLowerCase();
    const pronome = sexo === "feminino" ? "A AUTORA" : "O AUTOR";
    return `${pronome} DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.`;
  }
  const todosFemininos = autoresValidos.every(a => a.sexo.toLowerCase() === "feminino");
  const pronomePlural = todosFemininos ? "AS AUTORAS" : "OS AUTORES";
  return `${pronomePlural} DOS FATOS ABAIXO ASSINADOS, JÁ QUALIFICADOS NOS AUTOS, CIENTIFICADOS DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLARARAM QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSERAM E NEM LHE FOI PERGUNTADO.`;
};

const numberToText = (num: number): string => {
  const numbers = [
    "ZERO", "UMA", "DUAS", "TRÊS", "QUATRO",
    "CINCO", "SEIS", "SETE", "OITO", "NOVE", "DEZ"
  ];
  return num >= 0 && num <= 10 ? numbers[num] : num.toString();
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
};
// --- END OF Helper Functions ---


const TCOForm: React.FC<TCOFormProps> = ({ selectedTco, onClear }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBucketReady, setIsBucketReady] = useState(false);
  const [isTableReady, setIsTableReady] = useState(false);

  // --- Keep all existing state variables ---
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  const formattedTime = now.toTimeString().slice(0, 5);
  const [tcoNumber, setTcoNumber] = useState("");
  const [natureza, setNatureza] = useState("Vias de Fato");
  const [customNatureza, setCustomNatureza] = useState("");
  const [autor, setAutor] = useState(""); // Note: Primarily driven by autores[0].nome now
  const [representacao, setRepresentacao] = useState("");
  const [tipificacao, setTipificacao] = useState("Art. 21 da Lei de Contravenções Penais");
  const [penaDescricao, setPenaDescricao] = useState("");
  const [dataFato, setDataFato] = useState(formattedDate);
  const [horaFato, setHoraFato] = useState(formattedTime);
  const [dataInicioRegistro, setDataInicioRegistro] = useState(formattedDate);
  const [horaInicioRegistro, setHoraInicioRegistro] = useState(formattedTime);
  const [dataTerminoRegistro, setDataTerminoRegistro] = useState(formattedDate);
  const [horaTerminoRegistro, setHoraTerminoRegistro] = useState(formattedTime);
  const [localFato, setLocalFato] = useState("");
  const [endereco, setEndereco] = useState("");
  const [municipio] = useState("Várzea Grande");
  const [comunicante, setComunicante] = useState("CIOSP");
  const [guarnicao, setGuarnicao] = useState("");
  const [operacao, setOperacao] = useState("");
  const [apreensoes, setApreensoes] = useState("");
  const [lacreNumero, setLacreNumero] = useState("");
  const [componentesGuarnicao, setComponentesGuarnicao] = useState<ComponenteGuarnicao[]>([]);
  const [quantidade, setQuantidade] = useState("");
  const [substancia, setSubstancia] = useState("");
  const [cor, setCor] = useState("");
  const [indicios, setIndicios] = useState("");
  const [customMaterialDesc, setCustomMaterialDesc] = useState("");
  const [isUnknownMaterial, setIsUnknownMaterial] = useState(false);
  const [juizadoEspecialData, setJuizadoEspecialData] = useState("");
  const [juizadoEspecialHora, setJuizadoEspecialHora] = useState("");
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [newVideoLink, setNewVideoLink] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [autores, setAutores] = useState<Pessoa[]>([{ ...initialPersonData }]);
  const [vitimas, setVitimas] = useState<Pessoa[]>([{ ...initialPersonData }]);
  const [testemunhas, setTestemunhas] = useState<Pessoa[]>([{ ...initialPersonData }]);
  const relatoPolicialTemplate = `POR VOLTA DAS [HORÁRIO] DO DIA [DATA], NESTA CIDADE DE VÁRZEA GRANDE-MT, A GUARNIÇÃO DA VIATURA [GUARNIÇÃO][OPERACAO_TEXT] COMPOSTA PELOS MILITARES [GUPM], DURANTE RONDAS NO BAIRRO [BAIRRO], FOI ACIONADA VIA [MEIO DE ACIONAMENTO] PARA ATENDER A UMA OCORRÊNCIA DE [NATUREZA] NO [LOCAL], ONDE [VERSÃO INICIAL]. CHEGANDO NO LOCAL, A EQUIPE [O QUE A PM DEPAROU]. A VERSÃO DAS PARTES FOI REGISTRADA EM CAMPO PRÓPRIO. [VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]. [DILIGÊNCIAS E APREENSÕES REALIZADAS]. DIANTE DISSO, [ENCAMINHAMENTO PARA REGISTRO DOS FATOS].`;
  const [relatoPolicial, setRelatoPolicial] = useState(relatoPolicialTemplate);
  const [relatoAutor, setRelatoAutor] = useState(formatarRelatoAutor(autores));
  const [relatoVitima, setRelatoVitima] = useState("RELATOU A VÍTIMA, ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
  const [relatoTestemunha, setRelatoTestemunha] = useState("A TESTEMUNHA ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, COMPROMISSADA NA FORMA DA LEI, QUE AOS COSTUMES RESPONDEU NEGATIVAMENTE OU QUE É AMIGA/PARENTE DE UMA DAS PARTES, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSERAM E NEM LHE FOI PERGUNTADO.");
  const [conclusaoPolicial, setConclusaoPolicial] = useState("");
  const [isRelatoPolicialManuallyEdited, setIsRelatoPolicialManuallyEdited] = useState(false);
  // --- END OF State Variables ---

  // --- Keep all useEffect hooks ---
  useEffect(() => {
    if (tcoNumber && !isTimerRunning) {
      setStartTime(new Date());
      setIsTimerRunning(true);
    }
  }, [tcoNumber, isTimerRunning]);

  useEffect(() => {
    if (substancia === "Vegetal" && cor !== "Verde") {
      setIsUnknownMaterial(true);
      setIndicios("Material desconhecido");
    } else if (substancia === "Artificial" && (cor !== "Amarelada" && cor !== "Branca")) {
      setIsUnknownMaterial(true);
      setIndicios("Material desconhecido");
    } else {
      setIsUnknownMaterial(false);
      if (substancia === "Vegetal" && cor === "Verde") setIndicios("Maconha");
      else if (substancia === "Artificial" && cor === "Amarelada") setIndicios("Pasta-Base");
      else if (substancia === "Artificial" && cor === "Branca") setIndicios("Cocaína");
      else setIndicios("");
    }
  }, [substancia, cor]);

  useEffect(() => {
    const isDrugCase = natureza === "Porte de drogas para consumo";
    if (isDrugCase) {
      if (indicios) {
        const indicioFinal = isUnknownMaterial && customMaterialDesc ? customMaterialDesc : indicios;
        if (indicioFinal) {
          const quantidadeNum = parseInt(quantidade.match(/\d+/)?.[0] || "1", 10);
          const quantidadeText = quantidadeNum <= 10 ? numberToText(quantidadeNum) : quantidadeNum.toString();
          const plural = quantidadeNum > 1 ? "PORÇÕES" : "PORÇÃO";
          const descriptiveText = isUnknownMaterial
            ? `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA DE MATERIAL DESCONHECIDO, ${customMaterialDesc || "[DESCRIÇÃO]"}, CONFORME FOTO EM ANEXO.`
            : `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA ANÁLOGA A ${indicioFinal.toUpperCase()}, CONFORME FOTO EM ANEXO.`;
          if (!apreensoes || apreensoes.startsWith("[DESCRIÇÃO]") || apreensoes.includes("SUBSTÂNCIA ANÁLOGA A") || apreensoes.includes("MATERIAL DESCONHECIDO")) {
             setApreensoes(descriptiveText);
          }
        }
      }
       // In drug cases, Vítima is usually "O ESTADO" or similar, clear specific victim data if added accidentally
       setVitimas([{ ...initialPersonData, nome: "O ESTADO" }]); // Or clear it: setVitimas([{ ...initialPersonData }]);
       setRepresentacao(""); // No representation needed for drug cases usually
    } else {
        if (apreensoes.includes("SUBSTÂNCIA ANÁLOGA A") || apreensoes.includes("MATERIAL DESCONHECIDO")){
            setApreensoes("");
        }
       setVitimas(prevVitimas => {
         // If nature changes *away* from drugs, reset victim if it was set to "O ESTADO"
         if (prevVitimas.length === 1 && prevVitimas[0].nome === "O ESTADO") {
             return [{ ...initialPersonData }];
         }
         // Otherwise, keep existing victims or ensure one empty slot
         if (prevVitimas.length === 0 || (prevVitimas.length === 1 && !prevVitimas[0].nome && !prevVitimas[0].cpf)) {
           return [{ ...initialPersonData }];
         }
         return prevVitimas;
       });
    }
  }, [natureza, indicios, isUnknownMaterial, customMaterialDesc, quantidade, apreensoes]); // Removed relatoPolicialTemplate

  useEffect(() => {
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "[NATUREZA NÃO ESPECIFICADA]" : natureza;
    let tipificacaoAtual = "";
    let penaAtual = "";
    if (natureza === "Outros") {
      tipificacaoAtual = tipificacao || "[TIPIFICAÇÃO LEGAL A SER INSERIDA]";
      penaAtual = penaDescricao || "";
    } else {
      switch (natureza) {
        case "Ameaça": tipificacaoAtual = "ART. 147 DO CÓDIGO PENAL"; penaAtual = "DETENÇÃO DE 1 A 6 MESES, OU MULTA"; break;
        case "Vias de Fato": tipificacaoAtual = "ART. 21 DA LEI DE CONTRAVENÇÕES PENAIS"; penaAtual = "PRISÃO SIMPLES DE 15 DIAS A 3 MESES, OU MULTA"; break;
        case "Lesão Corporal": tipificacaoAtual = "ART. 129 DO CÓDIGO PENAL"; penaAtual = "DETENÇÃO DE 3 MESES A 1 ANO"; break;
        case "Dano": tipificacaoAtual = "ART. 163 DO CÓDIGO PENAL"; penaAtual = "DETENÇÃO DE 1 A 6 MESES, OU MULTA"; break;
        case "Injúria": tipificacaoAtual = "ART. 140 DO CÓDIGO PENAL"; penaAtual = "DETENÇÃO DE 1 A 6 MESES, OU MULTA"; break;
        case "Difamação": tipificacaoAtual = "ART. 139 DO CÓDIGO PENAL"; penaAtual = "DETENÇÃO DE 3 MESES A 1 ANO, E MULTA"; break;
        case "Calúnia": tipificacaoAtual = "ART. 138 DO CÓDIGO PENAL"; penaAtual = "DETENÇÃO DE 6 MESES A 2 ANOS, E MULTA"; break;
        case "Perturbação do Sossego": tipificacaoAtual = "ART. 42 DA LEI DE CONTRAVENÇÕES PENAIS"; penaAtual = "PRISÃO SIMPLES DE 15 DIAS A 3 MESES, OU MULTA"; break;
        case "Porte de drogas para consumo": tipificacaoAtual = "ART. 28 DA LEI Nº 11.343/2006 (LEI DE DROGAS)"; penaAtual = "ADVERTÊNCIA SOBRE OS EFEITOS DAS DROGAS, PRESTAÇÃO DE SERVIÇOS À COMUNIDADE OU MEDIDA EDUCATIVA DE COMPARECIMENTO A PROGRAMA OU CURSO EDUCATIVO."; break;
        default: tipificacaoAtual = "[TIPIFICAÇÃO NÃO MAPEADA]"; penaAtual = "";
      }
      setTipificacao(tipificacaoAtual);
      setPenaDescricao(penaAtual);
    }
    const autoresValidos = autores.filter(a => a.nome.trim() !== "");
    const autorTexto = autoresValidos.length === 0 ? "O(A) AUTOR(A)" :
      autoresValidos.length === 1 ? (autoresValidos[0].sexo.toLowerCase() === "feminino" ? "A AUTORA" : "O AUTOR") :
      autoresValidos.every(a => a.sexo.toLowerCase() === "feminino") ? "AS AUTORAS" : "OS AUTORES";
    const testemunhasValidas = testemunhas.filter(t => t.nome.trim() !== "");
    const testemunhaTexto = testemunhasValidas.length > 1 ? "TESTEMUNHAS" : (testemunhasValidas.length === 1 ? "TESTEMUNHA" : "");
    const conclusaoBase = `DIANTE DAS CIRCUNSTÂNCIAS E DE TUDO O QUE FOI RELATADO, RESTA ACRESCENTAR QUE ${autorTexto} INFRINGIU, EM TESE, A CONDUTA DE ${displayNaturezaReal.toUpperCase()}, PREVISTA EM ${tipificacaoAtual}. NADA MAIS HAVENDO A TRATAR, DEU-SE POR FINDO O PRESENTE TERMO CIRCUNSTANCIADO DE OCORRÊNCIA QUE VAI DEVIDAMENTE ASSINADO PELAS PARTES${testemunhaTexto ? ` E ${testemunhaTexto}` : ""}, SE HOUVER, E POR MIM, RESPONSÁVEL PELA LAVRATURA, QUE O DIGITEI. E PELO FATO DE ${autorTexto} TER SE COMPROMETIDO A COMPARECER AO JUIZADO ESPECIAL CRIMINAL, ESTE FOI LIBERADO SEM LESÕES CORPORAIS APARENTES, APÓS A ASSINATURA DO TERMO DE COMPROMISSO.`;
    setConclusaoPolicial(conclusaoBase);
  }, [natureza, customNatureza, tipificacao, penaDescricao, autores, testemunhas]); // Removed tipificacao from dependency array to prevent potential loop if natureza="Outros"

   useEffect(() => {
    if (isRelatoPolicialManuallyEdited) return;
    let updatedRelato = relatoPolicialTemplate;
    const bairro = endereco ? endereco.split(',').pop()?.trim() || "[BAIRRO PENDENTE]" : "[BAIRRO PENDENTE]";
    const gupm = formatarGuarnicao(componentesGuarnicao);
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "OUTROS" : natureza;
    const operacaoText = operacao ? `, DURANTE A ${operacao.toUpperCase()},` : "";
    updatedRelato = updatedRelato
      .replace("[HORÁRIO]", horaFato || "[HORÁRIO PENDENTE]")
      .replace("[DATA]", dataFato ? new Date(dataFato + 'T00:00:00Z').toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : "[DATA PENDENTE]")
      .replace("[GUARNIÇÃO]", guarnicao || "[GUARNIÇÃO PENDENTE]")
      .replace("[OPERACAO_TEXT]", operacaoText)
      .replace("[GUPM]", gupm)
      .replace("[BAIRRO]", bairro)
      .replace("[MEIO DE ACIONAMENTO]", comunicante || "[ACIONAMENTO PENDENTE]")
      .replace("[NATUREZA]", displayNaturezaReal.toUpperCase() || "[NATUREZA PENDENTE]")
      .replace("[LOCAL]", localFato || "[LOCAL PENDENTE]")
      .replace("[VERSÃO INICIAL]", "[VERSÃO INICIAL]")
      .replace("[O QUE A PM DEPAROU]", "[O QUE A PM DEPAROU]")
      .replace("[VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]", "[VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]")
      .replace("[DILIGÊNCIAS E APREENSÕES REALIZADAS]", "[DILIGÊNCIAS E APREENSÕES REALIZADAS]")
      .replace("[ENCAMINHAMENTO PARA REGISTRO DOS FATOS]", "[ENCAMINHAMENTO PARA REGISTRO DOS FATOS]");
     if (!isRelatoPolicialManuallyEdited || relatoPolicial === relatoPolicialTemplate) {
       setRelatoPolicial(updatedRelato.toUpperCase());
     } else {
       setRelatoPolicial(updatedRelato);
     }
  }, [horaFato, dataFato, guarnicao, operacao, componentesGuarnicao, endereco, comunicante, natureza, customNatureza, localFato, relatoPolicialTemplate, isRelatoPolicialManuallyEdited, relatoPolicial]); // Added relatoPolicial

  useEffect(() => {
    const novoRelatoAutor = formatarRelatoAutor(autores).toUpperCase();
    if (!relatoAutor.includes('[INSIRA DECLARAÇÃO]') || relatoAutor.startsWith("O AUTOR") || relatoAutor.startsWith("A AUTORA") || relatoAutor.startsWith("OS AUTORES") || relatoAutor.startsWith("AS AUTORAS")) {
      setRelatoAutor(novoRelatoAutor);
    }
  }, [autores, relatoAutor]); // Added relatoAutor

  useEffect(() => {
    const currentFirstAutorName = autores.length > 0 ? autores[0].nome : "";
    if (currentFirstAutorName !== autor) {
      setAutor(currentFirstAutorName); // Update the simple 'autor' state shown in Basic Info
    }
  }, [autores, autor]);

  // Verificar se o bucket e a tabela existem quando o componente é montado
  useEffect(() => {
    const checkSupabaseResources = async () => {
      try {
        // Verificar se o bucket existe
        const bucketName = 'tco-pdfs';
        const bucketExists = await ensureBucketExists(bucketName, { public: true });
        setIsBucketReady(bucketExists);
        
        // Verificar se a tabela existe
        const tableExists = await createTcoPdfsTable();
        setIsTableReady(tableExists);
        
        if (bucketExists && tableExists) {
          console.log('Recursos do Supabase prontos para uso');
        }
      } catch (error) {
        console.error('Erro ao verificar recursos do Supabase:', error);
        toast({ 
          variant: "destructive", 
          title: "Erro na verificação de recursos", 
          description: "Houve um problema ao verificar os recursos no Supabase. Alguns recursos podem não estar disponíveis." 
        });
      }
    };
    
    checkSupabaseResources();
  }, [toast]);
  // --- END OF useEffect hooks ---


  // --- Keep all handler functions ---
  const handleAddPolicialToList = useCallback((novoPolicial: ComponenteGuarnicao) => {
    const alreadyExists = componentesGuarnicao.some(comp => comp.rg === novoPolicial.rg);
    if (!alreadyExists) {
      setComponentesGuarnicao(prevList => {
        const newList = prevList.length === 0 || (prevList.length === 1 && !prevList[0].rg && !prevList[0].nome && !prevList[0].posto)
          ? [novoPolicial]
          : [...prevList, novoPolicial];
        return newList;
      });
      toast({ title: "Adicionado", description: `Policial ${novoPolicial.nome} adicionado à guarnição.` });
    } else {
      toast({ variant: "default", title: "Duplicado", description: "Este policial já está na guarnição." });
    }
  }, [componentesGuarnicao, toast]);

  const handleRemovePolicialFromList = useCallback((indexToRemove: number) => {
    setComponentesGuarnicao(prevList => prevList.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleAddVitima = () => {
    const hasOnlyPlaceholder = vitimas.length === 1 && (!vitimas[0].nome && !vitimas[0].cpf) || (vitimas.length === 1 && vitimas[0].nome === "O ESTADO");
    if (hasOnlyPlaceholder) {
        setVitimas([{ ...initialPersonData }]); // Replace placeholder/Estado
    } else {
        setVitimas(prevVitimas => [...prevVitimas, { ...initialPersonData }]);
    }
  };

  const handleRemoveVitima = (index: number) => {
    const newVitimas = vitimas.filter((_, i) => i !== index);
    if (newVitimas.length === 0) {
      setVitimas([{...initialPersonData}]); // Keep one empty entry
    } else {
      setVitimas(newVitimas);
    }
  };

  const handleAddTestemunha = () => {
     const hasOnlyPlaceholder = testemunhas.length === 1 && !testemunhas[0].nome && !testemunhas[0].cpf;
     if (hasOnlyPlaceholder) {
         setTestemunhas([{ ...initialPersonData }]);
     } else {
         setTestemunhas(prev => [...prev, { ...initialPersonData }]);
     }
  };

  const handleRemoveTestemunha = (index: number) => {
    const newTestemunhas = testemunhas.filter((_, i) => i !== index);
     if (newTestemunhas.length === 0) {
      setTestemunhas([{...initialPersonData}]);
    } else {
      setTestemunhas(newTestemunhas);
    }
  };

  const handleAddAutor = () => {
      const hasOnlyPlaceholder = autores.length === 1 && !autores[0].nome && !autores[0].cpf;
      if (hasOnlyPlaceholder) {
          setAutores([{ ...initialPersonData }]);
      } else {
          setAutores(prev => [...prev, { ...initialPersonData }]);
      }
  };

  const handleRemoveAutor = (index: number) => {
    const newAutores = autores.filter((_, i) => i !== index);
     if (newAutores.length === 0) {
      setAutores([{...initialPersonData}]);
    } else {
      setAutores(newAutores);
    }
    // Update the main 'autor' field if the first author was removed
    if (index === 0) {
         setAutor(newAutores.length > 0 ? newAutores[0].nome : "");
    }
  };

  const handleVitimaChange = (index: number, field: string, value: string) => {
    const newVitimas = [...vitimas];
    let processedValue = value;
    if (field === 'cpf') {
      processedValue = formatCPF(value);
      if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) {
        toast({ variant: "destructive", title: "CPF Inválido (Vítima)", description: "O CPF informado não é válido." });
      }
    } else if (field === 'celular') {
      processedValue = formatPhone(value);
    }
    // If editing the placeholder "O ESTADO", replace it entirely
    if (newVitimas[index].nome === "O ESTADO" && field === 'nome' && value.trim() !== "O ESTADO") {
        newVitimas[index] = { ...initialPersonData, [field]: processedValue };
    } else {
        newVitimas[index] = { ...newVitimas[index], [field]: processedValue };
    }
    setVitimas(newVitimas);
  };

  const handleTestemunhaChange = (index: number, field: string, value: string) => {
    const newTestemunhas = [...testemunhas];
    let processedValue = value;
    if (field === 'cpf') {
      processedValue = formatCPF(value);
      if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) {
        toast({ variant: "destructive", title: "CPF Inválido (Testemunha)", description: "O CPF informado não é válido." });
      }
    } else if (field === 'celular') {
      processedValue = formatPhone(value);
    }
    newTestemunhas[index] = { ...newTestemunhas[index], [field]: processedValue };
    setTestemunhas(newTestemunhas);
  };

  const handleAutorDetalhadoChange = (index: number, field: string, value: string) => {
    const newAutores = [...autores];
    let processedValue = value;
    if (field === 'cpf') {
      processedValue = formatCPF(value);
      if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) {
        toast({ variant: "destructive", title: "CPF Inválido (Autor)", description: "O CPF informado não é válido." });
      }
    } else if (field === 'celular') {
      processedValue = formatPhone(value);
    } else if (field === 'dataNascimento') {
      const birthDate = new Date(value + 'T00:00:00Z');
      if (value && !isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          toast({
            variant: "destructive", 
            title: "Autor menor de idade",
            description: "O autor é menor de 18 anos. Este TCO não é adequado para menores infratores."
          });
        }
      }
    }
    newAutores[index] = { ...newAutores[index], [field]: processedValue };
    setAutores(newAutores);
  };
  
  return (
    <div className="container mx-auto py-4">
      {/* Component JSX goes here */}
    </div>
  );
};

export default TCOForm;
