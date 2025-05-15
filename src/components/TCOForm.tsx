import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Image as ImageIcon, Video as VideoIcon, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import BasicInformationTab from "./tco/BasicInformationTab";
import GeneralInformationTab from "./tco/GeneralInformationTab";
import PessoasEnvolvidasTab from "./tco/PessoasEnvolvidasTab";
import GuarnicaoTab from "./tco/GuarnicaoTab";
import HistoricoTab from "./tco/HistoricoTab";
import DrugVerificationTab from "./tco/DrugVerificationTab";
import { generatePDF } from "./tco/pdfGenerator";
import supabase from "@/lib/supabaseClient";
import { uploadPDF, saveTCOMetadata } from '@/lib/supabaseStorage';
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
interface TCOFormProps {
  selectedTco?: any;
  onClear?: () => void;
}
const initialPersonData: Pessoa = {
  nome: "",
  sexo: "",
  estadoCivil: "",
  profissao: "",
  endereco: "",
  dataNascimento: "",
  naturalidade: "",
  filiacaoMae: "",
  filiacaoPai: "",
  rg: "",
  cpf: "",
  celular: "",
  email: "",
  laudoPericial: "Não"
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
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digit2 === parseInt(cpf.charAt(10));
};
const formatarGuarnicao = (componentes: ComponenteGuarnicao[]): string => {
  if (!componentes || componentes.length === 0) return "[GUPM PENDENTE]";
  const nomesFormatados = componentes.filter(c => c.nome && c.posto).map(c => `${c.posto} PM ${c.nome}`);
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
  const numbers = ["ZERO", "UMA", "DUAS", "TRÊS", "QUATRO", "CINCO", "SEIS", "SETE", "OITO", "NOVE", "DEZ"];
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
const calculateAge = (birthDate: Date, referenceDate: Date) => {
  let years = referenceDate.getFullYear() - birthDate.getFullYear();
  let months = referenceDate.getMonth() - birthDate.getMonth();
  let days = referenceDate.getDate() - birthDate.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return {
    years,
    months,
    days
  };
};
const TCOForm: React.FC<TCOFormProps> = ({
  selectedTco,
  onClear
}) => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMinorAuthor, setHasMinorAuthor] = useState<{
    isMinor: boolean;
    details?: {
      years: number;
      months: number;
      days: number;
      index: number;
    };
  }>({
    isMinor: false
  });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  const formattedTime = now.toTimeString().slice(0, 5);
  const [tcoNumber, setTcoNumber] = useState("");
  const [natureza, setNatureza] = useState("Vias de Fato");
  const [customNatureza, setCustomNatureza] = useState("");
  const [autor, setAutor] = useState("");
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
  const [autores, setAutores] = useState<Pessoa[]>([{
    ...initialPersonData
  }]);
  const [vitimas, setVitimas] = useState<Pessoa[]>([{
    ...initialPersonData
  }]);
  const [testemunhas, setTestemunhas] = useState<Pessoa[]>([{
    ...initialPersonData
  }]);
  const relatoPolicialTemplate = `POR VOLTA DAS [HORÁRIO] DO DIA [DATA], NESTA CIDADE DE VÁRZEA GRANDE-MT, A GUARNIÇÃO DA VIATURA [GUARNIÇÃO][OPERACAO_TEXT] COMPOSTA PELOS MILITARES [GUPM], DURANTE RONDAS NO BAIRRO [BAIRRO], FOI ACIONADA VIA [MEIO DE ACIONAMENTO] PARA ATENDER A UMA OCORRÊNCIA DE [NATUREZA] NO [LOCAL], ONDE [VERSÃO INICIAL]. CHEGANDO NO LOCAL, A EQUIPE [O QUE A PM DEPAROU]. A VERSÃO DAS PARTES FOI REGISTRADA EM CAMPO PRÓPRIO. [VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]. [DILIGÊNCIAS E APREENSÕES REALIZADAS]. DIANTE DISSO, [ENCAMINHAMENTO PARA REGISTRO DOS FATOS].`;
  const [relatoPolicial, setRelatoPolicial] = useState(relatoPolicialTemplate);
  const [relatoAutor, setRelatoAutor] = useState(formatarRelatoAutor(autores));
  const [relatoVitima, setRelatoVitima] = useState("RELATOU A VÍTIMA, ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
  const [relatoTestemunha, setRelatoTestemunha] = useState("A TESTEMUNHA ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, COMPROMISSADA NA FORMA DA LEI, QUE AOS COSTUMES RESPONDEU NEGATIVAMENTE OU QUE É AMIGA/PARENTE DE UMA DAS PARTES, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSERAM E NEM LHE FOI PERGUNTADO.");
  const [conclusaoPolicial, setConclusaoPolicial] = useState("");
  const [isRelatoPolicialManuallyEdited, setIsRelatoPolicialManuallyEdited] = useState(false);
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
    } else if (substancia === "Artificial" && cor !== "Amarelada" && cor !== "Branca") {
      setIsUnknownMaterial(true);
      setIndicios("Material desconhecido");
    } else {
      setIsUnknownMaterial(false);
      if (substancia === "Vegetal" && cor === "Verde") setIndicios("Maconha");else if (substancia === "Artificial" && cor === "Amarelada") setIndicios("Pasta-Base");else if (substancia === "Artificial" && cor === "Branca") setIndicios("Cocaína");else setIndicios("");
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
          const descriptiveText = isUnknownMaterial ? `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA DE MATERIAL DESCONHECIDO, ${customMaterialDesc || "[DESCRIÇÃO]"}, CONFORME FOTO EM ANEXO.` : `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA ANÁLOGA A ${indicioFinal.toUpperCase()}, CONFORME FOTO EM ANEXO.`;
          if (!apreensoes || apreensoes.startsWith("[DESCRIÇÃO]") || apreensoes.includes("SUBSTÂNCIA ANÁLOGA A") || apreensoes.includes("MATERIAL DESCONHECIDO")) {
            setApreensoes(descriptiveText);
          }
        }
      }
      setVitimas([{
        ...initialPersonData,
        nome: "O ESTADO"
      }]);
      setRepresentacao("");
    } else {
      if (apreensoes.includes("SUBSTÂNCIA ANÁLOGA A") || apreensoes.includes("MATERIAL DESCONHECIDO")) {
        setApreensoes("");
      }
      setVitimas(prevVitimas => {
        if (prevVitimas.length === 1 && prevVitimas[0].nome === "O ESTADO") {
          return [{
            ...initialPersonData
          }];
        }
        if (prevVitimas.length === 0 || prevVitimas.length === 1 && !prevVitimas[0].nome && !prevVitimas[0].cpf) {
          return [{
            ...initialPersonData
          }];
        }
        return prevVitimas;
      });
    }
  }, [natureza, indicios, isUnknownMaterial, customMaterialDesc, quantidade, apreensoes]);
  useEffect(() => {
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "[NATUREZA NÃO ESPECIFICADA]" : natureza;
    let tipificacaoAtual = "";
    let penaAtual = "";
    if (natureza === "Outros") {
      tipificacaoAtual = tipificacao || "[TIPIFICAÇÃO LEGAL A SER INSERIDA]";
      penaAtual = penaDescricao || "";
    } else {
      switch (natureza) {
        case "Ameaça":
          tipificacaoAtual = "ART. 147 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 1 A 6 MESES, OU MULTA";
          break;
        case "Vias de Fato":
          tipificacaoAtual = "ART. 21 DA LEI DE CONTRAVENÇÕES PENAIS";
          penaAtual = "PRISÃO SIMPLES DE 15 DIAS A 3 MESES, OU MULTA";
          break;
        case "Lesão Corporal":
          tipificacaoAtual = "ART. 129 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 3 MESES A 1 ANO";
          break;
        case "Dano":
          tipificacaoAtual = "ART. 163 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 1 A 6 MESES, OU MULTA";
          break;
        case "Injúria":
          tipificacaoAtual = "ART. 140 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 1 A 6 MESES, OU MULTA";
          break;
        case "Difamação":
          tipificacaoAtual = "ART. 139 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 3 MESES A 1 ANO, E MULTA";
          break;
        case "Calúnia":
          tipificacaoAtual = "ART. 138 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 6 MESES A 2 ANOS, E MULTA";
          break;
        case "Perturbação do Sossego":
          tipificacaoAtual = "ART. 42 DA LEI DE CONTRAVENÇÕES PENAIS";
          penaAtual = "PRISÃO SIMPLES DE 15 DIAS A 3 MESES, OU MULTA";
          break;
        case "Porte de drogas para consumo":
          tipificacaoAtual = "ART. 28 DA LEI Nº 11.343/2006 (LEI DE DROGAS)";
          penaAtual = "ADVERTÊNCIA SOBRE OS EFEITOS DAS DROGAS, PRESTAÇÃO DE SERVIÇOS À COMUNIDADE OU MEDIDA EDUCATIVA DE COMPARECIMENTO A PROGRAMA OU CURSO EDUCATIVO.";
          break;
        default:
          tipificacaoAtual = "[TIPIFICAÇÃO NÃO MAPEADA]";
          penaAtual = "";
      }
      setTipificacao(tipificacaoAtual);
      setPenaDescricao(penaAtual);
    }
    const autoresValidos = autores.filter(a => a.nome.trim() !== "");
    const autorTexto = autoresValidos.length === 0 ? "O(A) AUTOR(A)" : autoresValidos.length === 1 ? autoresValidos[0].sexo.toLowerCase() === "feminino" ? "A AUTORA" : "O AUTOR" : autoresValidos.every(a => a.sexo.toLowerCase() === "feminino") ? "AS AUTORAS" : "OS AUTORES";
    const testemunhasValidas = testemunhas.filter(t => t.nome.trim() !== "");
    const testemunhaTexto = testemunhasValidas.length > 1 ? "TESTEMUNHAS" : testemunhasValidas.length === 1 ? "TESTEMUNHA" : "";
    const conclusaoBase = `DIANTE DAS CIRCUNSTÂNCIAS E DE TUDO O QUE FOI RELATADO, RESTA ACRESCENTAR QUE ${autorTexto} INFRINGIU, EM TESE, A CONDUTA DE ${displayNaturezaReal.toUpperCase()}, PREVISTA EM ${tipificacaoAtual}. NADA MAIS HAVENDO A TRATAR, DEU-SE POR FINDO O PRESENTE TERMO CIRCUNSTANCIADO DE OCORRÊNCIA QUE VAI DEVIDAMENTE ASSINADO PELAS PARTES${testemunhaTexto ? ` E ${testemunhaTexto}` : ""}, SE HOUVER, E POR MIM, RESPONSÁVEL PELA LAVRATURA, QUE O DIGITEI. E PELO FATO DE ${autorTexto} TER SE COMPROMETIDO A COMPARECER AO JUIZADO ESPECIAL CRIMINAL, ESTE FOI LIBERADO SEM LESÕES CORPORAIS APARENTES, APÓS A ASSINATURA DO TERMO DE COMPROMISSO.`;
    setConclusaoPolicial(conclusaoBase);
  }, [natureza, customNatureza, tipificacao, penaDescricao, autores, testemunhas]);
  useEffect(() => {
    if (isRelatoPolicialManuallyEdited) return;
    let updatedRelato = relatoPolicialTemplate;
    const bairro = endereco ? endereco.split(',').pop()?.trim() || "[BAIRRO PENDENTE]" : "[BAIRRO PENDENTE]";
    const gupm = formatarGuarnicao(componentesGuarnicao);
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "[NATUREZA PENDENTE]" : natureza;
    const operacaoText = operacao ? `, DURANTE A ${operacao.toUpperCase()},` : "";
    updatedRelato = updatedRelato.replace("[HORÁRIO]", horaFato || "[HORÁRIO PENDENTE]").replace("[DATA]", dataFato ? new Date(dataFato + 'T00:00:00Z').toLocaleDateString('pt-BR', {
      timeZone: 'UTC'
    }) : "[DATA PENDENTE]").replace("[GUARNIÇÃO]", guarnicao || "[GUARNIÇÃO PENDENTE]").replace("[OPERACAO_TEXT]", operacaoText).replace("[GUPM]", gupm).replace("[BAIRRO]", bairro).replace("[MEIO DE ACIONAMENTO]", comunicante || "[ACIONAMENTO PENDENTE]").replace("[NATUREZA]", displayNaturezaReal.toUpperCase() || "[NATUREZA PENDENTE]").replace("[LOCAL]", localFato || "[LOCAL PENDENTE]").replace("[VERSÃO INICIAL]", "[VERSÃO INICIAL]").replace("[O QUE A PM DEPAROU]", "[O QUE A PM DEPAROU]").replace("[VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]", "[VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]").replace("[DILIGÊNCIAS E APREENSÕES REALIZADAS]", "[DILIGÊNCIAS E APREENSÕES REALIZADAS]").replace("[ENCAMINHAMENTO PARA REGISTRO DOS FATOS]", "[ENCAMINHAMENTO PARA REGISTRO DOS FATOS]");
    if (!isRelatoPolicialManuallyEdited || relatoPolicial === relatoPolicialTemplate) {
      setRelatoPolicial(updatedRelato.toUpperCase());
    } else {
      setRelatoPolicial(updatedRelato);
    }
  }, [horaFato, dataFato, guarnicao, operacao, componentesGuarnicao, endereco, comunicante, natureza, customNatureza, localFato, relatoPolicialTemplate, isRelatoPolicialManuallyEdited, relatoPolicial]);
  useEffect(() => {
    const novoRelatoAutor = formatarRelatoAutor(autores).toUpperCase();
    if (!relatoAutor.includes('[INSIRA DECLARAÇÃO]') || relatoAutor.startsWith("O AUTOR") || relatoAutor.startsWith("A AUTORA") || relatoAutor.startsWith("OS AUTORES") || relatoAutor.startsWith("AS AUTORAS")) {
      setRelatoAutor(novoRelatoAutor);
    }
  }, [autores, relatoAutor]);
  useEffect(() => {
    const currentFirstAutorName = autores.length > 0 ? autores[0].nome : "";
    if (currentFirstAutorName !== autor) {
      setAutor(currentFirstAutorName);
    }
  }, [autores, autor]);
  const handleAddPolicialToList = useCallback((novoPolicial: ComponenteGuarnicao) => {
    const alreadyExists = componentesGuarnicao.some(comp => comp.rg === novoPolicial.rg);
    if (!alreadyExists) {
      setComponentesGuarnicao(prevList => {
        const newList = prevList.length === 0 || prevList.length === 1 && !prevList[0].rg && !prevList[0].nome && !prevList[0].posto ? [novoPolicial] : [...prevList, novoPolicial];
        return newList;
      });
      toast({
        title: "Adicionado",
        description: `Policial ${novoPolicial.nome} adicionado à guarnição.`,
        className: "bg-green-600 text-white border-green-700",
        duration: 5000
      });
    } else {
      toast({
        title: "Duplicado",
        description: "Este policial já está na guarnição.",
        className: "bg-yellow-600 text-white border-yellow-700",
        duration: 5000
      });
    }
  }, [componentesGuarnicao, toast]);
  const handleRemovePolicialFromList = useCallback((indexToRemove: number) => {
    setComponentesGuarnicao(prevList => prevList.filter((_, index) => index !== indexToRemove));
  }, []);
  const handleAddVitima = () => {
    const hasOnlyPlaceholder = vitimas.length === 1 && !vitimas[0].nome && !vitimas[0].cpf || vitimas.length === 1 && vitimas[0].nome === "O ESTADO";
    if (hasOnlyPlaceholder) {
      setVitimas([{
        ...initialPersonData
      }]);
    } else {
      setVitimas(prevVitimas => [...prevVitimas, {
        ...initialPersonData
      }]);
    }
  };
  const handleRemoveVitima = (index: number) => {
    const newVitimas = vitimas.filter((_, i) => i !== index);
    if (newVitimas.length === 0) {
      setVitimas([{
        ...initialPersonData
      }]);
    } else {
      setVitimas(newVitimas);
    }
  };
  const handleAddTestemunha = () => {
    const hasOnlyPlaceholder = testemunhas.length === 1 && !testemunhas[0].nome && !testemunhas[0].cpf;
    if (hasOnlyPlaceholder) {
      setTestemunhas([{
        ...initialPersonData
      }]);
    } else {
      setTestemunhas(prev => [...prev, {
        ...initialPersonData
      }]);
    }
  };
  const handleRemoveTestemunha = (index: number) => {
    const newTestemunhas = testemunhas.filter((_, i) => i !== index);
    if (newTestemunhas.length === 0) {
      setTestemunhas([{
        ...initialPersonData
      }]);
    } else {
      setTestemunhas(newTestemunhas);
    }
  };
  const handleAddAutor = () => {
    const hasOnlyPlaceholder = autores.length === 1 && !autores[0].nome && !autores[0].cpf;
    if (hasOnlyPlaceholder) {
      setAutores([{
        ...initialPersonData
      }]);
    } else {
      setAutores(prev => [...prev, {
        ...initialPersonData
      }]);
    }
  };
  const handleRemoveAutor = (index: number) => {
    const newAutores = autores.filter((_, i) => i !== index);
    if (newAutores.length === 0) {
      setAutores([{
        ...initialPersonData
      }]);
    } else {
      setAutores(newAutores);
    }
    if (index === 0) {
      setAutor(newAutores.length > 0 ? newAutores[0].nome : "");
    }
    // Recalculate minor status
    const today = new Date();
    const minorAuthor = newAutores.find((autor, idx) => {
      if (autor.dataNascimento) {
        const birthDate = new Date(autor.dataNascimento + 'T00:00:00Z');
        if (!isNaN(birthDate.getTime())) {
          const age = calculateAge(birthDate, today);
          return age.years < 18;
        }
      }
      return false;
    });
    setHasMinorAuthor({
      isMinor: !!minorAuthor
    });
  };
  const handleVitimaChange = (index: number, field: string, value: string) => {
    const newVitimas = [...vitimas];
    let processedValue = value;
    if (field === 'cpf') {
      processedValue = formatCPF(value);
      if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) {
        toast({
          title: "CPF Inválido (Vítima)",
          description: "O CPF informado não é válido.",
          className: "bg-red-600 text-white border-red-700",
          duration: 7000
        });
      }
    } else if (field === 'celular') {
      processedValue = formatPhone(value);
    }
    if (newVitimas[index].nome === "O ESTADO" && field === 'nome' && value.trim() !== "O ESTADO") {
      newVitimas[index] = {
        ...initialPersonData,
        [field]: processedValue
      };
    } else {
      newVitimas[index] = {
        ...newVitimas[index],
        [field]: processedValue
      };
    }
    setVitimas(newVitimas);
  };
  const handleTestemunhaChange = (index: number, field: string, value: string) => {
    const newTestemunhas = [...testemunhas];
    let processedValue = value;
    if (field === 'cpf') {
      processedValue = formatCPF(value);
      if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) {
        toast({
          title: "CPF Inválido (Testemunha)",
          description: "O CPF informado não é válido.",
          className: "bg-red-600 text-white border-red-700",
          duration: 7000
        });
      }
    } else if (field === 'celular') {
      processedValue = formatPhone(value);
    }
    newTestemunhas[index] = {
      ...newTestemunhas[index],
      [field]: processedValue
    };
    setTestemunhas(newTestemunhas);
  };
  const handleAutorDetalhadoChange = (index: number, field: string, value: string) => {
    const newAutores = [...autores];
    let processedValue = value;
    if (field === 'cpf') {
      processedValue = formatCPF(value);
      if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) {
        toast({
          title: "CPF Inválido (Autor)",
          description: "O CPF informado não é válido.",
          className: "bg-red-600 text-white border-red-700",
          duration: 7000
        });
      }
    } else if (field === 'celular') {
      processedValue = formatPhone(value);
    } else if (field === 'dataNascimento') {
      processedValue = value;
      const birthDate = new Date(value + 'T00:00:00Z');
      if (value && !isNaN(birthDate.getTime())) {
        const today = new Date();
        const age = calculateAge(birthDate, today);
        if (age.years < 18) {
          setHasMinorAuthor({
            isMinor: true,
            details: {
              years: age.years,
              months: age.months,
              days: age.days,
              index
            }
          });
          toast({
            title: "Autor Menor de Idade",
            description: `O autor ${autores[index].nome || 'sem nome'} possui ${age.years} anos, ${age.months} meses e ${age.days} dias. TCO não pode ser registrado para menores de 18 anos.`,
            className: "bg-red-600 text-white border-red-700",
            duration: 10000
          });
        } else {
          setHasMinorAuthor(prev => prev.details?.index === index ? {
            isMinor: false
          } : prev);
        }
      } else {
        setHasMinorAuthor(prev => prev.details?.index === index ? {
          isMinor: false
        } : prev);
      }
    }
    newAutores[index] = {
      ...newAutores[index],
      [field]: processedValue
    };
    setAutores(newAutores);
    if (index === 0 && field === 'nome') {
      setAutor(processedValue);
    }
  };
  const handleRelatoPolicialChange = (value: string) => {
    setRelatoPolicial(value);
    if (value !== relatoPolicialTemplate && !value.includes("[HORÁRIO]")) {
      setIsRelatoPolicialManuallyEdited(true);
    }
  };
  const handleAddVideoLink = () => {
    if (newVideoLink.trim() && !videoLinks.includes(newVideoLink.trim())) {
      if (!/^(https?:\/\/)/i.test(newVideoLink.trim())) {
        toast({
          title: "Link Inválido",
          description: "Por favor, insira um link válido começando com http:// ou https://.",
          className: "bg-yellow-600 text-white border-yellow-700",
          duration: 7000
        });
        return;
      }
      setVideoLinks(prev => [...prev, newVideoLink.trim()]);
      setNewVideoLink("");
      toast({
        title: "Link Adicionado",
        description: "Link de vídeo adicionado com sucesso.",
        className: "bg-green-600 text-white border-green-700",
        duration: 5000
      });
    } else if (!newVideoLink.trim()) {
      toast({
        title: "Link Vazio",
        description: "Por favor, insira um link.",
        className: "bg-yellow-600 text-white border-yellow-700",
        duration: 5000
      });
    } else {
      toast({
        title: "Link Duplicado",
        description: "Este link já foi adicionado.",
        className: "bg-yellow-600 text-white border-yellow-700",
        duration: 5000
      });
    }
  };
  const handleRemoveVideoLink = (index: number) => {
    setVideoLinks(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Link Removido",
      description: "Link de vídeo removido com sucesso.",
      className: "bg-green-600 text-white border-green-700",
      duration: 5000
    });
  };
  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const uniqueNewFiles = newFiles.filter(file => !imageFiles.some(existingFile => existingFile.name === file.name && existingFile.size === file.size));
      if (uniqueNewFiles.length > 0) {
        setImageFiles(prevFiles => [...prevFiles, ...uniqueNewFiles]);
        toast({
          title: `${uniqueNewFiles.length} Imagem(ns) Adicionada(s)`,
          description: "Imagens selecionadas para anexo.",
          className: "bg-green-600 text-white border-green-700",
          duration: 5000
        });
      } else if (newFiles.length > 0) {
        toast({
          title: "Imagens Duplicadas",
          description: "Algumas ou todas as imagens selecionadas já foram adicionadas.",
          className: "bg-yellow-600 text-white border-yellow-700",
          duration: 5000
        });
      }
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };
  const handleRemoveImageFile = (index: number) => {
    setImageFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    toast({
      title: "Imagem Removida",
      description: "Imagem removida da lista de anexos.",
      className: "bg-green-600 text-white border-green-700",
      duration: 5000
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasMinorAuthor.isMinor) {
      toast({
        title: "Submissão Bloqueada",
        description: `Não é possível registrar o TCO porque o autor ${autores[hasMinorAuthor.details!.index].nome || 'sem nome'} é menor de idade (${hasMinorAuthor.details!.years} anos, ${hasMinorAuthor.details!.months} meses, ${hasMinorAuthor.details!.days} dias).`,
        className: "bg-red-600 text-white border-red-700",
        duration: 10000
      });
      return;
    }
    
    const completionNow = new Date();
    const completionDate = completionNow.toISOString().split('T')[0];
    const completionTime = completionNow.toTimeString().slice(0, 5);
    const autoresValidos = autores.filter(a => a.nome?.trim());
    if (!tcoNumber.trim()) {
      toast({
        title: "Campo Obrigatório",
        description: "O número do TCO é obrigatório.",
        className: "bg-red-600 text-white border-red-700",
        duration: 7000
      });
      return;
    }
    if (natureza === "Selecione...") {
      toast({
        title: "Campo Obrigatório",
        description: "Selecione a Natureza da Ocorrência.",
        className: "bg-red-600 text-white border-red-700",
        duration: 7000
      });
      return;
    }
    if (natureza === "Outros" && !customNatureza.trim()) {
      toast({
        title: "Campo Obrigatório",
        description: "Descreva a Natureza em 'Outros'.",
        className: "bg-red-600 text-white border-red-700",
        duration: 7000
      });
      return;
    }
    if (autoresValidos.length === 0) {
      toast({
        title: "Campo Obrigatório",
        description: "Adicione pelo menos um Autor com nome.",
        className: "bg-red-600 text-white border-red-700",
        duration: 7000
      });
      return;
    }
    const componentesValidos = componentesGuarnicao.filter(c => c.nome?.trim() && c.rg?.trim());
    if (componentesValidos.length === 0) {
      toast({
        title: "Campo Obrigatório",
        description: "Adicione pelo menos um Componente da Guarnição válido (Nome e RG).",
        className: "bg-red-600 text-white border-red-700",
        duration: 7000
      });
      return;
    }
    if (natureza === "Porte de drogas para consumo" && (!quantidade.trim() || !substancia || !cor || isUnknownMaterial && !customMaterialDesc.trim() || !lacreNumero.trim())) {
      toast({
        title: "Dados da Droga Incompletos",
        description: "Para Porte de Drogas, preencha Quantidade, Substância, Cor, Número do Lacre e Descrição (se material desconhecido).",
        className: "bg-red-600 text-white border-red-700",
        duration: 7000
      });
      return;
    }
    setIsSubmitting(true);
    setIsTimerRunning(false);
    try {
      const displayNaturezaReal = natureza === "Outros" ? customNatureza.trim() : natureza;
      const indicioFinalDroga = natureza === "Porte de drogas para consumo" ? isUnknownMaterial ? customMaterialDesc.trim() : indicios : "";
      const vitimasFiltradas = vitimas.filter(v => v.nome?.trim() || v.cpf?.trim());
      const testemunhasFiltradas = testemunhas.filter(t => t.nome?.trim() || t.cpf?.trim());
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = userInfo.id || null;
      const userRegistration = userInfo.registration || "";
      const imageBase64Array: {
        name: string;
        data: string;
      }[] = [];
      for (const file of imageFiles) {
        try {
          const base64Data = await fileToBase64(file);
          imageBase64Array.push({
            name: file.name,
            data: base64Data
          });
        } catch (error) {
          console.error(`Erro ao converter imagem ${file.name} para base64:`, error);
          toast({
            title: "Erro ao Processar Imagem",
            description: `Não foi possível processar a imagem ${file.name}. Ela não será incluída.`,
            className: "bg-red-600 text-white border-red-700",
            duration: 7000
          });
        }
      }
      const tcoDataParaPDF: any = {
        tcoNumber: tcoNumber.trim(),
        natureza: displayNaturezaReal,
        originalNatureza: natureza,
        customNatureza: customNatureza.trim(),
        tipificacao: tipificacao.trim(),
        penaDescricao: penaDescricao.trim(),
        dataFato,
        horaFato,
        dataInicioRegistro,
        horaInicioRegistro,
        dataTerminoRegistro: completionDate,
        horaTerminoRegistro: completionTime,
        localFato: localFato.trim(),
        endereco: endereco.trim(),
        municipio,
        comunicante,
        autores: autoresValidos,
        vitimas: vitimasFiltradas,
        testemunhas: testemunhasFiltradas,
        guarnicao: guarnicao.trim(),
        operacao: operacao.trim(),
        componentesGuarnicao: componentesValidos,
        relatoPolicial: relatoPolicial.trim(),
        relatoAutor: relatoAutor.trim(),
        relatoTestemunha: relatoTestemunha.trim(),
        apreensoes: apreensoes.trim(),
        conclusaoPolicial: conclusaoPolicial.trim(),
        lacreNumero: natureza === "Porte de drogas para consumo" ? lacreNumero.trim() : undefined,
        drogaQuantidade: natureza === "Porte de drogas para consumo" ? quantidade.trim() : undefined,
        drogaTipo: natureza === "Porte de drogas para consumo" ? substancia : undefined,
        drogaCor: natureza === "Porte de drogas para consumo" ? cor : undefined,
        drogaNomeComum: natureza === "Porte de drogas para consumo" ? indicioFinalDroga : undefined,
        drogaCustomDesc: natureza === "Porte de drogas para consumo" && isUnknownMaterial ? customMaterialDesc.trim() : undefined,
        drogaIsUnknown: natureza === "Porte de drogas para consumo" ? isUnknownMaterial : undefined,
        startTime: startTime?.toISOString(),
        endTime: completionNow.toISOString(),
        userRegistration: userRegistration,
        videoLinks: videoLinks,
        imageBase64: imageBase64Array,
        juizadoEspecialData: juizadoEspecialData.trim() || undefined,
        juizadoEspecialHora: juizadoEspecialHora.trim() || undefined,
        relatoVitima: vitimasFiltradas.length > 0 && vitimasFiltradas[0].nome !== 'O ESTADO' ? relatoVitima.trim() : undefined,
        representacao: vitimasFiltradas.length > 0 && vitimasFiltradas[0].nome !== 'O ESTADO' && representacao ? formatRepresentacao(representacao) : undefined,
        downloadLocal: true
      };
      Object.keys(tcoDataParaPDF).forEach(key => tcoDataParaPDF[key] === undefined && delete tcoDataParaPDF[key]);
      console.log("Dados para gerar PDF:", tcoDataParaPDF);
      
      // Generate the PDF
      const pdfGenerationPromise = generatePDF(tcoDataParaPDF);
      const timeoutPromise = new Promise<Blob>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido ao gerar o PDF.")), 90000);
      });
      const pdfBlob = await Promise.race([pdfGenerationPromise, timeoutPromise]);
      
      if (!pdfBlob || pdfBlob.size === 0) throw new Error("Falha ao gerar o PDF. O arquivo está vazio.");
      console.log("PDF gerado, tamanho:", pdfBlob.size, "tipo:", pdfBlob.type);
      
      const tcoNumParaNome = tcoNumber.trim();
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `TCO_${tcoNumParaNome}_${dateStr}.pdf`;
      const filePath = `tcos/${userId || 'anonimo'}/${tcoNumParaNome}_${dateStr}.pdf`;
      
      // Upload the PDF to Supabase Storage using our utility function
      const { url: downloadURL, error: uploadError } = await uploadPDF(filePath, pdfBlob, {
        tcoNumber: tcoNumParaNome,
        natureza: displayNaturezaReal,
        createdBy: userId || 'anonimo'
      });
      
      if (uploadError) throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`);
      if (!downloadURL) throw new Error("URL do arquivo não disponível após o upload.");
      
      console.log('URL pública do arquivo:', downloadURL);
      
      // Save metadata to Supabase database
      const tcoMetadata = {
        tcoNumber: tcoNumber.trim(),
        natureza: displayNaturezaReal,
        policiais: componentesValidos.map(p => ({
          nome: p.nome,
          rg: p.rg,
          posto: p.posto
        })),
        pdfPath: filePath,
        pdfUrl: downloadURL,
        createdBy: userId,
        createdAt: new Date().toISOString()
      };
      
      console.log("Metadados para salvar no DB:", tcoMetadata);
      
      // Save metadata using our utility function
      const { error: metadataError } = await saveTCOMetadata(tcoMetadata);
      
      if (metadataError) {
        console.error("Erro ao salvar metadados no Supabase DB:", metadataError);
        throw new Error(`Erro ao salvar informações do TCO: ${metadataError.message || metadataError}`);
      }
      
      console.log("Metadados salvos com sucesso no DB");
      
      toast({
        title: "TCO Registrado com Sucesso!",
        description: "PDF enviado e informações salvas no sistema.",
        className: "bg-green-600 text-white border-green-700",
        duration: 5000
      });
      
      navigate("/?tab=tco");
      
    } catch (error: any) {
      console.error("Erro geral no processo de submissão do TCO:", error);
      toast({
        title: "Erro ao Finalizar TCO",
        description: `Ocorreu um erro: ${error.message || 'Erro desconhecido.'}`,
        className: "bg-red-600 text-white border-red-700",
        duration: 10000
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' && (target as HTMLButtonElement).type === 'submit') return;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
        e.preventDefault();
      }
    }
  };
  const naturezaOptions = ["Ameaça", "Vias de Fato", "Lesão Corporal", "Dano", "Injúria", "Difamação", "Calúnia", "Perturbação do Sossego", "Porte de drogas para consumo", "Outros"];
  const condutorParaDisplay = componentesGuarnicao.find(c => c.nome && c.rg);
  return <div className="container px-4 py-6 md:py-10 max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6" noValidate>
        {hasMinorAuthor.isMinor && hasMinorAuthor.details && <div className="bg-red-100 border-l-4 border-red-600 text-red-700 p-4 rounded-md mb-6 shadow-md">
            <p className="font-semibold">Atenção: Autor Menor de Idade Detectado</p>
            <p>
              O autor {autores[hasMinorAuthor.details.index].nome || 'sem nome'} possui {hasMinorAuthor.details.years} anos,{' '}
              {hasMinorAuthor.details.months} meses e {hasMinorAuthor.details.days} dias. Não é permitido registrar TCO para menores de 18 anos.
            </p>
          </div>}

        <Card>
          
          <CardContent>
            <BasicInformationTab tcoNumber={tcoNumber} setTcoNumber={setTcoNumber} natureza={natureza} setNatureza={setNatureza} autor={autor} setAutor={setAutor} penaDescricao={penaDescricao} naturezaOptions={naturezaOptions} customNatureza={customNatureza} setCustomNatureza={setCustomNatureza} startTime={startTime} isTimerRunning={isTimerRunning} juizadoEspecialData={juizadoEspecialData} setJuizadoEspecialData={setJuizadoEspecialData} juizadoEspecialHora={juizadoEspecialHora} setJuizadoEspecialHora={setJuizadoEspecialHora} />
          </CardContent>
        </Card>

        {natureza === "Porte de drogas para consumo" && <Card>
            <CardHeader>
              <CardTitle>Verificação de Entorpecente</CardTitle>
              <CardDescription>Detalhes sobre a substância apreendida.</CardDescription>
            </CardHeader>
            <CardContent>
              <DrugVerificationTab quantidade={quantidade} setQuantidade={setQuantidade} substancia={substancia} setSubstancia={setSubstancia} cor={cor} setCor={setCor} indicios={indicios} customMaterialDesc={customMaterialDesc} setCustomMaterialDesc={setCustomMaterialDesc} isUnknownMaterial={isUnknownMaterial} lacreNumero={lacreNumero} setLacreNumero={setLacreNumero} />
            </CardContent>
        </Card>}

        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais da Ocorrência</CardTitle>
            <CardDescription>Detalhes sobre local, data, hora, acionamento e tipificação legal.</CardDescription>
          </CardHeader>
          <CardContent>
            <GeneralInformationTab natureza={natureza} tipificacao={tipificacao} setTipificacao={setTipificacao} isCustomNatureza={natureza === "Outros"} customNatureza={customNatureza} dataFato={dataFato} setDataFato={setDataFato} horaFato={horaFato} setHoraFato={setHoraFato} dataInicioRegistro={dataInicioRegistro} horaInicioRegistro={horaInicioRegistro} dataTerminoRegistro={dataTerminoRegistro} horaTerminoRegistro={horaTerminoRegistro} localFato={localFato} setLocalFato={setLocalFato} endereco={endereco} setEndereco={setEndereco} municipio={municipio} comunicante={comunicante} setComunicante={setComunicante} guarnicao={guarnicao} setGuarnicao={setGuarnicao} operacao={operacao} setOperacao={setOperacao} condutorNome={condutorParaDisplay?.nome || ""} condutorPosto={condutorParaDisplay?.posto || ""} condutorRg={condutorParaDisplay?.rg || ""} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pessoas Envolvidas</CardTitle>
            <CardDescription>Detalhes sobre Autores, Vítimas e Testemunhas.</CardDescription>
          </CardHeader>
          <CardContent>
            <PessoasEnvolvidasTab vitimas={vitimas} handleVitimaChange={handleVitimaChange} handleAddVitima={handleAddVitima} handleRemoveVitima={handleRemoveVitima} testemunhas={testemunhas} handleTestemunhaChange={handleTestemunhaChange} handleAddTestemunha={handleAddTestemunha} handleRemoveTestemunha={handleRemoveTestemunha} autores={autores} handleAutorDetalhadoChange={handleAutorDetalhadoChange} handleAddAutor={handleAddAutor} handleRemoveAutor={handleRemoveAutor} natureza={natureza} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guarnição Policial</CardTitle>
            <CardDescription>Componentes da equipe que atendeu a ocorrência.</CardDescription>
          </CardHeader>
          <CardContent>
            <GuarnicaoTab currentGuarnicaoList={componentesGuarnicao} onAddPolicial={handleAddPolicialToList} onRemovePolicial={handleRemovePolicialFromList} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico e Narrativas</CardTitle>
            <CardDescription>Relatos, apreensões, conclusão e manifestação da vítima.</CardDescription>
          </CardHeader>
          <CardContent>
             <HistoricoTab relatoPolicial={relatoPolicial} setRelatoPolicial={handleRelatoPolicialChange} relatoAutor={relatoAutor} setRelatoAutor={setRelatoAutor} relatoVitima={relatoVitima} setRelatoVitima={setRelatoVitima} relatoTestemunha={relatoTestemunha} setRelatoTestemunha={setRelatoTestemunha} apreensoes={apreensoes} setApreensoes={setApreensoes} conclusaoPolicial={conclusaoPolicial} setConclusaoPolicial={setConclusaoPolicial} drugSeizure={natureza === "Porte de drogas para consumo"} representacao={representacao} setRepresentacao={setRepresentacao} natureza={natureza} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anexos (Opcional)</CardTitle>
            <CardDescription>Adicione fotos ou links de vídeos relacionados à ocorrência.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
               <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col space-y-4 hover:border-blue-500 transition-colors duration-200 ease-in-out">
                   <div className="flex flex-col items-center text-center">
                       <ImageIcon className="w-12 h-12 text-blue-600 mb-2" />
                       <h3 className="text-lg font-medium text-gray-700">Fotos</h3>
                       <p className="text-sm text-gray-500 px-4 mt-1">
                           Anexe imagens relevantes (JPG, PNG, GIF). Serão incluídas no PDF.
                       </p>
                   </div>
                 <input type="file" multiple accept="image/jpeg, image/png, image/gif" ref={imageInputRef} onChange={handleImageFileChange} className="hidden" id="imageUpload" />
                 <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()} className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto mx-auto" aria-label="Selecionar imagens para anexar">
                   <Plus className="mr-2 h-5 w-5" />
                   Selecionar Fotos
                 </Button>
                 {imageFiles.length > 0 && <div className="w-full pt-2">
                     <p className="text-sm font-medium text-gray-600 mb-1.5">Arquivos selecionados:</p>
                     <ul className="space-y-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                       {imageFiles.map((file, index) => <li key={`${file.name}-${index}-${file.lastModified}`} className="flex justify-between items-center p-1.5 bg-white border border-gray-200 rounded-md text-sm group shadow-sm">
                           <span className="truncate mr-2 flex-1 text-gray-700" title={file.name}>
                             {file.name} <span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                           </span>
                           <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveImageFile(index)} className="text-gray-400 group-hover:text-red-500 hover:bg-red-100 h-7 w-7" aria-label={`Remover imagem ${file.name}`}>
                             <X className="h-4 w-4" />
                           </Button>
                         </li>)}
                     </ul>
                   </div>}
                 {imageFiles.length === 0 && <p className="text-xs text-gray-400 text-center italic pt-2">Nenhuma imagem adicionada.</p>}
               </div>

               <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col space-y-4 hover:border-green-500 transition-colors duration-200 ease-in-out">
                 <div className="flex flex-col items-center text-center">
                   <VideoIcon className="w-12 h-12 text-green-600 mb-2" />
                   <h3 className="text-lg font-medium text-gray-700">Vídeos (Links)</h3>
                   <p className="text-sm text-gray-500 px-4 mt-1">Adicione links para vídeos online (YouTube, Drive, etc.).</p>
                 </div>
                 <div className="flex w-full space-x-2 items-center pt-1">
                   <Input type="url" value={newVideoLink} onChange={e => setNewVideoLink(e.target.value)} placeholder="https://..." aria-label="Link do vídeo" className="flex-1 text-sm" />
                   <Button type="button" onClick={handleAddVideoLink} className="bg-green-600 hover:bg-green-700 text-white shrink-0" size="icon" aria-label="Adicionar link de vídeo" disabled={!newVideoLink.trim()}>
                     <Plus className="h-5 w-5" />
                   </Button>
                 </div>
                 {videoLinks.length > 0 && <div className="w-full pt-2">
                     <p className="text-sm font-medium text-gray-600 mb-1.5">Links adicionados:</p>
                     <ul className="space-y-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                       {videoLinks.map((link, index) => <li key={`${index}-${link}`} className="flex justify-between items-center p-1.5 bg-white border border-gray-200 rounded-md text-sm group shadow-sm">
                           <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate mr-2 flex-1" title={`Abrir link: ${link}`}> {link} </a>
                           <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveVideoLink(index)} className="text-gray-400 group-hover:text-red-500 hover:bg-red-100 h-7 w-7" aria-label={`Remover link ${link}`}>
                             <X className="h-4 w-4" />
                           </Button>
                         </li>)}
                     </ul>
                   </div>}
                  {videoLinks.length === 0 && <p className="text-xs text-gray-400 text-center italic pt-2">Nenhum link de vídeo adicionado.</p>}
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-8 pt-6 border-t border-gray-300">
          <Button type="submit" disabled={isSubmitting || hasMinorAuthor.isMinor} size="lg" className="min-w-[200px]">
            {isSubmitting ? <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </> : <>
                 <FileText className="mr-2 h-5 w-5" />
                 Finalizar e Salvar TCO
               </>}
          </Button>
        </div>
      </form>
    </div>;
};
export default TCOForm;
