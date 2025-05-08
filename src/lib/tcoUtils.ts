// src/lib/tcoUtils.ts

export interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
}

export interface Pessoa {
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

export const initialPersonData: Pessoa = {
  nome: "", sexo: "", estadoCivil: "", profissao: "",
  endereco: "", dataNascimento: "", naturalidade: "",
  filiacaoMae: "", filiacaoPai: "", rg: "", cpf: "",
  celular: "", email: "", laudoPericial: "Não"
};

export const formatCPF = (cpf: string): string => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length <= 11) {
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return cpf;
};

export const formatPhone = (phone: string): string => {
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

export const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // Checks for 11 repeated digits
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

export const formatarGuarnicao = (componentes: ComponenteGuarnicao[]): string => {
  if (!componentes || componentes.length === 0) return "[GUPM PENDENTE]";
  const nomesFormatados = componentes
    .filter(c => c.nome && c.posto) // Ensure essential fields are present
    .map(c => `${c.posto} PM ${c.nome}`);
  if (nomesFormatados.length === 0) return "[GUPM PENDENTE]";
  if (nomesFormatados.length === 1) return nomesFormatados[0].toUpperCase();
  if (nomesFormatados.length === 2) return `${nomesFormatados[0]} E ${nomesFormatados[1]}`.toUpperCase();
  return `${nomesFormatados.slice(0, -1).join(", ")} E ${nomesFormatados[nomesFormatados.length - 1]}`.toUpperCase();
};

export const formatarRelatoAutorBase = (autores: Pessoa[]): string => {
  if (autores.length === 0 || !autores.some(a => a.nome && a.nome.trim() !== "")) {
    return "O AUTOR DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.";
  }
  const autoresValidos = autores.filter(a => a.nome && a.nome.trim() !== "");
  if (autoresValidos.length === 1) {
    const sexo = autoresValidos[0].sexo ? autoresValidos[0].sexo.toLowerCase() : "masculino";
    const pronome = sexo === "feminino" ? "A AUTORA" : "O AUTOR";
    return `${pronome} DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.`;
  }
  const todosFemininos = autoresValidos.every(a => a.sexo && a.sexo.toLowerCase() === "feminino");
  const pronomePlural = todosFemininos ? "AS AUTORAS" : "OS AUTORES";
  return `${pronomePlural} DOS FATOS ABAIXO ASSINADOS, JÁ QUALIFICADOS NOS AUTOS, CIENTIFICADOS DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLARARAM QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSERAM E NEM LHE FOI PERGUNTADO.`;
};

export const numberToText = (num: number): string => {
  const numbers = [
    "ZERO", "UMA", "DUAS", "TRÊS", "QUATRO",
    "CINCO", "SEIS", "SETE", "OITO", "NOVE", "DEZ"
  ];
  return num >= 0 && num <= 10 ? numbers[num] : num.toString();
};

export const relatoPolicialTemplateBase = `POR VOLTA DAS [HORÁRIO] DO DIA [DATA], NESTA CIDADE DE VÁRZEA GRANDE-MT, A GUARNIÇÃO DA VIATURA [GUARNIÇÃO][OPERACAO_TEXT] COMPOSTA PELOS MILITARES [GUPM], DURANTE RONDAS NO BAIRRO [BAIRRO], FOI ACIONADA VIA [MEIO DE ACIONAMENTO] PARA ATENDER A UMA OCORRÊNCIA DE [NATUREZA] NO [LOCAL], ONDE [VERSÃO INICIAL]. CHEGANDO NO LOCAL, A EQUIPE [O QUE A PM DEPAROU]. A VERSÃO DAS PARTES FOI REGISTRADA EM CAMPO PRÓPRIO. [VERSÃO SUMÁRIA DAS PARTES E TESTEMUNHAS]. [DILIGÊNCIAS E APREENSÕES REALIZADAS]. DIANTE DISSO, [ENCAMINHAMENTO PARA REGISTRO DOS FATOS].`;

export const relatoVitimaTemplateBase = "RELATOU A VÍTIMA, ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO.";

export const relatoTestemunhaTemplateBase = "A TESTEMUNHA ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, COMPROMISSADA NA FORMA DA LEI, QUE AOS COSTUMES RESPONDEU NEGATIVAMENTE OU QUE É AMIGA/PARENTE DE UMA DAS PARTES, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSERAM E NEM LHE FOI PERGUNTADO.";
