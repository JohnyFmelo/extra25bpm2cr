
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
