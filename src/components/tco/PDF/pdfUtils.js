
// Constants for page margins
export const MARGIN_LEFT = 20;
export const MARGIN_RIGHT = 20;
export const MARGIN_TOP = 20;
export const MARGIN_BOTTOM = 30; // Ajustado para ficar alinhado com o rodapé

// Utility function to get page constants based on document
export const getPageConstants = (doc) => {
  return {
    PAGE_WIDTH: doc.internal.pageSize.width,
    PAGE_HEIGHT: doc.internal.pageSize.height
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

// Date formatting helper
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

// Helper to split text into multiple lines if it exceeds maxWidth
export const splitTextToLines = (doc, text, maxWidth) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  return lines;
};
