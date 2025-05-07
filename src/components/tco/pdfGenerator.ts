import jsPDF from "jspdf";
import { addTermoCompromisso } from "./PDFTermoCompromisso";
import { addTermoApreensao } from "./PDFTermoApreensao";
import { addHistorico } from "./PDFhistorico";

interface Autor {
  nome: string;
  rg: string;
  cpf: string;
  celular: string;
  endereco: string;
  municipio: string;
  assinatura: string;
  sexo: string;
  estadoCivil: string;
  profissao: string;
  dataNascimento: string;
  naturalidade: string;
  filiacaoMae: string;
  filiacaoPai: string;
  laudoPericial: string;
}

interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
  pai?: string;
  mae?: string;
  naturalidade?: string;
  cpf?: string;
  telefone?: string;
}

interface ObjetoApreendido {
  descricao: string;
  quantidade: string;
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

interface FormData {
  tcoNumber: string;
  natureza: string;
  originalNatureza: string;
  customNatureza: string;
  tipificacao: string;
  penaDescricao: string;
  dataFato: string;
  horaFato: string;
  dataInicioRegistro: string;
  horaInicioRegistro: string;
  dataTerminoRegistro: string;
  horaTerminoRegistro: string;
  localFato: string;
  endereco: string;
  municipio: string;
  comunicante: string;
  guarnicao: string;
  operacao: string;
  lacre: string;
  lacreNumero: string;
  apreensoes: string;
  relatoPolicial: string;
  relatoAutor: string;
  relatoTestemunha: string;
  relatoVitima?: string;
  representacao?: string;
  autores: Autor[];
  vitimas: Pessoa[];
  testemunhas: Pessoa[];
  componentesGuarnicao: ComponenteGuarnicao[];
  objetosApreendidos: ObjetoApreendido[];
  drogaQuantidade: string;
  drogaTipo?: string;
  drogaCor?: string;
  drogaNomeComum: string;
  drogaCustomDesc: string;
  drogaIsUnknown: boolean;
  startTime?: string;
  endTime?: string;
  createdAt?: Date;
  createdBy?: string;
}

export const generatePDF = (data: FormData): jsPDF => {
  console.log("[pdfGenerator] Iniciando geração do PDF com dados:", data);
  const doc = new jsPDF({ format: "a4" });
  let yPos = 0;

  // Adiciona Termo de Compromisso
  yPos = addTermoCompromisso(doc, data, yPos);
  console.log("[pdfGenerator] Termo de Compromisso adicionado, yPos:", yPos);

  // Adiciona Termo de Apreensão (em nova página)
  yPos = addTermoApreensao(doc, data);
  console.log("[pdfGenerator] Termo de Apreensão adicionado, yPos:", yPos);

  // Adiciona Histórico
  yPos = addHistorico(doc, data, yPos);
  console.log("[pdfGenerator] Histórico adicionado, yPos:", yPos);

  console.log("[pdfGenerator] PDF gerado com sucesso");
  return doc;
};
