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

// --- Interfaces ---
interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
  // Outros campos do policial podem existir aqui (pai, mae, cpf etc)
  // mas não são diretamente gerenciados pelo TCOForm principal,
  // são tratados dentro de GuarnicaoTab.
}

interface Pessoa { // Interface comum para Vítima, Testemunha, Autor
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
  corpoDelito: "Sim" | "Não" | ""; // <-- NOVO: Adicionado para Autor e Vítima
}

// --- Funções Auxiliares ---
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
// *** IMPORTANTE: Garantir que esta função esteja definida ANTES de ser usada ***
// *** Ou que seja exportada/importada corretamente se estiver em outro arquivo ***
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

// --- Componente Principal ---
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

  // --- ESTADOS DO FORMULÁRIO ---

  // Basic
  const [tcoNumber, setTcoNumber] = useState("");
  const [natureza, setNatureza] = useState("Vias de Fato");
  const [customNatureza, setCustomNatureza] = useState("");
  const [autor, setAutor] = useState("");

  // General
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

  // Guarnição
  const [componentesGuarnicao, setComponentesGuarnicao] = useState<ComponenteGuarnicao[]>([]);

  // Drogas
  const [quantidade, setQuantidade] = useState("");
  const [substancia, setSubstancia] = useState("");
  const [cor, setCor] = useState("");
  const [indicios, setIndicios] = useState("");
  const [customMaterialDesc, setCustomMaterialDesc] = useState("");
  const [isUnknownMaterial, setIsUnknownMaterial] = useState(false);
  // <-- NOVOS ESTADOS PARA DROGAS -->
  const [solicitarPericia, setSolicitarPericia] = useState<"Sim" | "Não">("Não");
  const [numeroLacre, setNumeroLacre] = useState("");
  // <-- FIM NOVOS ESTADOS DROGAS -->

  // Pessoas (com campo corpoDelito)
  const vitimaInitialState: Pessoa = {
    nome: "", sexo: "", estadoCivil: "", profissao: "",
    endereco: "", dataNascimento: "", naturalidade: "",
    filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
    celular: "", email: "", corpoDelito: "" // <-- NOVO
  };
  const autorInitialState: Pessoa = {
    nome: "", sexo: "", estadoCivil: "", profissao: "",
    endereco: "", dataNascimento: "", naturalidade: "",
    filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
    celular: "", email: "", corpoDelito: "" // <-- NOVO
  };
  const testemunhaInitialState = { // Testemunha não precisa de corpoDelito
    nome: "", sexo: "", estadoCivil: "", profissao: "",
    endereco: "", dataNascimento: "", naturalidade: "",
    filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
    celular: "", email: ""
  };

  const [vitimas, setVitimas] = useState<Pessoa[]>([vitimaInitialState]);
  const [testemunhas, setTestemunhas] = useState([testemunhaInitialState]);
  const [autores, setAutores] = useState<Pessoa[]>([autorInitialState]);

  // Histórico e Termos
  const relatoPolicialTemplate = "Por volta das [HORÁRIO] do dia [DATA], nesta cidade de Várzea Grande-MT, a guarnição da viatura [GUARNIÇÃO][OPERACAO_TEXT] composta por [GUPM], durante rondas no bairro [BAIRRO], foi acionada via [MEIO DE ACIONAMENTO] para atender a uma ocorrência de [NATUREZA] no [LOCAL], onde [VERSÃO INICIAL]. Chegando no local, a equipe [O QUE A PM DEPAROU]. A versão das partes foi registrada em campo próprio. [VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]. [DILIGÊNCIAS E APREENSÕES REALIZADAS]. Diante disso, [ENCAMINHAMENTO PARA REGISTRO DOS FATOS].";
  const [relatoPolicial, setRelatoPolicial] = useState(relatoPolicialTemplate);
  const [relatoAutor, setRelatoAutor] = useState("O AUTOR DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
  const [relatoVitima, setRelatoVitima] = useState("RELATOU A VÍTIMA, ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
  const [relatoTestemunha, setRelatoTestemunha] = useState("A TESTEMUNHA ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, COMPROMISSADA NA FORMA DA LEI, QUE AOS COSTUMES RESPONDEU NEGATIVAMENTE OU QUE É AMIGA/PARENTE DE UMA DAS PARTES, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
  const [conclusaoPolicial, setConclusaoPolicial] = useState("");
  const [representacao, setRepresentacao] = useState(""); // Vinculado à vítima principal/manifestação

  // <-- NOVO ESTADO PARA ANEXOS/TERMOS -->
  const listaTermosAnexaveis = [
      "Termo de Apreensão",
      "Termo de Depósito",
      "Termo de Manifestação da Vítima",
      // "Termo de Comparecimento em Juízo" // Excluído
      "Termo de Declarações do Autor",
      "Termo de Declarações da Testemunha",
      // "Termo de Encerramento e Remessa dos Autos" // Excluído
  ];
  const initialTermosState = listaTermosAnexaveis.reduce((acc, termo) => {
      acc[termo] = false; // Começa desativado
      return acc;
  }, {} as { [key: string]: boolean });
  const [termosAtivados, setTermosAtivados] = useState<{ [key: string]: boolean }>(initialTermosState);
  // <-- FIM NOVO ESTADO ANEXOS -->

  // --- useEffects (Lógica principal mantida) ---
  useEffect(() => { /* ... timer start ... */
    if (tcoNumber && !isTimerRunning) {
      setStartTime(new Date());
      setIsTimerRunning(true);
    }
   }, [tcoNumber, isTimerRunning]);

  useEffect(() => { /* ... drug verification logic ... */
    let unknown = false;
    let calculatedIndicios = "";

    if (substancia === "Vegetal") {
        if (cor === "Verde") calculatedIndicios = "Maconha";
        else unknown = true;
    } else if (substancia === "Artificial") {
        if (cor === "Amarelada") calculatedIndicios = "Pasta-Base";
        else if (cor === "Branca") calculatedIndicios = "Cocaína";
        else unknown = true;
    }

    if(unknown) {
        calculatedIndicios = "Material desconhecido";
    }

    setIsUnknownMaterial(unknown);
    setIndicios(calculatedIndicios);

    // Resetar Perícia/Lacre se não for mais material desconhecido
    if (!unknown) {
        setSolicitarPericia("Não");
        setNumeroLacre("");
        // Limpar descrição customizada também? Opcional.
        // setCustomMaterialDesc("");
    }

  }, [substancia, cor]);

  useEffect(() => { /* ... set drug seizure description ... */
    if (natureza === "Porte de drogas para consumo" && indicios) {
      const indicioFinal = isUnknownMaterial && customMaterialDesc ? customMaterialDesc : indicios;
      if (indicioFinal){
        const descriptiveText = `01 (UMA) PORÇÃO PEQUENA DE SUBSTÂNCIA ANÁLOGA A ${indicioFinal.toUpperCase()} [DESCRIÇÃO EMBALAGEM], CONFORME FOTO EM ANEXO.`;
        if (!apreensoes || apreensoes === "Descreva os objetos ou documentos apreendidos, se houver" || apreensoes.includes("SUBSTÂNCIA ANÁLOGA A")) { // Lógica um pouco mais robusta para não sobrescrever
            setApreensoes(descriptiveText);
        }
      }
    }
  }, [natureza, indicios, isUnknownMaterial, customMaterialDesc, apreensoes]);

  useEffect(() => { /* ... set tipificacao, pena, and conclusaoPolicial ... */
    // ... (lógica mantida, sem alterações necessárias aqui para as novas features) ...
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "[NATUREZA NÃO ESPECIFICADA]" : natureza;
    let conclusaoBase = `DIANTE DAS CIRCUNSTÂNCIAS E DE TUDO O QUE FOI RELATADO, RESTA ACRESCENTAR QUE O(A) AUTOR(A) INFRINGIU, EM TESE, O DISPOSITIVO LEGAL CORRESPONDENTE À CONDUTA DE ${displayNaturezaReal.toUpperCase()}. NADA MAIS HAVENDO A TRATAR, DEU-SE POR FINDO O PRESENTE TERMO CIRCUNSTANCIADO DE OCORRÊNCIA QUE VAI DEVIDAMENTE ASSINADO PELAS PARTES E TESTEMUNHA(S), SE HOUVER, E POR MIM, RESPONSÁVEL PELA LAVRATURA, QUE O DIGITEI. E PELO FATO DO(A) AUTOR(A) TER SE COMPROMETIDO A COMPARECER AO JUIZADO ESPECIAL CRIMINAL, ESTE FOI LIBERADO SEM LESÕES CORPORAIS APARENTES, APÓS A ASSINATURA DO TERMO DE COMPROMISSO.`;
    let tipificacaoAtual = "";
    let penaAtual = "";

    if (natureza === "Outros") {
        tipificacaoAtual = tipificacao || "";
        penaAtual = penaDescricao || "";
    } else {
      switch(natureza) {
        case "Ameaça": tipificacaoAtual = "Art. 147 do Código Penal"; penaAtual = "Detenção de 1 a 6 meses, ou multa"; break;
        case "Vias de Fato": tipificacaoAtual = "Art. 21 da Lei de Contravenções Penais"; penaAtual = "Prisão simples de 15 dias a 3 meses, ou multa"; break;
        case "Lesão Corporal": tipificacaoAtual = "Art. 129 do Código Penal"; penaAtual = "Detenção de 3 meses a 1 ano"; break;
        case "Dano": tipificacaoAtual = "Art. 163 do Código Penal"; penaAtual = "Detenção de 1 a 6 meses, ou multa"; break;
        case "Injúria": tipificacaoAtual = "Art. 140 do Código Penal"; penaAtual = "Detenção de 1 a 6 meses, ou multa"; break;
        case "Difamação": tipificacaoAtual = "Art. 139 do Código Penal"; penaAtual = "Detenção de 3 meses a 1 ano, e multa"; break;
        case "Calúnia": tipificacaoAtual = "Art. 138 do Código Penal"; penaAtual = "Detenção de 6 meses a 2 anos, e multa"; break;
        case "Perturbação do Sossego": tipificacaoAtual = "Art. 42 da Lei de Contravenções Penais"; penaAtual = "Prisão simples de 15 dias a 3 meses, ou multa"; break;
        case "Porte de drogas para consumo": tipificacaoAtual = "Art. 28 da Lei nº 11.343/2006 (Lei de Drogas)"; penaAtual = "Advertência sobre os efeitos das drogas, prestação de serviços à comunidade ou medida educativa de comparecimento a programa ou curso educativo."; break;
        default: tipificacaoAtual = ""; penaAtual = "";
      }
      setTipificacao(tipificacaoAtual);
      setPenaDescricao(penaAtual);
    }

    const tipificacaoParaConclusao = tipificacaoAtual || (natureza === "Outros" ? "[TIPIFICAÇÃO LEGAL A SER INSERIDA]" : "[TIPIFICAÇÃO NÃO MAPEADA]");
    conclusaoBase = conclusaoBase.replace("[DISPOSITIVO LEGAL CORRESPONDENTE À CONDUTA]", tipificacaoParaConclusao);

    setConclusaoPolicial(conclusaoBase);

  }, [natureza, customNatureza, tipificacao, penaDescricao]); // Adicionado tipificacao e penaDescricao como deps


  useEffect(() => { /* ... update relatoPolicial ... */
    // ... (lógica mantida) ...
    let updatedRelato = relatoPolicialTemplate;
    const bairroMatch = endereco.match(/,\s*([^,]+)$/);
    const bairro = bairroMatch?.[1]?.trim() || "[BAIRRO PENDENTE]";
    const gupm = componentesGuarnicao
        .filter(c => c.nome && c.posto)
        .map(c => `${c.posto} ${c.nome}`)
        .join(", ") || "[GUPM PENDENTE]";
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "Outros" : natureza;
    const operacaoText = operacao ? `, durante a ${operacao},` : "";

    updatedRelato = updatedRelato
        .replace("[HORÁRIO]", horaFato || "[HORÁRIO]")
        .replace("[DATA]", dataFato ? new Date(dataFato + 'T00:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : "[DATA]") // Adicionado timeZone UTC
        .replace("[GUARNIÇÃO]", guarnicao || "[VIATURA PENDENTE]")
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

    if (relatoPolicial === relatoPolicialTemplate || relatoPolicial.startsWith("Por volta das [HORÁRIO]")) {
       setRelatoPolicial(updatedRelato);
    }

   }, [horaFato, dataFato, guarnicao, operacao, componentesGuarnicao, endereco, comunicante, natureza, customNatureza, localFato, relatoPolicial]);

  useEffect(() => { /* ... sync autor principal com autores[0].nome ... */
    // ... (lógica mantida) ...
    if (autores.length > 0 && autores[0].nome !== autor) {
        setAutor(autores[0].nome);
    }
    else if (autor && (autores.length === 0 || autores[0].nome !== autor)) {
        const newAutores = [...autores];
        if (newAutores.length === 0) {
             newAutores.push({ ...autorInitialState, nome: autor }); // Usa o estado inicial + nome
        } else {
            newAutores[0] = { ...newAutores[0], nome: autor };
        }
        setAutores(newAutores);
    }
  }, [autor, autores]);


  // --- Callbacks para Filhos (Guarnição) ---
  const handleAddPolicialToList = useCallback((novoPolicial: ComponenteGuarnicao) => {
    const alreadyExists = componentesGuarnicao.some(comp => comp.rg === novoPolicial.rg);
    if (!alreadyExists) {
        setComponentesGuarnicao(prevList => [...prevList, novoPolicial]);
        toast({ title: "Adicionado", description: `Policial ${novoPolicial.nome} adicionado à guarnição.` });
    } else {
      toast({ variant: "warning", title: "Duplicado", description: "Este policial já está na guarnição." });
    }
  }, [componentesGuarnicao, toast]);

  const handleRemovePolicialFromList = useCallback((indexToRemove: number) => {
        setComponentesGuarnicao(prevList => prevList.filter((_, index) => index !== indexToRemove));
        // Toast pode ser adicionado aqui se desejado
  }, []);

  // --- Funções CRUD Pessoas (com validação e novos campos) ---
  const handleAddVitima = () => {
     setVitimas([...vitimas, { ...vitimaInitialState }]); // Usa o estado inicial
  };
  const handleRemoveVitima = (index: number) => {
     if (vitimas.length > 0) {
        const newVitimas = vitimas.filter((_, i) => i !== index);
        setVitimas(newVitimas.length > 0 ? newVitimas : [{...vitimaInitialState}]); // Garante que sempre haja pelo menos um item (mesmo que vazio) se a interface exigir
    }
  };
  const handleAddTestemunha = () => {
    setTestemunhas([...testemunhas, { ...testemunhaInitialState }]);
  };
  const handleRemoveTestemunha = (index: number) => {
     if (testemunhas.length > 0) {
       const newTestemunhas = testemunhas.filter((_, i) => i !== index);
        setTestemunhas(newTestemunhas.length > 0 ? newTestemunhas : [{...testemunhaInitialState}]);
    }
  };
  const handleAddAutor = () => {
    setAutores([...autores, { ...autorInitialState }]);
  };
  const handleRemoveAutor = (index: number) => {
     if (autores.length > 0) {
        const newAutores = autores.filter((_, i) => i !== index);
        setAutores(newAutores.length > 0 ? newAutores : [{...autorInitialState}]);
        if (index === 0 && newAutores.length > 0) { setAutor(newAutores[0].nome); }
         else if (newAutores.length === 0) { setAutor(""); }
    }
  };

   // Handlers de mudança para Pessoas (incluindo corpoDelito)
   const handlePessoaChange = (setter: React.Dispatch<React.SetStateAction<any[]>>, index: number, field: keyof Pessoa | string, value: any) => {
        setter(prevPessoas => {
            const newPessoas = [...prevPessoas];
            let processedValue = value;

            if (field === 'cpf') {
                processedValue = formatCPF(value);
                if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) {
                    toast({ variant: "destructive", title: `CPF Inválido (${newPessoas === vitimas ? 'Vítima' : newPessoas === autores ? 'Autor' : 'Testemunha'})`, description: "O CPF informado não é válido." });
                }
            } else if (field === 'celular') {
                processedValue = formatPhone(value);
            } else if (field === 'dataNascimento' && newPessoas === autores) { // Validação de idade só para autores
                const birthDate = new Date(value + 'T00:00:00Z');
                if (!isNaN(birthDate.getTime())) {
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
                    if (age < 18) {
                        toast({ variant: "destructive", title: "Atenção: Autor Menor de Idade", description: `Avalie se cabe TCO.` });
                    }
                }
            }
            // <-- NOVO: Trata o campo corpoDelito -->
            // Não precisa de processamento especial, apenas atribuição.

            newPessoas[index] = { ...newPessoas[index], [field]: processedValue };

            // Sincroniza autor principal se nome do index 0 for mudado no array de autores
            if (newPessoas === autores && index === 0 && field === 'nome') {
                setAutor(processedValue);
            }

            return newPessoas;
        });
   };

   // Funções específicas para cada tipo de pessoa
   const handleVitimaChange = (index: number, field: keyof Pessoa, value: any) => {
       handlePessoaChange(setVitimas, index, field, value);
   };
   const handleTestemunhaChange = (index: number, field: keyof Pessoa, value: any) => { // Testemunha não usa corpoDelito na interface Pessoa
       handlePessoaChange(setTestemunhas, index, field, value);
   };
   const handleAutorDetalhadoChange = (index: number, field: keyof Pessoa, value: any) => {
       handlePessoaChange(setAutores, index, field, value);
   };

   // <-- NOVO: Handler para ativação de termos -->
   const handleTermoActivationChange = (termoNome: string, isActive: boolean) => {
       setTermosAtivados(prev => ({
           ...prev,
           [termoNome]: isActive
       }));
   };
   // <-- FIM NOVO HANDLER -->

  // --- Submissão Principal ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... (validações essenciais mantidas) ...
    if (!tcoNumber || natureza === "Selecione..." || (natureza === "Outros" && !customNatureza) || autores.length === 0 || !autores[0].nome || componentesGuarnicao.length === 0 ) {
        toast({ variant: "destructive", title: "Campos Essenciais Faltando", description: "Verifique: Nº TCO, Natureza, Autor Principal e pelo menos um Componente da Guarnição." });
        return;
    }
     // Validação drogas com perícia/lacre
    if (natureza === "Porte de drogas para consumo") {
        if (!quantidade || !substancia || !cor) {
             toast({ variant: "destructive", title: "Dados da Droga Incompletos", description: "Preencha Quantidade, Substância e Cor." });
             return;
        }
        if (isUnknownMaterial && !customMaterialDesc) {
            toast({ variant: "destructive", title: "Dados da Droga Incompletos", description: "Material desconhecido requer preenchimento da Descrição." });
            return;
        }
        if (isUnknownMaterial && solicitarPericia === "Sim" && !numeroLacre) {
            toast({ variant: "destructive", title: "Dados da Droga Incompletos", description: "Se solicitou perícia, informe o Nº do Lacre." });
            return;
        }
    }


    setIsSubmitting(true);
    setIsTimerRunning(false);

    const completionNow = new Date();
    const completionDate = completionNow.toISOString().split('T')[0];
    const completionTime = completionNow.toTimeString().slice(0, 5);

    try {
      const displayNaturezaReal = natureza === "Outros" ? customNatureza : natureza;
      const indicioFinalDroga = natureza === "Porte de drogas para consumo" ? (isUnknownMaterial ? customMaterialDesc : indicios) : "";

      // Filtra pessoas realmente preenchidas (pelo menos nome)
      const vitimasFiltradas = vitimas.filter(v => v.nome?.trim());
      const testemunhasFiltradas = testemunhas.filter(t => t.nome?.trim());
      const autoresFiltrados = autores.filter(a => a.nome?.trim()); // Filtra autores também

      // Verifica se ainda existe um autor principal após filtrar
      if(autoresFiltrados.length === 0) {
          toast({ variant: "destructive", title: "Autor Principal Faltando", description: "Preencha os dados do Autor." });
          setIsSubmitting(false);
          return;
      }


      const tcoDataParaSalvar = {
        // Info Básica
        tcoNumber: tcoNumber.trim(),
        natureza: displayNaturezaReal,
        originalNatureza: natureza,
        customNatureza: customNatureza.trim(),
        tipificacao: tipificacao.trim(),
        penaDescricao: penaDescricao.trim(),

        // Datas/Horas
        dataFato, horaFato,
        dataInicioRegistro, horaInicioRegistro,
        dataTerminoRegistro: completionDate,
        horaTerminoRegistro: completionTime,

        // Local/Acionamento
        localFato: localFato.trim(),
        endereco: endereco.trim(),
        municipio, comunicante,

        // Pessoas (Filtradas e com corpoDelito)
        autores: autoresFiltrados, // Usa array filtrado
        vitimas: vitimasFiltradas,
        testemunhas: testemunhasFiltradas,
        representacao: formatRepresentacao(representacao),

        // Guarnição/Operação
        guarnicao: guarnicao.trim(),
        operacao: operacao.trim(),
        componentesGuarnicao,

        // Histórico/Apreensões
        relatoPolicial: relatoPolicial.trim(),
        relatoAutor: relatoAutor.trim(),
        relatoVitima: relatoVitima.trim(),
        relatoTestemunha: relatoTestemunha.trim(),
        apreensoes: apreensoes.trim(),
        conclusaoPolicial: conclusaoPolicial.trim(),

        // Drogas (com perícia/lacre)
        drogaQuantidade: natureza === "Porte de drogas para consumo" ? quantidade.trim() : undefined,
        drogaTipo: natureza === "Porte de drogas para consumo" ? substancia : undefined,
        drogaCor: natureza === "Porte de drogas para consumo" ? cor : undefined,
        drogaNomeComum: natureza === "Porte de drogas para consumo" ? indicioFinalDroga : undefined,
        drogaCustomDesc: natureza === "Porte de drogas para consumo" && isUnknownMaterial ? customMaterialDesc.trim() : undefined,
        drogaIsUnknown: natureza === "Porte de drogas para consumo" ? isUnknownMaterial : undefined,
        // <-- NOVOS CAMPOS DROGAS -->
        drogaSolicitarPericia: natureza === "Porte de drogas para consumo" && isUnknownMaterial ? solicitarPericia : undefined,
        drogaNumeroLacre: natureza === "Porte de drogas para consumo" && isUnknownMaterial && solicitarPericia === "Sim" ? numeroLacre.trim() : undefined,
        // <-- FIM NOVOS CAMPOS DROGAS -->

        // Termos a Anexar
        termosAtivados, // <-- NOVO CAMPO -->

        // Metadados
        startTime: startTime?.toISOString(),
        endTime: completionNow.toISOString(),
        createdAt: new Date(),
        createdBy: JSON.parse(localStorage.getItem("user") || "{}").id
      };

      // Limpeza de undefined (mantida)
      Object.keys(tcoDataParaSalvar).forEach(key => tcoDataParaSalvar[key] === undefined && delete tcoDataParaSalvar[key]);

      console.log("Dados a serem salvos/gerados:", tcoDataParaSalvar);

      // Salvar no Firebase
      await addDoc(collection(db, "tcos"), tcoDataParaSalvar);

      toast({ title: "TCO Registrado", description: "Registrado com sucesso no banco de dados!" });

      // Gerar PDF (passando todos os dados, inclusive os novos)
      // A função generatePDF precisará ser ATUALIZADA para:
      // 1. Ler `tcoDataParaSalvar.autores[n].corpoDelito` e `tcoDataParaSalvar.vitimas[n].corpoDelito`
      // 2. Ler `tcoDataParaSalvar.drogaSolicitarPericia` e `tcoDataParaSalvar.drogaNumeroLacre`
      // 3. Ler `tcoDataParaSalvar.termosAtivados` e incluir condicionalmente as seções/páginas dos termos marcados como `true`.
      generatePDF(tcoDataParaSalvar);

      navigate("/?tab=tco");

    } catch (error: any) {
      console.error("Erro ao salvar ou gerar TCO:", error);
      toast({ variant: "destructive", title: "Erro", description: `Ocorreu um erro: ${error.message || 'Erro desconhecido'}` });
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
            autor={autor} setAutor={setAutor} // Nome do primeiro autor para display rápido
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
            // <-- NOVAS PROPS -->
            solicitarPericia={solicitarPericia} setSolicitarPericia={setSolicitarPericia}
            numeroLacre={numeroLacre} setNumeroLacre={setNumeroLacre}
            // <-- FIM NOVAS PROPS -->
           />
           /*
           -> Em DrugVerificationTab.tsx:
           1. Encontre o input de `customMaterialDesc`.
           2. Envolva-o em um condicional: `{isUnknownMaterial && <div className="seu-container"> ... input ... </div>}`
           3. DENTRO desse `div`, adicione os controles (Select/Radio) para `solicitarPericia`.
              - O `value` deve ser `solicitarPericia` e `onChange` deve chamar `setSolicitarPericia`.
           4. Abaixo dos controles de perícia, adicione outro condicional:
              `{solicitarPericia === 'Sim' && <Input label="Nº Lacre" value={numeroLacre} onChange={(e) => setNumeroLacre(e.target.value)} />}`
           */
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
            // Passa os arrays completos e os handlers atualizados
            vitimas={vitimas} handleVitimaChange={handleVitimaChange} handleAddVitima={handleAddVitima} handleRemoveVitima={handleRemoveVitima}
            testemunhas={testemunhas} handleTestemunhaChange={handleTestemunhaChange} handleAddTestemunha={handleAddTestemunha} handleRemoveTestemunha={handleRemoveTestemunha}
            autores={autores} handleAutorDetalhadoChange={handleAutorDetalhadoChange} handleAddAutor={handleAddAutor} handleRemoveAutor={handleRemoveAutor}
         />
         /*
         -> Em PessoasEnvolvidasTab.tsx:
         1. Para cada item renderizado de `autores` e `vitimas`:
         2. Adicione um novo campo (Select ou Radio Buttons) com o label "Corpo de Delito".
         3. O `value` deve ser `pessoa.corpoDelito` (onde `pessoa` é o autor ou vítima atual no loop).
         4. O `onChange` deve chamar o handler correspondente (`handleAutorDetalhadoChange` ou `handleVitimaChange`), passando o índice, o nome do campo ('corpoDelito') e o novo valor ('Sim' ou 'Não'). Ex: `(e) => handleAutorDetalhadoChange(index, 'corpoDelito', e.target.value)`
         */

        <GuarnicaoTab
            currentGuarnicaoList={componentesGuarnicao}
            onAddPolicial={handleAddPolicialToList}
            onRemovePolicial={handleRemovePolicialFromList}
            // *** CORREÇÃO DO BUG validateCPF ***
            // Passe a função validateCPF como prop se o formulário de policial precisar dela
            // para validar o *CPF do policial* (e não nomes de pais).
            validateCPF={validateCPF} // <--- Passe a função
         />
         /*
         -> Em GuarnicaoTab.tsx (ou no componente/modal que ele usa para o formulário do policial):
         1. Certifique-se de que ele recebe a prop `validateCPF`.
         2. Encontre os `Input` para "Nome do Pai" e "Nome da Mãe".
         3. Verifique os handlers `onChange`, `onBlur` ou qualquer validação associada a esses inputs.
         4. **Remova qualquer chamada a `validateCPF` desses handlers específicos de nome de pai/mãe.** A validação de CPF não se aplica a eles.
         5. Certifique-se de que o `Input` para o *CPF do Policial* use corretamente a prop `validateCPF` em sua lógica de validação, se necessário.
         */

        <HistoricoTab
             relatoPolicial={relatoPolicial} setRelatoPolicial={setRelatoPolicial}
             relatoAutor={relatoAutor} setRelatoAutor={setRelatoAutor}
             relatoVitima={relatoVitima} setRelatoVitima={setRelatoVitima}
             relatoTestemunha={relatoTestemunha} setRelatoTestemunha={setRelatoTestemunha}
             apreensoes={apreensoes} setApreensoes={setApreensoes}
             conclusaoPolicial={conclusaoPolicial} setConclusaoPolicial={setConclusaoPolicial}
             drugSeizure={natureza === "Porte de drogas para consumo"}
             representacao={representacao} setRepresentacao={setRepresentacao}
             // <-- NOVAS PROPS PARA TERMOS -->
             termosAtivados={termosAtivados}
             listaTermosAnexaveis={listaTermosAnexaveis}
             onTermoActivationChange={handleTermoActivationChange}
             // <-- FIM NOVAS PROPS TERMOS -->
         />
         /*
         -> Em HistoricoTab.tsx:
         1. Adicione uma nova seção, por exemplo: `<Card><CardHeader><CardTitle>Anexar Termos</CardTitle></CardHeader><CardContent> ... </CardContent></Card>`
         2. Dentro do `CardContent`, faça um loop sobre `listaTermosAnexaveis`:
            `listaTermosAnexaveis.map(termo => (<div key={termo}><Checkbox id={termo} checked={termosAtivados[termo]} onCheckedChange={(checked) => onTermoActivationChange(termo, !!checked)} /><Label htmlFor={termo}>{termo}</Label></div>))`
            (Ajuste a estrutura e os componentes de UI conforme sua biblioteca - ex: Shadcn UI Checkbox)
         */

        {/* Submit Button */}
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
