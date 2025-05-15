
// PDF utilities for TCO generation

// Font constants
export const fontName = "helvetica";

// Page constants and margins
export const MARGIN_TOP = 20;
export const MARGIN_LEFT = 20;
export const MARGIN_RIGHT = 20;
export const MARGIN_BOTTOM = 20;
export const LINE_HEIGHT = 7;

/**
 * Gets page constants
 * @param {Object} doc - The jsPDF document instance
 * @returns {Object} Object with page dimensions
 */
export const getPageConstants = (doc) => {
  return {
    PAGE_WIDTH: doc.internal.pageSize.getWidth(),
    PAGE_HEIGHT: doc.internal.pageSize.getHeight(),
  };
};

/**
 * Adds a new page to the document
 * @param {Object} doc - The jsPDF document instance
 * @param {Object} data - Optional data for the page
 * @returns {number} The starting Y position for content
 */
export const addNewPage = (doc, data = {}) => {
  doc.addPage();
  const startY = MARGIN_TOP;
  return startY;
};

/**
 * Formats a date string to Brazilian format
 * @param {string} dateStr - The date string to format
 * @returns {string} The formatted date string
 */
export const formatDateToBrazilian = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateStr;
  }
};

/**
 * Gets the current date in Brazilian extended format
 * @returns {string} The formatted date string
 */
export const getDataAtualExtenso = () => {
  const date = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('pt-BR', options).toUpperCase();
};

/**
 * Adds a bold-labeled field to the document
 * @param {Object} doc - The jsPDF document instance
 * @param {number} yPos - The current Y position
 * @param {string} label - The bold label text
 * @param {string} value - The value text
 * @param {Object} data - Optional data
 * @returns {number} The new Y position
 */
export const addFieldBoldLabel = (doc, yPos, label, value, data = {}) => {
  doc.setFont("helvetica", "bold");
  doc.text(`${label}: `, MARGIN_LEFT, yPos);
  
  // Calculate width of the label
  const labelWidth = doc.getTextWidth(`${label}: `);
  
  // Add value after label
  doc.setFont("helvetica", "normal");
  doc.text(value || "Não informado.", MARGIN_LEFT + labelWidth, yPos);
  
  return yPos + LINE_HEIGHT;
};

/**
 * Adds wrapped text to the document
 * @param {Object} doc - The jsPDF document instance
 * @param {number} yPos - The current Y position
 * @param {string} text - The text to wrap
 * @param {number} xPos - The X position
 * @param {number} fontSize - The font size
 * @param {string} fontStyle - The font style
 * @param {number} maxWidth - The maximum width (optional)
 * @param {string} align - Text alignment (optional)
 * @param {Object} data - Additional data (optional)
 * @returns {number} The new Y position
 */
export const addWrappedText = (doc, yPos, text, xPos, fontSize, fontStyle, maxWidth = null, align = 'left', data = {}) => {
  const { PAGE_WIDTH } = getPageConstants(doc);
  const maxLineWidth = maxWidth || (PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT);
  
  doc.setFont("helvetica", fontStyle || "normal");
  doc.setFontSize(fontSize || 12);
  
  const lines = doc.splitTextToSize(text, maxLineWidth);
  let currentY = yPos;
  
  for (const line of lines) {
    if (currentY >= (PAGE_HEIGHT - MARGIN_BOTTOM)) {
      currentY = addNewPage(doc, data);
    }
    
    if (align === 'center') {
      doc.text(line, PAGE_WIDTH / 2, currentY, { align: 'center' });
    } else if (align === 'right') {
      doc.text(line, PAGE_WIDTH - MARGIN_RIGHT, currentY, { align: 'right' });
    } else if (align === 'justify') {
      // Basic justification - not true justification but better than left align
      doc.text(line, xPos, currentY);
    } else {
      doc.text(line, xPos, currentY);
    }
    
    currentY += LINE_HEIGHT;
  }
  
  return currentY;
};

/**
 * Adds standard footer content to the current page
 * @param {Object} doc - The jsPDF document instance
 */
export const addStandardFooterContent = (doc) => {
  const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", 'normal');
  
  // Footer text
  const footerText = "TERMO CIRCUNSTANCIADO DE OCORRÊNCIA";
  doc.text(footerText, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: "center" });
};

/**
 * Checks if a page break is needed and adds a new page if necessary
 * @param {Object} doc - The jsPDF document instance
 * @param {number} yPos - The current Y position
 * @param {number} contentHeight - The height of the content to be added
 * @param {Object} data - Optional data for the new page
 * @returns {number} The new Y position
 */
export const checkPageBreak = (doc, yPos, contentHeight, data = {}) => {
  const { PAGE_HEIGHT } = getPageConstants(doc);
  
  if (yPos + contentHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
    return addNewPage(doc, data);
  }
  
  return yPos;
};
