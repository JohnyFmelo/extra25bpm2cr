
// Constants for page margins
export const MARGIN_LEFT = 20;
export const MARGIN_RIGHT = 20;
export const MARGIN_TOP = 20;
export const MARGIN_BOTTOM = 30; // Ajustado para ficar alinhado com o rodapé

// Utility function to get page constants based on document
export const getPageConstants = (doc) => {
  return {
    PAGE_WIDTH: doc.internal.pageSize.width,
    PAGE_HEIGHT: doc.internal.pageSize.height,
    MAX_LINE_WIDTH: doc.internal.pageSize.width - MARGIN_LEFT - MARGIN_RIGHT
  };
};

// Adiciona nova página e aplicar cabeçalho padrão
export const addNewPage = (doc, data) => {
  doc.addPage();
  addStandardHeaderContent(doc);
  return MARGIN_TOP;
};

// Helper to add standard header content to a page
export const addStandardHeaderContent = (doc) => {
  const { PAGE_WIDTH } = getPageConstants(doc);
  
  // Logo do Estado (simulado com texto)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  centerAlign(doc, "ESTADO DE MATO GROSSO", PAGE_WIDTH / 2, MARGIN_TOP + 5);
  centerAlign(doc, "SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA", PAGE_WIDTH / 2, MARGIN_TOP + 10);
  centerAlign(doc, "POLÍCIA MILITAR DO ESTADO DE MATO GROSSO", PAGE_WIDTH / 2, MARGIN_TOP + 15);
  centerAlign(doc, "25º BATALHÃO DE POLÍCIA MILITAR", PAGE_WIDTH / 2, MARGIN_TOP + 20);
  
  // Reset font
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  
  return MARGIN_TOP + 25; // Retorna a posição Y após o cabeçalho
};

// Helper to add standard footer content to all pages except the first
export const addStandardFooterContent = (doc) => {
  const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc);
  
  let footerY = PAGE_HEIGHT - MARGIN_BOTTOM;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  centerAlign(doc, "25º Batalhão de Polícia Militar", PAGE_WIDTH / 2, footerY);
  footerY += 4;
  centerAlign(doc, "Várzea Grande - MT", PAGE_WIDTH / 2, footerY);
  
  // Reset font
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
};

// Text alignment helpers
export const rightAlign = (doc, text, x, y) => {
  doc.text(text, x, y, { align: "right" });
};

export const centerAlign = (doc, text, x, y) => {
  doc.text(text, x, y, { align: "center" });
};

// Adding section titles and fields
export const addSectionTitle = (doc, yPos, title, number, level = 1, data) => {
  yPos = checkPageBreak(doc, yPos, 10, data);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(level === 1 ? 14 : 12);
  doc.text(`${number}. ${title}`, MARGIN_LEFT, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  return yPos + 6;
};

// Function to add a field with label and value
export const addField = (doc, yPos, label, value, data) => {
  yPos = checkPageBreak(doc, yPos, 5, data);
  doc.setFont('helvetica', 'bold');
  doc.text(`${label}:`, MARGIN_LEFT, yPos);
  doc.setFont('helvetica', 'normal');
  
  const labelWidth = doc.getTextWidth(`${label}: `);
  const valueText = value || 'Não informado';
  
  // Check if value is too long for the same line
  const { MAX_LINE_WIDTH } = getPageConstants(doc);
  if (MARGIN_LEFT + labelWidth + doc.getTextWidth(valueText) < MARGIN_LEFT + MAX_LINE_WIDTH) {
    // Short enough to fit on the same line
    doc.text(valueText, MARGIN_LEFT + labelWidth + 2, yPos);
    return yPos + 5;
  } else {
    // Too long, put on next line with proper indentation
    yPos += 5;
    yPos = checkPageBreak(doc, yPos, 5, data);
    const indentedValue = addWrappedText(doc, yPos, valueText, MARGIN_LEFT + 5, 12, 'normal', MAX_LINE_WIDTH - 5, 'left', data);
    return indentedValue + 2;
  }
};

// Check if we need to add a new page
export const checkPageBreak = (doc, yPos, nextElementHeight, data) => {
  const { PAGE_HEIGHT } = getPageConstants(doc);
  if (yPos + nextElementHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
    return addNewPage(doc, data);
  }
  return yPos;
};

// Add text that wraps to multiple lines if needed
export const addWrappedText = (doc, yPos, text, x, fontSize, fontStyle, maxWidth, align, data) => {
  if (!text || text.trim() === '') {
    return yPos;
  }
  
  doc.setFont('helvetica', fontStyle);
  doc.setFontSize(fontSize);
  
  const lines = doc.splitTextToSize(text, maxWidth);
  let currentY = yPos;
  
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) {
      currentY += fontSize * 0.4;
    }
    currentY = checkPageBreak(doc, currentY, fontSize, data);
    doc.text(lines[i], x, currentY, { align });
  }
  
  return currentY + fontSize * 0.4;
};

// Add signature with name and role
export const addSignatureWithNameAndRole = (doc, yPos, name, role, data) => {
  const { PAGE_WIDTH } = getPageConstants(doc);
  const lineWidth = 80;
  let newY = yPos + 20; // Espaço para assinatura
  
  newY = checkPageBreak(doc, newY, 15, data);
  
  // Linha da assinatura
  doc.setLineWidth(0.5);
  doc.line(PAGE_WIDTH / 2 - lineWidth / 2, newY, PAGE_WIDTH / 2 + lineWidth / 2, newY);
  newY += 5;
  
  // Nome e função abaixo da linha
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  centerAlign(doc, name ? name.toUpperCase() : '[NOME NÃO INFORMADO]', PAGE_WIDTH / 2, newY);
  newY += 5;
  
  doc.setFont('helvetica', 'normal');
  centerAlign(doc, role, PAGE_WIDTH / 2, newY);
  
  doc.setFontSize(12);
  return newY + 10; // Retorna a nova posição Y
};

// Date formatting helpers
export const formatarData = (dataStr) => {
  if (!dataStr) return "";
  
  try {
    const data = new Date(dataStr);
    if (isNaN(data.getTime())) return dataStr; // Retorna o original se for inválida
    
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return dataStr;
  }
};

export const formatarDataSimples = (dataStr) => {
  if (!dataStr) return "Não informada";
  
  try {
    const data = new Date(dataStr);
    if (isNaN(data.getTime())) return dataStr;
    
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch (e) {
    console.error("Erro ao formatar data simples:", e);
    return "Data inválida";
  }
};

export const formatarDataHora = (data, hora) => {
  if (!data) return "Não informada";
  
  try {
    const dataFormatada = formatarData(data);
    return hora ? `${dataFormatada} às ${hora}` : dataFormatada;
  } catch (e) {
    console.error("Erro ao formatar data e hora:", e);
    return "Data/hora inválida";
  }
};

// Helper to split text into multiple lines if it exceeds maxWidth
export const splitTextToLines = (doc, text, maxWidth) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  return lines;
};

// Função para retornar a data atual por extenso
export const getDataAtualExtenso = () => {
  const meses = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];
  
  const data = new Date();
  const dia = data.getDate();
  const mes = meses[data.getMonth()];
  const ano = data.getFullYear();
  
  return `AOS ${dia} DIAS DO MÊS DE ${mes} DO ANO DE ${ano}`;
};
