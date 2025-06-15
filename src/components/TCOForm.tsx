import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { generatePDF, generateTCOFilename } from "./tco/pdfGenerator";
import { uploadPDF, saveTCOMetadata, ensureBucketExists } from '@/lib/supabaseStorage';

// << CORREÇÃO: Interface para a estrutura de uma única droga. Essencial para o novo modelo de dados. >>
interface Droga {
  id: string; // ID único para usar como 'key' no React e facilitar a remoção
  quantidade: string;
  substancia: string;
  cor: string;
  odor: string;
  indicios: string;
  isUnknownMaterial: boolean;
  customMaterialDesc: string;
}
interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
  apoio?: boolean; // Campo para indicar se o policial é de apoio
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
  relato?: string; // Added for victim testimony
  representacao?: string; // Added for victim representation
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

// << CORREÇÃO: Estado inicial para o formulário de uma nova droga. Usado para limpar os campos após adicionar. >>
const initialNovaDrogaState: Omit<Droga, 'id'> = {
  quantidade: "",
  substancia: "",
  cor: "",
  odor: "",
  indicios: "",
  isUnknownMaterial: false,
  customMaterialDesc: ""
};
const formatRepresentacao = (representacao: string): string => {
  if (representacao === "representar") return "representar";
  if (representacao === "decidir_posteriormente") return "decidir_posteriormente";
  return "";
};
const formatCPF = (cpf: string): string => {
  cpf = cpf.replace(/\D/g, ''); // Remove tudo que não for dígito
  if (cpf.length > 0) {
    cpf = cpf.slice(0, 11); // Limita a 11 dígitos
    cpf = cpf.replace(/(\d{1,3})(\d{1,3})?(\d{1,3})?(\d{1,2})?/, (match, p1, p2, p3, p4) => {
      let result = p1;
      if (p2) result += `.${p2}`;
      if (p3) result += `.${p3}`;
      if (p4) result += `-${p4}`;
      return result;
    });
  }
  return cpf;
};
const formatPhone = (phone: string): string => {
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
const formatarGuarnicao = (componentes: ComponenteGuarnicao[]): string => {
  if (!componentes || componentes.length === 0) return "[GUPM PENDENTE]";
  const principais = componentes.filter(c => c && c.nome && c.posto && !c.apoio);
  const apoio = componentes.filter(c => c && c.nome && c.posto && c.apoio);
  const nomesPrincipais = principais.map(c => `${c.posto} PM ${c.nome}`);
  const nomesApoio = apoio.map(c => `${c.posto} PM ${c.nome} (APOIO)`);
  const nomesFormatados = [...nomesPrincipais, ...nomesApoio];
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
  const [natureza, setNatureza] = useState(""); // Removido valor padrão
  const [customNatureza, setCustomNatureza] = useState("");
  const [autor, setAutor] = useState("");
  const [representacao, setRepresentacao] = useState("");
  const [tipificacao, setTipificacao] = useState("");
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

  // << CORREÇÃO: Os estados individuais de droga foram removidos. >>
  // const [quantidade, setQuantidade] = useState(""); // REMOVIDO
  // const [substancia, setSubstancia] = useState(""); // REMOVIDO
  // ... e os outros.

  // << CORREÇÃO: Substituídos por um estado de array para a lista de drogas e um estado para o formulário de nova droga. >>
  const [drogas, setDrogas] = useState<Droga[]>([]);
  const [novaDroga, setNovaDroga] = useState<Omit<Droga, 'id'>>(initialNovaDrogaState);
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
  const [providencias, setProvidencias] = useState("");
  const [documentosAnexos, setDocumentosAnexos] = useState("");
  const relatoPolicialTemplate = `POR VOLTA DAS [HORÁRIO] DO DIA [DATA], NESTA CIDADE DE VÁRZEA GRANDE-MT, A GUARNIÇÃO DA VIATURA [GUARNIÇÃO][OPERACAO_TEXT] COMPOSTA PELOS MILITARES [GUPM], DURANTE RONDAS NO BAIRRO [BAIRRO], FOI ACIONADA VIA [MEIO DE ACIONAMENTO] PARA ATENDER A UMA OCORRÊNCIA DE [NATUREZA] NO [LOCAL], ONDE [VERSÃO INICIAL]. CHEGANDO NO LOCAL, A EQUIPE [O QUE A PM DEPAROU]. A VERSÃO DAS PARTES FOI REGISTRADA EM CAMPO PRÓPRIO. [VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]. [DILIGÊNCIAS E APREENSÕES REALIZADAS]. DIANTE DISSO, [ENCAMINHAMENTO PARA REGISTRO DOS FATOS].`;
  const [relatoPolicial, setRelatoPolicial] = useState(relatoPolicialTemplate);
  const [relatoAutor, setRelatoAutor] = useState(formatarRelatoAutor(autores));
  const [relatoVitima, setRelatoVitima] = useState("RELATOU A VÍTIMA, ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
  const [relatoTestemunha, setRelatoTestemunha] = useState("A TESTEMUNHA ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, COMPROMISSADA NA FORMA DA LEI, QUE AOS COSTUMES RESPONDEU NEGATIVAMENTE OU QUE É AMIGA/PARENTE DE UMA DAS PARTES, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSERAM E NEM LHE FOI PERGUNTADO.");
  const [conclusaoPolicial, setConclusaoPolicial] = useState("");
  const [isRelatoPolicialManuallyEdited, setIsRelatoPolicialManuallyEdited] = useState(false);
  const isPrimaryDrugCase = natureza.split(' + ')[0] === "Porte de drogas para consumo";

  // << CORREÇÃO: Novas funções para manipular a lista de drogas. >>
  const handleNovaDrogaChange = useCallback((field: keyof Omit<Droga, 'id'>, value: string | boolean) => {
    setNovaDroga(prev => {
      const updatedDroga = {
        ...prev,
        [field]: value
      };

      // A lógica de autocompletar os "indícios" agora vive aqui, reagindo à mudança no formulário.
      const {
        substancia,
        cor
      } = updatedDroga;
      let indicios = "";
      let isUnknownMaterial = false;
      if (substancia === "Vegetal" && cor !== "Verde") {
        isUnknownMaterial = true;
        indicios = "Material desconhecido";
      } else if (substancia === "Artificial" && cor !== "Amarelada" && cor !== "Branca") {
        isUnknownMaterial = true;
        indicios = "Material desconhecido";
      } else {
        isUnknownMaterial = false;
        if (substancia === "Vegetal" && cor === "Verde") indicios = "Maconha";else if (substancia === "Artificial" && cor === "Amarelada") indicios = "Pasta-Base";else if (substancia === "Artificial" && cor === "Branca") indicios = "Cocaína";else indicios = "";
      }
      return {
        ...updatedDroga,
        indicios,
        isUnknownMaterial
      };
    });
  }, []);
  const handleAdicionarDroga = useCallback(() => {
    if (!novaDroga.quantidade.trim() || !novaDroga.substancia) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos a quantidade e a substância da droga.",
        className: "bg-red-600 text-white border-red-700"
      });
      return;
    }
    const drogaParaAdicionar: Droga = {
      id: new Date().toISOString() + Math.random(),
      // ID único para a lista
      ...novaDroga
    };
    setDrogas(prev => [...prev, drogaParaAdicionar]);
    setNovaDroga(initialNovaDrogaState); // Limpa o formulário para a próxima droga
    toast({
      title: "Sucesso",
      description: `"${drogaParaAdicionar.indicios}" adicionado(a) à lista.`,
      className: "bg-green-600 text-white border-green-700"
    });
  }, [novaDroga, toast]);
  const handleRemoverDroga = useCallback((id: string) => {
    setDrogas(prev => prev.filter(d => d.id !== id));
    toast({
      title: "Removido",
      description: "Item removido da lista de drogas.",
      className: "bg-blue-600 text-white border-blue-700"
    });
  }, []);
  const handleVitimaRelatoChange = (index: number, relato: string) => {
    const newVitimas = [...vitimas];
    if (newVitimas[index]) {
      newVitimas[index] = {
        ...newVitimas[index],
        relato
      };
      setVitimas(newVitimas);
    }
  };
  const handleVitimaRepresentacaoChange = (index: number, novaRepresentacao: string) => {
    const newVitimas = [...vitimas];
    if (newVitimas[index]) {
      newVitimas[index] = {
        ...newVitimas[index],
        representacao: novaRepresentacao
      };
      setVitimas(newVitimas);
    }
  };
  const handleTestemunhaRelatoChange = (index: number, relato: string) => {
    const newTestemunhas = [...testemunhas];
    if (newTestemunhas[index]) {
      newTestemunhas[index] = {
        ...newTestemunhas[index],
        relato
      };
      setTestemunhas(newTestemunhas);
    }
  };
  const handleAutorRelatoChange = (index: number, relato: string) => {
    const newAutores = [...autores];
    if (newAutores[index]) {
      newAutores[index] = {
        ...newAutores[index],
        relato
      };
      setAutores(newAutores);
    }
  };
  useEffect(() => {
    if (tcoNumber && !isTimerRunning) {
      setStartTime(new Date());
      setIsTimerRunning(true);
    }
  }, [tcoNumber, isTimerRunning]);

  // << CORREÇÃO: O useEffect que atualizava os indícios foi removido daqui, pois sua lógica foi movida para handleNovaDrogaChange. >>
  // useEffect(() => { ... }, [substancia, cor]); // REMOVIDO

  // << CORREÇÃO: useEffect refatorado para gerar o texto de apreensões a partir do array 'drogas' >>
  useEffect(() => {
    if (isPrimaryDrugCase) {
      // Gera a descrição para cada droga no array
      const descricoesDrogas = drogas.map(droga => {
        const indicioFinal = droga.isUnknownMaterial && droga.customMaterialDesc ? droga.customMaterialDesc : droga.indicios;
        if (!indicioFinal) return "";
        const quantidadeNum = parseInt(droga.quantidade.match(/\d+/)?.[0] || "1", 10);
        const quantidadeText = numberToText(quantidadeNum);

        // << CORREÇÃO: Lógica ajustada para singular/plural de "PORÇÃO PEQUENA" >>
        const porcaoTexto = quantidadeNum > 1 ? "PORÇÕES PEQUENAS" : "PORÇÃO PEQUENA";
        return droga.isUnknownMaterial ? `${quantidadeText.toUpperCase()} ${porcaoTexto} DE SUBSTÂNCIA DE MATERIAL DESCONHECIDO, ${indicioFinal.toUpperCase()}, CONFORME FOTO EM ANEXO.` : `${quantidadeText.toUpperCase()} ${porcaoTexto} DE SUBSTÂNCIA ANÁLOGA A ${indicioFinal.toUpperCase()}, CONFORME FOTO EM ANEXO.`;

        // << CORREÇÃO: Alterado de '\n\n' para '\n' para remover a linha em branco >>
      }).filter(Boolean).join('\n');
      setApreensoes(descricoesDrogas);

      // Lógica original para limpar vítimas em caso de droga
      setVitimas([{
        ...initialPersonData,
        nome: ""
      }]);
      setRepresentacao("");
    } else {
      // Se não for caso de droga, limpa as descrições de drogas do campo de apreensões
      if (apreensoes.includes("SUBSTÂNCIA ANÁLOGA A") || apreensoes.includes("MATERIAL DESCONHECIDO")) {
        setApreensoes("");
      }
      // Reseta as drogas se a natureza mudar
      if (drogas.length > 0) {
        setDrogas([]);
      }
      // Lógica original para restaurar vítimas é mantida
      setVitimas(prevVitimas => {
        if (prevVitimas.length === 1 && prevVitimas[0].nome === "") {
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
  }, [natureza, drogas, isPrimaryDrugCase]);
  useEffect(() => {
    const primeiraNatureza = natureza.split(' + ')[0];
    const displayNaturezaReal = primeiraNatureza === "Outros" ? customNatureza.trim() : natureza;
    let tipificacaoAtual = "";
    let penaAtual = "";
    if (primeiraNatureza === "Outros") {
      tipificacaoAtual = tipificacao || "[TIPIFICAÇÃO LEGAL A SER INSERIDA]";
      penaAtual = penaDescricao || "";
    } else {
      switch (primeiraNatureza) {
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
        case "Conduzir veículo sem CNH gerando perigo de dano":
          tipificacaoAtual = "ART. 309 DO CÓDIGO DE TRÂNSITO BRASILEIRO";
          penaAtual = "DETENÇÃO DE 6 MESES A 1 ANO, OU MULTA";
          break;
        case "Entregar veículo automotor a pessoa não habilitada":
          tipificacaoAtual = "ART. 310 DO CÓDIGO DE TRÂNSITO BRASILEIRO";
          penaAtual = "DETENÇÃO DE 6 MESES A 1 ANO, OU MULTA";
          break;
        case "Trafegar em velocidade incompatível com segurança":
          tipificacaoAtual = "ART. 311 DO CÓDIGO DE TRÂNSITO BRASILEIRO";
          penaAtual = "DETENÇÃO DE 6 MESES A 1 ANO, OU MULTA";
          break;
        case "Omissão de socorro":
          tipificacaoAtual = "ART. 135 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 1 A 6 MESES, OU MULTA";
          break;
        case "Rixa":
          tipificacaoAtual = "ART. 137 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 15 DIAS A 2 MESES, OU MULTA";
          break;
        case "Invasão de domicílio":
          tipificacaoAtual = "ART. 150 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 1 A 3 MESES, OU MULTA";
          break;
        case "Fraude em comércio":
          tipificacaoAtual = "ART. 176 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 6 MESES A 2 ANOS, OU MULTA";
          break;
        case "Ato obsceno":
          tipificacaoAtual = "ART. 233 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 3 MESES A 1 ANO, OU MULTA";
          break;
        case "Falsa identidade":
          tipificacaoAtual = "ART. 307 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 3 MESES A 1 ANO, OU MULTA";
          break;
        case "Resistência":
          tipificacaoAtual = "ART. 329 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 2 MESES A 2 ANOS";
          break;
        case "Desobediência":
          tipificacaoAtual = "ART. 330 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 15 DIAS A 6 MESES, OU MULTA";
          break;
        case "Desacato":
          tipificacaoAtual = "ART. 331 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 6 MESES A 2 ANOS, OU MULTA";
          break;
        case "Exercício arbitrário das próprias razões":
          tipificacaoAtual = "ART. 345 DO CÓDIGO PENAL";
          penaAtual = "DETENÇÃO DE 15 DIAS A 1 MÊS, OU MULTA";
          break;
        default:
          tipificacaoAtual = "[TIPIFICAÇÃO NÃO MAPEADA]";
          penaAtual = "";
      }
      if (primeiraNatureza !== "Outros") {
        setTipificacao(tipificacaoAtual);
        setPenaDescricao(penaAtual);
      }
    }
    const autoresValidos = autores.filter(a => a.nome?.trim());
    const autorTexto = autoresValidos.length === 0 ? "O(A) AUTOR(A)" : autoresValidos.length === 1 ? autoresValidos[0].sexo.toLowerCase() === "feminino" ? "A AUTORA" : "O AUTOR" : autoresValidos.every(a => a.sexo.toLowerCase() === "feminino") ? "AS AUTORAS" : "OS AUTORES";
    const testemunhasValidas = testemunhas.filter(t => t.nome?.trim());
    const testemunhaTexto = testemunhasValidas.length > 1 ? "TESTEMUNHAS" : testemunhasValidas.length === 1 ? "TESTEMUNHA" : "";
    const conclusaoBase = `DIANTE DAS CIRCUNSTÂNCIAS E DE TUDO O QUE FOI RELATADO, RESTA ACRESCENTAR QUE ${autorTexto} INFRINGIU, EM TESE, A CONDUTA DE ${displayNaturezaReal.toUpperCase()}, PREVISTA EM ${tipificacaoAtual}. NADA MAIS HAVENDO A TRATAR, DEU-SE POR FINDO O PRESENTE TERMO CIRCUNSTANCIADO DE OCORRÊNCIA QUE VAI DEVIDAMENTE ASSINADO PELAS PARTES${testemunhaTexto ? ` E ${testemunhaTexto}` : ""}, E POR MIM, RESPONSÁVEL PELA LAVRATURA, QUE O DIGITEI. E PELO FATO DE ${autorTexto} TER SE COMPROMETIDO A COMPARECER AO JUIZADO ESPECIAL CRIMINAL, ESTE FOI LIBERADO SEM LESÕES CORPORAIS APARENTES, APÓS A ASSINATURA DO TERMO DE COMPROMISSO.`;
    setConclusaoPolicial(conclusaoBase);
  }, [natureza, customNatureza, tipificacao, penaDescricao, autores, testemunhas]);
  useEffect(() => {
    if (isRelatoPolicialManuallyEdited) return;
    let updatedRelato = relatoPolicialTemplate;
    const bairro = endereco ? endereco.split(',').pop()?.trim() || "[BAIRRO PENDENTE]" : "[BAIRRO PENDENTE]";
    const gupm = formatarGuarnicao(componentesGuarnicao);
    const displayNaturezaRealParaRelato = (natureza.split(' + ')[0] === "Outros" ? customNatureza : natureza) || "[NATUREZA PENDENTE]";
    const operacaoText = operacao ? `, DURANTE A ${operacao.toUpperCase()},` : "";
    updatedRelato = updatedRelato.replace("[HORÁRIO]", horaFato || "[HORÁRIO PENDENTE]").replace("[DATA]", dataFato ? new Date(dataFato + 'T00:00:00Z').toLocaleDateString('pt-BR', {
      timeZone: 'UTC'
    }) : "[DATA PENDENTE]").replace("[GUARNIÇÃO]", guarnicao || "[GUARNIÇÃO PENDENTE]").replace("[OPERACAO_TEXT]", operacaoText).replace("[GUPM]", gupm).replace("[BAIRRO]", bairro).replace("[MEIO DE ACIONAMENTO]", comunicante || "[ACIONAMENTO PENDENTE]").replace("[NATUREZA]", displayNaturezaRealParaRelato.toUpperCase()).replace("[LOCAL]", localFato || "[LOCAL PENDENTE]").replace("[VERSÃO INICIAL]", "[VERSÃO INICIAL]").replace("[O QUE A PM DEPAROU]", "[O QUE A PM DEPAROU]").replace("[VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]", "[VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]").replace("[DILIGÊNCIAS E APREENSÕES REALIZADAS]", "[DILIGÊNCIAS E APREENSÕES REALIZADAS]").replace("[ENCAMINHAMENTO PARA REGISTRO DOS FATOS]", "[ENCAMINHAMENTO PARA REGISTRO DOS FATOS]");
    if (!isRelatoPolicialManuallyEdited || relatoPolicial === relatoPolicialTemplate) {
      setRelatoPolicial(updatedRelato.toUpperCase());
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
  useEffect(() => {
    const updatedAutores = autores.map(autorPessoa => {
      if (autorPessoa.nome.trim() !== "" && !autorPessoa.relato) {
        const sexo = autorPessoa.sexo.toLowerCase();
        const pronome = sexo === "feminino" ? "A AUTORA" : "O AUTOR";
        return {
          ...autorPessoa,
          relato: `${pronome} DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.`
        };
      }
      return autorPessoa;
    });
    const hasChanges = updatedAutores.some((autorPessoa, index) => autorPessoa.relato !== autores[index].relato);
    if (hasChanges) {
      setAutores(updatedAutores);
    }
  }, [autores]);
  useEffect(() => {
    const autoresComRelato = autores.filter(a => a.nome.trim() !== "" && a.relato);
    if (autoresComRelato.length > 0) {
      const relatosConsolidados = autoresComRelato.map(a => a.relato).join('\n\n');
      setRelatoAutor(relatosConsolidados);
    } else {
      const novoRelatoAutor = formatarRelatoAutor(autores).toUpperCase();
      setRelatoAutor(novoRelatoAutor);
    }
  }, [autores]);
  const handleAddPolicialToList = useCallback((novoPolicial: ComponenteGuarnicao) => {
    const alreadyExists = componentesGuarnicao.some(comp => comp.rg === novoPolicial.rg);
    if (!alreadyExists) {
      setComponentesGuarnicao(prevList => {
        const newList = prevList.length === 0 || prevList.length === 1 && !prevList[0].rg && !prevList[0].nome && !prevList[0].posto ? [{
          ...novoPolicial,
          apoio: false
        }] : [...prevList, {
          ...novoPolicial,
          apoio: false
        }];
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
  const handleRemovePolicialFromList = useCallback((index: number) => {
    setComponentesGuarnicao(prevList => prevList.filter((_, i) => i !== index));
  }, []);
  const handleToggleApoioPolicial = useCallback((index: number) => {
    setComponentesGuarnicao(prevList => {
      const updatedList = [...prevList];
      updatedList[index] = {
        ...updatedList[index],
        apoio: !updatedList[index].apoio
      };
      return updatedList;
    });
    toast({
      title: "Status Alterado",
      description: `Policial ${componentesGuarnicao[index].nome} agora é ${componentesGuarnicao[index].apoio ? 'da guarnição principal' : 'de apoio'}.`,
      className: "bg-blue-600 text-white border-blue-700",
      duration: 5000
    });
  }, [componentesGuarnicao, toast]);
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
    const today = new Date();
    const minorAuthor = newAutores.find(autorPessoa => {
      if (autorPessoa.dataNascimento) {
        const birthDate = new Date(autorPessoa.dataNascimento + 'T00:00:00Z');
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
    const primeiraNaturezaSubmit = natureza.split(' + ')[0];
    if (primeiraNaturezaSubmit === "Outros" && !customNatureza.trim()) {
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

    // << CORREÇÃO: A validação agora checa se o array de drogas não está vazio e se o lacre foi preenchido. >>
    if (isPrimaryDrugCase && (drogas.length === 0 || !lacreNumero.trim())) {
      toast({
        title: "Dados da Droga Incompletos",
        description: "Para Porte de Drogas, adicione pelo menos um tipo de droga à lista e preencha o Número do Lacre.",
        className: "bg-red-600 text-white border-red-700",
        duration: 7000
      });
      return;
    }
    setIsSubmitting(true);
    setIsTimerRunning(false);
    try {
      const displayNaturezaRealSubmit = primeiraNaturezaSubmit === "Outros" ? customNatureza.trim() : natureza;
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
      const relatoAutorConsolidado = autoresValidos.filter(a => a.relato && a.relato.trim() !== "").map(a => a.relato).join('\n\n') || relatoAutor;

      // << CORREÇÃO: O objeto enviado para o PDF agora contém o array 'drogas' em vez de campos individuais. >>
      const tcoDataParaPDF: any = {
        tcoNumber: tcoNumber.trim(),
        natureza: displayNaturezaRealSubmit,
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
        relatoAutor: relatoAutorConsolidado.trim(),
        relatoTestemunha: relatoTestemunha.trim(),
        apreensoes: apreensoes.trim(),
        conclusaoPolicial: conclusaoPolicial.trim(),
        lacreNumero: isPrimaryDrugCase ? lacreNumero.trim() : undefined,
        drogas: isPrimaryDrugCase ? drogas : undefined,
        // << CAMPO NOVO COM O ARRAY DE DROGAS >>
        startTime: startTime?.toISOString(),
        endTime: completionNow.toISOString(),
        userRegistration: userRegistration,
        videoLinks: videoLinks,
        imageBase64: imageBase64Array,
        juizadoEspecialData: juizadoEspecialData.trim() || undefined,
        juizadoEspecialHora: juizadoEspecialHora.trim() || undefined,
        relatoVitima: vitimasFiltradas.length > 0 && vitimasFiltradas[0].nome !== 'O ESTADO' ? relatoVitima.trim() : undefined,
        representacao: vitimasFiltradas.length > 0 && vitimasFiltradas[0].nome !== 'O ESTADO' && representacao ? formatRepresentacao(representacao) : undefined,
        downloadLocal: true,
        providencias: providencias,
        documentosAnexos: documentosAnexos
      };
      Object.keys(tcoDataParaPDF).forEach(key => tcoDataParaPDF[key] === undefined && delete tcoDataParaPDF[key]);
      console.log("Dados para gerar PDF:", tcoDataParaPDF);
      const pdfGenerationPromise = generatePDF(tcoDataParaPDF);
      const timeoutPromise = new Promise<Blob>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido ao gerar o PDF.")), 90000);
      });
      const pdfBlob = await Promise.race([pdfGenerationPromise, timeoutPromise]);
      if (!pdfBlob || pdfBlob.size === 0) throw new Error("Falha ao gerar o PDF. O arquivo está vazio.");
      console.log("PDF gerado, tamanho:", pdfBlob.size, "tipo:", pdfBlob.type);
      const desiredFileName = generateTCOFilename(tcoDataParaPDF);
      const filePath = `tcos/${userId || 'anonimo'}/${desiredFileName}`;
      const bucketExists = await ensureBucketExists();
      if (!bucketExists) {
        throw new Error("Não foi possível criar ou verificar o bucket de armazenamento.");
      }
      const {
        url: downloadURL,
        error: uploadError
      } = await uploadPDF(filePath, pdfBlob, {
        tcoNumber: tcoNumber.trim(),
        natureza: displayNaturezaRealSubmit,
        createdBy: userId || 'anonimo'
      });
      if (uploadError) throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`);
      if (!downloadURL) throw new Error("URL do arquivo não disponível após o upload.");
      console.log('URL pública do arquivo:', downloadURL);
      const tcoMetadata = {
        tconumber: tcoNumber.trim(),
        natureza: displayNaturezaRealSubmit,
        policiais: componentesValidos.map(p => ({
          nome: p.nome,
          rgpm: p.rg,
          posto: p.posto,
          apoio: !!p.apoio
        })),
        pdfpath: filePath,
        pdfurl: downloadURL,
        createdby: userId,
        createdat: new Date().toISOString()
      };
      console.log("Metadados para salvar no DB:", tcoMetadata);
      let attempt = 0;
      let metadataSuccess = false;
      let lastError: any = null;
      while (attempt < 3 && !metadataSuccess) {
        try {
          attempt++;
          console.log(`Tentativa ${attempt} de salvar metadados...`);
          const {
            error: metadataError
          } = await saveTCOMetadata(tcoMetadata);
          if (metadataError) {
            console.error(`Erro na tentativa ${attempt} ao salvar metadados:`, metadataError);
            lastError = metadataError;
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
          } else {
            console.log("Metadados salvos com sucesso no DB");
            metadataSuccess = true;
          }
        } catch (error) {
          console.error(`Exceção na tentativa ${attempt}:`, error);
          lastError = error;
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
        }
      }
      if (!metadataSuccess) {
        const errorMessage = lastError instanceof Error ? lastError.message : String(lastError || 'Erro desconhecido');
        throw new Error(`Falha ao salvar metadados após ${attempt} tentativas: ${errorMessage}`);
      }
      toast({
        title: "TCO Registrado com Sucesso!",
        description: "PDF enviado e informações salvas no sistema.",
        className: "bg-green-600 text-white border-green-700",
        duration: 5000
      });
      navigate("/?tab=tco");
    } catch (error: any) {
      console.error("Erro geral no processo de submissão do TCO:", error);
      const errorMessage = error instanceof Error ? error.message : String(error || 'Erro desconhecido.');
      toast({
        title: "Erro ao Finalizar TCO",
        description: `Ocorreu um erro: ${errorMessage}`,
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
  const naturezaOptions = ["Ameaça", "Vias de Fato", "Lesão Corporal", "Dano", "Injúria", "Difamação", "Calúnia", "Perturbação do Sossego", "Porte de drogas para consumo", "Conduzir veículo sem CNH gerando perigo de dano", "Entregar veículo automotor a pessoa não habilitada", "Trafegar em velocidade incompatível com segurança", "Omissão de socorro", "Rixa", "Invasão de domicílio", "Fraude em comércio", "Ato obsceno", "Falsa identidade", "Resistência", "Desobediência", "Desacato", "Exercício arbitrário das próprias razões", "Outros"];
  const condutorParaDisplay = componentesGuarnicao.find(c => c.nome && c.rg);
  return <div className="container md:py-10 max-w-5xl mx-auto py-0 px-[9px]">
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6" noValidate>
        {hasMinorAuthor.isMinor && hasMinorAuthor.details && <div className="bg-red-100 border-l-4 border-red-600 text-red-700 p-4 rounded-md mb-6 shadow-md">
            <p className="font-semibold">Atenção: Autor Menor de Idade Detectado</p>
            <p>
              O autor {autores[hasMinorAuthor.details.index].nome || 'sem nome'} possui {hasMinorAuthor.details.years} anos,{' '}
              {hasMinorAuthor.details.months} meses e {hasMinorAuthor.details.days} dias. Não é permitido registrar TCO para menores de 18 anos.
            </p>
          </div>}

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
          <BasicInformationTab tcoNumber={tcoNumber} setTcoNumber={setTcoNumber} natureza={natureza} setNatureza={setNatureza} autor={autor} setAutor={setAutor} penaDescricao={penaDescricao} naturezaOptions={naturezaOptions} customNatureza={customNatureza} setCustomNatureza={setCustomNatureza} startTime={startTime} isTimerRunning={isTimerRunning} juizadoEspecialData={juizadoEspecialData} setJuizadoEspecialData={setJuizadoEspecialData} juizadoEspecialHora={juizadoEspecialHora} setJuizadoEspecialHora={setJuizadoEspecialHora} />
        </div>

        {isPrimaryDrugCase && <div className="mb-8">
            {/* << CORREÇÃO: As props do DrugVerificationTab foram completamente alteradas para refletir o novo modelo de dados. >> */}
            <DrugVerificationTab novaDroga={novaDroga} onNovaDrogaChange={handleNovaDrogaChange} onAdicionarDroga={handleAdicionarDroga} drogasAdicionadas={drogas} onRemoverDroga={handleRemoverDroga} lacreNumero={lacreNumero} setLacreNumero={setLacreNumero} />
          </div>}

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <h2 className="text-xl font-semibold mb-4">Informações Gerais da Ocorrência</h2>
          <GeneralInformationTab natureza={natureza} tipificacao={tipificacao} setTipificacao={setTipificacao} isCustomNatureza={natureza.split(' + ')[0] === "Outros"} customNatureza={customNatureza} dataFato={dataFato} setDataFato={setDataFato} horaFato={horaFato} setHoraFato={setHoraFato} dataInicioRegistro={dataInicioRegistro} horaInicioRegistro={horaInicioRegistro} setHoraInicioRegistro={setHoraInicioRegistro} dataTerminoRegistro={dataTerminoRegistro} horaTerminoRegistro={horaTerminoRegistro} localFato={localFato} setLocalFato={setLocalFato} endereco={endereco} setEndereco={setEndereco} municipio={municipio} comunicante={comunicante} setComunicante={setComunicante} guarnicao={guarnicao} setGuarnicao={setGuarnicao} operacao={operacao} setOperacao={setOperacao} condutorNome={condutorParaDisplay?.nome || ""} condutorPosto={condutorParaDisplay?.posto || ""} condutorRg={condutorParaDisplay?.rg || ""} />
        </div>

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <h2 className="text-xl font-semibold mb-4">Pessoas Envolvidas</h2>
          <PessoasEnvolvidasTab vitimas={vitimas} handleVitimaChange={handleVitimaChange} handleAddVitima={handleAddVitima} handleRemoveVitima={handleRemoveVitima} testemunhas={testemunhas} handleTestemunhaChange={handleTestemunhaChange} handleAddTestemunha={handleAddTestemunha} handleRemoveTestemunha={handleRemoveTestemunha} autores={autores} handleAutorDetalhadoChange={handleAutorDetalhadoChange} handleAddAutor={handleAddAutor} handleRemoveAutor={handleRemoveAutor} natureza={natureza} />
        </div>

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <h2 className="text-xl font-semibold mb-4">Guarnição Policial</h2>
          <GuarnicaoTab currentGuarnicaoList={componentesGuarnicao} onAddPolicial={handleAddPolicialToList} onRemovePolicial={handleRemovePolicialFromList} onToggleApoioPolicial={handleToggleApoioPolicial} />
        </div>

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <h2 className="text-xl font-semibold mb-4">Histórico e Narrativas</h2>
          <HistoricoTab relatoPolicial={relatoPolicial} setRelatoPolicial={handleRelatoPolicialChange} relatoAutor={relatoAutor} setRelatoAutor={setRelatoAutor} relatoVitima={relatoVitima} setRelatoVitima={setRelatoVitima} relatoTestemunha={relatoTestemunha} setRelatoTestemunha={setRelatoTestemunha} apreensoes={apreensoes} setApreensoes={setApreensoes} conclusaoPolicial={conclusaoPolicial} setConclusaoPolicial={setConclusaoPolicial} drugSeizure={isPrimaryDrugCase} representacao={representacao} setRepresentacao={setRepresentacao} natureza={natureza} videoLinks={videoLinks} setVideoLinks={setVideoLinks} solicitarCorpoDelito={autores.length > 0 ? autores[0].laudoPericial : "Não"} autorSexo={autores.length > 0 ? autores[0].sexo : "masculino"} providencias={providencias} setProvidencias={setProvidencias} documentosAnexos={documentosAnexos} setDocumentosAnexos={setDocumentosAnexos} lacreNumero={lacreNumero} vitimas={vitimas} setVitimaRelato={handleVitimaRelatoChange} setVitimaRepresentacao={handleVitimaRepresentacaoChange} testemunhas={testemunhas} setTestemunhaRelato={handleTestemunhaRelatoChange} autores={autores} setAutorRelato={handleAutorRelatoChange} />
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Anexos</CardTitle>
            <CardDescription>Adicione fotos ou links de vídeos relacionados à ocorrência.</CardDescription>
          </CardHeader>
          <CardContent className="px-[8px]">
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
                      {videoLinks.map((link, index) => <li key={`${index}-${link}`} className="flex justify-between items-start p-1.5 bg-white border border-gray-200 rounded-md text-sm group shadow-sm gap-2">
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all min-w-0 flex-1 leading-relaxed" title={`Abrir link: ${link}`} style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-all'
                    }}>
                            {link}
                          </a>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveVideoLink(index)} className="text-gray-400 group-hover:text-red-500 hover:bg-red-100 h-7 w-7 shrink-0 mt-0.5" aria-label={`Remover link ${link}`}>
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