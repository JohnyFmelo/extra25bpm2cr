// --- START OF TCOForm.tsx ---
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import supabase from "@/lib/supabaseClient"; // Use default import

// ... (Keep interfaces: ComponenteGuarnicao, Pessoa) ...
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


// ... (Keep initialPersonData, formatRepresentacao, formatCPF, formatPhone, validateCPF, formatarGuarnicao, formatarRelatoAutor, numberToText) ...
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

const TCOForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  const formattedTime = now.toTimeString().slice(0, 5);

  // --- Keep all your existing state variables ---
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
  // --- End of existing state variables ---


  // --- Keep all your useEffect hooks ---
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
          // Only update if it's empty or still the template placeholder
          if (!apreensoes || apreensoes.startsWith("[DESCRIÇÃO]") || apreensoes.includes("SUBSTÂNCIA ANÁLOGA A") || apreensoes.includes("MATERIAL DESCONHECIDO")) {
             setApreensoes(descriptiveText);
          }
        }
      }
    } else {
        // Reset apreensoes specific to drugs if nature changes
        if (apreensoes.includes("SUBSTÂNCIA ANÁLOGA A") || apreensoes.includes("MATERIAL DESCONHECIDO")){
            setApreensoes(""); // Or set to a default non-drug related placeholder
        }
       setVitimas(prevVitimas => {
        if (prevVitimas.length === 0 || (prevVitimas.length === 1 && !prevVitimas[0].nome)) {
          return [{ ...initialPersonData }];
        }
        return prevVitimas;
      });
    }
  }, [natureza, indicios, isUnknownMaterial, customMaterialDesc, quantidade, apreensoes]); // Removed relatoPolicialTemplate from dependencies


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
  }, [natureza, customNatureza, tipificacao, penaDescricao, autores, testemunhas]); // Dependencies seem correct

  useEffect(() => {
    if (isRelatoPolicialManuallyEdited) return;

    let updatedRelato = relatoPolicialTemplate;
    const bairro = endereco ? endereco.split(',').pop()?.trim() || "[BAIRRO PENDENTE]" : "[BAIRRO PENDENTE]";
    const gupm = formatarGuarnicao(componentesGuarnicao);
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "OUTROS" : natureza;
    const operacaoText = operacao ? `, DURANTE A ${operacao.toUpperCase()},` : ""; // Make operation uppercase

    updatedRelato = updatedRelato
      .replace("[HORÁRIO]", horaFato || "[HORÁRIO PENDENTE]")
      .replace("[DATA]", dataFato ? new Date(dataFato + 'T00:00:00Z').toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : "[DATA PENDENTE]")
      .replace("[GUARNIÇÃO]", guarnicao || "[GUARNIÇÃO PENDENTE]")
      .replace("[OPERACAO_TEXT]", operacaoText)
      .replace("[GUPM]", gupm)
      .replace("[BAIRRO]", bairro)
      .replace("[MEIO DE ACIONAMENTO]", comunicante || "[ACIONAMENTO PENDENTE]")
      .replace("[NATUREZA]", displayNaturezaReal.toUpperCase() || "[NATUREZA PENDENTE]") // Uppercase nature
      .replace("[LOCAL]", localFato || "[LOCAL PENDENTE]")
      // Keep placeholders for manual input
      .replace("[VERSÃO INICIAL]", "[VERSÃO INICIAL]")
      .replace("[O QUE A PM DEPAROU]", "[O QUE A PM DEPAROU]")
      .replace("[VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]", "[VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]")
      .replace("[DILIGÊNCIAS E APREENSÕES REALIZADAS]", "[DILIGÊNCIAS E APREENSÕES REALIZADAS]")
      .replace("[ENCAMINHAMENTO PARA REGISTRO DOS FATOS]", "[ENCAMINHAMENTO PARA REGISTRO DOS FATOS]");

    // Ensure the entire text is uppercase ONLY IF it wasn't manually edited before
     if (!isRelatoPolicialManuallyEdited || relatoPolicial === relatoPolicialTemplate) {
       setRelatoPolicial(updatedRelato.toUpperCase());
     } else {
       setRelatoPolicial(updatedRelato); // Preserve manual edits casing if any
     }
  }, [horaFato, dataFato, guarnicao, operacao, componentesGuarnicao, endereco, comunicante, natureza, customNatureza, localFato, relatoPolicialTemplate, isRelatoPolicialManuallyEdited, relatoPolicial]); // Added relatoPolicial back to track if it was the template

  useEffect(() => {
    const novoRelatoAutor = formatarRelatoAutor(autores).toUpperCase();
    // Only update if it hasn't been manually edited, or follows the template structure
    if (!relatoAutor.includes('[INSIRA DECLARAÇÃO]') || relatoAutor.startsWith("O AUTOR") || relatoAutor.startsWith("A AUTORA") || relatoAutor.startsWith("OS AUTORES") || relatoAutor.startsWith("AS AUTORAS")) {
      setRelatoAutor(novoRelatoAutor);
    }
  }, [autores, relatoAutor]); // Added relatoAutor dependency

  useEffect(() => {
    // Update main 'autor' state only if the first author's name changes
    const currentFirstAutorName = autores.length > 0 ? autores[0].nome : "";
    if (currentFirstAutorName !== autor) {
      setAutor(currentFirstAutorName);
    }
  }, [autores, autor]);
  // --- End of useEffect hooks ---


  // --- Keep all your handler functions (handleAddPolicialToList, handleRemovePolicialFromList, etc.) ---
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
      toast({ variant: "warning", title: "Duplicado", description: "Este policial já está na guarnição." });
    }
  }, [componentesGuarnicao, toast]);

  const handleRemovePolicialFromList = useCallback((indexToRemove: number) => {
    setComponentesGuarnicao(prevList => prevList.filter((_, index) => index !== indexToRemove));
  }, []);

   const handleAddVitima = () => {
     // Clear placeholder if it exists before adding a new one
    const hasOnlyPlaceholder = vitimas.length === 1 && !vitimas[0].nome && !vitimas[0].cpf;
    if (hasOnlyPlaceholder) {
        setVitimas([{ ...initialPersonData }]);
    } else {
        setVitimas(prevVitimas => [...prevVitimas, { ...initialPersonData }]);
    }
  };

  const handleRemoveVitima = (index: number) => {
    const newVitimas = vitimas.filter((_, i) => i !== index);
    if (newVitimas.length === 0) {
      // Keep one empty entry if all are removed
      setVitimas([{...initialPersonData}]);
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
    newVitimas[index] = { ...newVitimas[index], [field]: processedValue };
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
      const birthDate = new Date(value + 'T00:00:00Z'); // Ensure timezone consistency
      if (value && !isNaN(birthDate.getTime())) { // Check if date is valid
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < 18) {
          toast({ variant: "destructive", title: "Atenção: Autor Menor de Idade", description: "Avalie se cabe TCO." });
        }
      }
    }
    newAutores[index] = { ...newAutores[index], [field]: processedValue };
    setAutores(newAutores);
    // Update main 'autor' state only if the *first* author's name is changed
    if (index === 0 && field === 'nome') {
        setAutor(processedValue);
    }
  };

  const handleRelatoPolicialChange = (value: string) => {
    setRelatoPolicial(value);
    // Mark as manually edited only if the content differs significantly from the template's structure
    if (value !== relatoPolicialTemplate && !value.includes("[HORÁRIO]")) { // Example check
        setIsRelatoPolicialManuallyEdited(true);
    }
  };

  const handleAddVideoLink = () => {
    if (newVideoLink.trim() && !videoLinks.includes(newVideoLink.trim())) {
      if (!/^(https?:\/\/)/i.test(newVideoLink.trim())) {
          toast({ variant: "warning", title: "Link Inválido", description: "Por favor, insira um link válido começando com http:// ou https://." });
          return;
      }
      setVideoLinks(prev => [...prev, newVideoLink.trim()]);
      setNewVideoLink("");
      toast({ title: "Link Adicionado", description: "Link de vídeo adicionado com sucesso." });
    } else if (!newVideoLink.trim()) {
      toast({ variant: "warning", title: "Link Vazio", description: "Por favor, insira um link." });
    } else {
      toast({ variant: "warning", title: "Link Duplicado", description: "Este link já foi adicionado." });
    }
  };

  const handleRemoveVideoLink = (index: number) => {
    setVideoLinks(prev => prev.filter((_, i) => i !== index));
    toast({ title: "Link Removido", description: "Link de vídeo removido com sucesso." });
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const uniqueNewFiles = newFiles.filter(
        (file) => !imageFiles.some((existingFile) => existingFile.name === file.name && existingFile.size === file.size)
      );

      if (uniqueNewFiles.length > 0) {
        setImageFiles((prevFiles) => [...prevFiles, ...uniqueNewFiles]);
        toast({ title: `${uniqueNewFiles.length} Imagem(ns) Adicionada(s)`, description: "Imagens selecionadas para anexo." });
      } else if (newFiles.length > 0) {
        toast({ variant: "warning", title: "Imagens Duplicadas", description: "Algumas ou todas as imagens selecionadas já foram adicionadas." });
      }
      // Reset input value to allow selecting the same file again after removal
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImageFile = (index: number) => {
    setImageFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    toast({ title: "Imagem Removida", description: "Imagem removida da lista de anexos." });
  };

  // Keep fileToBase64 function
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };
  // --- End of handler functions ---


  // --- *** UPDATED handleSubmit Function *** ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const completionNow = new Date();
    const completionDate = completionNow.toISOString().split('T')[0];
    const completionTime = completionNow.toTimeString().slice(0, 5);

    // --- Basic Validations ---
    const autoresValidos = autores.filter(a => a.nome?.trim());
    if (!tcoNumber.trim()) {
       toast({ variant: "destructive", title: "Campo Obrigatório", description: "O número do TCO é obrigatório." });
       return;
    }
     if (natureza === "Selecione...") {
        toast({ variant: "destructive", title: "Campo Obrigatório", description: "Selecione a Natureza da Ocorrência." });
        return;
     }
     if (natureza === "Outros" && !customNatureza.trim()) {
         toast({ variant: "destructive", title: "Campo Obrigatório", description: "Descreva a Natureza em 'Outros'." });
         return;
     }
     if (autoresValidos.length === 0) {
         toast({ variant: "destructive", title: "Campo Obrigatório", description: "Adicione pelo menos um Autor com nome." });
         return;
     }
     if (componentesGuarnicao.length === 0 || componentesGuarnicao.every(c => !c.rg && !c.nome)) {
         toast({ variant: "destructive", title: "Campo Obrigatório", description: "Adicione pelo menos um Componente da Guarnição válido." });
         return;
     }

    if (natureza === "Porte de drogas para consumo" && (!quantidade.trim() || !substancia || !cor || (isUnknownMaterial && !customMaterialDesc.trim()) || !lacreNumero.trim())) {
      toast({ variant: "destructive", title: "Dados da Droga Incompletos", description: "Para Porte de Drogas, preencha Quantidade, Substância, Cor, Número do Lacre e Descrição (se material desconhecido)." });
      return;
    }
    // --- End Basic Validations ---

    setIsSubmitting(true);
    setIsTimerRunning(false); // Stop timer on submission attempt

    try {
      const displayNaturezaReal = natureza === "Outros" ? customNatureza.trim() : natureza;
      const indicioFinalDroga = natureza === "Porte de drogas para consumo" ? (isUnknownMaterial ? customMaterialDesc.trim() : indicios) : "";

      // Filter out empty entries before saving/generating PDF
      const vitimasFiltradas = vitimas.filter(v => v.nome?.trim() || v.cpf?.trim());
      const testemunhasFiltradas = testemunhas.filter(t => t.nome?.trim() || t.cpf?.trim());

      // Get user info (if available) for createdBy field
      // This is a basic example; replace with your actual auth logic if needed
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = userInfo.id || null; // Supabase user ID is usually a UUID
      const userRegistration = userInfo.registration || ""; // Assuming you store registration here

      // Convert images to base64 (as before)
      const imageBase64Array: { name: string; data: string }[] = [];
      for (const file of imageFiles) {
        try {
          const base64Data = await fileToBase64(file);
          imageBase64Array.push({ name: file.name, data: base64Data });
        } catch (error) {
          console.error(`Erro ao converter imagem ${file.name} para base64:`, error);
          toast({
            variant: "warning", // Changed to warning as it might not be critical
            title: "Erro ao Processar Imagem",
            description: `Não foi possível processar a imagem ${file.name}. Ela não será incluída no PDF/anexos.`,
          });
          // Continue without the failed image
        }
      }

      // --- Prepare Data Object for PDF Generation ---
      const tcoDataParaPDF: any = {
        tcoNumber: tcoNumber.trim(),
        natureza: displayNaturezaReal,
        originalNatureza: natureza, // Keep original selection if needed
        customNatureza: customNatureza.trim(),
        tipificacao: tipificacao.trim(),
        penaDescricao: penaDescricao.trim(),
        dataFato,
        horaFato,
        dataInicioRegistro,
        horaInicioRegistro,
        dataTerminoRegistro: completionDate, // Use completion date/time
        horaTerminoRegistro: completionTime,
        localFato: localFato.trim(),
        endereco: endereco.trim(),
        municipio,
        comunicante,
        autores: autoresValidos, // Use filtered valid authors
        vitimas: vitimasFiltradas,
        testemunhas: testemunhasFiltradas,
        guarnicao: guarnicao.trim(),
        operacao: operacao.trim(),
        componentesGuarnicao, // Use the full list for the PDF
        relatoPolicial: relatoPolicial.trim(),
        relatoAutor: relatoAutor.trim(),
        relatoTestemunha: relatoTestemunha.trim(),
        apreensoes: apreensoes.trim(),
        conclusaoPolicial: conclusaoPolicial.trim(),
        lacreNumero: natureza === "Porte de drogas para consumo" ? lacreNumero.trim() : undefined, // Use undefined for non-drug cases
        drogaQuantidade: natureza === "Porte de drogas para consumo" ? quantidade.trim() : undefined,
        drogaTipo: natureza === "Porte de drogas para consumo" ? substancia : undefined,
        drogaCor: natureza === "Porte de drogas para consumo" ? cor : undefined,
        drogaNomeComum: natureza === "Porte de drogas para consumo" ? indicioFinalDroga : undefined,
        drogaCustomDesc: natureza === "Porte de drogas para consumo" && isUnknownMaterial ? customMaterialDesc.trim() : undefined,
        drogaIsUnknown: natureza === "Porte de drogas para consumo" ? isUnknownMaterial : undefined,
        startTime: startTime?.toISOString(),
        endTime: completionNow.toISOString(),
        userRegistration: userRegistration, // Pass registration if needed in PDF
        videoLinks: videoLinks,
        imageBase64: imageBase64Array, // Pass base64 images to PDF generator
        juizadoEspecialData: juizadoEspecialData.trim() || undefined,
        juizadoEspecialHora: juizadoEspecialHora.trim() || undefined,
        relatoVitima: vitimasFiltradas.length > 0 ? relatoVitima.trim() : undefined,
        representacao: vitimasFiltradas.length > 0 && representacao ? formatRepresentacao(representacao) : undefined,
      };
      // Clean up undefined properties before PDF generation
      Object.keys(tcoDataParaPDF).forEach(key => tcoDataParaPDF[key] === undefined && delete tcoDataParaPDF[key]);

      console.log("Dados para gerar PDF:", tcoDataParaPDF);

      // --- Generate PDF ---
      // Ensure generatePDF returns a Blob
      const pdfBlob: Blob = await generatePDF(tcoDataParaPDF);
      if (!pdfBlob || pdfBlob.size === 0) {
           throw new Error("Falha ao gerar o PDF. O arquivo está vazio.");
      }
      console.log("PDF gerado, tamanho:", pdfBlob.size, "tipo:", pdfBlob.type);

      // --- Upload PDF to Supabase Storage ---
      const pdfFileName = `${tcoNumber.trim()}.pdf`;
      const pdfPath = `tcos/${tcoNumber.trim()}/${pdfFileName}`; // Structure: tcos/TCO_NUMBER/TCO_NUMBER.pdf
      const BUCKET_NAME = 'tco-pdfs'; // Match the bucket name you created

      console.log(`Fazendo upload para: ${BUCKET_NAME}/${pdfPath}`);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(pdfPath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true, // Overwrite if file exists (useful for testing/updates)
        });

      if (uploadError) {
        console.error("Erro no upload do PDF para Supabase Storage:", uploadError);
        throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`);
      }
      console.log("PDF enviado com sucesso para Supabase Storage:", pdfPath);

      // --- Save Metadata to Supabase Database ---
      const TABLE_NAME = 'tco_pdfs'; // Match the table name you created

      // Prepare only the essential metadata for the database record
      const tcoMetadata = {
        tcoNumber: tcoNumber.trim(),
        natureza: displayNaturezaReal,
        // createdAt is handled by default value in Supabase
        policiais: componentesGuarnicao // Store the full guarnicao details as JSON
                     .filter(p => p.nome && p.rg) // Ensure only valid entries are stored
                     .map(p => ({ nome: p.nome, rg: p.rg, posto: p.posto })),
        pdfPath: pdfPath, // Store the path in Storage
        createdBy: userId, // Link to the user who created it (nullable if no user)
        // Add any other relevant fields you want to query easily
      };

      console.log("Metadados para salvar no DB:", tcoMetadata);

      const { data: insertData, error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert([tcoMetadata]) // insert expects an array of objects
        .select('id') // Optionally select the ID of the new record
        .single(); // Expect only one record to be inserted

      if (insertError) {
        console.error("Erro ao salvar metadados no Supabase DB:", insertError);
        // Attempt to remove the already uploaded PDF if DB insert fails
        const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([pdfPath]);
        if (deleteError) console.error("Falha ao remover PDF após erro de inserção no DB:", deleteError);
        throw new Error(`Erro ao salvar informações do TCO: ${insertError.message}`);
      }
      console.log("Metadados salvos com sucesso no DB, ID:", insertData?.id);

      toast({ title: "TCO Registrado com Sucesso!", description: "PDF enviado e informações salvas no sistema." });

      // --- Navigate on Success ---
      navigate("/?tab=tco"); // Navigate to TCO list or dashboard

    } catch (error: any) {
      console.error("Erro geral no processo de submissão do TCO:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Finalizar TCO",
        description: `Ocorreu um erro: ${error.message || 'Erro desconhecido. Verifique o console para detalhes.'}`,
        duration: 7000 // Longer duration for error messages
      });
    } finally {
      setIsSubmitting(false); // Re-enable button regardless of success/failure
    }
  };
  // --- *** END of UPDATED handleSubmit Function *** ---


  // --- Keep Natureza Options and Condutor Display ---
  const naturezaOptions = [
    "Ameaça", "Vias de Fato", "Lesão Corporal", "Dano", "Injúria",
    "Difamação", "Calúnia", "Perturbação do Sossego",
    "Porte de drogas para consumo", "Outros"
  ];

  // Display the first valid police officer as 'condutor' in the General Info tab
  const condutorParaDisplay = componentesGuarnicao.find(c => c.nome && c.rg);

  // --- Keep handleFormKeyDown ---
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      // Allow submit buttons to work with Enter
      if (target.tagName === 'BUTTON' && (target as HTMLButtonElement).type === 'submit') {
        return;
      }
      // Prevent accidental form submission from text inputs/areas when Enter is pressed
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
         // Allow Enter in TextAreas for new lines
         if (target.tagName !== 'TEXTAREA') {
            // Check if inside a specific component that might handle Enter (like a search input)
            // For now, prevent default for most inputs
            // Find the next focusable element logic could go here if needed
            e.preventDefault();
         }
      }
    }
  };

  // --- Keep JSX Structure ---
  return (
    <div className="container px-4 py-6 md:py-10 max-w-5xl mx-auto">
      {/* Add novalidate to prevent default browser validation, relying on custom checks */}
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-8" noValidate>
        {/* BasicInformationTab */}
        <BasicInformationTab
          tcoNumber={tcoNumber} setTcoNumber={setTcoNumber}
          natureza={natureza} setNatureza={setNatureza}
          autor={autor} setAutor={setAutor} // Autor field here might be redundant if you rely on the first author in the list
          penaDescricao={penaDescricao} naturezaOptions={naturezaOptions}
          customNatureza={customNatureza} setCustomNatureza={setCustomNatureza}
          startTime={startTime} isTimerRunning={isTimerRunning}
        />

        {/* DrugVerificationTab (Conditional) */}
        {natureza === "Porte de drogas para consumo" && (
          <DrugVerificationTab
            quantidade={quantidade} setQuantidade={setQuantidade}
            substancia={substancia} setSubstancia={setSubstancia}
            cor={cor} setCor={setCor}
            indicios={indicios} // Display only
            customMaterialDesc={customMaterialDesc} setCustomMaterialDesc={setCustomMaterialDesc}
            isUnknownMaterial={isUnknownMaterial} // Display only
            lacreNumero={lacreNumero} setLacreNumero={setLacreNumero}
          />
        )}

        {/* GeneralInformationTab */}
         <GeneralInformationTab
            natureza={natureza} tipificacao={tipificacao} setTipificacao={setTipificacao}
            isCustomNatureza={natureza === "Outros"} customNatureza={customNatureza} // Pass customNatureza too
            dataFato={dataFato} setDataFato={setDataFato}
            horaFato={horaFato} setHoraFato={setHoraFato}
            dataInicioRegistro={dataInicioRegistro} // No setter needed?
            horaInicioRegistro={horaInicioRegistro} // No setter needed?
            dataTerminoRegistro={dataTerminoRegistro} // No setter needed? Display only?
            horaTerminoRegistro={horaTerminoRegistro} // No setter needed? Display only?
            localFato={localFato} setLocalFato={setLocalFato}
            endereco={endereco} setEndereco={setEndereco}
            municipio={municipio} // Display only
            comunicante={comunicante} setComunicante={setComunicante}
            guarnicao={guarnicao} setGuarnicao={setGuarnicao}
            operacao={operacao} setOperacao={setOperacao}
            // Pass condutor info derived from state
            condutorNome={condutorParaDisplay?.nome || ""}
            condutorPosto={condutorParaDisplay?.posto || ""}
            condutorRg={condutorParaDisplay?.rg || ""}
            juizadoEspecialData={juizadoEspecialData}
            setJuizadoEspecialData={setJuizadoEspecialData}
            juizadoEspecialHora={juizadoEspecialHora}
            setJuizadoEspecialHora={setJuizadoEspecialHora}
          />

        {/* PessoasEnvolvidasTab */}
        <PessoasEnvolvidasTab
            vitimas={vitimas} handleVitimaChange={handleVitimaChange} handleAddVitima={handleAddVitima} handleRemoveVitima={handleRemoveVitima}
            testemunhas={testemunhas} handleTestemunhaChange={handleTestemunhaChange} handleAddTestemunha={handleAddTestemunha} handleRemoveTestemunha={handleRemoveTestemunha}
            autores={autores} handleAutorDetalhadoChange={handleAutorDetalhadoChange} handleAddAutor={handleAddAutor} handleRemoveAutor={handleRemoveAutor}
            natureza={natureza} // Pass nature to conditionally show fields perhaps
        />

        {/* GuarnicaoTab */}
        <GuarnicaoTab
          currentGuarnicaoList={componentesGuarnicao}
          onAddPolicial={handleAddPolicialToList}
          onRemovePolicial={handleRemovePolicialFromList}
        />

        {/* HistoricoTab */}
         <HistoricoTab
            relatoPolicial={relatoPolicial} setRelatoPolicial={handleRelatoPolicialChange} // Use the handler that sets manual edit flag
            relatoAutor={relatoAutor} setRelatoAutor={setRelatoAutor}
            relatoVitima={relatoVitima} setRelatoVitima={setRelatoVitima}
            relatoTestemunha={relatoTestemunha} setRelatoTestemunha={setRelatoTestemunha}
            apreensoes={apreensoes} setApreensoes={setApreensoes}
            conclusaoPolicial={conclusaoPolicial} setConclusaoPolicial={setConclusaoPolicial}
            drugSeizure={natureza === "Porte de drogas para consumo"}
            representacao={representacao} setRepresentacao={setRepresentacao}
            natureza={natureza} // Pass nature to conditionally show fields perhaps
         />

        {/* Anexos Section */}
        <div className="space-y-4 pt-6 border-t border-gray-300">
          <h2 className="text-xl font-semibold text-gray-800 uppercase tracking-wide">
            ANEXOS (Opcional)
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Upload */}
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col space-y-4 hover:border-blue-500 transition-colors duration-200 ease-in-out">
                <div className="flex flex-col items-center text-center">
                    <ImageIcon className="w-12 h-12 text-blue-600 mb-2" />
                    <h3 className="text-lg font-medium text-gray-700">Fotos</h3>
                    <p className="text-sm text-gray-500 px-4 mt-1">
                        Anexe imagens relevantes (JPG, PNG, GIF). Serão incluídas no PDF.
                    </p>
                </div>
              <input
                type="file"
                multiple
                accept="image/jpeg, image/png, image/gif" // Be specific about accepted types
                ref={imageInputRef}
                onChange={handleImageFileChange}
                className="hidden" // Keep hidden, trigger via button
                id="imageUpload" // Associate label/button
              />
              <Button
                type="button" // Important: prevent form submission
                variant="outline" // Use outline style for secondary actions
                onClick={() => imageInputRef.current?.click()}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto mx-auto"
                aria-label="Selecionar imagens para anexar"
              >
                <Plus className="mr-2 h-5 w-5" />
                Selecionar Fotos
              </Button>
              {imageFiles.length > 0 && (
                <div className="w-full pt-2">
                  <p className="text-sm font-medium text-gray-600 mb-1.5">Arquivos selecionados:</p>
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                    {imageFiles.map((file, index) => (
                      <li key={`${file.name}-${index}-${file.lastModified}`} className="flex justify-between items-center p-1.5 bg-white border border-gray-200 rounded-md text-sm group shadow-sm">
                        <span className="truncate mr-2 flex-1 text-gray-700" title={file.name}>
                          {file.name} <span className="text-gray-400 text-xs">({ (file.size / 1024).toFixed(1) } KB)</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveImageFile(index)}
                          className="text-gray-400 group-hover:text-red-500 hover:bg-red-100 h-7 w-7"
                          aria-label={`Remover imagem ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {imageFiles.length === 0 && (
                  <p className="text-xs text-gray-400 text-center italic pt-2">Nenhuma imagem adicionada.</p>
               )}
            </div>

             {/* Video Links */}
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col space-y-4 hover:border-green-500 transition-colors duration-200 ease-in-out">
              <div className="flex flex-col items-center text-center">
                <VideoIcon className="w-12 h-12 text-green-600 mb-2" />
                <h3 className="text-lg font-medium text-gray-700">Vídeos (Links)</h3>
                <p className="text-sm text-gray-500 px-4 mt-1">Adicione links para vídeos online (YouTube, Drive, etc.).</p>
              </div>
              <div className="flex w-full space-x-2 items-center pt-1">
                <input
                  type="url" // Use type="url" for basic validation
                  value={newVideoLink}
                  onChange={(e) => setNewVideoLink(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                  aria-label="Link do vídeo"
                />
                <Button
                  type="button" // Important: prevent form submission
                  onClick={handleAddVideoLink}
                  className="bg-green-600 hover:bg-green-700 text-white shrink-0" // Prevent shrinking
                  size="icon"
                  aria-label="Adicionar link de vídeo"
                  disabled={!newVideoLink.trim()} // Disable if input is empty
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              {videoLinks.length > 0 && (
                <div className="w-full pt-2">
                  <p className="text-sm font-medium text-gray-600 mb-1.5">Links adicionados:</p>
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                    {videoLinks.map((link, index) => (
                      <li key={`${index}-${link}`} className="flex justify-between items-center p-1.5 bg-white border border-gray-200 rounded-md text-sm group shadow-sm">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate mr-2 flex-1"
                          title={`Abrir link: ${link}`}
                        >
                          {link}
                        </a>
                        <Button
                           type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVideoLink(index)}
                          className="text-gray-400 group-hover:text-red-500 hover:bg-red-100 h-7 w-7"
                          aria-label={`Remover link ${link}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
               {videoLinks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center italic pt-2">Nenhum link de vídeo adicionado.</p>
               )}
            </div>
          </div>
        </div>


        {/* Submit Button */}
        <div className="flex justify-end mt-10 pt-6 border-t border-gray-300">
          <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[200px]">
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </>
            ) : (
               <>
                 <FileText className="mr-2 h-5 w-5" />
                 Finalizar e Salvar TCO
               </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TCOForm;
// --- END OF TCOForm.tsx ---
