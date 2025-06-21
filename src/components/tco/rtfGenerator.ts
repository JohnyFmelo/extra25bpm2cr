
export const generateRTF = async (tcoData: any): Promise<string> => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatPersons = (persons: any[]) => {
    if (!persons || persons.length === 0) return "Não informado";
    
    return persons
      .filter(person => person.nome?.trim())
      .map(person => {
        let info = `Nome: ${person.nome}`;
        if (person.cpf) info += `\\line CPF: ${person.cpf}`;
        if (person.rg) info += `\\line RG: ${person.rg}`;
        if (person.endereco) info += `\\line Endereço: ${person.endereco}`;
        if (person.celular) info += `\\line Celular: ${person.celular}`;
        return info;
      })
      .join("\\line\\line ");
  };

  const formatGuarnicao = (componentes: any[]) => {
    if (!componentes || componentes.length === 0) return "Não informado";
    
    return componentes
      .filter(c => c.nome?.trim() && c.rg?.trim())
      .map(c => `${c.posto} PM ${c.nome} - RG: ${c.rg}${c.apoio ? ' (APOIO)' : ''}`)
      .join("\\line ");
  };

  const escapeRTF = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\n/g, '\\line ')
      .replace(/\r/g, '');
  };

  // Cabeçalho RTF
  let rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}`;
  
  // Título
  rtfContent += `\\f0\\fs28\\b TERMO CIRCUNSTANCIADO DE OCORRÊNCIA\\b0\\fs20\\line\\line`;
  rtfContent += `\\b TCO Nº: \\b0 ${escapeRTF(tcoData.tcoNumber)}\\line\\line`;

  // Informações Básicas
  rtfContent += `\\b INFORMAÇÕES BÁSICAS\\b0\\line`;
  rtfContent += `\\b Natureza: \\b0 ${escapeRTF(tcoData.natureza)}\\line`;
  rtfContent += `\\b Tipificação: \\b0 ${escapeRTF(tcoData.tipificacao)}\\line`;
  if (tcoData.penaDescricao) {
    rtfContent += `\\b Pena: \\b0 ${escapeRTF(tcoData.penaDescricao)}\\line`;
  }
  rtfContent += `\\line`;

  // Data e Local
  rtfContent += `\\b DATA E LOCAL\\b0\\line`;
  rtfContent += `\\b Data do Fato: \\b0 ${formatDate(tcoData.dataFato)} às ${tcoData.horaFato}\\line`;
  rtfContent += `\\b Local: \\b0 ${escapeRTF(tcoData.localFato)}\\line`;
  rtfContent += `\\b Endereço: \\b0 ${escapeRTF(tcoData.endereco)}\\line`;
  rtfContent += `\\b Município: \\b0 ${escapeRTF(tcoData.municipio)}\\line`;
  rtfContent += `\\line`;

  // Registro
  rtfContent += `\\b REGISTRO\\b0\\line`;
  rtfContent += `\\b Início: \\b0 ${formatDate(tcoData.dataInicioRegistro)} às ${tcoData.horaInicioRegistro}\\line`;
  rtfContent += `\\b Término: \\b0 ${formatDate(tcoData.dataTerminoRegistro)} às ${tcoData.horaTerminoRegistro}\\line`;
  rtfContent += `\\b Comunicante: \\b0 ${escapeRTF(tcoData.comunicante)}\\line`;
  rtfContent += `\\line`;

  // Guarnição
  rtfContent += `\\b GUARNIÇÃO POLICIAL\\b0\\line`;
  rtfContent += `\\b Guarnição: \\b0 ${escapeRTF(tcoData.guarnicao)}\\line`;
  if (tcoData.operacao) {
    rtfContent += `\\b Operação: \\b0 ${escapeRTF(tcoData.operacao)}\\line`;
  }
  rtfContent += `\\b Componentes:\\b0\\line ${formatGuarnicao(tcoData.componentesGuarnicao)}\\line\\line`;

  // Pessoas Envolvidas
  if (tcoData.autores && tcoData.autores.length > 0) {
    rtfContent += `\\b AUTOR(ES)\\b0\\line`;
    rtfContent += `${formatPersons(tcoData.autores)}\\line\\line`;
  }

  if (tcoData.vitimas && tcoData.vitimas.length > 0 && tcoData.vitimas[0].nome !== 'O ESTADO') {
    rtfContent += `\\b VÍTIMA(S)\\b0\\line`;
    rtfContent += `${formatPersons(tcoData.vitimas)}\\line\\line`;
  }

  if (tcoData.testemunhas && tcoData.testemunhas.length > 0) {
    rtfContent += `\\b TESTEMUNHA(S)\\b0\\line`;
    rtfContent += `${formatPersons(tcoData.testemunhas)}\\line\\line`;
  }

  // Apreensões
  if (tcoData.apreensoes) {
    rtfContent += `\\b APREENSÕES\\b0\\line`;
    rtfContent += `${escapeRTF(tcoData.apreensoes)}\\line`;
    if (tcoData.lacreNumero) {
      rtfContent += `\\b Número do Lacre: \\b0 ${escapeRTF(tcoData.lacreNumero)}\\line`;
    }
    rtfContent += `\\line`;
  }

  // Relatos
  if (tcoData.relatoPolicial) {
    rtfContent += `\\b RELATO POLICIAL\\b0\\line`;
    rtfContent += `${escapeRTF(tcoData.relatoPolicial)}\\line\\line`;
  }

  if (tcoData.relatoAutor) {
    rtfContent += `\\b RELATO DO(S) AUTOR(ES)\\b0\\line`;
    rtfContent += `${escapeRTF(tcoData.relatoAutor)}\\line\\line`;
  }

  if (tcoData.relatoVitima && tcoData.vitimas && tcoData.vitimas[0]?.nome !== 'O ESTADO') {
    rtfContent += `\\b RELATO DA(S) VÍTIMA(S)\\b0\\line`;
    rtfContent += `${escapeRTF(tcoData.relatoVitima)}\\line\\line`;
  }

  if (tcoData.relatoTestemunha && tcoData.testemunhas && tcoData.testemunhas.length > 0) {
    rtfContent += `\\b RELATO DA(S) TESTEMUNHA(S)\\b0\\line`;
    rtfContent += `${escapeRTF(tcoData.relatoTestemunha)}\\line\\line`;
  }

  // Providências
  if (tcoData.providencias) {
    rtfContent += `\\b PROVIDÊNCIAS ADOTADAS\\b0\\line`;
    rtfContent += `${escapeRTF(tcoData.providencias)}\\line\\line`;
  }

  // Documentos Anexos
  if (tcoData.documentosAnexos) {
    rtfContent += `\\b DOCUMENTOS ANEXOS\\b0\\line`;
    rtfContent += `${escapeRTF(tcoData.documentosAnexos)}\\line\\line`;
  }

  // Conclusão
  if (tcoData.conclusaoPolicial) {
    rtfContent += `\\b CONCLUSÃO POLICIAL\\b0\\line`;
    rtfContent += `${escapeRTF(tcoData.conclusaoPolicial)}\\line\\line`;
  }

  // Anexos
  if (tcoData.videoLinks && tcoData.videoLinks.length > 0) {
    rtfContent += `\\b LINKS DE VÍDEOS\\b0\\line`;
    tcoData.videoLinks.forEach((link: string, index: number) => {
      rtfContent += `${index + 1}. ${escapeRTF(link)}\\line`;
    });
    rtfContent += `\\line`;
  }

  if (tcoData.imageBase64 && tcoData.imageBase64.length > 0) {
    rtfContent += `\\b IMAGENS ANEXADAS\\b0\\line`;
    rtfContent += `Total de ${tcoData.imageBase64.length} imagem(ns) anexada(s)\\line\\line`;
  }

  // Compromisso de Comparecimento
  if (tcoData.juizadoEspecialData && tcoData.juizadoEspecialHora) {
    rtfContent += `\\b TERMO DE COMPROMISSO DE COMPARECIMENTO\\b0\\line`;
    rtfContent += `Data de Comparecimento: ${formatDate(tcoData.juizadoEspecialData)} às ${tcoData.juizadoEspecialHora}\\line\\line`;
  }

  // Rodapé
  rtfContent += `\\line\\line`;
  rtfContent += `Várzea Grande-MT, ${formatDate(tcoData.dataTerminoRegistro)}\\line\\line`;
  rtfContent += `________________________________\\line`;
  rtfContent += `Responsável pela Lavratura\\line`;
  if (tcoData.userRegistration) {
    rtfContent += `RG PM: ${escapeRTF(tcoData.userRegistration)}`;
  }

  // Fechamento do RTF
  rtfContent += `}`;

  return rtfContent;
};
