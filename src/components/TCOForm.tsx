import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import BasicInformationTab from "./tco/BasicInformationTab";
import GeneralInformationTab from "./tco/GeneralInformationTab";
import PessoasEnvolvidasTab from "./tco/PessoasEnvolvidasTab";
import GuarnicaoTab from "./tco/GuarnicaoTab";
import HistoricoTab from "./tco/HistoricoTab";
import DrugVerificationTab from "./tco/DrugVerificationTab";
import { generatePDF } from "./tco/pdfGenerator";

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
  assinatura?: string; // Added for Autor compatibility
}

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
  console.log("Componentes recebidos em formatarGuarnicao:", componentes);
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
  if (autores.length === 0) {
    return "O AUTOR DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.";
  }
  if (autores.length === 1) {
    const sexo = autores[0].sexo.toLowerCase();
    const pronome = sexo === "feminino" ? "A AUTORA" : "O AUTOR";
    return `${pronome} DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.`;
  }
  const todosFemininos = autores.every(a => a.sexo.toLowerCase() === "feminino");
  const pronomePlural = todosFemininos ? "AS AUTORAS" : "OS AUTORES";
  return `${pronomePlural} DOS FATOS ABAIXO ASSINADOS, JÁ QUALIFICADOS NOS AUTOS, CIENTIFICADOS DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLARARAM QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSERAM E NEM LHE FOI PERGUNTADO.`;
};

// Função para converter números até 10 em texto
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
  const [activeTab, setActiveTab] = useState("basic");

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
  const [vitimas, setVitimas] = useState<Pessoa[]>([{
    nome: "", sexo: "", estadoCivil: "", profissao: "",
    endereco: "", dataNascimento: "", naturalidade: "",
    filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
    celular: "", email: "", laudoPericial: "Não",
    assinatura: ""
  }]);
  const [testemunhas, setTestemunhas] = useState<Pessoa[]>([{
    nome: "", sexo: "", estadoCivil: "", profissao: "",
    endereco: "", dataNascimento: "", naturalidade: "",
    filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
    celular: "", email: "", laudoPericial: "Não",
    assinatura: ""
  }]);
  const [autores, setAutores] = useState<Pessoa[]>([{
    nome: "", sexo: "", estadoCivil: "", profissao: "",
    endereco: "", dataNascimento: "", naturalidade: "",
    filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
    celular: "", email: "", laudoPericial: "Não",
    assinatura: ""
  }]);
  const relatoPolicialTemplate = `POR VOLTA DAS [HORÁRIO] DO DIA [DATA], NESTA CIDADE DE VÁRZEA GRANDE-MT, A GUARNIÇÃO DA VIATURA [GUARNIÇÃO][OPERACAO_TEXT] COMPOSTA PELOS MILITARES [GUPM], DURANTE RONDAS NO BAIRRO [BAIRRO], FOI ACIONADA VIA [MEIO DE ACIONAMENTO] PARA ATENDER A UMA OCORRÊNCIA DE [NATUREZA] NO [LOCAL], ONDE [VERSÃO INICIAL]. CHEGANDO NO LOCAL, A EQUIPE [O QUE A PM DEPAROU]. A VERSÃO DAS PARTES FOI REGISTRADA EM CAMPO PRÓPRIO. [VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]. [DILIGÊNCIAS E APREENSÕES REALIZADAS]. DIANTE DISSO, [ENCAMINHAMENTO PARA REGISTRO DOS FATOS].`;
  const [relatoPolicial, setRelatoPolicial] = useState(relatoPolicialTemplate);
  const [relatoAutor, setRelatoAutor] = useState(formatarRelatoAutor(autores));
  const [relatoVitima, setRelatoVitima] = useState("RELATOU A VÍTIMA, ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
  const [relatoTestemunha, setRelatoTestemunha] = useState("A TESTEMUNHA ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, COMPROMISSADA NA FORMA DA LEI, QUE AOS COSTUMES RESPONDEU NEGATIVAMENTE OU QUE É AMIGA/PARENTE DE UMA DAS PARTES, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
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
    if (natureza === "Porte de drogas para consumo" && indicios) {
      const indicioFinal = isUnknownMaterial && customMaterialDesc ? customMaterialDesc : indicios;
      if (indicioFinal) {
        const quantidadeNum = parseInt(quantidade.match(/\d+/)?.[0] || "1", 10);
        const quantidadeText = quantidadeNum <= 10 ? numberToText(quantidadeNum) : quantidadeNum.toString();
        const plural = quantidadeNum > 1 ? "PORÇÕES" : "PORÇÃO";
        const descriptiveText = isUnknownMaterial
          ? `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA DE MATERIAL DESCONHECIDO, ${customMaterialDesc || "[DESCRIÇÃO]"}, CONFORME FOTO EM ANEXO.`
          : `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA ANÁLOGA A ${indicioFinal.toUpperCase()}, CONFORME FOTO EM ANEXO.`;
        if (!apreensoes || apreensoes.includes("[DESCRIÇÃO]") || apreensoes === relatoPolicialTemplate) {
          setApreensoes(descriptiveText);
        }
      }
    } else if (natureza !== "Porte de drogas para consumo") {
      setLacreNumero("");
      setVitimas([]);
      setRelatoVitima("");
      setRepresentacao("");
    }
  }, [natureza, indicios, isUnknownMaterial, customMaterialDesc, quantidade, apreensoes, relatoPolicialTemplate]);

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

    const autorTexto = autores.length === 0 ? "O(A) AUTOR(A)" :
      autores.length === 1 ? (autores[0].sexo.toLowerCase() === "feminino" ? "A AUTORA" : "O AUTOR") :
      autores.every(a => a.sexo.toLowerCase() === "feminino") ? "AS AUTORAS" : "OS AUTORES";
    const testemunhaTexto = testemunhas.filter(t => t.nome.trim()).length > 1 ? "TESTEMUNHAS" : "TESTEMUNHA";
    const conclusaoBase = `DIANTE DAS CIRCUNSTÂNCIAS E DE TUDO O QUE FOI RELATADO, RESTA ACRESCENTAR QUE ${autorTexto} INFRINGIU, EM TESE, A CONDUTA DE ${displayNaturezaReal.toUpperCase()}, PREVISTA EM ${tipificacaoAtual}. NADA MAIS HAVENDO A TRATAR, DEU-SE POR FINDO O PRESENTE TERMO CIRCUNSTANCIADO DE OCORRÊNCIA QUE VAI DEVIDAMENTE ASSINADO PELAS PARTES E ${testemunhaTexto}, SE HOUVER, E POR MIM, RESPONSÁVEL PELA LAVRATURA, QUE O DIGITEI. E PELO FATO DE ${autorTexto} TER SE COMPROMETIDO A COMPARECER AO JUIZADO ESPECIAL CRIMINAL, ESTE FOI LIBERADO SEM LESÕES CORPORAIS APARENTES, APÓS A ASSINATURA DO TERMO DE COMPROMISSO.`;

    setConclusaoPolicial(conclusaoBase);
  }, [natureza, customNatureza, tipificacao, penaDescricao, autores, testemunhas]);

  useEffect(() => {
    if (isRelatoPolicialManuallyEdited) {
      console.log("Atualização automática de relatoPolicial pulada devido a edição manual.");
      return;
    }

    console.log("Atualizando relatoPolicial com:", { horaFato, dataFato, guarnicao, operacao, componentesGuarnicao, endereco, comunicante, natureza, customNatureza, localFato });
    let updatedRelato = relatoPolicialTemplate;
    const bairro = endereco ? endereco.split(',').pop()?.trim() || "[BAIRRO PENDENTE]" : "[BAIRRO PENDENTE]";
    const gupm = formatarGuarnicao(componentesGuarnicao);
    console.log("Valor de gupm antes da substituição:", gupm);
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "OUTROS" : natureza;
    const operacaoText = operacao ? `, DURANTE A ${operacao},` : "";

    updatedRelato = updatedRelato
      .replace("[HORÁRIO]", horaFato || "[HORÁRIO]")
      .replace("[DATA]", dataFato ? new Date(dataFato + 'T00:00:00Z').toLocaleDateString('pt-BR') : "[DATA]")
      .replace("[GUARNIÇÃO]", guarnicao || "[GUARNIÇÃO PENDENTE]")
      .replace("[OPERACAO_TEXT]", operacaoText)
      .replace("[GUPM]", gupm)
      .replace("[BAIRRO]", bairro)
      .replace("[MEIO DE ACIONAMENTO]", comunicante || "[ACIONAMENTO]")
      .replace("[NATUREZA]", displayNaturezaReal || "[NATUREZA PENDENTE]")
      .replace("[LOCAL]", localFato || "[LOCAL PENDENTE]")
      .replace("[VERSÃO INICIAL]", "[DETALHAR VERSÃO INICIAL]")
      .replace("[O QUE A PM DEPAROU]", "[DETALHAR O QUE A PM DEPAROU]")
      .replace("[VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]", "[RESUMO DAS VERSÕES]")
      .replace("[DILIGÊNCIAS E APREENSÕES REALIZADAS]", "[DESCREVER DILIGÊNCIAS/APREENSÕES]")
      .replace("[ENCAMINHAMENTO PARA REGISTRO DOS FATOS]", "[DETALHAR ENCAMINHAMENTO]");

    updatedRelato = updatedRelato.toUpperCase();
    console.log("Relato atualizado:", updatedRelato);

    setRelatoPolicial(updatedRelato);
  }, [horaFato, dataFato, guarnicao, operacao, componentesGuarnicao, endereco, comunicante, natureza, customNatureza, localFato]);

  useEffect(() => {
    const novoRelatoAutor = formatarRelatoAutor(autores).toUpperCase();
    setRelatoAutor(novoRelatoAutor);
  }, [autores]);

  useEffect(() => {
    if (autores.length > 0 && autores[0].nome !== autor) {
      setAutor(autores[0].nome);
    } else if (autor && (autores.length === 0 || autores[0].nome !== autor)) {
      const newAutores = [...autores];
      if (newAutores.length === 0) {
        newAutores.push({
          nome: autor, sexo: "", estadoCivil: "", profissao: "",
          endereco: "", dataNascimento: "", naturalidade: "",
          filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
          celular: "", email: "", laudoPericial: "Não",
          assinatura: ""
        });
      } else {
        newAutores[0] = { ...newAutores[0], nome: autor };
      }
      setAutores(newAutores);
    }
  }, [autor, autores]);

  const handleAddPolicialToList = useCallback((novoPolicial: ComponenteGuarnicao) => {
    const alreadyExists = componentesGuarnicao.some(comp => comp.rg === novoPolicial.rg);
    if (!alreadyExists) {
      setComponentesGuarnicao(prevList => {
        const newList = prevList.length === 0 || (prevList.length === 1 && !prevList[0].rg && !prevList[0].nome && !prevList[0].posto)
          ? [novoPolicial]
          : [...prevList, novoPolicial];
        console.log("Novo policial adicionado:", novoPolicial, "Nova lista:", newList);
        return newList;
      });
      toast({ title: "Adicionado", description: `Policial ${novoPolicial.nome} adicionado à guarnição.` });
    } else {
      toast({ variant: "warning", title: "Duplicado", description: "Este policial já está na guarnição." });
    }
  }, [componentesGuarnicao, toast]);

  const handleRemovePolicialFromList = useCallback((indexToRemove: number) => {
    setComponentesGuarnicao(prevList => {
      const newList = prevList.filter((_, index) => index !== indexToRemove);
      console.log("Policial removido, nova lista:", newList);
      return newList;
    });
  }, []);

  const handleAddVitima = () => {
    setVitimas([...vitimas, {
      nome: "", sexo: "", estadoCivil: "", profissao: "",
      endereco: "", dataNascimento: "", naturalidade: "",
      filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
      celular: "", email: "", laudoPericial: "Não",
      assinatura: ""
    }]);
  };
  const handleRemoveVitima = (index: number) => {
    if (vitimas.length > 0) {
      const newVitimas = vitimas.filter((_, i) => i !== index);
      setVitimas(newVitimas);
    }
  };
  const handleAddTestemunha = () => {
    setTestemunhas([...testemunhas, {
      nome: "", sexo: "", estadoCivil: "", profissao: "",
      endereco: "", dataNascimento: "", naturalidade: "",
      filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
      celular: "", email: "", laudoPericial: "Não",
      assinatura: ""
    }]);
  };
  const handleRemoveTestemunha = (index: number) => {
    if (testemunhas.length > 0) {
      const newTestemunhas = testemunhas.filter((_, i) => i !== index);
      setTestemunhas(newTestemunhas);
    }
  };
  const handleAddAutor = () => {
    setAutores([...autores, {
      nome: "", sexo: "", estadoCivil: "", profissao: "",
      endereco: "", dataNascimento: "", naturalidade: "",
      filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
      celular: "", email: "", laudoPericial: "Não",
      assinatura: ""
    }]);
  };
  const handleRemoveAutor = (index: number) => {
    if (autores.length > 0) {
      const newAutores = autores.filter((_, i) => i !== index);
      setAutores(newAutores);
      if (index === 0 && newAutores.length > 0) setAutor(newAutores[0].nome);
      else if (newAutores.length === 0) setAutor("");
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
    } else if (field === 'laudoPericial') {
      processedValue = value;
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
    } else if (field === 'laudoPericial') {
      processedValue = value;
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
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < 18) {
          toast({ variant: "destructive", title: "Atenção: Autor Menor de Idade", description: "Avalie se cabe TCO." });
        }
      }
    } else if (field === 'laudoPericial') {
      processedValue = value;
    }
    newAutores[index] = { ...newAutores[index], [field]: processedValue };
    setAutores(newAutores);
    if (index === 0 && field === 'nome') setAutor(processedValue);
  };

  const handleRelatoPolicialChange = (value: string) => {
    setRelatoPolicial(value);
    setIsRelatoPolicialManuallyEdited(true);
    console.log("Relato policial editado manualmente:", value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const completionNow = new Date();
    const completionDate = completionNow.toISOString().split('T')[0];
    const completionTime = completionNow.toTimeString().slice(0, 5);

    if (!tcoNumber || natureza === "Selecione..." || (natureza === "Outros" && !customNatureza) || autores.length === 0 || !autores[0].nome || componentesGuarnicao.length === 0) {
      toast({
        variant: "destructive",
        title: "Campos Essenciais Faltando",
        description: "Verifique: Nº TCO, Natureza, Autor Principal e pelo menos um Componente da Guarnição."
      });
      return;
    }

    if (natureza === "Porte de drogas para consumo" && (!quantidade || !substancia || !cor || (isUnknownMaterial && !customMaterialDesc) || !lacreNumero)) {
      toast({ variant: "destructive", title: "Dados da Droga Incompletos", description: "Preencha Quantidade, Substância, Cor, Descrição (se material desconhecido) e Número do Lacre." });
      return;
    }

    setIsSubmitting(true);
    setIsTimerRunning(false);

    try {
      const displayNaturezaReal = natureza === "Outros" ? customNatureza : natureza;
      const indicioFinalDroga = natureza === "Porte de drogas para consumo" ? (isUnknownMaterial ? customMaterialDesc : indicios) : "";
      const vitimasFiltradas = natureza === "Porte de drogas para consumo" ? [] : vitimas.filter(v => v.nome?.trim());
      const testemunhasFiltradas = testemunhas.filter(t => t.nome?.trim());

      const tcoDataParaSalvar: any = {
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
        autores,
        vitimas: vitimasFiltradas,
        testemunhas: testemunhasFiltradas,
        guarnicao: guarnicao.trim(),
        operacao: operacao.trim(),
        componentesGuarnicao,
        relatoPolicial: relatoPolicial.trim(),
        relatoAutor: relatoAutor.trim(),
        relatoTestemunha: relatoTestemunha.trim(),
        apreensoes: apreensoes.trim(),
        conclusaoPolicial: conclusaoPolicial.trim(),
        lacreNumero: natureza === "Porte de drogas para consumo" ? lacreNumero.trim() : "",
        lacre: "",
        objetosApreendidos: [],
        drogaQuantidade: natureza === "Porte de drogas para consumo" ? quantidade.trim() : undefined,
        drogaTipo: natureza === "Porte de drogas para consumo" ? substancia : undefined,
        drogaCor: natureza === "Porte de drogas para consumo" ? cor : undefined,
        drogaNomeComum: natureza === "Porte de drogas para consumo" ? indicioFinalDroga : undefined,
        drogaCustomDesc: natureza === "Porte de drogas para consumo" && isUnknownMaterial ? customMaterialDesc.trim() : undefined,
        drogaIsUnknown: natureza === "Porte de drogas para consumo" ? isUnknownMaterial : undefined,
        startTime: startTime?.toISOString(),
        endTime: completionNow.toISOString(),
        createdAt: new Date(),
        createdBy: JSON.parse(localStorage.getItem("user") || "{}").id
      };

      // Excluir relatoVitima e representacao para casos de droga
      if (natureza !== "Porte de drogas para consumo") {
        tcoDataParaSalvar.relatoVitima = relatoVitima.trim();
        tcoDataParaSalvar.representacao = formatRepresentacao(representacao);
      }

      Object.keys(tcoDataParaSalvar).forEach(key => tcoDataParaSalvar[key] === undefined && delete tcoDataParaSalvar[key]);

      console.log("Dados a serem salvos/gerados:", tcoDataParaSalvar);

      await addDoc(collection(db, "tcos"), tcoDataParaSalvar);

      toast({ title: "TCO Registrado", description: "Registrado com sucesso no banco de dados!" });

      const pdfDoc = generatePDF(tcoDataParaSalvar);
      pdfDoc.save(`TCO_${tcoDataParaSalvar.tcoNumber}.pdf`);

      navigate("/?tab=tco");
    } catch (error: any) {
      console.error("Erro ao salvar ou gerar TCO:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Ocorreu um erro: ${error.message || 'Erro desconhecido'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const naturezaOptions = [
    "Ameaça", "Vias de Fato", "Lesão Corporal", "Dano", "Injúria",
    "Difamação", "Calúnia", "Perturbação do Sossego",
    "Porte de drogas para consumo", "Outros"
  ];

  const condutorParaDisplay = componentesGuarnicao[0];

  return (
    <div className="container px-4 py-6 md:py-10 max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInformationTab
          tcoNumber={tcoNumber} setTcoNumber={setTcoNumber}
          natureza={natureza} setNatureza={setNatureza}
          autor={autor} setAutor={setAutor}
          penaDescricao={penaDescricao} naturezaOptions={naturezaOptions}
          customNatureza={customNatureza} setCustomNatureza={setCustomNatureza}
          startTime={startTime} isTimerRunning={isTimerRunning}
        />
        {natureza === "Porte de drogas para consumo" && (
          <DrugVerificationTab
            quantidade={quantidade} setQuantidade={setQuantidade}
            substancia={substancia} setSubstancia={setSubstancia}
            cor={cor} setCor={setCor}
            indicios={indicios}
            customMaterialDesc={customMaterialDesc} setCustomMaterialDesc={setCustomMaterialDesc}
            isUnknownMaterial={isUnknownMaterial}
            lacreNumero={lacreNumero} setLacreNumero={setLacreNumero}
          />
        )}
        <GeneralInformationTab
          natureza={natureza} tipificacao={tipificacao} setTipificacao={setTipificacao}
          isCustomNatureza={natureza === "Outros"} customNatureza={customNatureza}
          dataFato={dataFato} setDataFato={setDataFato}
          horaFato={horaFato} setHoraFato={setHoraFato}
          dataInicioRegistro={dataInicioRegistro} horaInicioRegistro={horaInicioRegistro}
          dataTerminoRegistro={dataTerminoRegistro} horaTerminoRegistro={horaTerminoRegistro}
          localFato={localFato} setLocalFato={setLocalFato}
          endereco={endereco} setEndereco={setEndereco}
          municipio={municipio}
          comunicante={comunicante} setComunicante={setComunicante}
          guarnicao={guarnicao} setGuarnicao={setGuarnicao}
          operacao={operacao} setOperacao={setOperacao}
          condutorNome={condutorParaDisplay?.nome || ""}
          condutorPosto={condutorParaDisplay?.posto || ""}
          condutorRg={condutorParaDisplay?.rg || ""}
        />
        <PessoasEnvolvidasTab
          activeTab={activeTab} setActiveTab={setActiveTab}
          autorDetalhes={autores[0] || { nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", dataNascimento: "", naturalidade: "", filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "", celular: "", email: "", laudoPericial: "Não", assinatura: "" }}
          vitimas={vitimas} handleVitimaChange={handleVitimaChange} handleAddVitima={handleAddVitima} handleRemoveVitima={handleRemoveVitima}
          testemunhas={testemunhas} handleTestemunhaChange={handleTestemunhaChange} handleAddTestemunha={handleAddTestemunha} handleRemoveTestemunha={handleRemoveTestemunha}
          autores={autores} handleAutorDetalhadoChange={handleAutorDetalhadoChange} handleAddAutor={handleAddAutor} handleRemoveAutor={handleRemoveAutor}
          natureza={natureza}
        />
        <GuarnicaoTab
          currentGuarnicaoList={componentesGuarnicao}
          onAddPolicial={handleAddPolicialToList}
          onRemovePolicial={handleRemovePolicialFromList}
        />
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
        <div className="flex justify-end mt-8">
          <Button type="submit" disabled={isSubmitting} size="lg">
            <FileText className="mr-2 h-5 w-5" />
            {isSubmitting ? "Gerando e Salvando..." : "Finalizar e Gerar TCO"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TCOForm;
