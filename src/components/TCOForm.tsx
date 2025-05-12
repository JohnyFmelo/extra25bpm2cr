// --- START OF FILE TCOForm (31).tsx ---

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
import { generatePDF } from "./tco/pdfGenerator"; // Assuming this returns a Promise<Blob>
import supabase from "@/lib/supabaseClient"; // Use default import

// --- Interfaces (Keep as they were) ---
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

// --- Initial Data & Formatting Functions (Keep as they were) ---
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
    .filter(c => c.nome && c.posto) // Filter out incomplete entries
    .map(c => `${c.posto} PM ${c.nome}`);
  if (nomesFormatados.length === 0) return "[GUPM PENDENTE]";
  if (nomesFormatados.length === 1) return nomesFormatados[0].toUpperCase();
  if (nomesFormatados.length === 2) return `${nomesFormatados[0]} E ${nomesFormatados[1]}`.toUpperCase();
  return `${nomesFormatados.slice(0, -1).join(", ")} E ${nomesFormatados[nomesFormatados.length - 1]}`.toUpperCase();
};

const formatarRelatoAutor = (autores: Pessoa[]): string => {
  const autoresValidos = autores.filter(a => a.nome?.trim()); // Filter valid authors
  if (autoresValidos.length === 0) {
    return "O AUTOR DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.";
  }
  if (autoresValidos.length === 1) {
    const sexo = autoresValidos[0].sexo?.toLowerCase() || 'masculino'; // Default to masculine if sex is missing
    const pronome = sexo === "feminino" ? "A AUTORA" : "O AUTOR";
    return `${pronome} DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.`;
  }
  const todosFemininos = autoresValidos.every(a => a.sexo?.toLowerCase() === "feminino");
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

// --- TCOForm Component ---
const TCOForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- State Variables (Keep as they were) ---
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  const formattedTime = now.toTimeString().slice(0, 5);
  const [tcoNumber, setTcoNumber] = useState("");
  const [natureza, setNatureza] = useState("Vias de Fato");
  const [customNatureza, setCustomNatureza] = useState("");
  const [autor, setAutor] = useState(""); // Note: This might be better derived from autores[0].nome
  const [representacao, setRepresentacao] = useState("");
  const [tipificacao, setTipificacao] = useState("Art. 21 da Lei de Contravenções Penais");
  const [penaDescricao, setPenaDescricao] = useState("");
  const [dataFato, setDataFato] = useState(formattedDate);
  const [horaFato, setHoraFato] = useState(formattedTime);
  const [dataInicioRegistro, setDataInicioRegistro] = useState(formattedDate);
  const [horaInicioRegistro, setHoraInicioRegistro] = useState(formattedTime);
  const [localFato, setLocalFato] = useState("");
  const [endereco, setEndereco] = useState("");
  const [municipio] = useState("Várzea Grande");
  const [comunicante, setComunicante] = useState("CIOSP");
  const [guarnicao, setGuarnicao] = useState("");
  const [operacao, setOperacao] = useState("");
  const [apreensoes, setApreensoes] = useState("");
  const [lacreNumero, setLacreNumero] = useState("");
  const [componentesGuarnicao, setComponentesGuarnicao] = useState<ComponenteGuarnicao[]>([{ rg: "", nome: "", posto: "" }]); // Start with one empty entry
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

  // --- useEffect Hooks (Keep as they were, with previous corrections) ---
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
            ? `${quantidadeText} ${plural} PEQUENA(S) DE SUBSTÂNCIA DE MATERIAL DESCONHECIDO, ${customMaterialDesc || "[DESCRIÇÃO PENDENTE]"}, CONFORME FOTO EM ANEXO.`
            : `${quantidadeText} ${plural} PEQUENA(S) DE SUBSTÂNCIA ANÁLOGA A ${indicioFinal.toUpperCase()}, CONFORME FOTO EM ANEXO.`;
          // Only update if it's empty, a placeholder, or clearly drug-related text
          if (!apreensoes || apreensoes.startsWith("[DESCRIÇÃO") || apreensoes.includes("SUBSTÂNCIA ANÁLOGA A") || apreensoes.includes("MATERIAL DESCONHECIDO")) {
             setApreensoes(descriptiveText);
          }
        }
      } else {
         // Clear specific drug text if indicio is cleared but still drug case
         if (apreensoes.includes("SUBSTÂNCIA ANÁLOGA A") || apreensoes.includes("MATERIAL DESCONHECIDO")) {
             setApreensoes("[DESCRIÇÃO PENDENTE], CONFORME FOTO EM ANEXO.");
         }
      }
    } else {
        // Reset apreensoes specific to drugs if nature changes away from drugs
        if (apreensoes.includes("SUBSTÂNCIA ANÁLOGA A") || apreensoes.includes("MATERIAL DESCONHECIDO")){
            setApreensoes(""); // Clear or set to a general placeholder if needed
        }
       // Ensure there's always at least a placeholder for vitimas if not drug case
       setVitimas(prevVitimas => {
        const hasRealVictim = prevVitimas.some(v => v.nome?.trim());
        if (!hasRealVictim) {
          return [{ ...initialPersonData }];
        }
        return prevVitimas;
      });
    }
  // Ensure apreensoes is updated when drug details change
  }, [natureza, indicios, isUnknownMaterial, customMaterialDesc, quantidade, apreensoes]);


  useEffect(() => {
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "[NATUREZA NÃO ESPECIFICADA]" : natureza;
    let tipificacaoAtual = "";
    let penaAtual = "";

    if (natureza === "Outros") {
      // Keep user's input if they are editing tipificacao/pena for "Outros"
      tipificacaoAtual = tipificacao || "[TIPIFICAÇÃO LEGAL PENDENTE]";
      penaAtual = penaDescricao || "[PENA PENDENTE]";
    } else {
      // Auto-populate based on selection, overwriting previous auto-population
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

    const autoresValidos = autores.filter(a => a.nome?.trim());
    const autorTexto = autoresValidos.length === 0 ? "O(A) AUTOR(A)" :
      autoresValidos.length === 1 ? (autoresValidos[0].sexo?.toLowerCase() === "feminino" ? "A AUTORA" : "O AUTOR") :
      autoresValidos.every(a => a.sexo?.toLowerCase() === "feminino") ? "AS AUTORAS" : "OS AUTORES";

    const testemunhasValidas = testemunhas.filter(t => t.nome?.trim());
    const testemunhaTexto = testemunhasValidas.length > 1 ? "AS TESTEMUNHAS" : (testemunhasValidas.length === 1 ? "A TESTEMUNHA" : ""); // More natural phrasing

    // Use the potentially user-edited tipificacaoAtual for conclusion if Natureza is Outros
    const finalTipificacao = natureza === "Outros" ? tipificacao : tipificacaoAtual;

    const conclusaoBase = `DIANTE DAS CIRCUNSTÂNCIAS E DE TUDO O QUE FOI RELATADO, RESTA ACRESCENTAR QUE ${autorTexto} INFRINGIU, EM TESE, A CONDUTA DE ${displayNaturezaReal.toUpperCase()}, PREVISTA EM ${finalTipificacao.toUpperCase()}. NADA MAIS HAVENDO A TRATAR, DEU-SE POR FINDO O PRESENTE TERMO CIRCUNSTANCIADO DE OCORRÊNCIA QUE VAI DEVIDAMENTE ASSINADO PELAS PARTES${testemunhaTexto ? ` E ${testemunhaTexto}` : ""}, SE HOUVER, E POR MIM, RESPONSÁVEL PELA LAVRATURA, QUE O DIGITEI. E PELO FATO DE ${autorTexto} TER SE COMPROMETIDO A COMPARECER AO JUIZADO ESPECIAL CRIMINAL, ESTE FOI LIBERADO SEM LESÕES CORPORAIS APARENTES, APÓS A ASSINATURA DO TERMO DE COMPROMISSO.`;

    setConclusaoPolicial(conclusaoBase);
  // Update conclusion when tipificacao or penaDescricao changes (relevant for "Outros")
  }, [natureza, customNatureza, tipificacao, penaDescricao, autores, testemunhas]);

  useEffect(() => {
    if (isRelatoPolicialManuallyEdited) return; // Only update if not manually edited

    let updatedRelato = relatoPolicialTemplate;
    // Extract bairro more robustly
    const addressParts = endereco?.split(',');
    const bairro = addressParts && addressParts.length > 1 ? addressParts[addressParts.length - 1].trim() : "[BAIRRO PENDENTE]";
    const gupm = formatarGuarnicao(componentesGuarnicao);
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "OUTROS" : natureza;
    const operacaoText = operacao ? `, DURANTE A OPERAÇÃO ${operacao.toUpperCase()},` : ""; // Standardize phrasing

    updatedRelato = updatedRelato
      .replace("[HORÁRIO]", horaFato || "[HORÁRIO PENDENTE]")
      .replace("[DATA]", dataFato ? new Date(dataFato + 'T00:00:00Z').toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : "[DATA PENDENTE]")
      .replace("[GUARNIÇÃO]", guarnicao || "[GUARNIÇÃO PENDENTE]")
      .replace("[OPERACAO_TEXT]", operacaoText)
      .replace("[GUPM]", gupm)
      .replace("[BAIRRO]", bairro.toUpperCase()) // Uppercase bairro
      .replace("[MEIO DE ACIONAMENTO]", comunicante || "[ACIONAMENTO PENDENTE]")
      .replace("[NATUREZA]", displayNaturezaReal.toUpperCase() || "[NATUREZA PENDENTE]")
      .replace("[LOCAL]", localFato || "[LOCAL PENDENTE]")
      // Keep placeholders for required manual input clear
      .replace("[VERSÃO INICIAL]", "[VERSÃO INICIAL FORNECIDA PELO COMUNICANTE/CIOSP]")
      .replace("[O QUE A PM DEPAROU]", "[DESCRIÇÃO DA CENA E PESSOAS ENCONTRADAS NO LOCAL]")
      .replace("[VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]", "[BREVE RESUMO DO QUE CADA PARTE ALEGOU NO LOCAL]")
      .replace("[DILIGÊNCIAS E APREENSÕES REALIZADAS]", "[DETALHAR BUSCAS, REVISTAS, APREENSÕES (SE HOUVER, ALÉM DO RELATADO EM CAMPO PRÓPRIO)]")
      .replace("[ENCAMINHAMENTO PARA REGISTRO DOS FATOS]", "[INFORMAR SE AS PARTES FORAM ENCAMINHADAS À CENTRAL OU SE O REGISTRO FOI NO LOCAL]");

    setRelatoPolicial(updatedRelato.toUpperCase()); // Always set to uppercase if auto-updating

  }, [horaFato, dataFato, guarnicao, operacao, componentesGuarnicao, endereco, comunicante, natureza, customNatureza, localFato, isRelatoPolicialManuallyEdited]); // Removed relatoPolicialTemplate, relatoPolicial dependencies


  useEffect(() => {
    const novoRelatoAutor = formatarRelatoAutor(autores).toUpperCase();
    // Only update if it still contains the placeholder, otherwise user might be editing
    if (relatoAutor.includes('[INSIRA DECLARAÇÃO]')) {
      setRelatoAutor(novoRelatoAutor);
    }
  }, [autores, relatoAutor]); // Add relatoAutor dependency


  useEffect(() => {
    // Update the separate 'autor' state only if the first *valid* author's name changes
    const firstValidAutor = autores.find(a => a.nome?.trim());
    const currentFirstAutorName = firstValidAutor ? firstValidAutor.nome : "";
    if (currentFirstAutorName !== autor) {
      setAutor(currentFirstAutorName);
    }
  }, [autores, autor]);
  // --- End of useEffect Hooks ---

  // --- Handler Functions (Keep as they were, with previous corrections) ---
  const handleAddPolicialToList = useCallback((novoPolicial: ComponenteGuarnicao) => {
    // Prevent adding empty entries
    if (!novoPolicial.rg?.trim() && !novoPolicial.nome?.trim()) {
        toast({ variant: "warning", title: "Dados Incompletos", description: "Informe o RG ou Nome do policial." });
        return;
    }
    const alreadyExists = componentesGuarnicao.some(comp => comp.rg?.trim() && comp.rg.trim() === novoPolicial.rg.trim());
    if (!alreadyExists) {
      setComponentesGuarnicao(prevList => {
        // Replace the initial empty placeholder if it exists
        const cleanList = prevList.filter(p => p.rg || p.nome);
        return [...cleanList, novoPolicial];
      });
      toast({ title: "Adicionado", description: `Policial ${novoPolicial.nome} adicionado.` });
    } else {
      toast({ variant: "warning", title: "Duplicado", description: "Este policial (RG) já está na guarnição." });
    }
  }, [componentesGuarnicao, toast]);

  const handleRemovePolicialFromList = useCallback((indexToRemove: number) => {
    setComponentesGuarnicao(prevList => {
        const newList = prevList.filter((_, index) => index !== indexToRemove);
        // Ensure at least one empty entry remains if list becomes empty
        return newList.length === 0 ? [{ rg: "", nome: "", posto: "" }] : newList;
    });
  }, []);

   const handleAddVitima = () => {
    const hasOnlyPlaceholder = vitimas.length === 1 && !vitimas[0].nome && !vitimas[0].cpf && !vitimas[0].rg;
    if (hasOnlyPlaceholder) {
        setVitimas([{ ...initialPersonData }]); // Replace placeholder with a new one
    } else {
        setVitimas(prevVitimas => [...prevVitimas, { ...initialPersonData }]); // Add new entry
    }
  };

  const handleRemoveVitima = (index: number) => {
    const newVitimas = vitimas.filter((_, i) => i !== index);
    if (newVitimas.length === 0) {
      setVitimas([{...initialPersonData}]); // Ensure placeholder remains
    } else {
      setVitimas(newVitimas);
    }
  };

  const handleAddTestemunha = () => {
     const hasOnlyPlaceholder = testemunhas.length === 1 && !testemunhas[0].nome && !testemunhas[0].cpf && !testemunhas[0].rg;
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
      const hasOnlyPlaceholder = autores.length === 1 && !autores[0].nome && !autores[0].cpf && !autores[0].rg;
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
      // Clear the derived 'autor' state if the last author is removed
      setAutor("");
    } else {
      setAutores(newAutores);
       // Update the derived 'autor' state if the first author was removed
      if (index === 0) {
           const firstValid = newAutores.find(a => a.nome?.trim());
           setAutor(firstValid ? firstValid.nome : "");
      }
    }
  };

  // Input change handlers (keep cpf/phone formatting and validation)
  const handleVitimaChange = (index: number, field: keyof Pessoa, value: string) => {
    const newVitimas = [...vitimas];
    let processedValue = value;
    if (field === 'cpf') {
      processedValue = formatCPF(value);
      if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) {
        // Consider showing validation message inline instead of toast for better UX
        // toast({ variant: "warning", title: "CPF Inválido (Vítima)", description: "O CPF informado parece inválido." });
      }
    } else if (field === 'celular') {
      processedValue = formatPhone(value);
    }
    newVitimas[index] = { ...newVitimas[index], [field]: processedValue };
    setVitimas(newVitimas);
  };

  const handleTestemunhaChange = (index: number, field: keyof Pessoa, value: string) => {
    const newTestemunhas = [...testemunhas];
    let processedValue = value;
     if (field === 'cpf') {
      processedValue = formatCPF(value);
       if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) {
         // toast({ variant: "warning", title: "CPF Inválido (Testemunha)"});
       }
    } else if (field === 'celular') {
      processedValue = formatPhone(value);
    }
    newTestemunhas[index] = { ...newTestemunhas[index], [field]: processedValue };
    setTestemunhas(newTestemunhas);
  };

 const handleAutorDetalhadoChange = (index: number, field: keyof Pessoa, value: string) => {
    const newAutores = [...autores];
    let processedValue = value;
    if (field === 'cpf') {
      processedValue = formatCPF(value);
      if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) {
        // toast({ variant: "warning", title: "CPF Inválido (Autor)"});
      }
    } else if (field === 'celular') {
      processedValue = formatPhone(value);
    } else if (field === 'dataNascimento') {
        // Check age only if a valid date is entered
        if (value && !isNaN(new Date(value).getTime())) {
            const birthDate = new Date(value + 'T00:00:00Z'); // Use UTC to avoid timezone issues
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            if (age < 18) {
              toast({ variant: "destructive", title: "Atenção: Autor Menor de Idade", description: "Verifique se o procedimento é TCO ou Ato Infracional." });
            }
        }
    }
    newAutores[index] = { ...newAutores[index], [field]: processedValue };
    setAutores(newAutores);
    // Update the separate 'autor' state ONLY if the first author's name is changed
    if (index === 0 && field === 'nome') {
        setAutor(processedValue);
    }
  };

  const handleRelatoPolicialChange = (value: string) => {
    setRelatoPolicial(value);
    // Set manual edit flag if the content changes from the initial template
    // A more robust check might compare against the dynamically generated template if needed
    if (value !== relatoPolicialTemplate && !isRelatoPolicialManuallyEdited) {
      setIsRelatoPolicialManuallyEdited(true);
    }
  };

   // Video/Image handlers (Keep as they were, with previous corrections)
  const handleAddVideoLink = () => {
    if (!newVideoLink.trim()) {
      toast({ variant: "warning", title: "Link Vazio", description: "Por favor, insira um link." });
      return;
    }
    if (!/^(https?:\/\/)/i.test(newVideoLink.trim())) {
        toast({ variant: "warning", title: "Link Inválido", description: "O link deve começar com http:// ou https://." });
        return;
    }
     if (videoLinks.includes(newVideoLink.trim())) {
      toast({ variant: "warning", title: "Link Duplicado", description: "Este link já foi adicionado." });
       return;
    }
    setVideoLinks(prev => [...prev, newVideoLink.trim()]);
    setNewVideoLink("");
    toast({ title: "Link Adicionado" });
  };

  const handleRemoveVideoLink = (index: number) => {
    setVideoLinks(prev => prev.filter((_, i) => i !== index));
    toast({ title: "Link Removido" });
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const uniqueNewFiles = newFiles.filter(
        (file) => !imageFiles.some((existingFile) => existingFile.name === file.name && existingFile.size === file.size)
      );

      if (uniqueNewFiles.length > 0) {
        setImageFiles((prevFiles) => [...prevFiles, ...uniqueNewFiles]);
        toast({ title: `${uniqueNewFiles.length} Imagem(ns) Adicionada(s)`});
      } else if (newFiles.length > 0) {
        toast({ variant: "warning", title: "Imagens Duplicadas", description: "Nenhuma imagem nova adicionada." });
      }
      if (imageInputRef.current) {
        imageInputRef.current.value = ""; // Reset file input
      }
    }
  };

  const handleRemoveImageFile = (index: number) => {
    setImageFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    toast({ title: "Imagem Removida" });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };
  // --- End of Handler Functions ---

  // --- *** UPDATED handleSubmit Function with Logging and Error Handling *** ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    const completionNow = new Date();
    const completionDate = completionNow.toISOString().split('T')[0];
    const completionTime = completionNow.toTimeString().slice(0, 5);

    // --- Strict Validations ---
    const cleanTcoNumber = tcoNumber.trim();
    const autoresValidos = autores.filter(a => a.nome?.trim());
    const componentesValidos = componentesGuarnicao.filter(c => c.nome?.trim() || c.rg?.trim());

    if (!cleanTcoNumber) {
       toast({ variant: "destructive", title: "Campo Obrigatório", description: "O número do TCO é obrigatório." });
       return;
    }
     if (natureza === "Selecione...") { // Assuming you have a placeholder option
        toast({ variant: "destructive", title: "Campo Obrigatório", description: "Selecione a Natureza da Ocorrência." });
        return;
     }
     if (natureza === "Outros" && !customNatureza.trim()) {
         toast({ variant: "destructive", title: "Campo Obrigatório", description: "Descreva a Natureza quando 'Outros' for selecionado." });
         return;
     }
     if (autoresValidos.length === 0) {
         toast({ variant: "destructive", title: "Campo Obrigatório", description: "Adicione pelo menos um Autor com nome." });
         return;
     }
     if (componentesValidos.length === 0) {
         toast({ variant: "destructive", title: "Campo Obrigatório", description: "Adicione pelo menos um Componente da Guarnição válido." });
         return;
     }

    if (natureza === "Porte de drogas para consumo" && (!quantidade.trim() || !substancia || !cor || (isUnknownMaterial && !customMaterialDesc.trim()) || !lacreNumero.trim())) {
      toast({ variant: "destructive", title: "Dados da Droga Incompletos", description: "Para Porte de Drogas, preencha Quantidade, Substância, Cor, Número do Lacre e Descrição (se material desconhecido)." });
      return;
    }
    // --- End Validations ---

    console.log("--- Starting TCO Submission ---");
    setIsSubmitting(true);
    setIsTimerRunning(false);

    try {
      const displayNaturezaReal = natureza === "Outros" ? customNatureza.trim() : natureza;
      const indicioFinalDroga = natureza === "Porte de drogas para consumo" ? (isUnknownMaterial ? customMaterialDesc.trim() : indicios) : undefined;

      // Filter out empty/placeholder entries finally before saving
      const vitimasFiltradas = vitimas.filter(v => v.nome?.trim() || v.cpf?.trim() || v.rg?.trim());
      const testemunhasFiltradas = testemunhas.filter(t => t.nome?.trim() || t.cpf?.trim() || t.rg?.trim());

      // User Info (ensure 'user' and 'id' exist in your localStorage item)
      const userInfoString = localStorage.getItem("user");
      const userInfo = userInfoString ? JSON.parse(userInfoString) : {};
      const userId = userInfo.id || null; // Should match Supabase 'createdBy' column type (e.g., uuid)
      const userRegistration = userInfo.registration || "";

      // Convert images to base64
      console.log("Converting images to Base64...");
      const imageBase64Array: { name: string; data: string }[] = [];
      for (const file of imageFiles) {
        try {
          const base64Data = await fileToBase64(file);
          imageBase64Array.push({ name: file.name, data: base64Data });
        } catch (error) {
          console.error(`Error converting image ${file.name} to base64:`, error);
          toast({
            variant: "warning",
            title: "Erro ao Processar Imagem",
            description: `Não foi possível processar ${file.name}. Ela não será incluída.`,
          });
          // Continue without the failed image
        }
      }
      console.log(`${imageBase64Array.length} images converted.`);

      // --- Prepare Data Object for PDF Generation ---
      const tcoDataParaPDF: any = {
        tcoNumber: cleanTcoNumber,
        natureza: displayNaturezaReal,
        tipificacao: tipificacao.trim(),
        penaDescricao: penaDescricao.trim(),
        dataFato, horaFato, dataInicioRegistro, horaInicioRegistro,
        dataTerminoRegistro: completionDate, horaTerminoRegistro: completionTime,
        localFato: localFato.trim(), endereco: endereco.trim(), municipio, comunicante,
        autores: autoresValidos,
        vitimas: vitimasFiltradas,
        testemunhas: testemunhasFiltradas,
        guarnicao: guarnicao.trim(), operacao: operacao.trim(),
        componentesGuarnicao: componentesValidos, // Pass only valid components to PDF
        relatoPolicial: relatoPolicial.trim(), relatoAutor: relatoAutor.trim(),
        relatoTestemunha: relatoTestemunha.trim(), apreensoes: apreensoes.trim(),
        conclusaoPolicial: conclusaoPolicial.trim(),
        lacreNumero: natureza === "Porte de drogas para consumo" ? lacreNumero.trim() : undefined,
        drogaQuantidade: natureza === "Porte de drogas para consumo" ? quantidade.trim() : undefined,
        drogaTipo: natureza === "Porte de drogas para consumo" ? substancia : undefined,
        drogaCor: natureza === "Porte de drogas para consumo" ? cor : undefined,
        drogaNomeComum: indicioFinalDroga,
        drogaCustomDesc: natureza === "Porte de drogas para consumo" && isUnknownMaterial ? customMaterialDesc.trim() : undefined,
        drogaIsUnknown: natureza === "Porte de drogas para consumo" ? isUnknownMaterial : undefined,
        startTime: startTime?.toISOString(), endTime: completionNow.toISOString(),
        userRegistration: userRegistration, videoLinks: videoLinks, imageBase64: imageBase64Array,
        juizadoEspecialData: juizadoEspecialData.trim() || undefined,
        juizadoEspecialHora: juizadoEspecialHora.trim() || undefined,
        relatoVitima: vitimasFiltradas.length > 0 ? relatoVitima.trim() : undefined,
        representacao: vitimasFiltradas.length > 0 && representacao ? formatRepresentacao(representacao) : undefined,
        // Remove undefined keys explicitly if generatePDF requires it
      };
       Object.keys(tcoDataParaPDF).forEach(key => tcoDataParaPDF[key] === undefined && delete tcoDataParaPDF[key]);
      console.log("Data prepared for PDF generation:", tcoDataParaPDF);

      // --- Generate PDF ---
      console.log("Generating PDF...");
      const pdfBlob: Blob = await generatePDF(tcoDataParaPDF);
      if (!pdfBlob || pdfBlob.size === 0) {
           throw new Error("Falha ao gerar o PDF. O arquivo Blob está vazio ou inválido.");
      }
      console.log("PDF Blob generated successfully, size:", pdfBlob.size, "type:", pdfBlob.type);

      // --- Upload PDF to Supabase Storage ---
      // Sanitize TCO number for use in path (replace slashes, etc.)
       const safeTcoNumber = cleanTcoNumber.replace(/[\/\\]/g, '_');
      const pdfFileName = `${safeTcoNumber}.pdf`;
      const pdfPath = `tcos/${safeTcoNumber}/${pdfFileName}`; // Structure: bucket/tcos/TCO_NUMBER/TCO_NUMBER.pdf
      const BUCKET_NAME = 'tco-pdfs'; // ** VERIFY THIS BUCKET NAME EXISTS **

      console.log(`Attempting PDF upload to Supabase Storage: ${BUCKET_NAME}/${pdfPath}`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(pdfPath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true, // Overwrite if exists (useful for testing/retries)
        });

      // **** CRITICAL: Check Storage Upload Error ****
      console.log("Supabase Storage Upload Response:", { uploadData, uploadError: uploadError ? { message: uploadError.message, status: (uploadError as any).status } : null }); // Log specific error details
      if (uploadError) {
        console.error(">>> SUPABASE STORAGE UPLOAD FAILED:", uploadError);
        let userMessage = `Erro no upload do PDF: ${uploadError.message}`;
        // Add specific user messages based on common errors
        if (uploadError.message?.includes('Not found') || (uploadError as any).status === 404) {
            userMessage = "Erro no upload: Bucket 'tco-pdfs' não encontrado ou caminho inválido.";
        } else if (uploadError.message?.includes('Auth') || uploadError.message?.includes('policy') || (uploadError as any).status === 401 || (uploadError as any).status === 403) {
            userMessage = "Erro de permissão ao fazer upload do PDF. Verifique as políticas RLS do bucket 'tco-pdfs'.";
        }
        throw new Error(userMessage); // Throw to stop execution and show toast
      }
      console.log("PDF upload successful to Supabase Storage:", pdfPath);

      // --- Save Metadata to Supabase Database ---
      const TABLE_NAME = 'tco_pdfs'; // ** VERIFY THIS TABLE NAME EXISTS **

      // Prepare metadata object - ENSURE keys match your Supabase table columns exactly
      const tcoMetadata = {
        tcoNumber: safeTcoNumber, // Use the sanitized TCO number
        natureza: displayNaturezaReal,
        // 'created_at' is usually handled by Supabase default value
        policiais: componentesValidos // Store valid components as JSONB
                     .map(p => ({ nome: p.nome, rg: p.rg, posto: p.posto })),
        pdfPath: pdfPath, // Store the storage path
        createdBy: userId, // ** ENSURE 'createdBy' column exists and accepts this type (uuid or text), handle NULL if needed **
        // Add other relevant fields from your table schema here
      };

      console.log(`Attempting DB insert into Supabase table: ${TABLE_NAME}`, tcoMetadata);
      const { data: insertData, error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert([tcoMetadata]) // insert expects an array
        .select('id') // Optionally get the ID back
        .single(); // If you expect only one row inserted

      // **** CRITICAL: Check Database Insert Error ****
      console.log("Supabase DB Insert Response:", { insertData, insertError: insertError ? { message: insertError.message, code: insertError.code, details: insertError.details } : null }); // Log specific error details
      if (insertError) {
        console.error(">>> SUPABASE DB INSERT FAILED:", insertError);
        // Attempt to remove the already uploaded PDF if DB insert fails (best effort)
        console.warn("DB insert failed, attempting to roll back PDF upload:", pdfPath);
        const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([pdfPath]);
        if (deleteError) console.error("Rollback failed: Could not remove PDF after DB error:", deleteError);

        // Provide more specific user messages
        let userMessage = `Erro ao salvar dados: ${insertError.message}`;
        if (insertError.code === '23502') { // NOT NULL violation
            userMessage = `Erro ao salvar: Campo obrigatório '${(insertError as any).column_name || 'desconhecido'}' não foi preenchido.`;
        } else if (insertError.code === '22P02') { // Invalid text representation (e.g., wrong type for UUID)
             userMessage = "Erro ao salvar: Tipo de dado inválido para uma coluna. Verifique os dados enviados.";
        } else if (insertError.code === '23505') { // Unique constraint violation
             userMessage = `Erro ao salvar: O número do TCO '${safeTcoNumber}' já existe no banco de dados.`;
        } else if (insertError.message?.includes('policy')) { // RLS policy violation
            userMessage = "Erro de permissão ao salvar dados. Verifique as políticas RLS da tabela 'tco_pdfs'.";
        }
        throw new Error(userMessage); // Throw to stop execution and show toast
      }
      console.log("DB insert successful, new record ID:", insertData?.id);

      // --- Success ---
      toast({ title: "TCO Registrado com Sucesso!", description: `PDF e dados do TCO ${cleanTcoNumber} salvos.` });
      console.log("Submission successful. Navigating...");
      navigate("/?tab=tco"); // Navigate to TCO list/dashboard

    } catch (error: any) {
      console.error("!!! ERROR during handleSubmit:", error); // Log the caught error object
      toast({
        variant: "destructive",
        title: "Erro ao Finalizar TCO",
        // Display the specific error message thrown from the try block
        description: error.message || 'Ocorreu um erro inesperado. Verifique o console do navegador para mais detalhes.',
        duration: 10000 // Longer duration for errors
      });
    } finally {
      console.log("--- Finishing TCO Submission ---");
      // Ensure button is re-enabled even if errors occurred
      setIsSubmitting(false);
    }
  };
  // --- *** END of UPDATED handleSubmit Function *** ---

  // --- Natureza Options ---
  const naturezaOptions = [
    "Ameaça", "Vias de Fato", "Lesão Corporal", "Dano", "Injúria",
    "Difamação", "Calúnia", "Perturbação do Sossego",
    "Porte de drogas para consumo", "Outros"
  ];

  // --- Derived State for Display ---
  const condutorParaDisplay = componentesGuarnicao.find(c => c.nome?.trim() || c.rg?.trim()); // Find first valid officer

  // --- Keyboard Handler ---
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      // Allow Enter on submit buttons and TextAreas
      if ((target.tagName === 'BUTTON' && (target as HTMLButtonElement).type === 'submit') || target.tagName === 'TEXTAREA') {
        return;
      }
      // Prevent Enter from submitting the form on other inputs/selects
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
         e.preventDefault();
         // Optionally, find the next focusable element and focus it
      }
    }
  };

  // --- JSX Structure (Keep as it was, using updated state/handlers) ---
  return (
    <div className="container px-4 py-6 md:py-10 max-w-5xl mx-auto">
      {/* Add noValidate to use custom validation */}
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-8" noValidate>
        {/* BasicInformationTab */}
        <BasicInformationTab
          tcoNumber={tcoNumber} setTcoNumber={setTcoNumber}
          natureza={natureza} setNatureza={setNatureza}
          autor={autor} setAutor={setAutor} // Display derived autor
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
            isCustomNatureza={natureza === "Outros"} customNatureza={customNatureza}
            dataFato={dataFato} setDataFato={setDataFato}
            horaFato={horaFato} setHoraFato={setHoraFato}
            dataInicioRegistro={dataInicioRegistro} horaInicioRegistro={horaInicioRegistro}
            // dataTerminoRegistro/horaTerminoRegistro are set on submit, no need for setters here
            dataTerminoRegistro="" horaTerminoRegistro="" // Pass empty or calculated values if needed for display
            localFato={localFato} setLocalFato={setLocalFato}
            endereco={endereco} setEndereco={setEndereco}
            municipio={municipio}
            comunicante={comunicante} setComunicante={setComunicante}
            guarnicao={guarnicao} setGuarnicao={setGuarnicao}
            operacao={operacao} setOperacao={setOperacao}
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
            natureza={natureza}
        />

        {/* GuarnicaoTab */}
        <GuarnicaoTab
          currentGuarnicaoList={componentesGuarnicao}
          onAddPolicial={handleAddPolicialToList}
          onRemovePolicial={handleRemovePolicialFromList}
        />

        {/* HistoricoTab */}
         <HistoricoTab
            relatoPolicial={relatoPolicial} setRelatoPolicial={handleRelatoPolicialChange}
            relatoAutor={relatoAutor} setRelatoAutor={setRelatoAutor}
            relatoVitima={relatoVitima} setRelatoVitima={setRelatoVitima}
            relatoTestemunha={relatoTestemunha} setRelatoTestemunha={setRelatoTestemunha}
            apreensoes={apreensoes} setApreensoes={setApreensoes}
            conclusaoPolicial={conclusaoPolicial} setConclusaoPolicial={setConclusaoPolicial}
            drugSeizure={natureza === "Porte de drogas para consumo"}
            representacao={representacao} setRepresentacao={setRepresentacao}
            natureza={natureza}
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
                        Anexe imagens (JPG, PNG). Serão incluídas no PDF.
                    </p>
                </div>
              <input
                type="file"
                multiple
                accept="image/jpeg, image/png" // Restrict accepted types
                ref={imageInputRef}
                onChange={handleImageFileChange}
                className="hidden"
                id="imageUpload"
              />
              <Button
                type="button"
                variant="outline"
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
                          type="button" variant="ghost" size="icon"
                          onClick={() => handleRemoveImageFile(index)}
                          className="text-gray-400 group-hover:text-red-500 hover:bg-red-100 h-7 w-7"
                          aria-label={`Remover imagem ${file.name}`} >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {imageFiles.length === 0 && (<p className="text-xs text-gray-400 text-center italic pt-2">Nenhuma imagem adicionada.</p>)}
            </div>

             {/* Video Links */}
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col space-y-4 hover:border-green-500 transition-colors duration-200 ease-in-out">
              <div className="flex flex-col items-center text-center">
                <VideoIcon className="w-12 h-12 text-green-600 mb-2" />
                <h3 className="text-lg font-medium text-gray-700">Vídeos (Links Externos)</h3>
                <p className="text-sm text-gray-500 px-4 mt-1">Adicione links (YouTube, Drive, etc.).</p>
              </div>
              <div className="flex w-full space-x-2 items-center pt-1">
                <input
                  type="url" value={newVideoLink}
                  onChange={(e) => setNewVideoLink(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                  aria-label="Link do vídeo" />
                <Button
                  type="button" onClick={handleAddVideoLink}
                  className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                  size="icon" aria-label="Adicionar link de vídeo"
                  disabled={!newVideoLink.trim()} >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              {videoLinks.length > 0 && (
                <div className="w-full pt-2">
                  <p className="text-sm font-medium text-gray-600 mb-1.5">Links adicionados:</p>
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                    {videoLinks.map((link, index) => (
                      <li key={`${index}-${link}`} className="flex justify-between items-center p-1.5 bg-white border border-gray-200 rounded-md text-sm group shadow-sm">
                        <a href={link} target="_blank" rel="noopener noreferrer"
                           className="text-blue-600 hover:underline truncate mr-2 flex-1" title={`Abrir link: ${link}`} >
                          {link}
                        </a>
                        <Button
                           type="button" variant="ghost" size="icon"
                           onClick={() => handleRemoveVideoLink(index)}
                           className="text-gray-400 group-hover:text-red-500 hover:bg-red-100 h-7 w-7"
                           aria-label={`Remover link ${link}`} >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
               {videoLinks.length === 0 && (<p className="text-xs text-gray-400 text-center italic pt-2">Nenhum link de vídeo adicionado.</p>)}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-10 pt-6 border-t border-gray-300">
          <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[240px]">
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando e Gerando PDF...
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
// --- END OF FILE TCOForm (31).tsx ---
