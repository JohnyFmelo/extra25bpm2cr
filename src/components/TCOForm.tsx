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
import { normalizeTcoNumber } from "../utils/tcoValidation";

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
  return { years, months, days };
};

const TCOForm: React.FC<TCOFormProps> = ({ selectedTco, onClear }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMinorAuthor, setHasMinorAuthor] = useState<{
    isMinor: boolean;
    details?: { years: number; months: number; days: number; index: number };
  }>({ isMinor: false });
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

  // Drug related states
  const [quantidade, setQuantidade] = useState("");
  const [substancia, setSubstancia] = useState("");
  const [cor, setCor] = useState("");
  const [odor, setOdor] = useState("");
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
  const [providencias, setProvidencias] = useState("");
  const [documentosAnexos, setDocumentosAnexos] = useState("");
  const relatoPolicialTemplate = `POR VOLTA DAS [HORÁRIO] DO DIA [DATA], NESTA CIDADE DE VÁRZEA GRANDE-MT, A GUARNIÇÃO DA VIATURA [GUARNIÇÃO][OPERACAO_TEXT] COMPOSTA PELOS MILITARES [GUPM], DURANTE RONDAS NO BAIRRO [BAIRRO], FOI ACIONADA VIA [MEIO DE ACIONAMENTO] PARA ATENDER A UMA OCORRÊNCIA DE [NATUREZA] NO [LOCAL], ONDE [VERSÃO INICIAL]. CHEGANDO NO LOCAL, A EQUIPE [O QUE A PM DEPAROU]. A VERSÃO DAS PARTES FOI REGISTRADA EM CAMPO PRÓPRIO. [VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]. [DILIGÊNCIAS E APREENSÕES REALIZADAS]. DIANTE DISSO, [ENCAMINHAMENTO PARA REGISTRO DOS FATOS].`;
  const [relatoPolicial, setRelatoPolicial] = useState(relatoPolicialTemplate);
  const [relatoAutor, setRelatoAutor] = useState(formatarRelatoAutor(autores));
  const [relatoVitima, setRelatoVitima] = useState("RELATOU A VÍTIMA, ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
  const [relatoTestemunha, setRelatoTestemunha] = useState("A TESTEMUNHA ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, COMPROMISSADA NA FORMA DA LEI, QUE AOS COSTUMES RESPONDEU NEGATIVAMENTE OU QUE É AMIGA/PARENTE DE UMA DAS PARTES, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSERAM E NEM LHE FOI PERGUNTADO.");
  const [conclusaoPolicial, setConclusaoPolicial] = useState("");
  const [isRelatoPolicialManuallyEdited, setIsRelatoPolicialManuallyEdited] = useState(false);

  const handleVitimaRelatoChange = (index: number, relato: string) => {
    const newVitimas = [...vitimas];
    if (newVitimas[index]) {
      newVitimas[index] = { ...newVitimas[index], relato };
      setVitimas(newVitimas);
    }
  };

  const handleVitimaRepresentacaoChange = (index: number, novaRepresentacao: string) => {
    const newVitimas = [...vitimas];
    if (newVitimas[index]) {
      newVitimas[index] = { ...newVitimas[index], representacao: novaRepresentacao };
      setVitimas(newVitimas);
    }
  };

  const handleTestemunhaRelatoChange = (index: number, relato: string) => {
    const newTestemunhas = [...testemunhas];
    if (newTestemunhas[index]) {
      newTestemunhas[index] = { ...newTestemunhas[index], relato };
      setTestemunhas(newTestemunhas);
    }
  };

  const handleAutorRelatoChange = (index: number, relato: string) => {
    const newAutores = [...autores];
    if (newAutores[index]) {
      newAutores[index] = { ...newAutores[index], relato };
      setAutores(newAutores);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    
    if (!tcoNumber.trim()) {
      toast({
        title: "Erro",
        description: "Número do TCO é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Consolidate individual author reports for PDF
      const consolidatedRelatoAutor = autores
        .filter(autor => autor.nome.trim() && autor.nome !== "Não informado.")
        .map(autor => autor.relato || "")
        .join("\n\n")
        .trim() || relatoAutor;

      const tcoDataParaPDF = {
        tcoNumber: normalizeTcoNumber(tcoNumber),
        natureza,
        customNatureza,
        tipificacao,
        penaDescricao,
        dataFato,
        horaFato,
        dataInicioRegistro,
        horaInicioRegistro,
        dataTerminoRegistro,
        horaTerminoRegistro,
        localFato,
        endereco,
        municipio,
        comunicante,
        guarnicao,
        operacao,
        apreensoes,
        lacreNumero,
        componentesGuarnicao,
        autores,
        vitimas,
        testemunhas,
        relatoPolicial,
        relatoAutor: consolidatedRelatoAutor,
        relatoVitima,
        relatoTestemunha,
        conclusaoPolicial,
        providencias,
        documentosAnexos,
        videoLinks,
        imageFiles,
        juizadoEspecialData,
        juizadoEspecialHora,
        // Drug verification data
        quantidade,
        substancia,
        cor,
        odor,
        indicios,
        customMaterialDesc,
        isUnknownMaterial
      };

      console.log('Generating PDF...');
      const pdfBlob = await generatePDF(tcoDataParaPDF);
      const filename = generateTCOFilename(tcoDataParaPDF);
      
      console.log('Uploading PDF...');
      const { url, error: uploadError } = await uploadPDF(filename, pdfBlob);
      
      if (uploadError) {
        throw uploadError;
      }
      
      console.log('Saving metadata...');
      const { error: metadataError } = await saveTCOMetadata({
        tcoNumber: normalizeTcoNumber(tcoNumber),
        natureza: natureza === "Outros" ? customNatureza : natureza,
        filename
      });

      if (metadataError) {
        throw metadataError;
      }

      toast({
        title: "Sucesso!",
        description: "TCO finalizado e salvo com sucesso",
      });

      navigate('/');
    } catch (error) {
      console.error('Error submitting TCO:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar TCO. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e as any);
    }
  };

  // Vitima handlers
  const handleVitimaChange = (index: number, field: string, value: string) => {
    const newVitimas = [...vitimas];
    if (newVitimas[index]) {
      newVitimas[index] = { ...newVitimas[index], [field]: value };
      setVitimas(newVitimas);
    }
  };

  const handleAddVitima = () => {
    setVitimas([...vitimas, { ...initialPersonData }]);
  };

  const handleRemoveVitima = (index: number) => {
    if (vitimas.length > 1) {
      const newVitimas = vitimas.filter((_, i) => i !== index);
      setVitimas(newVitimas);
    }
  };

  // Testemunha handlers
  const handleTestemunhaChange = (index: number, field: string, value: string) => {
    const newTestemunhas = [...testemunhas];
    if (newTestemunhas[index]) {
      newTestemunhas[index] = { ...newTestemunhas[index], [field]: value };
      setTestemunhas(newTestemunhas);
    }
  };

  const handleAddTestemunha = () => {
    setTestemunhas([...testemunhas, { ...initialPersonData }]);
  };

  const handleRemoveTestemunha = (index: number) => {
    if (testemunhas.length > 1) {
      const newTestemunhas = testemunhas.filter((_, i) => i !== index);
      setTestemunhas(newTestemunhas);
    }
  };

  // Autor handlers
  const handleAutorDetalhadoChange = (index: number, field: string, value: string) => {
    const newAutores = [...autores];
    if (newAutores[index]) {
      newAutores[index] = { ...newAutores[index], [field]: value };
      setAutores(newAutores);
    }
  };

  const handleAddAutor = () => {
    setAutores([...autores, { ...initialPersonData }]);
  };

  const handleRemoveAutor = (index: number) => {
    if (autores.length > 1) {
      const newAutores = autores.filter((_, i) => i !== index);
      setAutores(newAutores);
    }
  };

  // Guarnicao handlers
  const handleAddPolicialToList = (policial: ComponenteGuarnicao) => {
    setComponentesGuarnicao([...componentesGuarnicao, policial]);
  };

  const handleRemovePolicialFromList = (index: number) => {
    const newComponentes = componentesGuarnicao.filter((_, i) => i !== index);
    setComponentesGuarnicao(newComponentes);
  };

  const handleToggleApoioPolicial = (index: number) => {
    const newComponentes = [...componentesGuarnicao];
    if (newComponentes[index]) {
      newComponentes[index] = { 
        ...newComponentes[index], 
        apoio: !newComponentes[index].apoio 
      };
      setComponentesGuarnicao(newComponentes);
    }
  };

  // Image handlers
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
  };

  const handleRemoveImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Video handlers
  const handleAddVideoLink = () => {
    if (newVideoLink.trim()) {
      setVideoLinks([...videoLinks, newVideoLink.trim()]);
      setNewVideoLink("");
    }
  };

  const handleRemoveVideoLink = (index: number) => {
    setVideoLinks(prev => prev.filter((_, i) => i !== index));
  };

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
      setVitimas([{ ...initialPersonData, nome: "O ESTADO" }]);
      setRepresentacao("");
    } else {
      if (apreensoes.includes("SUBSTÂNCIA ANÁLOGA A") || apreensoes.includes("MATERIAL DESCONHECIDO")) {
        setApreensoes("");
      }
      setVitimas(prevVitimas => {
        if (prevVitimas.length === 1 && prevVitimas[0].nome === "O ESTADO") {
          return [{ ...initialPersonData }];
        }
        if (prevVitimas.length === 0 || (prevVitimas.length === 1 && !prevVitimas[0].nome && !prevVitimas[0].cpf)) {
          return [{ ...initialPersonData }];
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
    const autorTexto = autoresValidos.length === 0 ? "O(A) AUTOR(A)" : 
      autoresValidos.length === 1 ? (autoresValidos[0].sexo.toLowerCase() === "feminino" ? "A AUTORA" : "O AUTOR") : 
      autoresValidos.every(a => a.sexo.toLowerCase() === "feminino") ? "AS AUTORAS" : "OS AUTORES";
    const testemunhasValidas = testemunhas.filter(t => t.nome.trim() !== "");
    const testemunhaTexto = testemunhasValidas.length > 1 ? "TESTEMUNHAS" : testemunhasValidas.length === 1 ? "TESTEMUNHA" : "";
    const conclusaoBase = `DIANTE DAS CIRCUNSTÂNCIAS E DE TUDO O QUE FOI RELATADO, RESTA ACRESCENTAR QUE ${autorTexto} INFRINGIU, EM TESE, A CONDUTA DE ${displayNaturezaReal.toUpperCase()}, PREVISTA EM ${tipificacaoAtual}. NADA MAIS HAVENDO A TRATAR, DEU-SE POR FINDO O PRESENTE TERMO CIRCUNSTANCIADO DE OCORRÊNCIA QUE VAI DEVIDAMENTE ASSINADO PELAS PARTES${testemunhaTexto ? ` E ${testemunhaTexto}` : ""}, E POR MIM, RESPONSÁVEL PELA LAVRATURA, QUE O DIGITEI. E PELO FATO DE ${autorTexto} TER SE COMPROMETIDO A COMPARECER AO JUIZADO ESPECIAL CRIMINAL, ESTE FOI LIBERADO SEM LESÕES CORPORAIS APARENTES, APÓS A ASSINATURA DO TERMO DE COMPROMISSO.`;
    setConclusaoPolicial(conclusaoBase);
  }, [natureza, customNatureza, tipificacao, penaDescricao, autores, testemunhas]);

  const naturezaOptions = [
    "Ameaça",
    "Vias de Fato",
    "Lesão Corporal",
    "Dano",
    "Injúria",
    "Difamação",
    "Calúnia",
    "Perturbação do Sossego",
    "Porte de drogas para consumo",
    "Outros"
  ];
  const condutorParaDisplay = componentesGuarnicao.find(c => c.nome && c.rg);

  return (
    <div className="container px-4 py-6 md:py-10 max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6" noValidate>
        {hasMinorAuthor.isMinor && hasMinorAuthor.details && (
          <div className="bg-red-100 border-l-4 border-red-600 text-red-700 p-4 rounded-md mb-6 shadow-md">
            <p className="font-semibold">Atenção: Autor Menor de Idade Detectado</p>
            <p>
              O autor {autores[hasMinorAuthor.details.index].nome || 'sem nome'} possui {hasMinorAuthor.details.years} anos,{' '}
              {hasMinorAuthor.details.months} meses e {hasMinorAuthor.details.days} dias. Não é permitido registrar TCO para menores de 18 anos.
            </p>
          </div>
        )}

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <h2 className="text-xl font-semibold mb-4">Informações Básicas do TCO</h2>
          <BasicInformationTab
            tcoNumber={tcoNumber}
            setTcoNumber={setTcoNumber}
            natureza={natureza}
            setNatureza={setNatureza}
            autor={autor}
            setAutor={setAutor}
            penaDescricao={penaDescricao}
            naturezaOptions={naturezaOptions}
            customNatureza={customNatureza}
            setCustomNatureza={setCustomNatureza}
            startTime={startTime}
            isTimerRunning={isTimerRunning}
            juizadoEspecialData={juizadoEspecialData}
            setJuizadoEspecialData={setJuizadoEspecialData}
            juizadoEspecialHora={juizadoEspecialHora}
            setJuizadoEspecialHora={setJuizadoEspecialHora}
          />
        </div>

        {natureza === "Porte de drogas para consumo" && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Verificação de Entorpecente</CardTitle>
              <CardDescription>Detalhes sobre a substância apreendida.</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <h2 className="text-xl font-semibold mb-4">Informações Gerais da Ocorrência</h2>
          <GeneralInformationTab
            natureza={natureza}
            tipificacao={tipificacao}
            setTipificacao={setTipificacao}
            isCustomNatureza={natureza === "Outros"}
            customNatureza={customNatureza}
            dataFato={dataFato}
            setDataFato={setDataFato}
            horaFato={horaFato}
            setHoraFato={setHoraFato}
            dataInicioRegistro={dataInicioRegistro}
            horaInicioRegistro={horaInicioRegistro}
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
          <h2 className="text-xl font-semibold mb-4">Pessoas Envolvidas</h2>
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
        </div>

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <h2 className="text-xl font-semibold mb-4">Guarnição Policial</h2>
          <GuarnicaoTab
            currentGuarnicaoList={componentesGuarnicao}
            onAddPolicial={handleAddPolicialToList}
            onRemovePolicial={handleRemovePolicialFromList}
            onToggleApoioPolicial={handleToggleApoioPolicial}
          />
        </div>

        <div className="mb-8 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
          <h2 className="text-xl font-semibold mb-4">Histórico e Narrativas</h2>
          <HistoricoTab
            relatoPolicial={relatoPolicial}
            setRelatoPolicial={setRelatoPolicial}
            relatoAutor={relatoAutor}
            setRelatoAutor={setRelatoAutor}
            relatoVitima={relatoVitima}
            setRelatoVitima={setRelatoVitima}
            relatoTestemunha={relatoTestemunha}
            setRelatoTestemunha={setRelatoTestemunha}
            apreensoes={apreensoes}
            setApreensoes={setApreensoes}
            conclusaoPolicial={conclusaoPolicial}
            setConclusaoPolicial={setConclusaoPolicial}
            drugSeizure={natureza === "Porte de drogas para consumo"}
            representacao={representacao}
            setRepresentacao={setRepresentacao}
            natureza={natureza}
            videoLinks={videoLinks}
            setVideoLinks={setVideoLinks}
            solicitarCorpoDelito={autores.length > 0 ? autores[0].laudoPericial : "Não"}
            autorSexo={autores.length > 0 ? autores[0].sexo : "masculino"}
            providencias={providencias}
            setProvidencias={setProvidencias}
            documentosAnexos={documentosAnexos}
            setDocumentosAnexos={setDocumentosAnexos}
            lacreNumero={lacreNumero}
            vitimas={vitimas}
            setVitimaRelato={handleVitimaRelatoChange}
            setVitimaRepresentacao={handleVitimaRepresentacaoChange}
            testemunhas={testemunhas}
            setTestemunhaRelato={handleTestemunhaRelatoChange}
            autores={autores}
            setAutorRelato={handleAutorRelatoChange}
          />
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Anexos (Opcional)</CardTitle>
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
                <input
                  type="file"
                  multiple
                  accept="image/jpeg, image/png, image/gif"
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
                        <li
                          key={`${file.name}-${index}-${file.lastModified}`}
                          className="flex justify-between items-center p-1.5 bg-white border border-gray-200 rounded-md text-sm group shadow-sm"
                        >
                          <span className="truncate mr-2 flex-1 text-gray-700" title={file.name}>
                            {file.name} <span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
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

              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col space-y-4 hover:border-green-500 transition-colors duration-200 ease-in-out">
                <div className="flex flex-col items-center text-center">
                  <VideoIcon className="w-12 h-12 text-green-600 mb-2" />
                  <h3 className="text-lg font-medium text-gray-700">Vídeos (Links)</h3>
                  <p className="text-sm text-gray-500 px-4 mt-1">Adicione links para vídeos online (YouTube, Drive, etc.).</p>
                </div>
                <div className="flex w-full space-x-2 items-center pt-1">
                  <Input
                    type="url"
                    value={newVideoLink}
                    onChange={e => setNewVideoLink(e.target.value)}
                    placeholder="https://..."
                    aria-label="Link do vídeo"
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    onClick={handleAddVideoLink}
                    className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                    size="icon"
                    aria-label="Adicionar link de vídeo"
                    disabled={!newVideoLink.trim()}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                {videoLinks.length > 0 && (
                  <div className="w-full pt-2">
                    <p className="text-sm font-medium text-gray-600 mb-1.5">Links adicionados:</p>
                    <ul className="space-y-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                      {videoLinks.map((link, index) => (
                        <li
                          key={`${index}-${link}`}
                          className="flex justify-between items-center p-1.5 bg-white border border-gray-200 rounded-md text-sm group shadow-sm"
                        >
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
          </CardContent>
        </Card>

        <div className="flex justify-end mt-8 pt-6 border-t border-gray-300">
          <Button 
            type="submit" 
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Finalizando..." : "Finalizar TCO"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TCOForm;
