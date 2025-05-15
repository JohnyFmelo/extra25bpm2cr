import { fontName } from "./PDFUtils";

/**
 * Creates the history section of the PDF
 * @param {Object} doc - The jsPDF document object
 * @param {Object} tco - The TCO data object
 * @param {Object} options - Optional parameters
 * @returns {number} The Y position after creating the content
 */
export const createHistoricoSection = (doc, tco, options = {}) => {
  const margemEsquerda = 20;
  const margemDireita = 20;
  const margemSuperior = 20;
  const margemInferior = 20;
  const espacamento = 7;
  const espacamentoLinhas = 5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(12);
  doc.setFont(fontName, 'normal');
  doc.setLineDash([], 0);
  doc.lastY = doc.lastY || margemSuperior;

  // Seção 6 - Relato Policial
  let secao6Y = doc.lastY + 10;
  doc.setFont(fontName, 'bold');
  doc.text('6. RELATO POLICIAL', margemEsquerda, secao6Y);
  secao6Y += espacamento;

  doc.setFont(fontName, 'normal');
  const relatoPolicial = tco.relatoPolicial || 'Nenhum relato policial informado.';
  const linhasRelato = doc.splitTextToSize(relatoPolicial, pageWidth - margemEsquerda - margemDireita);
  for (const linha of linhasRelato) {
    doc.text(linha, margemEsquerda, secao6Y);
    secao6Y += espacamentoLinhas;
  }
  secao6Y += espacamento;

  // Seção 7 - Relato do(s) Autor(es)
  let secao7Y = secao6Y + 10;
  doc.setFont(fontName, 'bold');
  doc.text('7. RELATO DO(S) AUTOR(ES)', margemEsquerda, secao7Y);
  secao7Y += espacamento;

  doc.setFont(fontName, 'normal');
  const relatoAutor = tco.relatoAutor || 'Nenhum relato do(s) autor(es) informado.';
  const linhasRelatoAutor = doc.splitTextToSize(relatoAutor, pageWidth - margemEsquerda - margemDireita);
  for (const linha of linhasRelatoAutor) {
    doc.text(linha, margemEsquerda, secao7Y);
    secao7Y += espacamentoLinhas;
  }
  secao7Y += espacamento;

  // Seção 8 - Relato da(s) Vítima(s)
  let secao8Y = secao7Y + 10;
  doc.setFont(fontName, 'bold');
  doc.text('8. RELATO DA(S) VÍTIMA(S)', margemEsquerda, secao8Y);
  secao8Y += espacamento;

  doc.setFont(fontName, 'normal');
  const relatoVitima = tco.relatoVitima || 'Nenhum relato da(s) vítima(s) informado.';
  const linhasRelatoVitima = doc.splitTextToSize(relatoVitima, pageWidth - margemEsquerda - margemDireita);
  for (const linha of linhasRelatoVitima) {
    doc.text(linha, margemEsquerda, secao8Y);
    secao8Y += espacamentoLinhas;
  }
  secao8Y += espacamento;

  // Seção 9 - Relato da(s) Testemunha(s)
  let secao9Y = secao8Y + 10;
  doc.setFont(fontName, 'bold');
  doc.text('9. RELATO DA(S) TESTEMUNHA(S)', margemEsquerda, secao9Y);
  secao9Y += espacamento;

  doc.setFont(fontName, 'normal');
  const relatoTestemunha = tco.relatoTestemunha || 'Nenhum relato da(s) testemunha(s) informado.';
  const linhasRelatoTestemunha = doc.splitTextToSize(relatoTestemunha, pageWidth - margemEsquerda - margemDireita);
  for (const linha of linhasRelatoTestemunha) {
    doc.text(linha, margemEsquerda, secao9Y);
    secao9Y += espacamentoLinhas;
  }
  secao9Y += espacamento;

  // Seção 10 - Apreensões
  let secao10Y = secao9Y + 10;
  doc.setFont(fontName, 'bold');
  doc.text('10. APREENSÕES', margemEsquerda, secao10Y);
  secao10Y += espacamento;

  doc.setFont(fontName, 'normal');
  const apreensoes = tco.apreensoes || 'Nenhuma apreensão informada.';
  const linhasApreensoes = doc.splitTextToSize(apreensoes, pageWidth - margemEsquerda - margemDireita);
  for (const linha of linhasApreensoes) {
    doc.text(linha, margemEsquerda, secao10Y);
    secao10Y += espacamentoLinhas;
  }
  secao10Y += espacamento;

  // Seção 11 - Conclusão
  let secao11Y = secao10Y + 10;
  doc.setFont(fontName, 'bold');
  doc.text('11. CONCLUSÃO', margemEsquerda, secao11Y);
  secao11Y += espacamento;

  doc.setFont(fontName, 'normal');
  const conclusaoPolicial = tco.conclusaoPolicial || 'Nenhuma conclusão informada.';
  const linhasConclusao = doc.splitTextToSize(conclusaoPolicial, pageWidth - margemEsquerda - margemDireita);
  for (const linha of linhasConclusao) {
    doc.text(linha, margemEsquerda, secao11Y);
    secao11Y += espacamentoLinhas;
  }
  secao11Y += espacamento;

  // Seção 5 - Identificação da Guarnição
  let secao5Y = doc.lastY + 10;
  doc.setFont(fontName, 'bold');
  doc.text('5. IDENTIFICAÇÃO DA GUARNIÇÃO', margemEsquerda, secao5Y);
  secao5Y += espacamento;
  
  // Componentes da guarnição (servidores e assinaturas)
  doc.setFont(fontName, 'normal');
  const componentesGuarnicao = tco.componentesGuarnicao || [];
  
  // Adicionar espaço antes dos componentes
  secao5Y += espacamentoLinhas;
  
  // Se não houver componentes
  if (componentesGuarnicao.length === 0) {
    doc.text('Não há componentes na guarnição informados.', margemEsquerda, secao5Y);
    secao5Y += espacamento;
  } else {
    // Para cada componente, adicionar ao PDF
    for (let i = 0; i < componentesGuarnicao.length; i++) {
      const componente = componentesGuarnicao[i];
      doc.setFont(fontName, 'bold');
      
      // Se for o primeiro, mostrar como Condutor
      if (i === 0) {
        doc.text(`Condutor: ${componente.posto} ${componente.nome} - RG PM ${componente.rg}`, margemEsquerda, secao5Y);
      } else {
        doc.text(`${componente.posto} ${componente.nome} - RG PM ${componente.rg}`, margemEsquerda, secao5Y);
      }
      
      // Área de assinatura
      secao5Y += espacamentoLinhas * 5;
      doc.setLineDash([1, 1], 0);
      doc.line(margemEsquerda, secao5Y, margemEsquerda + 150, secao5Y);
      secao5Y += espacamentoLinhas;
      doc.setFont(fontName, 'normal');
      doc.text('Assinatura', margemEsquerda + 65, secao5Y);
      secao5Y += espacamentoLinhas * 2;
    }
  }
  
  // Adicionar Componentes de Apoio (seção 5.1)
  if (tco.componentesApoio && tco.componentesApoio.length > 0) {
    secao5Y += espacamentoLinhas;
    doc.setFont(fontName, 'bold');
    doc.text('5.1. POLICIAIS DE APOIO', margemEsquerda, secao5Y);
    secao5Y += espacamentoLinhas;
    
    doc.setFont(fontName, 'normal');
    
    const apoios = tco.componentesApoio.map(componente => 
      `${componente.posto} ${componente.nome} - RG PM ${componente.rg}`
    );
    
    for (const apoio of apoios) {
      // Verificar se o texto vai ultrapassar a margem
      if (doc.getTextDimensions(apoio).w > pageWidth - margemEsquerda - margemDireita) {
        const linhas = doc.splitTextToSize(apoio, pageWidth - margemEsquerda - margemDireita);
        for (const linha of linhas) {
          doc.text(linha, margemEsquerda, secao5Y);
          secao5Y += espacamentoLinhas;
        }
      } else {
        doc.text(apoio, margemEsquerda, secao5Y);
        secao5Y += espacamentoLinhas;
      }
    }
    
    secao5Y += espacamentoLinhas;
  }

  // Verificar se há espaço para continuar na página atual
  if (secao5Y > pageHeight - margemInferior - 15) {
    doc.addPage();
    secao5Y = margemSuperior;
  }
  
  doc.lastY = secao11Y;
  return doc.lastY;
};
