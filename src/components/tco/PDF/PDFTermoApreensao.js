import jsPDF from "jspdf"; // Assuming you might need this for type hinting or direct use elsewhere
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addSignatureWithNameAndRole, checkPageBreak,
    // formatarDataHora, // Ensure this is correctly imported from your utils
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
            dataHoraInstance = new Date(); // Fallback to now
            if (horaStr) { // If dataStr is null, but horaStr is provided
                 const [h, m] = hora.split(':').map(Number);
                 if (!isNaN(h) && !isNaN(m)) {
                    dataHoraInstance.setHours(h,m,0,0);
                 }
            }
        }
        if (isNaN(dataHoraInstance.getTime())) throw new Error("Invalid date");
    } catch (e) {
        dataHoraInstance = new Date(); // Ultimate fallback
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

// --- Layout Constants ---
const CELL_PADDING_X = 2;
const CELL_PADDING_Y = 2; // Increased for better vertical spacing
const LINE_HEIGHT_FACTOR = 1.15; // jsPDF's default is often around 1.15
const MIN_ROW_HEIGHT = 7; // Minimum height for any row in mm

/**
 * Calculates content metrics for a cell.
 * @returns {object} { height, labelLines, valueLines, labelHeight, valueHeight, sideBySide }
 */
function getCellContentMetrics(doc, label, value, cellWidth, fontSize, valueFontStyle = "normal", isLabelBold = true) {
    const availableWidth = cellWidth - CELL_PADDING_X * 2;
    let labelHeight = 0, valueHeight = 0, calculatedHeight = 0;
    let labelLines = [], valueLines = [];
    let sideBySide = false;

    const fullLabel = label ? (label.endsWith(": ") ? label : label + ": ") : "";
    const valueString = String(value || ""); // Ensure value is a string

    if (fullLabel) {
        doc.setFont("helvetica", isLabelBold ? "bold" : valueFontStyle, isLabelBold ? "bold" : "normal");
        doc.setFontSize(fontSize);
        labelLines = doc.splitTextToSize(fullLabel, availableWidth);
        labelHeight = labelLines.length > 0 ? doc.getTextDimensions(labelLines, { fontSize, lineHeightFactor: LINE_HEIGHT_FACTOR }).h : 0;
    }

    doc.setFont("helvetica", valueFontStyle, "normal");
    doc.setFontSize(fontSize);

    let valueEffectiveMaxWidth = availableWidth;
    if (labelLines.length === 1 && fullLabel) { // If label is single line, try to fit value next to it
        doc.setFont("helvetica", isLabelBold ? "bold" : valueFontStyle, isLabelBold ? "bold" : "normal");
        const labelTextWidth = doc.getTextWidth(labelLines[0]);
        const potentialValueWidth = availableWidth - labelTextWidth - (fullLabel && valueString ? 1 : 0); // 1mm gap
        if (potentialValueWidth > doc.getTextWidth(" ") * 3) { // Only if there's meaningful space for value
             valueEffectiveMaxWidth = potentialValueWidth;
        }
    }
    
    valueLines = doc.splitTextToSize(valueString, valueEffectiveMaxWidth > 0 ? valueEffectiveMaxWidth : availableWidth);
    valueHeight = valueLines.length > 0 ? doc.getTextDimensions(valueLines, { fontSize, lineHeightFactor: LINE_HEIGHT_FACTOR }).h : 0;

    // Determine layout and total height
    if (labelLines.length === 1 && valueLines.length === 1 && fullLabel && valueEffectiveMaxWidth === availableWidth - doc.getTextWidth(labelLines[0]) - (fullLabel && valueString ? 1:0) ) {
         // They were calculated to fit side-by-side potentially
        doc.setFont("helvetica", isLabelBold ? "bold" : valueFontStyle, isLabelBold ? "bold" : "normal");
        const labelW = doc.getTextWidth(labelLines[0]);
        doc.setFont("helvetica", valueFontStyle, "normal");
        const valueW = doc.getTextWidth(valueLines[0]);

        if (labelW + (fullLabel && valueString ? 1 : 0) + valueW <= availableWidth) {
            calculatedHeight = Math.max(labelHeight, valueHeight);
            sideBySide = true;
        } else { // Didn't fit side-by-side, so they stack
            calculatedHeight = labelHeight + valueHeight;
            sideBySide = false;
            // Recalculate valueLines with full width if it was constrained and now needs to stack
            if (valueEffectiveMaxWidth < availableWidth) {
                 valueLines = doc.splitTextToSize(valueString, availableWidth);
                 valueHeight = valueLines.length > 0 ? doc.getTextDimensions(valueLines, { fontSize, lineHeightFactor: LINE_HEIGHT_FACTOR }).h : 0;
                 calculatedHeight = labelHeight + valueHeight;
            }
        }
    } else if (fullLabel) { // Label exists, and one or both wrap, or value didn't fit beside
        calculatedHeight = labelHeight + valueHeight;
        sideBySide = false;
         // Ensure valueLines are based on full width if they are to be stacked below a multi-line label
        if (labelLines.length > 1 && valueEffectiveMaxWidth < availableWidth) {
            valueLines = doc.splitTextToSize(valueString, availableWidth);
            valueHeight = valueLines.length > 0 ? doc.getTextDimensions(valueLines, { fontSize, lineHeightFactor: LINE_HEIGHT_FACTOR }).h : 0;
            calculatedHeight = labelHeight + valueHeight;
        }

    } else { // Only value
        calculatedHeight = valueHeight;
        sideBySide = false; // No label to be side-by-side with
    }
    
    return { height: calculatedHeight, labelLines, valueLines, labelHeight, valueHeight, sideBySide };
}

/**
 * Renders text within a cell. Assumes rect is already drawn.
 */
function renderCellText(doc, x, y, cellWidth, cellRowHeight, metrics, fontSize, valueFontStyle = "normal", isLabelBold = true, valueAlign = "left", cellVerticalAlign = "top") {
    const { labelLines, valueLines, labelHeight, valueHeight, height: totalCalculatedTextHeight, sideBySide } = metrics;
    
    let currentTextY; // This will be the Y for the top of the text block
    if (cellVerticalAlign === 'middle') {
        currentTextY = y + (cellRowHeight - totalCalculatedTextHeight) / 2;
    } else { // 'top'
        currentTextY = y + CELL_PADDING_Y;
    }
    currentTextY = Math.max(y + CELL_PADDING_Y, currentTextY); // Ensure at least top padding

    const textContentX = x + CELL_PADDING_X;
    const availableWidth = cellWidth - CELL_PADDING_X * 2;

    let yOffset = currentTextY;

    if (labelLines.length > 0) {
        doc.setFont("helvetica", isLabelBold ? "bold" : valueFontStyle, isLabelBold ? "bold" : "normal");
        doc.setFontSize(fontSize);
        doc.text(labelLines, textContentX, yOffset, { align: 'left', lineHeightFactor: LINE_HEIGHT_FACTOR });
        if (!sideBySide) {
            yOffset += labelHeight;
        }
    }

    if (valueLines.length > 0) {
        doc.setFont("helvetica", valueFontStyle, "normal");
        doc.setFontSize(fontSize);
        
        let valueX = textContentX;
        if (sideBySide && labelLines.length > 0) {
            doc.setFont("helvetica", isLabelBold ? "bold" : valueFontStyle, isLabelBold ? "bold" : "normal");
            valueX = textContentX + doc.getTextWidth(labelLines[0]) + (labelLines.length > 0 && valueLines.length > 0 ? 1 : 0) ; // 1mm gap
        }
        
        doc.text(valueLines, valueX, yOffset, { 
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

    const TABLE_TEXT_FONT_SIZE = 9; // Slightly reduced for better fit
    const TABLE_LEGAL_FONT_SIZE = 8;

    const colWidth = MAX_LINE_WIDTH / 3;
    const xCol1 = MARGIN_LEFT;
    const xCol2 = MARGIN_LEFT + colWidth;
    const xCol3 = MARGIN_LEFT + 2 * colWidth;
    const lastColWidth = MAX_LINE_WIDTH - (2 * colWidth);

    // Título
    const titulo = isDroga ? `TERMO DE APREENSÃO LACRE Nº ${lacreNumero}` : "TERMO DE APREENSÃO";
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    currentY = checkPageBreak(doc, currentY, 15, data);
    doc.text(titulo.toUpperCase(), PAGE_WIDTH / 2, currentY, { align: "center" });
    currentY += 10;

    const cellOptionsBase = { fontSize: TABLE_TEXT_FONT_SIZE, cellVerticalAlign: 'middle' };

    // --- ROW 1: DATA, HORA, LOCAL ---
    let rowY = currentY;
    const dataHoraObj = formatarDataHora(data.dataTerminoRegistro || data.dataFato, data.horaTerminoRegistro || data.horaFato, true);
    const m11 = getCellContentMetrics(doc, "DATA", dataHoraObj.date, colWidth, TABLE_TEXT_FONT_SIZE);
    const m12 = getCellContentMetrics(doc, "HORA", dataHoraObj.time, colWidth, TABLE_TEXT_FONT_SIZE);
    const m13 = getCellContentMetrics(doc, "LOCAL", "25º BPM", lastColWidth, TABLE_TEXT_FONT_SIZE);
    const r1H = Math.max(MIN_ROW_HEIGHT, m11.height, m12.height, m13.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r1H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(xCol1, rowY, colWidth, r1H); renderCellText(doc, xCol1, rowY, colWidth, r1H, m11, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    doc.rect(xCol2, rowY, colWidth, r1H); renderCellText(doc, xCol2, rowY, colWidth, r1H, m12, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    doc.rect(xCol3, rowY, lastColWidth, r1H); renderCellText(doc, xCol3, rowY, lastColWidth, r1H, m13, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    currentY = rowY + r1H;

    // --- ROW 2: NOME DO POLICIAL ---
    rowY = currentY;
    const nomePolicial = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim().toUpperCase();
    const m21 = getCellContentMetrics(doc, "NOME DO POLICIAL", `[${nomePolicial}]`, MAX_LINE_WIDTH, TABLE_TEXT_FONT_SIZE);
    const r2H = Math.max(MIN_ROW_HEIGHT, m21.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r2H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r2H); renderCellText(doc, MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r2H, m21, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    currentY = rowY + r2H;

    // --- ROW 3: FILIAÇÃO PAI ---
    rowY = currentY;
    const m31 = getCellContentMetrics(doc, "FILIAÇÃO PAI", (condutor?.pai || "").toUpperCase(), MAX_LINE_WIDTH, TABLE_TEXT_FONT_SIZE); // Label + Value in one cell for simplicity of example image
    const r3H = Math.max(MIN_ROW_HEIGHT, m31.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r3H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r3H); renderCellText(doc, MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r3H, m31, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    currentY = rowY + r3H;
    
    // --- ROW 4: FILIAÇÃO MÃE ---
    rowY = currentY;
    const m41 = getCellContentMetrics(doc, "FILIAÇÃO MÃE", (condutor?.mae || "").toUpperCase(), MAX_LINE_WIDTH, TABLE_TEXT_FONT_SIZE);
    const r4H = Math.max(MIN_ROW_HEIGHT, m41.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r4H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r4H); renderCellText(doc, MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r4H, m41, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    currentY = rowY + r4H;

    // --- ROW 5: NATURALIDADE, RGPM, CPF ---
    rowY = currentY;
    const m51 = getCellContentMetrics(doc, "NATURALIDADE", (condutor?.naturalidade || "").toUpperCase(), colWidth, TABLE_TEXT_FONT_SIZE);
    const m52 = getCellContentMetrics(doc, "RGPM", condutor?.rg || "", colWidth, TABLE_TEXT_FONT_SIZE);
    const m53 = getCellContentMetrics(doc, "CPF", condutor?.cpf || "", lastColWidth, TABLE_TEXT_FONT_SIZE);
    const r5H = Math.max(MIN_ROW_HEIGHT, m51.height, m52.height, m53.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r5H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(xCol1, rowY, colWidth, r5H); renderCellText(doc, xCol1, rowY, colWidth, r5H, m51, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    doc.rect(xCol2, rowY, colWidth, r5H); renderCellText(doc, xCol2, rowY, colWidth, r5H, m52, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    doc.rect(xCol3, rowY, lastColWidth, r5H); renderCellText(doc, xCol3, rowY, lastColWidth, r5H, m53, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    currentY = rowY + r5H;
    
    // --- ROW 6: END. ---
    rowY = currentY;
    const enderecoValue = "AV. DR. PARANÁ, S/N° COMPLEXO DA UNIVAG, AO LADO DO NÚCLEO DE PRÁTICA JURÍDICA. BAIRRO CRISTO REI CEP 78.110-100, VÁRZEA GRANDE - MT".toUpperCase();
    const m61 = getCellContentMetrics(doc, "END.", enderecoValue, MAX_LINE_WIDTH, TABLE_TEXT_FONT_SIZE);
    const r6H = Math.max(MIN_ROW_HEIGHT, m61.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r6H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r6H); renderCellText(doc, MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r6H, m61, TABLE_TEXT_FONT_SIZE, "normal", true, "left", 'top'); // Top align long address
    currentY = rowY + r6H;

    // --- ROW 7: MUNICÍPIO, UF, TEL ---
    rowY = currentY;
    const m71 = getCellContentMetrics(doc, "MUNICÍPIO", "VÁRZEA GRANDE", colWidth, TABLE_TEXT_FONT_SIZE);
    const m72 = getCellContentMetrics(doc, "UF", "MT", colWidth, TABLE_TEXT_FONT_SIZE);
    const m73 = getCellContentMetrics(doc, "TEL", condutor?.telefone || "", lastColWidth, TABLE_TEXT_FONT_SIZE);
    const r7H = Math.max(MIN_ROW_HEIGHT, m71.height, m72.height, m73.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r7H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(xCol1, rowY, colWidth, r7H); renderCellText(doc, xCol1, rowY, colWidth, r7H, m71, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    doc.rect(xCol2, rowY, colWidth, r7H); renderCellText(doc, xCol2, rowY, colWidth, r7H, m72, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    doc.rect(xCol3, rowY, lastColWidth, r7H); renderCellText(doc, xCol3, rowY, lastColWidth, r7H, m73, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    currentY = rowY + r7H;

    // --- ROW 8: FICA APREENDIDO O DESCRITO ABAIXO: ---
    rowY = currentY;
    const m81 = getCellContentMetrics(doc, "FICA APREENDIDO O DESCRITO ABAIXO:", "", MAX_LINE_WIDTH, TABLE_TEXT_FONT_SIZE, "normal", true);
    const r8H = Math.max(MIN_ROW_HEIGHT, m81.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r8H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r8H); renderCellText(doc, MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r8H, m81, TABLE_TEXT_FONT_SIZE, "normal", true, "left", cellOptionsBase.cellVerticalAlign);
    currentY = rowY + r8H;

    // --- ROW 9: DESCRIÇÃO DA APREENSÃO ---
    rowY = currentY;
    let apreensaoCombinedText = "";
    if (isDroga) {
        apreensaoCombinedText += "CONSTAÇÃO PRELIMINAR DE DROGA\n".toUpperCase(); // Treat as separate lines
    }
    let textoApreensao = (data.apreensoes || "Nenhum objeto/documento descrito para apreensão.").toUpperCase();
    if (isDroga) {
        const quantidadeStr = String(data.drogaQuantidade || "01 (UMA)");
        const quantidadeNumMatch = quantidadeStr.match(/\d+/);
        const quantidadeNum = parseInt(quantidadeNumMatch ? quantidadeNumMatch[0] : "1", 10);
        const quantidadeText = numberToText(quantidadeNum);
        const plural = quantidadeNum > 1 ? "PORÇÕES" : "PORÇÃO";
        textoApreensao = data.drogaIsUnknown
            ? `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA DE MATERIAL DESCONHECIDO, ${(data.drogaCustomDesc || "[DESCRIÇÃO]").toUpperCase()}, CONFORME FOTO EM ANEXO.`
            : `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA ANÁLOGA A ${data.drogaNomeComum.toUpperCase()}, ${(data.drogaCustomDesc || "[DESCRIÇÃO]").toUpperCase()}, CONFORME FOTO EM ANEXO.`;
    }
    apreensaoCombinedText += `- ${textoApreensao}`;
    
    // For this complex cell, we directly use splitTextToSize and text rendering
    const apreensaoFontSize = TABLE_TEXT_FONT_SIZE;
    let apreensaoActualY = rowY + CELL_PADDING_Y;
    const apreensaoTextX = MARGIN_LEFT + CELL_PADDING_X;
    const apreensaoMaxWidth = MAX_LINE_WIDTH - CELL_PADDING_X * 2;
    let totalDescHeight = 0;

    if (isDroga) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(apreensaoFontSize);
        const constatacaoLines = doc.splitTextToSize("CONSTAÇÃO PRELIMINAR DE DROGA".toUpperCase(), apreensaoMaxWidth);
        totalDescHeight += doc.getTextDimensions(constatacaoLines, {fontSize: apreensaoFontSize, lineHeightFactor: LINE_HEIGHT_FACTOR}).h + 2; // 2mm spacing
    }
    doc.setFont("helvetica", "normal"); doc.setFontSize(apreensaoFontSize);
    const apreensaoDescLines = doc.splitTextToSize(`- ${textoApreensao}`, apreensaoMaxWidth);
    totalDescHeight += doc.getTextDimensions(apreensaoDescLines, {fontSize: apreensaoFontSize, lineHeightFactor: LINE_HEIGHT_FACTOR}).h;
    
    const r9H = Math.max(MIN_ROW_HEIGHT * 2.5, totalDescHeight) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r9H, data); if (currentY !== rowY) {rowY = currentY; apreensaoActualY = rowY + CELL_PADDING_Y;}
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r9H);
    
    if (isDroga) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(apreensaoFontSize);
        const constatacaoLines = doc.splitTextToSize("CONSTAÇÃO PRELIMINAR DE DROGA".toUpperCase(), apreensaoMaxWidth);
        doc.text(constatacaoLines, apreensaoTextX, apreensaoActualY, {align: 'left', lineHeightFactor: LINE_HEIGHT_FACTOR});
        apreensaoActualY += doc.getTextDimensions(constatacaoLines, {fontSize: apreensaoFontSize, lineHeightFactor: LINE_HEIGHT_FACTOR}).h + 2;
    }
    doc.setFont("helvetica", "normal"); doc.setFontSize(apreensaoFontSize);
    doc.text(apreensaoDescLines, apreensaoTextX, apreensaoActualY, {align: 'justify', lineHeightFactor: LINE_HEIGHT_FACTOR});
    currentY = rowY + r9H;

    // --- ROW 10: TERMO LEGAL ---
    rowY = currentY;
    const textoLegal = "O PRESENTE TERMO DE APREENSÃO FOI LAVRADO COM BASE NO ART. 6º, II, DO CÓDIGO DE PROCESSO PENAL, E ART. 92 DA LEI 9.099/1995.".toUpperCase();
    const m10_1 = getCellContentMetrics(doc, null, textoLegal, MAX_LINE_WIDTH, TABLE_LEGAL_FONT_SIZE); // No label
    const r10H = Math.max(MIN_ROW_HEIGHT, m10_1.height) + CELL_PADDING_Y * 2;
    currentY = checkPageBreak(doc, rowY, r10H, data); if (currentY !== rowY) rowY = currentY;
    doc.rect(MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r10H); renderCellText(doc, MARGIN_LEFT, rowY, MAX_LINE_WIDTH, r10H, m10_1, TABLE_LEGAL_FONT_SIZE, "normal", false, "justify", 'top');
    currentY = rowY + r10H;

    // --- SIGNATURES ---
    currentY += 10; 
    const autorLabel = autor?.sexo === "Feminino" ? "AUTORA DOS FATOS" : "AUTOR DOS FATOS";
    currentY = addSignatureWithNameAndRole(doc, currentY, (autor?.nome || "").toUpperCase(), autorLabel.toUpperCase(), data);
    const nomeCondutorCompleto = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim().toUpperCase();
    currentY = addSignatureWithNameAndRole(doc, currentY, nomeCondutorCompleto, "CONDUTOR DA OCORRÊNCIA".toUpperCase(), data);

    console.log("[PDFTermoApreensao] Termo de Apreensão finalizado, currentY:", currentY);
    return currentY;
}
