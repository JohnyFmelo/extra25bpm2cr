 import React, { useState, useEffect, useCallback } from "react"; // Adicionado useCallback
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase"; // Presumo que esta configuração esteja correta
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import BasicInformationTab from "./tco/BasicInformationTab";
import GeneralInformationTab from "./tco/GeneralInformationTab";
import PessoasEnvolvidasTab from "./tco/PessoasEnvolvidasTab";
import GuarnicaoTab from "./tco/GuarnicaoTab"; // Importa o componente filho
import HistoricoTab from "./tco/HistoricoTab";
import DrugVerificationTab from "./tco/DrugVerificationTab";
import { generatePDF } from "./tco/pdfGenerator"; // Importa o gerador PDF

// --- Interfaces (Definir ou Importar aqui também para uso no TCOForm) ---
// É importante que esta interface esteja acessível ou definida aqui
interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
}

// --- Funções Auxiliares (Mantidas do original) ---
const formatRepresentacao = (representacao: string): string => {
  if (representacao === "Representa") return "representar"; // Padronizado para gerar PDF
  if (representacao === "Posteriormente") return "decidir_posteriormente"; // Padronizado para gerar PDF
  return ""; // Ou um valor padrão se necessário
};
const formatCPF = (cpf: string) => { /* ...código original... */
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length <= 11) {
      cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
      cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
      cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return cpf;
 };
const formatPhone = (phone: string) => { /* ...código original... */
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
const validateCPF = (cpf: string) => { /* ...código original... */
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

// --- Componente Principal do Formulário TCO ---
const TCOForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Timer state
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Current date and time
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  const formattedTime = now.toTimeString().slice(0, 5);

  // --- ESTADOS DO FORMULÁRIO (Gerenciados aqui) ---

  // Basic fields
  const [tcoNumber, setTcoNumber] = useState("");
  const [natureza, setNatureza] = useState("Vias de Fato");
  const [customNatureza, setCustomNatureza] = useState("");
  const [autor, setAutor] = useState(""); // Nome principal do autor para BasicInfoTab

  // Representation state (vinculado à vítima)
  const [representacao, setRepresentacao] = useState(""); // Poderia estar dentro do objeto vitima, mas OK aqui por simplicidade se for só 1 campo

  // General fields
  const [tipificacao, setTipificacao] = useState("Art. 21 da Lei de Contravenções Penais");
  const [penaDescricao, setPenaDescricao] = useState("");
  const [dataFato, setDataFato] = useState(formattedDate);
  const [horaFato, setHoraFato] = useState(formattedTime);
  const [dataInicioRegistro, setDataInicioRegistro] = useState(formattedDate);
  const [horaInicioRegistro, setHoraInicioRegistro] = useState(formattedTime);
  const [dataTerminoRegistro, setDataTerminoRegistro] = useState(formattedDate); // Será atualizado no submit
  const [horaTerminoRegistro, setHoraTerminoRegistro] = useState(formattedTime); // Será atualizado no submit
  const [localFato, setLocalFato] = useState("");
  const [endereco, setEndereco] = useState("");
  const [municipio] = useState("Várzea Grande");
  const [comunicante, setComunicante] = useState("CIOSP");
  const [guarnicao, setGuarnicao] = useState(""); // ID/Nome da Viatura/Guarnicao
  const [operacao, setOperacao] = useState("");
  const [apreensoes, setApreensoes] = useState(""); // Campo texto livre

  // *** Estado da Guarnição (Lista de Componentes) - DONO É TCOForm ***
  const [componentesGuarnicao, setComponentesGuarnicao] = useState<ComponenteGuarnicao[]>([]); // Começa vazio

  // Drug verification fields
  const [quantidade, setQuantidade] = useState("");
  const [substancia, setSubstancia] = useState("");
  const [cor, setCor] = useState("");
  const [indicios, setIndicios] = useState("");
  const [customMaterialDesc, setCustomMaterialDesc] = useState("");
  const [isUnknownMaterial, setIsUnknownMaterial] = useState(false);

  // Arrays para multiplas pessoas
  const [vitimas, setVitimas] = useState([{
    nome: "", sexo: "", estadoCivil: "", profissao: "",
    endereco: "", dataNascimento: "", naturalidade: "",
    filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
    celular: "", email: ""
  }]);

  const [testemunhas, setTestemunhas] = useState([{
    nome: "", sexo: "", estadoCivil: "", profissao: "",
    endereco: "", dataNascimento: "", naturalidade: "",
    filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
    celular: "", email: ""
  }]);

  // Array para múltiplos autores (detalhado)
  const [autores, setAutores] = useState([{
    nome: "", sexo: "", estadoCivil: "", profissao: "",
    endereco: "", dataNascimento: "", naturalidade: "",
    filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
    celular: "", email: ""
  }]);

  // Histórico Fields
  const relatoPolicialTemplate = "Por volta das [HORÁRIO] do dia [DATA], nesta cidade de Várzea Grande-MT, a guarnição da viatura [GUARNIÇÃO][OPERACAO_TEXT] composta por [GUPM], durante rondas no bairro [BAIRRO], foi acionada via [MEIO DE ACIONAMENTO] para atender a uma ocorrência de [NATUREZA] no [LOCAL], onde [VERSÃO INICIAL]. Chegando no local, a equipe [O QUE A PM DEPAROU]. A versão das partes foi registrada em campo próprio. [VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]. [DILIGÊNCIAS E APREENSÕES REALIZADAS]. Diante disso, [ENCAMINHAMENTO PARA REGISTRO DOS FATOS].";
  const [relatoPolicial, setRelatoPolicial] = useState(relatoPolicialTemplate);
  const [relatoAutor, setRelatoAutor] = useState("O AUTOR DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
  const [relatoVitima, setRelatoVitima] = useState("RELATOU A VÍTIMA, ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
  const [relatoTestemunha, setRelatoTestemunha] = useState("A TESTEMUNHA ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, COMPROMISSADA NA FORMA DA LEI, QUE AOS COSTUMES RESPONDEU NEGATIVAMENTE OU QUE É AMIGA/PARENTE DE UMA DAS PARTES, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.");
  const [conclusaoPolicial, setConclusaoPolicial] = useState("");


  // --- useEffects (Mantidos do original) ---
  useEffect(() => { /* ... timer start ... */
    if (tcoNumber && !isTimerRunning) {
      setStartTime(new Date());
      setIsTimerRunning(true);
    }
   }, [tcoNumber, isTimerRunning]);

  useEffect(() => { /* ... drug verification logic ... */
    if (substancia === "Vegetal" && cor !== "Verde") { setIsUnknownMaterial(true); setIndicios("Material desconhecido"); }
    else if (substancia === "Artificial" && (cor !== "Amarelada" && cor !== "Branca")) { setIsUnknownMaterial(true); setIndicios("Material desconhecido"); }
    else {
      setIsUnknownMaterial(false);
      if (substancia === "Vegetal" && cor === "Verde") { setIndicios("Maconha"); }
      else if (substancia === "Artificial" && cor === "Amarelada") { setIndicios("Pasta-Base"); } // Corrigido nome popular
      else if (substancia === "Artificial" && cor === "Branca") { setIndicios("Cocaína"); }
      else { setIndicios("")} // Limpa se não combinar
    }
  }, [substancia, cor]);

  useEffect(() => { /* ... set drug seizure description ... */
    if (natureza === "Porte de drogas para consumo" && indicios) {
      const indicioFinal = isUnknownMaterial && customMaterialDesc ? customMaterialDesc : indicios;
      if (indicioFinal){ // Só preenche se tiver um indicio válido
        const descriptiveText = `01 (UMA) PORÇÃO PEQUENA DE SUBSTÂNCIA ANÁLOGA A ${indicioFinal.toUpperCase()} [DESCRIÇÃO EMBALAGEM], CONFORME FOTO EM ANEXO.`;
        // Evita sobrescrever se o usuário já digitou algo manualmente
        if (!apreensoes || apreensoes === "Descreva os objetos ou documentos apreendidos, se houver" || apreensoes === relatoPolicialTemplate) { // Verifica template também
            setApreensoes(descriptiveText);
        }
      }
    } else {
         // Se não for porte de droga, limpa a apreensão automática se ela ainda for o template
         // Cuidado para não limpar uma apreensão manual legítima
        // Talvez seja melhor deixar o usuário limpar manualmente.
        // Ou ter uma lógica mais robusta para saber se o texto atual é o automático
    }
  }, [natureza, indicios, isUnknownMaterial, customMaterialDesc, apreensoes]); // Adicionado apreensoes como dep

  useEffect(() => { /* ... set tipificacao, pena, and conclusaoPolicial based on natureza ... */
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "[NATUREZA NÃO ESPECIFICADA]" : natureza;
    let conclusaoBase = `DIANTE DAS CIRCUNSTÂNCIAS E DE TUDO O QUE FOI RELATADO, RESTA ACRESCENTAR QUE O(A) AUTOR(A) INFRINGIU, EM TESE, O DISPOSITIVO LEGAL CORRESPONDENTE À CONDUTA DE ${displayNaturezaReal.toUpperCase()}. NADA MAIS HAVENDO A TRATAR, DEU-SE POR FINDO O PRESENTE TERMO CIRCUNSTANCIADO DE OCORRÊNCIA QUE VAI DEVIDAMENTE ASSINADO PELAS PARTES E TESTEMUNHA(S), SE HOUVER, E POR MIM, RESPONSÁVEL PELA LAVRATURA, QUE O DIGITEI. E PELO FATO DO(A) AUTOR(A) TER SE COMPROMETIDO A COMPARECER AO JUIZADO ESPECIAL CRIMINAL, ESTE FOI LIBERADO SEM LESÕES CORPORAIS APARENTES, APÓS A ASSINATURA DO TERMO DE COMPROMISSO.`;
    let tipificacaoAtual = "";
    let penaAtual = "";

    if (natureza === "Outros") {
        // Não definir padrão, mas pode usar o estado 'tipificacao' se preenchido manualmente
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
        case "Perturbação do Sossego": tipificacaoAtual = "Art. 42 da Lei de Contravenções Penais"; penaAtual = "Prisão simples de 15 dias a 3 meses, ou multa"; break; // Ajustado limite pena
        case "Porte de drogas para consumo": tipificacaoAtual = "Art. 28 da Lei nº 11.343/2006 (Lei de Drogas)"; penaAtual = "Advertência sobre os efeitos das drogas, prestação de serviços à comunidade ou medida educativa de comparecimento a programa ou curso educativo."; break;
        default: tipificacaoAtual = ""; penaAtual = "";
      }
      // Define os estados apenas se a natureza não for "Outros"
      setTipificacao(tipificacaoAtual);
      setPenaDescricao(penaAtual);
    }

    // Ajusta a conclusão incluindo a tipificação encontrada ou placeholder
    const tipificacaoParaConclusao = tipificacaoAtual || (natureza === "Outros" ? "[TIPIFICAÇÃO LEGAL A SER INSERIDA]" : "[TIPIFICAÇÃO NÃO MAPEADA]");
    conclusaoBase = conclusaoBase.replace("[DISPOSITIVO LEGAL CORRESPONDENTE À CONDUTA]", tipificacaoParaConclusao);

    setConclusaoPolicial(conclusaoBase);

  }, [natureza, customNatureza, tipificacao, penaDescricao]); // Ajustado deps


  useEffect(() => { /* ... update relatoPolicial ... */
    let updatedRelato = relatoPolicialTemplate;
    const bairroMatch = endereco.match(/,\s*([^,]+)$/); // Tenta pegar o último item após vírgula
    const bairro = bairroMatch?.[1]?.trim() || "[BAIRRO PENDENTE]";
    const gupm = componentesGuarnicao
        .filter(c => c.nome && c.posto)
        .map(c => `${c.posto} ${c.nome}`) // Apenas Posto e Nome
        .join(", ") || "[GUPM PENDENTE]";
    const displayNaturezaReal = natureza === "Outros" ? customNatureza || "Outros" : natureza;
    const operacaoText = operacao ? `, durante a ${operacao},` : ""; // Ajustado texto

    updatedRelato = updatedRelato
        .replace("[HORÁRIO]", horaFato || "[HORÁRIO]")
        .replace("[DATA]", dataFato ? new Date(dataFato + 'T00:00:00Z').toLocaleDateString('pt-BR') : "[DATA]") // Formata data
        .replace("[GUARNIÇÃO]", guarnicao || "[VIATURA PENDENTE]")
        .replace("[OPERACAO_TEXT]", operacaoText)
        .replace("[GUPM]", gupm)
        .replace("[BAIRRO]", bairro)
        .replace("[MEIO DE ACIONAMENTO]", comunicante || "[ACIONAMENTO]")
        .replace("[NATUREZA]", displayNaturezaReal || "[NATUREZA PENDENTE]")
        .replace("[LOCAL]", localFato || "[LOCAL PENDENTE]")
        // Deixar placeholders para edição manual
        .replace("[VERSÃO INICIAL]", "[DETALHAR VERSÃO INICIAL]")
        .replace("[O QUE A PM DEPAROU]", "[DETALHAR O QUE A PM DEPAROU]")
        .replace("[VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]", "[RESUMO DAS VERSÕES]")
        .replace("[DILIGÊNCIAS E APREENSÕES REALIZADAS]", "[DESCREVER DILIGÊNCIAS/APREENSÕES]")
        .replace("[ENCAMINHAMENTO PARA REGISTRO DOS FATOS]", "[DETALHAR ENCAMINHAMENTO]");


    // Somente atualiza se for o template inicial para evitar sobrescrever digitação manual
    if (relatoPolicial === relatoPolicialTemplate || relatoPolicial.startsWith("Por volta das [HORÁRIO]")) {
       setRelatoPolicial(updatedRelato);
    }

   }, [horaFato, dataFato, guarnicao, operacao, componentesGuarnicao, endereco, comunicante, natureza, customNatureza, localFato, relatoPolicial]); // Adicionado relatoPolicial nas deps

  useEffect(() => { /* ... sync autor principal com autores[0].nome ... */
    // Atualiza autor principal se o nome no array[0] mudar E for diferente
    if (autores.length > 0 && autores[0].nome !== autor) {
        setAutor(autores[0].nome);
    }
    // Atualiza o array[0] se o autor principal mudar E o array estiver vazio ou nome diferente
    else if (autor && (autores.length === 0 || autores[0].nome !== autor)) {
        const newAutores = [...autores];
        if (newAutores.length === 0) {
            // Se array vazio, cria o primeiro autor
             newAutores.push({
                nome: autor, sexo: "", estadoCivil: "", profissao: "",
                endereco: "", dataNascimento: "", naturalidade: "",
                filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
                celular: "", email: ""
            });
        } else {
            // Se já existe, atualiza o nome do primeiro
            newAutores[0] = { ...newAutores[0], nome: autor };
        }
        setAutores(newAutores);
    }
  }, [autor, autores]); // Depende dos dois para sincronia bidirecional


  // --- Funções de Callback para os Filhos ---

  // Callback para ADICIONAR um policial encontrado à lista principal
  const handleAddPolicialToList = useCallback((novoPolicial: ComponenteGuarnicao) => {
    // Lógica para evitar duplicados no PAI
    const alreadyExists = componentesGuarnicao.some(comp => comp.rg === novoPolicial.rg);
    if (!alreadyExists) {
      // Se for o primeiro policial, substitui o item vazio (se existir) ou adiciona
        setComponentesGuarnicao(prevList => {
            // Se a lista está vazia ou o primeiro item é o placeholder inicial
            if (prevList.length === 0 || (prevList.length === 1 && !prevList[0].rg && !prevList[0].nome && !prevList[0].posto)) {
                 return [novoPolicial]; // Substitui o placeholder pelo policial real
            }
             return [...prevList, novoPolicial]; // Adiciona ao final da lista existente

        });
        toast({ title: "Adicionado", description: `Policial ${novoPolicial.nome} adicionado à guarnição.` });
    } else {
      toast({ variant: "warning", title: "Duplicado", description: "Este policial já está na guarnição." });
    }
  }, [componentesGuarnicao, toast]); // Depende da lista atual e toast

  // Callback para REMOVER um policial da lista principal
  const handleRemovePolicialFromList = useCallback((indexToRemove: number) => {
        setComponentesGuarnicao(prevList => {
           const newList = prevList.filter((_, index) => index !== indexToRemove);
            // Garante que a lista não fique totalmente vazia se o comportamento padrão
             // de alguns campos depender de ter pelo menos um item (mesmo que placeholder)
             // Poderia adicionar um placeholder se a lista ficar vazia, mas iniciar com [] é mais limpo
            // if (newList.length === 0) {
            //    return [{ nome: "", posto: "", rg: "" }];
            // }
           return newList;
        });
        // O toast pode ser mostrado aqui ou no GuarnicaoTab após a remoção bem-sucedida
  }, []); // Não depende de nada externo para definir a função

  // Funções para manipular Pessoas (Vitimas, Testemunhas, Autores detalhados) - Mantidas
  const handleAddVitima = () => { /* ...código original... */
     setVitimas([...vitimas, { nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", dataNascimento: "", naturalidade: "", filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "", celular: "", email: "" }]);
  };
  const handleRemoveVitima = (index) => { /* ...código original... */
     if (vitimas.length > 0) { // Permite remover mesmo se for o último
        const newVitimas = vitimas.filter((_, i) => i !== index);
        setVitimas(newVitimas);
    }
  };
  const handleAddTestemunha = () => { /* ...código original... */
    setTestemunhas([...testemunhas, { nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", dataNascimento: "", naturalidade: "", filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "", celular: "", email: "" }]);
  };
  const handleRemoveTestemunha = (index) => { /* ...código original... */
     if (testemunhas.length > 0) {
       const newTestemunhas = testemunhas.filter((_, i) => i !== index);
        setTestemunhas(newTestemunhas);
    }
  };
  const handleAddAutor = () => { /* ...código original... */
    setAutores([...autores, { nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", dataNascimento: "", naturalidade: "", filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "", celular: "", email: "" }]);
  };
  const handleRemoveAutor = (index) => { /* ...código original... */
     if (autores.length > 0) {
        const newAutores = autores.filter((_, i) => i !== index);
        setAutores(newAutores);
        // Sincroniza o autor principal se o primeiro for removido
        if (index === 0 && newAutores.length > 0) { setAutor(newAutores[0].nome); }
         else if (newAutores.length === 0) { setAutor(""); } // Limpa se não houver mais autores
    }
  };

   // Funções para ATUALIZAR campos detalhados de Pessoas (Com validação/formatação) - Mantidas
   const handleVitimaChange = (index, field, value) => { /* ...código original com formatCPF/Phone e validação... */
        const newVitimas = [...vitimas];
        let processedValue = value;
        if (field === 'cpf') { processedValue = formatCPF(value); if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) { toast({ variant: "destructive", title: "CPF Inválido (Vítima)", description: "O CPF informado não é válido." }); } }
        else if (field === 'celular') { processedValue = formatPhone(value); }
        newVitimas[index] = { ...newVitimas[index], [field]: processedValue };
        setVitimas(newVitimas);
   };
  const handleTestemunhaChange = (index, field, value) => { /* ...código original com formatCPF/Phone e validação... */
        const newTestemunhas = [...testemunhas];
        let processedValue = value;
        if (field === 'cpf') { processedValue = formatCPF(value); if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) { toast({ variant: "destructive", title: "CPF Inválido (Testemunha)", description: "O CPF informado não é válido." }); } }
        else if (field === 'celular') { processedValue = formatPhone(value); }
        newTestemunhas[index] = { ...newTestemunhas[index], [field]: processedValue };
        setTestemunhas(newTestemunhas);
   };
   const handleAutorDetalhadoChange = (index, field, value) => { /* ...código original com format/validate CPF/Phone e validação de idade... */
        const newAutores = [...autores];
        let processedValue = value;
        if (field === 'cpf') { processedValue = formatCPF(value); if (processedValue.replace(/\D/g, '').length === 11 && !validateCPF(processedValue)) { toast({ variant: "destructive", title: "CPF Inválido (Autor)", description: "O CPF informado não é válido." }); } }
        else if (field === 'celular') { processedValue = formatPhone(value); }
        else if (field === 'dataNascimento') {
            const birthDate = new Date(value + 'T00:00:00Z'); // Considerar UTC para evitar problemas de fuso
            if (!isNaN(birthDate.getTime())) {
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
                if (age < 18) { toast({ variant: "destructive", title: "Atenção: Autor Menor de Idade", description: `Avalie se cabe TCO.` }); }
            }
         }
         newAutores[index] = { ...newAutores[index], [field]: processedValue };
         setAutores(newAutores);
        // Sincroniza autor principal se nome do index 0 for mudado
         if (index === 0 && field === 'nome') { setAutor(processedValue); }
   };


   // --- REMOVIDO ---
   // As funções abaixo não são mais necessárias pois GuarnicaoTab
   // notificará TCOForm para adicionar/remover itens completos.
   /*
   const handleComponenteGuarnicaoChange = (index, field, value) => { ... };
   const handleAddComponenteGuarnicao = () => { ... };
   const setCondutorNome = (value: string) => { ... };
   const setCondutorPosto = (value: string) => { ... };
   const setCondutorRg = (value: string) => { ... };
   */


  // --- Função de Submissão Principal ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const completionNow = new Date();
    const completionDate = completionNow.toISOString().split('T')[0];
    const completionTime = completionNow.toTimeString().slice(0, 5);

    // Validação Principal (Simplificada, focando nos essenciais)
    if (!tcoNumber || natureza === "Selecione..." || (natureza === "Outros" && !customNatureza) || autores.length === 0 || !autores[0].nome || componentesGuarnicao.length === 0 ) {
      toast({
        variant: "destructive",
        title: "Campos Essenciais Faltando",
        description: "Verifique: Nº TCO, Natureza, Autor Principal e pelo menos um Componente da Guarnição."
      });
      return;
    }

    // Validação Vítima (Opcional ter vítima, mas se tiver, nome é bom)
    if (vitimas.length > 0 && !vitimas[0].nome) {
        // Pode ser um aviso ou bloqueio, dependendo da regra de negócio
        // console.warn("Vítima adicionada mas sem nome preenchido.");
    }

    // Validação drogas
    if (natureza === "Porte de drogas para consumo" && (!quantidade || !substancia || !cor || (isUnknownMaterial && !customMaterialDesc))) {
        toast({ variant: "destructive", title: "Dados da Droga Incompletos", description: "Preencha Quantidade, Substância, Cor e Descrição (se material desconhecido)." });
        return;
    }
    // ... (outras validações específicas podem ser adicionadas) ...

    setIsSubmitting(true);
    setIsTimerRunning(false); // Para timer

    try {
      const displayNaturezaReal = natureza === "Outros" ? customNatureza : natureza;
      const indicioFinalDroga = natureza === "Porte de drogas para consumo" ? (isUnknownMaterial ? customMaterialDesc : indicios) : "";

      // Preparar dados para PDF e Firebase
      // Remove dados vazios/placeholders de vítimas e testemunhas
      const vitimasFiltradas = vitimas.filter(v => v.nome?.trim());
      const testemunhasFiltradas = testemunhas.filter(t => t.nome?.trim());

      const tcoDataParaSalvar = {
        // Basic Info
        tcoNumber: tcoNumber.trim(),
        natureza: displayNaturezaReal,
        originalNatureza: natureza, // Guarda a seleção original
        customNatureza: customNatureza.trim(), // Guarda o texto customizado
        tipificacao: tipificacao.trim(),
        penaDescricao: penaDescricao.trim(),

        // Datas e Horas
        dataFato,
        horaFato,
        dataInicioRegistro,
        horaInicioRegistro,
        dataTerminoRegistro: completionDate, // Data de conclusão
        horaTerminoRegistro: completionTime, // Hora de conclusão

        // Localização e Acionamento
        localFato: localFato.trim(),
        endereco: endereco.trim(),
        municipio,
        comunicante,

        // Pessoas
        autores, // Array completo de autores detalhados
        vitimas: vitimasFiltradas, // Array filtrado de vítimas
        testemunhas: testemunhasFiltradas, // Array filtrado de testemunhas
        representacao: formatRepresentacao(representacao), // Vítima representa?

        // Guarnição e Operação
        guarnicao: guarnicao.trim(), // ID Viatura/Nome
        operacao: operacao.trim(),
        componentesGuarnicao, // *** USA O ESTADO CORRETO DO PAI ***

        // Histórico e Apreensões
        relatoPolicial: relatoPolicial.trim(),
        relatoAutor: relatoAutor.trim(),
        relatoVitima: relatoVitima.trim(),
        relatoTestemunha: relatoTestemunha.trim(),
        apreensoes: apreensoes.trim(),
        conclusaoPolicial: conclusaoPolicial.trim(),

        // Droga (Condicional)
        drogaQuantidade: natureza === "Porte de drogas para consumo" ? quantidade.trim() : undefined, // Renomeado para clareza no PDF
        drogaTipo: natureza === "Porte de drogas para consumo" ? substancia : undefined,          // Renomeado
        drogaCor: natureza === "Porte de drogas para consumo" ? cor : undefined,             // Renomeado
        drogaNomeComum: natureza === "Porte de drogas para consumo" ? indicioFinalDroga : undefined, // Renomeado (Indício vira Nome Comum)
        // Campos extras para Firebase
        drogaCustomDesc: natureza === "Porte de drogas para consumo" && isUnknownMaterial ? customMaterialDesc.trim() : undefined,
        drogaIsUnknown: natureza === "Porte de drogas para consumo" ? isUnknownMaterial : undefined,


        // Timestamps e Metadados para Firebase
        startTime: startTime?.toISOString(),
        endTime: completionNow.toISOString(),
        createdAt: new Date(), // Firestore Timestamp
        createdBy: JSON.parse(localStorage.getItem("user") || "{}").id // Ajuste conforme sua autenticação
      };

      // Remover propriedades `undefined` antes de salvar no Firebase
      // (Firestore ignora undefined, mas é boa prática limpar)
      Object.keys(tcoDataParaSalvar).forEach(key => tcoDataParaSalvar[key] === undefined && delete tcoDataParaSalvar[key]);


      console.log("Dados a serem salvos/gerados:", tcoDataParaSalvar); // Para debug

      // Salvar no Firebase
      await addDoc(collection(db, "tcos"), tcoDataParaSalvar);

      toast({ title: "TCO Registrado", description: "Registrado com sucesso no banco de dados!" });

      // Gerar PDF com os mesmos dados (ou um subconjunto se preferir)
      // A função generatePDF já espera os campos com os nomes corretos
      // que definimos em tcoDataParaSalvar (como 'componentesGuarnicao', 'drogaQuantidade', etc)
      generatePDF(tcoDataParaSalvar);

      navigate("/?tab=tco"); // Navega após sucesso

    } catch (error: any) { // Captura erro específico
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

  const naturezaOptions = [ // Mantido igual
    "Ameaça", "Vias de Fato", "Lesão Corporal", "Dano", "Injúria",
    "Difamação", "Calúnia", "Perturbação do Sossego",
    "Porte de drogas para consumo", "Outros"
  ];

  // Obter dados do condutor para passar para GeneralInformationTab (APENAS LEITURA)
  const condutorParaDisplay = componentesGuarnicao[0];

  return (
    // Linha 539
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-10 min-h-screen flex flex-col"> {/* Adicionado mx-auto */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs/Componentes Filhos */}

        <BasicInformationTab
            // ... (props existentes: tcoNumber, natureza, autor, pena, etc.) ...
            tcoNumber={tcoNumber} setTcoNumber={setTcoNumber}
            natureza={natureza} setNatureza={setNatureza}
            autor={autor} setAutor={setAutor} // OK, sincronizado com autores[0].nome
            penaDescricao={penaDescricao} naturezaOptions={naturezaOptions}
            customNatureza={customNatureza} setCustomNatureza={setCustomNatureza}
            startTime={startTime} isTimerRunning={isTimerRunning}
         />

        {natureza === "Porte de drogas para consumo" && (
          <DrugVerificationTab
            // ... (props existentes) ...
            quantidade={quantidade} setQuantidade={setQuantidade}
            substancia={substancia} setSubstancia={setSubstancia}
            cor={cor} setCor={setCor}
            indicios={indicios} // Passa o indicio calculado
            customMaterialDesc={customMaterialDesc} setCustomMaterialDesc={setCustomMaterialDesc}
            isUnknownMaterial={isUnknownMaterial}
           />
        )}

        <GeneralInformationTab
            // ... (props existentes para datas, locais, etc.) ...
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
            // Passa os dados do condutor (lidos de componentesGuarnicao[0]) APENAS PARA DISPLAY
            condutorNome={condutorParaDisplay?.nome || ""}
            condutorPosto={condutorParaDisplay?.posto || ""}
            condutorRg={condutorParaDisplay?.rg || ""}
            // *** REMOVIDO setCondutorNome, setCondutorPosto, setCondutorRg ***
        />

        <PessoasEnvolvidasTab
            // ... (props existentes) ...
            activeTab={activeTab} setActiveTab={setActiveTab}
            autorDetalhes={autores[0] || { nome: "", sexo: "", estadoCivil: "", profissao: "", endereco: "", dataNascimento: "", naturalidade: "", filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "", celular: "", email: "" }} // Passa o primeiro autor
            vitimas={vitimas} handleVitimaChange={handleVitimaChange} handleAddVitima={handleAddVitima} handleRemoveVitima={handleRemoveVitima}
            testemunhas={testemunhas} handleTestemunhaChange={handleTestemunhaChange} handleAddTestemunha={handleAddTestemunha} handleRemoveTestemunha={handleRemoveTestemunha}
            autores={autores} handleAutorDetalhadoChange={handleAutorDetalhadoChange} handleAddAutor={handleAddAutor} handleRemoveAutor={handleRemoveAutor} // Passa o array completo para gerenciar múltiplos
        />

        {/* GuarnicaoTab com as props CORRIGIDAS */}
        <GuarnicaoTab
            currentGuarnicaoList={componentesGuarnicao} // Passa a lista do estado PAI
            onAddPolicial={handleAddPolicialToList}     // Passa a callback para adicionar
            onRemovePolicial={handleRemovePolicialFromList} // Passa a callback para remover
         />

        <HistoricoTab
            // ... (props existentes) ...
             relatoPolicial={relatoPolicial} setRelatoPolicial={setRelatoPolicial}
             relatoAutor={relatoAutor} setRelatoAutor={setRelatoAutor}
             relatoVitima={relatoVitima} setRelatoVitima={setRelatoVitima}
             relatoTestemunha={relatoTestemunha} setRelatoTestemunha={setRelatoTestemunha}
             apreensoes={apreensoes} setApreensoes={setApreensoes}
             conclusaoPolicial={conclusaoPolicial} setConclusaoPolicial={setConclusaoPolicial}
             drugSeizure={natureza === "Porte de drogas para consumo"}
             representacao={representacao} setRepresentacao={setRepresentacao} // Para o termo de manifestação
         />

        {/* Submit Button */}
        <div className="flex justify-end mt-8"> {/* Aumentado margin top */}
          <Button type="submit" disabled={isSubmitting} size="lg"> {/* Botão maior */}
            <FileText className="mr-2 h-5 w-5" />
            {isSubmitting ? "Gerando e Salvando..." : "Finalizar e Gerar TCO"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TCOForm;
