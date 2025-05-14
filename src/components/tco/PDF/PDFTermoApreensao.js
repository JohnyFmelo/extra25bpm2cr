import jsPDF from "jspdf"; // Assuming you might need this for type hinting or direct use elsewhere
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addSignatureWithNameAndRole, checkPageBreak,
    // formatarDataHora, // Ensure this is correctly imported from your utils
    // addWrappedText // If used, ensure it can work in a 'noPageBreak' mode or calculate height
} from './pdfUtils.js';

// --- START: Potentially in pdfUtils.js or local ---
// Helper to format date and time, with an option to return an object
export function formatarDataHora(dataStrInput, horaStrInput, returnObject = false) {
    const dataStr = dataStrInput;
    const horaStr = horaStrInput;

    const dataISO = dataStr ? dataStr.split('/').reverse().join('-') : null;
    const hora = horaStr || "00:00";

    let dataHoraInstance;
    if (dataISO) {
        // Append a default timezone offset if not present to help Safari/some browsers
        const timeZoneOffset = new Date().getTimezoneOffset();
        const offsetHours = String(Math.floor(Math.abs(timeZoneOffset) / 60)).padStart(2, '0');
        const offsetMinutes = String(Math.abs(timeZoneOffset) % 60).padStart(2, '0');
        const offsetSign = timeZoneOffset <= 0 ? '+' : '-';
        // Using a common offset like -03:00 for Brazil if no specific timezone logic is in place
        // For robust timezone handling, a library like date-fns-tz is recommended.
        // For now, let's assume local time interpretation of the ISO string.
        dataHoraInstance = new Date(`${dataISO}T${hora}:00`);
    } else {
        dataHoraInstance = new Date();
        if (horaStr) { // If dataStr is null, but horaStr is provided
            const today = new Date();
            dataHoraInstance = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hora.split(':')[0]), parseInt(hora.split(':')[1]));
        }
    }

    if (isNaN(dataHoraInstance.getTime())) {
        const fallbackDate = new Date();
        const formattedDate = fallbackDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedTime = fallbackDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (returnObject) return { date: formattedDate, time: formattedTime };
        return `${formattedDate} às ${formattedTime}`;
    }

    const finalDate = `${dataHoraInstance.getDate().toString().padStart(2, '0')}/${(dataHoraInstance.getMonth() + 1).toString().padStart(2, '0')}/${dataHoraInstance.getFullYear()}`;
    const finalTime = `${dataHoraInstance.getHours().toString().padStart(2, '0')}:${dataHoraInstance.getMinutes().toString().padStart(2, '0')}`;

    if (returnObject) {
        return { date: finalDate, time: finalTime };
    }
    return `${finalDate} às ${finalTime}`;
}

// Simple wrapped text placer for internal use (doesn't handle page breaks)
// Returns the Y position after the text
function placeWrappedTextInCell(doc, text, x, y, maxWidth, fontSize, fontStyle, align, lineHeightFactor) {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y, { align: align, lineHeightFactor: lineHeightFactor });
    const { h: textHeight } = doc.getTextDimensions(lines, { fontSize: fontSize, lineHeightFactor: lineHeightFactor });
    return y + textHeight;
}
// --- END: Potentially in pdfUtils.js or local ---


// Função para converter números até 10 em texto
const numberToText = (num) => {
    const numbers = [
        "ZERO", "UMA", "DUAS", "TRÊS", "QUATRO",
        "CINCO", "SEIS", "SETE", "OITO", "NOVE", "DEZ"
    ];
    return num >= 0 && num <= 10 ? numbers[num].toUpperCase() : num.toString(); // Ensure uppercase
};

/** Adiciona Termo de Apreensão (em página nova) */
export function addTermoApreensao(doc, data) {
    console.log("[PDFTermoApreensao] Iniciando renderização do Termo de Apreensão");

    let yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    const autor = data.autores?.[0];
    const isDroga = data.natureza && data.natureza.toLowerCase() === "porte de drogas para consumo";
    const lacreNumero = data.lacreNumero || "00000000";

    const TABLE_TEXT_FONT_SIZE = 9.5; // Adjusted for fitting more text if needed
    const TABLE_LEGAL_FONT_SIZE = 8;
    const ROW_HEIGHT = 7; // Default row height in mm
    const CELL_PADDING_X = 2; // Horizontal padding inside cell
    const CELL_PADDING_Y = 1; // Vertical padding for multi-line text from top/bottom of cell
    const LINE_HEIGHT_FACTOR = 1.15;

    const colWidth = MAX_LINE_WIDTH / 3;
    const xCol1 = MARGIN_LEFT;
    const xCol2 = MARGIN_LEFT + colWidth;
    const xCol3 = MARGIN_LEFT + 2 * colWidth;
    const lastColWidth = MAX_LINE_WIDTH - (2 * colWidth); // Ensure it sums to MAX_LINE_WIDTH

    // Título com lacre para droga
    const titulo = isDroga ? `TERMO DE APREENSÃO LACRE Nº ${lacreNumero}` : "TERMO DE APREENSÃO";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text(titulo.toUpperCase(), PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    let currentY = yPos;
    doc.setFontSize(TABLE_TEXT_FONT_SIZE);

    // Helper to add label and value
    function addCellContent(x, y, w, h, label, value = "", isLabelBold = true, valueMaxWidthReduction = 0) {
        const textY = y + h / 2;
        doc.setFont("helvetica", isLabelBold ? "bold" : "normal");
        doc.text(label, x + CELL_PADDING_X, textY, { baseline: 'middle' });
        const labelWidth = doc.getTextWidth(label);
        doc.setFont("helvetica", "normal");
        doc.text(
            String(value),
            x + CELL_PADDING_X + labelWidth + (label ? 1 : 0), // Add 1mm space if label exists
            textY,
            { baseline: 'middle', maxWidth: w - labelWidth - CELL_PADDING_X * 2 - (label ? 1 : 0) - valueMaxWidthReduction }
        );
    }
    
    // --- ROW 1: DATA, HORA, LOCAL ---
    const dataHoraObj = formatarDataHora(
        data.dataTerminoRegistro || data.dataFato,
        data.horaTerminoRegistro || data.horaFato,
        true
    );
    doc.rect(xCol1, currentY, colWidth, ROW_HEIGHT);
    addCellContent(xCol1, currentY, colWidth, ROW_HEIGHT, "DATA: ", dataHoraObj.date);

    doc.rect(xCol2, currentY, colWidth, ROW_HEIGHT);
    addCellContent(xCol2, currentY, colWidth, ROW_HEIGHT, "HORA: ", dataHoraObj.time);

    doc.rect(xCol3, currentY, lastColWidth, ROW_HEIGHT);
    addCellContent(xCol3, currentY, lastColWidth, ROW_HEIGHT, "LOCAL: ", "25º BPM");
    currentY += ROW_HEIGHT;

    // --- ROW 2: NOME DO POLICIAL ---
    doc.rect(MARGIN_LEFT, currentY, MAX_LINE_WIDTH, ROW_HEIGHT);
    const nomePolicial = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim().toUpperCase();
    addCellContent(MARGIN_LEFT, currentY, MAX_LINE_WIDTH, ROW_HEIGHT, "NOME DO POLICIAL: ", `[${nomePolicial}]`);
    currentY += ROW_HEIGHT;

    // --- ROW 3: FILIAÇÃO PAI ---
    doc.rect(xCol1, currentY, colWidth, ROW_HEIGHT); // Label cell
    addCellContent(xCol1, currentY, colWidth, ROW_HEIGHT, "FILIAÇÃO PAI: ");
    doc.rect(xCol2, currentY, MAX_LINE_WIDTH - colWidth, ROW_HEIGHT); // Value cell spans 2 cols
    addCellContent(xCol2, currentY, MAX_LINE_WIDTH - colWidth, ROW_HEIGHT, "", (condutor?.pai || "").toUpperCase(), false);
    currentY += ROW_HEIGHT;

    // --- ROW 4: FILIAÇÃO MÃE ---
    doc.rect(xCol1, currentY, colWidth, ROW_HEIGHT);
    addCellContent(xCol1, currentY, colWidth, ROW_HEIGHT, "FILIAÇÃO MÃE: ");
    doc.rect(xCol2, currentY, MAX_LINE_WIDTH - colWidth, ROW_HEIGHT);
    addCellContent(xCol2, currentY, MAX_LINE_WIDTH - colWidth, ROW_HEIGHT, "", (condutor?.mae || "").toUpperCase(), false);
    currentY += ROW_HEIGHT;

    // --- ROW 5: NATURALIDADE, RGPM, CPF ---
    doc.rect(xCol1, currentY, colWidth, ROW_HEIGHT);
    addCellContent(xCol1, currentY, colWidth, ROW_HEIGHT, "NATURALIDADE: ", (condutor?.naturalidade || "").toUpperCase());
    doc.rect(xCol2, currentY, colWidth, ROW_HEIGHT);
    addCellContent(xCol2, currentY, colWidth, ROW_HEIGHT, "RGPM: ", condutor?.rg || "");
    doc.rect(xCol3, currentY, lastColWidth, ROW_HEIGHT);
    addCellContent(xCol3, currentY, lastColWidth, ROW_HEIGHT, "CPF: ", condutor?.cpf || "");
    currentY += ROW_HEIGHT;

    // --- ROW 6: END. ---
    const enderecoLabel = "END.: ";
    const enderecoValue = "AV. DR. PARANÁ, S/N° COMPLEXO DA UNIVAG, AO LADO DO NÚCLEO DE PRÁTICA JURÍDICA. BAIRRO CRISTO REI CEP 78.110-100, VÁRZEA GRANDE - MT".toUpperCase();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(TABLE_TEXT_FONT_SIZE);
    const endLabelWidth = doc.getTextWidth(enderecoLabel);
    const addressValueX = MARGIN_LEFT + CELL_PADDING_X + endLabelWidth + 1;
    const addressMaxWidth = MAX_LINE_WIDTH - (CELL_PADDING_X + endLabelWidth + 1) - CELL_PADDING_X;

    doc.setFont("helvetica", "normal");
    const addressLines = doc.splitTextToSize(enderecoValue, addressMaxWidth);
    const { h: addressTextHeight } = doc.getTextDimensions(addressLines, { fontSize: TABLE_TEXT_FONT_SIZE, lineHeightFactor: LINE_HEIGHT_FACTOR });
    const endRowHeight = Math.max(ROW_HEIGHT, addressTextHeight + CELL_PADDING_Y * 2);

    doc.rect(MARGIN_LEFT, currentY, MAX_LINE_WIDTH, endRowHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(TABLE_TEXT_FONT_SIZE);
    doc.text(enderecoLabel, MARGIN_LEFT + CELL_PADDING_X, currentY + endRowHeight / 2, { baseline: 'middle' });
    placeWrappedTextInCell(doc, enderecoValue, addressValueX, currentY + CELL_PADDING_Y, addressMaxWidth, TABLE_TEXT_FONT_SIZE, "normal", "left", LINE_HEIGHT_FACTOR);
    currentY += endRowHeight;

    // --- ROW 7: MUNICÍPIO, UF, TEL ---
    doc.rect(xCol1, currentY, colWidth, ROW_HEIGHT);
    addCellContent(xCol1, currentY, colWidth, ROW_HEIGHT, "MUNICÍPIO: ", "VÁRZEA GRANDE");
    doc.rect(xCol2, currentY, colWidth, ROW_HEIGHT);
    addCellContent(xCol2, currentY, colWidth, ROW_HEIGHT, "UF: MT"); // Label and value combined
    doc.rect(xCol3, currentY, lastColWidth, ROW_HEIGHT);
    addCellContent(xCol3, currentY, lastColWidth, ROW_HEIGHT, "TEL: ", condutor?.telefone || "");
    currentY += ROW_HEIGHT;
    
    // --- ROW 8: FICA APREENDIDO O DESCRITO ABAIXO: ---
    doc.rect(MARGIN_LEFT, currentY, MAX_LINE_WIDTH, ROW_HEIGHT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(TABLE_TEXT_FONT_SIZE);
    doc.text("FICA APREENDIDO O DESCRITO ABAIXO:", MARGIN_LEFT + CELL_PADDING_X, currentY + ROW_HEIGHT / 2, { baseline: 'middle' });
    currentY += ROW_HEIGHT;

    // --- ROW 9: DESCRIÇÃO DA APREENSÃO ---
    let apreensaoY = currentY + CELL_PADDING_Y;
    const apreensaoTextX = MARGIN_LEFT + CELL_PADDING_X;
    const apreensaoMaxWidth = MAX_LINE_WIDTH - CELL_PADDING_X * 2;
    let totalApreensaoTextHeight = 0;

    if (isDroga) {
        const constatacaoTitle = "CONSTAÇÃO PRELIMINAR DE DROGA";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(TABLE_TEXT_FONT_SIZE);
        const constatacaoLines = doc.splitTextToSize(constatacaoTitle, apreensaoMaxWidth);
        doc.text(constatacaoLines, apreensaoTextX, apreensaoY, { lineHeightFactor: LINE_HEIGHT_FACTOR });
        const { h: ch } = doc.getTextDimensions(constatacaoLines, { fontSize: TABLE_TEXT_FONT_SIZE, lineHeightFactor: LINE_HEIGHT_FACTOR });
        totalApreensaoTextHeight += ch;
        apreensaoY += ch + 2; // Add some space
    }

    let textoApreensao = (data.apreensoes || "Nenhum objeto/documento descrito para apreensão.").toUpperCase();
    if (isDroga) {
        const quantidadeStr = String(data.drogaQuantidade || "01 (UMA)"); // Ensure it's a string
        const quantidadeNumMatch = quantidadeStr.match(/\d+/);
        const quantidadeNum = parseInt(quantidadeNumMatch ? quantidadeNumMatch[0] : "1", 10);
        const quantidadeText = numberToText(quantidadeNum); // Already uppercase
        const plural = quantidadeNum > 1 ? "PORÇÕES" : "PORÇÃO";
        textoApreensao = data.drogaIsUnknown
            ? `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA DE MATERIAL DESCONHECIDO, ${(data.drogaCustomDesc || "[DESCRIÇÃO]").toUpperCase()}, CONFORME FOTO EM ANEXO.`
            : `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA ANÁLOGA A ${data.drogaNomeComum.toUpperCase()}, ${(data.drogaCustomDesc || "[DESCRIÇÃO]").toUpperCase()}, CONFORME FOTO EM ANEXO.`;
    }
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(TABLE_TEXT_FONT_SIZE);
    const apreensaoLines = doc.splitTextToSize(`- ${textoApreensao}`, apreensaoMaxWidth); // Add leading dash as per image placeholder
    doc.text(apreensaoLines, apreensaoTextX, apreensaoY, { align: 'justify', lineHeightFactor: LINE_HEIGHT_FACTOR });
    const { h: ah } = doc.getTextDimensions(apreensaoLines, { fontSize: TABLE_TEXT_FONT_SIZE, lineHeightFactor: LINE_HEIGHT_FACTOR });
    totalApreensaoTextHeight += ah + (isDroga ? 2 : 0); // Add spacing if title was present

    const descRowHeight = Math.max(ROW_HEIGHT * 2.5, totalApreensaoTextHeight + CELL_PADDING_Y * 2);
    doc.rect(MARGIN_LEFT, currentY, MAX_LINE_WIDTH, descRowHeight);
    currentY += descRowHeight;

    // --- ROW 10: TERMO LEGAL ---
    const textoLegal = "O PRESENTE TERMO DE APREENSÃO FOI LAVRADO COM BASE NO ART. 6º, II, DO CÓDIGO DE PROCESSO PENAL, E ART. 92 DA LEI 9.099/1995.".toUpperCase();
    const legalTextX = MARGIN_LEFT + CELL_PADDING_X;
    const legalMaxWidth = MAX_LINE_WIDTH - CELL_PADDING_X * 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(TABLE_LEGAL_FONT_SIZE);
    const legalLines = doc.splitTextToSize(textoLegal, legalMaxWidth);
    const { h: legalTextHeight } = doc.getTextDimensions(legalLines, { fontSize: TABLE_LEGAL_FONT_SIZE, lineHeightFactor: LINE_HEIGHT_FACTOR });
    const legalRowHeight = Math.max(ROW_HEIGHT, legalTextHeight + CELL_PADDING_Y * 2);

    doc.rect(MARGIN_LEFT, currentY, MAX_LINE_WIDTH, legalRowHeight);
    placeWrappedTextInCell(doc, textoLegal, legalTextX, currentY + CELL_PADDING_Y, legalMaxWidth, TABLE_LEGAL_FONT_SIZE, "normal", "justify", LINE_HEIGHT_FACTOR);
    currentY += legalRowHeight;

    yPos = currentY; // Update main yPos

    // --- SIGNATURES ---
    yPos += 10; // Space before signatures
    const autorLabel = autor?.sexo === "Feminino" ? "AUTORA DOS FATOS" : "AUTOR DOS FATOS";
    yPos = addSignatureWithNameAndRole(doc, yPos, (autor?.nome || "").toUpperCase(), autorLabel.toUpperCase(), data);
    const nomeCondutorCompleto = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim().toUpperCase();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutorCompleto, "CONDUTOR DA OCORRÊNCIA".toUpperCase(), data);

    console.log("[PDFTermoApreensao] Termo de Apreensão finalizado, yPos:", yPos);
    return yPos;
}
