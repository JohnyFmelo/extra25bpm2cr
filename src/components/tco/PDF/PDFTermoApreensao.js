import jsPDF from "jspdf";
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addSignatureWithNameAndRole, checkPageBreak,
} from './pdfUtils.js';

// --- START: Potentially in pdfUtils.js or local ---
export function formatarDataHora(dataStrInput, horaStrInput, returnObject = false) {
    const dataStr = dataStrInput;
    const horaStr = horaStrInput;
    const dataISO = dataStr ? dataStr.split('/').reverse().join('-') : null;
    const hora = horaStr || "00:00";
    let dataHoraInstance;

    try {
        if (dataISO) {
            dataHoraInstance = new Date(`${dataISO}T${hora}:00`);
        } else {
            dataHoraInstance = new Date();
            if (horaStr) {
                 const [h, m] = hora.split(':').map(Number);
                 if (!isNaN(h) && !isNaN(m)) {
                    dataHoraInstance.setHours(h,m,0,0);
                 }
            }
        }
        if (isNaN(dataHoraInstance.getTime())) throw new Error("Invalid date");
    } catch (e) {
        dataHoraInstance = new Date();
    }

    const finalDate = `${dataHoraInstance.getDate().toString().padStart(2, '0')}/${(dataHoraInstance.getMonth() + 1).toString().padStart(2, '0')}/${dataHoraInstance.getFullYear()}`;
    const finalTime = `${dataHoraInstance.getHours().toString().padStart(2, '0')}:${dataHoraInstance.getMinutes().toString().padStart(2, '0')}`;

    if (returnObject) {
        return { date: finalDate, time: finalTime };
    }
    return `${finalDate} às ${finalTime}`;
}
// --- END: Potentially in pdfUtils.js or local ---

const numberToText = (num) => {
    const numbers = [
        "ZERO", "UMA", "DUAS", "TRÊS", "QUATRO",
        "CINCO", "SEIS", "SETE", "OITO", "NOVE", "DEZ"
    ];
    return num >= 0 && num <= 10 ? numbers[num].toUpperCase() : num.toString();
};

const DEFAULT_FONT_NAME = "helvetica";
const CELL_PADDING_X = 2;
// global cell vertical padding reduced for tighter rows
const CELL_PADDING_Y = 2; 
const LINE_HEIGHT_FACTOR = 1.1;
// Minimum row height reduced for tighter rows
const MIN_ROW_HEIGHT = 5; 

function getCellContentMetrics(doc, label, value, cellWidth, fontSize, valueFontStyle = "normal", isLabelBold = true) {
    const availableWidth = cellWidth - CELL_PADDING_X * 2;
    let labelHeight = 0, valueHeight = 0, calculatedHeight = 0;
    let labelLines = [], valueLines = [];
    let sideBySide = false;

    const fullLabel = label ? (label.endsWith(": ") ? label : label + ": ") : "";
    const valueString = String(value || "");

    if (fullLabel) {
        doc.setFont(DEFAULT_FONT_NAME, isLabelBold ? "bold" : valueFontStyle, isLabelBold ? "bold" : "normal");
        doc.setFontSize(fontSize);
        labelLines = doc.splitTextToSize(fullLabel, availableWidth);
        labelHeight = labelLines.length > 0 ? doc.getTextDimensions(labelLines, { fontSize, lineHeightFactor: LINE_HEIGHT_FACTOR }).h : 0;
    }

    doc.setFont(DEFAULT_FONT_NAME, valueFontStyle, "normal");
    doc.setFontSize(fontSize);

    let valueEffectiveMaxWidth = availableWidth;
    if (labelLines.length === 1 && fullLabel) {
        doc.setFont(DEFAULT_FONT_NAME, isLabelBold ? "bold" : valueFontStyle, isLabelBold ? "bold" : "normal");
        const labelTextWidth = doc.getTextWidth(labelLines[0]);
        const potentialValueWidth = availableWidth - labelTextWidth - (fullLabel && valueString ? 1 : 0); // 1 is approx for space character
        if (potentialValueWidth > doc.getTextWidth(" ") * 3) { // Check if there's meaningful space for value
             valueEffectiveMaxWidth = potentialValueWidth;
        }
    }
    
    valueLines = doc.splitTextToSize(valueString, valueEffectiveMaxWidth > 0 ? valueEffectiveMaxWidth : availableWidth);
    valueHeight = valueLines.length > 0 ? doc.getTextDimensions(valueLines, { fontSize, lineHeightFactor: LINE_HEIGHT_FACTOR }).h : 0;

    if (labelLines.length === 1 && valueLines.length === 1 && fullLabel && valueEffectiveMaxWidth === availableWidth - doc.getTextWidth(labelLines[0]) - (fullLabel && valueString ? 1:0) ) {
        doc.setFont(DEFAULT_FONT_NAME, isLabelBold ? "bold" : valueFontStyle, isLabelBold ? "bold" : "normal");
        const labelW = doc.getTextWidth(labelLines[0]);
        doc.setFont(DEFAULT_FONT_NAME, valueFontStyle, "normal");
        const valueW = doc.getTextWidth(valueLines[0]);

        if (labelW + (fullLabel && valueString ? 1 : 0) + valueW <= availableWidth) {
            calculatedHeight = Math.max(labelHeight, valueHeight);
            sideBySide = true;
        } else { // Not enough space side-by-side, stack them
            calculatedHeight = labelHeight + valueHeight;
            sideBySide = false;
            // Re-calculate valueLines with full width if they were constrained
            if (valueEffectiveMaxWidth < availableWidth) {
                 valueLines = doc.splitTextToSize(valueString, availableWidth);
                 valueHeight = valueLines.length > 0 ? doc.getTextDimensions(valueLines, { fontSize, lineHeightFactor: LINE_HEIGHT_FACTOR }).h : 0;
                 calculatedHeight = labelHeight + valueHeight;
            }
        }
    } else if (fullLabel) { // Label or value (or both) are multi-line or no label
        calculatedHeight = labelHeight + valueHeight;
        sideBySide = false;
        // If label was multiline, value was constrained, recalculate value height with full width
        if (labelLines.length > 1 && valueEffectiveMaxWidth < availableWidth) {
            valueLines = doc.splitTextToSize(valueString, availableWidth);
            valueHeight = valueLines.length > 0 ? doc.getTextDimensions(valueLines, { fontSize, lineHeightFactor: LINE_HEIGHT_FACTOR }).h : 0;
            calculatedHeight = labelHeight + valueHeight;
        }
    } else { // Only value, no label
        calculatedHeight = valueHeight;
        sideBySide = false;
    }
    
    return { height: calculatedHeight, labelLines, valueLines, labelHeight, valueHeight, sideBySide };
}

function renderCellText(doc, x, y, cellWidth, cellRowHeight, metrics, fontSize, valueFontStyle = "normal", isLabelBold = true, valueAlign = "left", cellVerticalAlign = "middle") {
    const { labelLines, valueLines, labelHeight, valueHeight, height: totalCalculatedTextHeight, sideBySide } = metrics;
    
    let textBlockStartY;
    const usableCellHeight = cellRowHeight - 2 * CELL_PADDING_Y;

    if (cellVerticalAlign === 'middle') {
        textBlockStartY = y + CELL_PADDING_Y + (usableCellHeight - totalCalculatedTextHeight) / 2 + 1; // +1 for slight downward shift
    } else { // 'top'
        textBlockStartY = y + CELL_PADDING_Y;
    }
    textBlockStartY = Math.max(y + CELL_PADDING_Y, textBlockStartY); // Ensure it doesn't go above cell top padding

    const textContentX = x + CELL_PADDING_X;
    const availableWidth = cellWidth - CELL_PADDING_X * 2;

    let currentDrawingY = textBlockStartY;

    if (labelLines.length > 0) {
        doc.setFont(DEFAULT_FONT_NAME, isLabelBold ? "bold" : valueFontStyle, isLabelBold ? "bold" : "normal");
        doc.setFontSize(fontSize);
        doc.text(labelLines, textContentX, currentDrawingY, { align: 'left', lineHeightFactor: LINE_HEIGHT_FACTOR });
        if (!sideBySide) {
            currentDrawingY += labelHeight;
        }
    }

    if (valueLines.length > 0) {
        doc.setFont(DEFAULT_FONT_NAME, valueFontStyle, "normal");
        doc.setFontSize(fontSize);
        
        let valueX = textContentX;
        let valueY = currentDrawingY;

        if (sideBySide && labelLines.length > 0) {
            doc.setFont(DEFAULT_FONT_NAME, isLabelBold ? "bold" : valueFontStyle, isLabelBold ? "bold" : "normal"); // Reset font for getTextWidth
            valueX = textContentX + doc.getTextWidth(labelLines[0]) + (labelLines.length > 0 && valueLines.length > 0 ? 1 : 0); // Approx 1 for space
            valueY = textBlockStartY; // Align with label start Y if side-by-side
        }
        
        doc.text(valueLines, valueX, valueY, { 
            align: valueAlign, 
            lineHeightFactor: LINE_HEIGHT_FACTOR, 
            maxWidth: sideBySide ? availableWidth - (valueX - textContentX) : availableWidth 
        });
    }
}

export function addTermoApreensao(doc, data) {
    console.log("[PDFTermoApreensao] Iniciando renderização do Termo de Apreensão");

    let currentY = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    const autor = data.autores?.[0];
    const isDroga = data.natureza && data.natureza.toLowerCase() === "porte de drogas para consumo";
    const lacreNumero = data.lacreNumero || "00000000";

    const TABLE_CONTENT_FONT_SIZE = 10;

    const colWidth = MAX_LINE_WIDTH / 3;
    const xCol1 = MARGIN_LEFT;
    const xCol2 = MARGIN_LEFT + colWidth;
    const xCol3 = MARGIN_LEFT + 2 * colWidth;
    const lastColWidth = MAX_LINE_WIDTH - (2 * colWidth);

    const titulo = isDroga ? `TERMO DE APREENSÃO LACRE Nº ${lacreNumero}` : "TERMO DE APREENSÃO";
    doc.setFont(DEFAULT_FONT_NAME, "bold"); doc.setFontSize(12);
    currentY = checkPageBreak(doc, currentY, 15, data); // Height for title + initial spacing
    doc.text(titulo.toUpperCase(), PAGE_WIDTH / 2, currentY, { align: "center" });
    currentY += 8; // Spacing after title

    const cellOptionsBase = { fontSize: TABLE_CONTENT_FONT_SIZE, cellVerticalAlign: 'middle' };
    const firstRowsCellVerticalAlign = 'top'; // For first 5 rows to be tighter to top border

    let rowY = currentY;
    const dataHoraObj = formatarDataHora(data.dataTerminoRegistro || data.dataFato, data.horaTerminoRegistro || data.horaFato, true);
    const m11 = getCellContentMetrics(doc, "DATA", dataHoraObj.date, colWidth, TABLE_CONTENT_FONT_SIZE);
    const m12 = getCellContentMetrics(doc, "HORA", dataHoraObj.time, colWidth, TABLE_CONTENT_FONT_SIZE);
    const m13 = getCellContentMetrics(doc, "LOCAL", "25º BPM", lastColWidth, TABLE_CONTENT_FONT_SIZE);
    const r1H = Math.max(MIN_ROW_HEIGHT, m11.height, m12.height, m13.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r1H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(xCol1, rowY, colWidth, r1H); renderCellText(doc, xCol1, rowY, colWidth, r1H, m11, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", firstRowsCellVerticalAlign);
    doc.rect(xCol2, rowY, colWidth, r1H); renderCellText(doc, xCol2, rowY, colWidth, r1H, m12, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", firstRowsCellVerticalAlign);
    doc.rect(xCol3, rowY, lastColWidth, r1H); renderCellText(doc, xCol3, rowY, lastColWidth, r1H, m13, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", firstRowsCellVerticalAlign);
    currentY = rowY + r1H;

    rowY = currentY;
    const nomePolicial = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim().toUpperCase();
    const m21 = getCellContentMetrics(doc, "NOME DO POLICIAL", nomePolicial, MAX_LINE_WIDTH, TABLE_CONTENT_FONT_SIZE);
    const r2H = Math.max(MIN_ROW_HEIGHT, m21.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r2H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r2H); renderCellText(doc, MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r2H, m21, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", firstRowsCellVerticalAlign);
    currentY = rowY + r2H;

    rowY = currentY;
    const m31 = getCellContentMetrics(doc, "FILIAÇÃO PAI", (condutor?.pai || "").toUpperCase(), MAX_LINE_WIDTH, TABLE_CONTENT_FONT_SIZE);
    const r3H = Math.max(MIN_ROW_HEIGHT, m31.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r3H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r3H); renderCellText(doc, MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r3H, m31, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", firstRowsCellVerticalAlign);
    currentY = rowY + r3H;
    
    rowY = currentY;
    const m41 = getCellContentMetrics(doc, "FILIAÇÃO MÃE", (condutor?.mae || "").toUpperCase(), MAX_LINE_WIDTH, TABLE_CONTENT_FONT_SIZE);
    const r4H = Math.max(MIN_ROW_HEIGHT, m41.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r4H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r4H); renderCellText(doc, MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r4H, m41, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", firstRowsCellVerticalAlign);
    currentY = rowY + r4H;

    rowY = currentY;
    const m51 = getCellContentMetrics(doc, "NATURALIDADE", (condutor?.naturalidade || "").toUpperCase(), colWidth, TABLE_CONTENT_FONT_SIZE);
    const m52 = getCellContentMetrics(doc, "RGPM", condutor?.rg || "", colWidth, TABLE_CONTENT_FONT_SIZE);
    const m53 = getCellContentMetrics(doc, "CPF", condutor?.cpf || "", lastColWidth, TABLE_CONTENT_FONT_SIZE);
    const r5H = Math.max(MIN_ROW_HEIGHT, m51.height, m52.height, m53.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r5H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(xCol1, rowY, colWidth, r5H); renderCellText(doc, xCol1, rowY, colWidth, r5H, m51, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", firstRowsCellVerticalAlign);
    doc.rect(xCol2, rowY, colWidth, r5H); renderCellText(doc, xCol2, rowY, colWidth, r5H, m52, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", firstRowsCellVerticalAlign);
    doc.rect(xCol3, rowY, lastColWidth, r5H); renderCellText(doc, xCol3, rowY, lastColWidth, r5H, m53, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", firstRowsCellVerticalAlign);
    currentY = rowY + r5H;
    
    // For subsequent rows, use middle alignment as default unless specified otherwise
    rowY = currentY;
    const enderecoValue = "AV. DR. PARANÁ, S/N° COMPLEXO DA UNIVAG, AO LADO DO NÚCLEO DE PRÁTICA JURÍDICA. BAIRRO CRISTO REI CEP 78.110-100, VG - MT".toUpperCase();
    const m61 = getCellContentMetrics(doc, "END.", enderecoValue, MAX_LINE_WIDTH, TABLE_CONTENT_FONT_SIZE);
    const r6H = Math.max(MIN_ROW_HEIGHT, m61.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r6H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r6H); renderCellText(doc, MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r6H, m61, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    currentY = rowY + r6H;

    rowY = currentY;
    const m71 = getCellContentMetrics(doc, "MUNICÍPIO", "VÁRZEA GRANDE", colWidth, TABLE_CONTENT_FONT_SIZE);
    const m72 = getCellContentMetrics(doc, "UF", "MT", colWidth, TABLE_CONTENT_FONT_SIZE);
    const m73 = getCellContentMetrics(doc, "TEL", condutor?.telefone || "", lastColWidth, TABLE_CONTENT_FONT_SIZE);
    const r7H = Math.max(MIN_ROW_HEIGHT, m71.height, m72.height, m73.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r7H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(xCol1, rowY, colWidth, r7H); renderCellText(doc, xCol1, rowY, colWidth, r7H, m71, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    doc.rect(xCol2, rowY, colWidth, r7H); renderCellText(doc, xCol2, rowY, colWidth, r7H, m72, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    doc.rect(xCol3, rowY, lastColWidth, r7H); renderCellText(doc, xCol3, rowY, lastColWidth, r7H, m73, TABLE_CONTENT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    currentY = rowY + r7H;

    rowY = currentY;
    let textoApreensaoOriginal = (data.apreensoes || "Nenhum objeto/documento descrito para apreensão.").toUpperCase();
    if (isDroga) {
        const quantidadeStr = String(data.drogaQuantidade || "01 (UMA)");
        const quantidadeNumMatch = quantidadeStr.match(/\d+/);
        const quantidadeNum = parseInt(quantidadeNumMatch ? quantidadeNumMatch[0] : "1", 10);
        const quantidadeText = numberToText(quantidadeNum);
        const plural = quantidadeNum > 1 ? "PORÇÕES" : "PORÇÃO";
        textoApreensaoOriginal = data.drogaIsUnknown
            ? `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA DE MATERIAL DESCONHECIDO, ${data.drogaCustomDesc || "DESCRIÇÃO"}, CONFORME FOTO EM ANEXO.`
            : `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA ANÁLOGA A ${data.drogaNomeComum.toUpperCase()}, ${data.drogaCustomDesc || "DESCRIÇÃO"}, CONFORME FOTO EM ANEXO.`;
    }
    
    const apreensaoFontSize = TABLE_CONTENT_FONT_SIZE;
    const apreensaoTextX = MARGIN_LEFT + CELL_PADDING_X;
    const apreensaoMaxWidth = MAX_LINE_WIDTH - CELL_PADDING_X * 2;
    let totalCalculatedTextHeightForDesc = 0;

    const combinedText = `FICA APREENDIDO O DESCRITO ABAIXO:\n- ${textoApreensaoOriginal}`;
    doc.setFont(DEFAULT_FONT_NAME, "normal"); doc.setFontSize(apreensaoFontSize);
    const combinedLines = doc.splitTextToSize(combinedText, apreensaoMaxWidth);
    totalCalculatedTextHeightForDesc = doc.getTextDimensions(combinedLines, { fontSize: apreensaoFontSize, lineHeightFactor: LINE_HEIGHT_FACTOR }).h;

    // Ensure this row has enough height for at least two lines visually, even if text is shorter
    const r9H = Math.max(MIN_ROW_HEIGHT + (doc.getTextDimensions(" ", {fontSize: apreensaoFontSize}).h * LINE_HEIGHT_FACTOR), totalCalculatedTextHeightForDesc) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r9H, data); 
    if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r9H);
    
    // Calculate vertical centering for this specific block
    const usableDescCellHeight = r9H - 2 * CELL_PADDING_Y;
    let textBlockStartYForDesc = rowY + CELL_PADDING_Y + (usableDescCellHeight - totalCalculatedTextHeightForDesc) / 2 + 1; // +1 for slight downward shift
    textBlockStartYForDesc = Math.max(rowY + CELL_PADDING_Y, textBlockStartYForDesc); // Ensure not above padding

    doc.text(combinedLines, apreensaoTextX, textBlockStartYForDesc, { align: 'left', lineHeightFactor: LINE_HEIGHT_FACTOR });
    currentY = rowY + r9H;

    rowY = currentY;
    const textoLegal = "O PRESENTE TERMO DE APREENSÃO FOI LAVRADO COM BASE NO ART. 6º, II, DO CÓDIGO DE PROCESSO PENAL, E ART. 92 DA LEI 9.999/1995.".toUpperCase();
    // Metrics for text that is effectively only a 'value' (no 'label' part)
    const m10_1 = getCellContentMetrics(doc, null, textoLegal, MAX_LINE_WIDTH, TABLE_CONTENT_FONT_SIZE);
    const r10H = Math.max(MIN_ROW_HEIGHT, m10_1.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r10H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r10H); 
    renderCellText(doc, MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r10H, m10_1, TABLE_CONTENT_FONT_SIZE, "normal", false, "left", cellOptionsBase.cellVerticalAlign);
    currentY = rowY + r10H;

    currentY += 5; // Reduced spacing before signatures
    doc.setFont(DEFAULT_FONT_NAME, "normal");
    doc.setFontSize(10);
    const autorLabel = autor?.sexo === "Feminino" ? "AUTORA DOS FATOS" : "AUTOR DOS FATOS";
    currentY = addSignatureWithNameAndRole(doc, currentY, (autor?.nome || "").toUpperCase(), autorLabel.toUpperCase(), data);
    const nomeCondutorCompleto = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim().toUpperCase();
    currentY = addSignatureWithNameAndRole(doc, currentY, nomeCondutorCompleto, "CONDUTOR DA OCORRÊNCIA".toUpperCase(), data);

    console.log("[PDFTermoApreensao] Termo de Apreensão finalizado, currentY:", currentY);
    return currentY;
}
