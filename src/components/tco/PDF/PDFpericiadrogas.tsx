// src/components/tco/PDF/PDFpericiadrogas.tsx
import jsPDF from "jspdf";
import {
    addNewPage,
    addStandardFooterContent,
    MARGIN_TOP,
    MARGIN_LEFT,
    MARGIN_RIGHT,
    LINE_HEIGHT,
    formatDate,
    addCenteredText,
    wrapText,
    getPageConstants, // Ensure this is exported from pdfUtils
} from "./pdfUtils"; // Assuming pdfUtils.js or pdfUtils.ts is in the same PDF directory

// Helper function to convert number to text (0-10) for quantity
// This might already exist in TCOForm or could be moved to pdfUtils if used more broadly.
const numberToTextLocal = (numStr: string): string => {
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return numStr; // Return original if not a number

    const numbers = [
        "ZERO", "UMA", "DUAS", "TRÊS", "QUATRO",
        "CINCO", "SEIS", "SETE", "OITO", "NOVE", "DEZ"
    ];
    return num >= 0 && num <= 10 ? numbers[num] : num.toString();
};


export const addRequisicaoExameDrogas = (doc: jsPDF, data: any) => {
    let yPos = addNewPage(doc, data); // Start new page, get initial yPos

    const { PAGE_WIDTH, CONTENT_WIDTH } = getPageConstants(doc);

    // Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    addCenteredText(doc, "REQUISIÇÃO DE EXAME EM DROGAS DE ABUSO", yPos + LINE_HEIGHT);
    yPos += LINE_HEIGHT * 3; // Increased spacing after title

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Main text body
    const autorNome = data.autores && data.autores.length > 0 ? data.autores[0].nome.toUpperCase() : "[AUTOR PENDENTE]";
    const dataFatoFormatada = data.dataFato ? formatDate(data.dataFato) : "[DATA PENDENTE]";
    
    const textBody1 = `Requisito a POLITEC, nos termos do Artigo 159 e seguintes do CPP combinado com o Artigo 69, Caput da Lei nº 9.99/95, combinado com o Artigo 48 paragrafo 2 e artigo 50 paragrafo 1º da Lei nº 11,343/2006, solicito a realização de exame químico na substância análoga a entorpecente apensado sob Lacre Nº ${data.lacreNumero || "[LACRE PENDENTE]"}, encontrado em posse do sr, autor do fato ${autorNome}, qualificado neste TCO, de natureza porte ilegal de drogas, ocorrido na data de ${dataFatoFormatada}.`;
    const wrappedTextBody1 = wrapText(doc, textBody1, CONTENT_WIDTH);
    wrappedTextBody1.forEach(line => {
        doc.text(line, MARGIN_LEFT, yPos);
        yPos += LINE_HEIGHT;
    });
    yPos += LINE_HEIGHT * 0.5;

    // Apenso
    const quantidadeNumStr = data.drogaQuantidade || "1"; // e.g., "02"
    const quantidadeNum = parseInt(quantidadeNumStr, 10);
    const quantidadeText = numberToTextLocal(quantidadeNumStr); // e.g., "DUAS"
    const porcaoText = quantidadeNum > 1 ? "PORÇÕES" : "PORÇÃO";
    const drogaNome = data.drogaNomeComum ? data.drogaNomeComum.toUpperCase() : "[SUBSTÂNCIA PENDENTE]";
    
    const apensoText = `Apenso:  - ${quantidadeNumStr} (${quantidadeText.toUpperCase()}) ${porcaoText} DE SUBSTÂNCIA ANÁLOGA A ${drogaNome}.`;
    doc.setFont("helvetica", "bold"); // As per image, Apenso line is bold
    doc.text(apensoText, MARGIN_LEFT, yPos);
    yPos += LINE_HEIGHT * 2;
    doc.setFont("helvetica", "normal");


    // Questions Intro
    const questionIntroText = `Para tanto, solicito de Vossa Senhoria, que seja confeccionado o respectivo Laudo Pericial definitivo, devendo os peritos responderem aos quesitos, conforme abaixo:`;
    const wrappedQuestionIntroText = wrapText(doc, questionIntroText, CONTENT_WIDTH);
    wrappedQuestionIntroText.forEach(line => {
        doc.text(line, MARGIN_LEFT, yPos);
        yPos += LINE_HEIGHT;
    });
    yPos += LINE_HEIGHT * 0.5;

    // Questions List
    const questions = [
        "1.    Qual a natureza e características das substâncias enviadas a exame?",
        "2.    Podem as mesmas causar dependência física/psíquicas?",
        "3.    Qual o peso das substâncias enviadas a exame?"
    ];

    questions.forEach(q => {
        // Wrap text with a slightly smaller width for indentation effect if text is long
        const wrappedQ = wrapText(doc, q, CONTENT_WIDTH - 5); 
        wrappedQ.forEach(line => {
            doc.text(line, MARGIN_LEFT + (line.startsWith(" ") ? 0 : 5), yPos); // Indent question text (5mm)
            yPos += LINE_HEIGHT;
        });
        yPos += LINE_HEIGHT * 0.2; // Small space between questions
    });
    yPos += LINE_HEIGHT * 2;


    // Location and Date (Aligned Right)
    const localDateText = `Várzea Grande-MT, ${dataFatoFormatada}.`;
    const localDateWidth = doc.getStringUnitWidth(localDateText) * doc.getFontSize() / doc.internal.scaleFactor;
    doc.text(localDateText, PAGE_WIDTH - MARGIN_RIGHT - localDateWidth, yPos);
    yPos += LINE_HEIGHT * 3; // Space for signature line


    // Signature block
    const condutor = data.componentesGuarnicao && data.componentesGuarnicao.length > 0 ? data.componentesGuarnicao[0] : null;
    const condutorNome = condutor ? condutor.nome.toUpperCase() : "[NOME CONDUTOR PENDENTE]";
    const condutorPosto = condutor ? condutor.posto.toUpperCase() : "[POSTO PENDENTE]"; // e.g., "2º SGT"
    const condutorRg = condutor ? condutor.rg : "[RG PENDENTE]";

    const signatureLineWidth = 80; // Width of the signature line
    const signatureLineX = (PAGE_WIDTH - signatureLineWidth) / 2; // Centered
    doc.line(signatureLineX, yPos, signatureLineX + signatureLineWidth, yPos); // Signature line
    yPos += LINE_HEIGHT * 0.8; // Space between line and text

    addCenteredText(doc, `${condutorNome} - ${condutorPosto} PM`, yPos);
    yPos += LINE_HEIGHT;
    addCenteredText(doc, `RG ${condutorRg} PMMT`, yPos);
    yPos += LINE_HEIGHT;
    addCenteredText(doc, `CONDUTOR DA OCORRÊNCIA`, yPos);
    yPos += LINE_HEIGHT * 3;


    // Footer table (DATA | POLITEC | ASSINATURA)
    const tableY = yPos;
    const tableCellHeight = LINE_HEIGHT * 1.5; // Height for header cells
    const tableDataCellHeight = LINE_HEIGHT * 2; // Height for data cells (empty space)
    const colWidth = CONTENT_WIDTH / 3;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    // Table Headers
    doc.rect(MARGIN_LEFT, tableY, colWidth, tableCellHeight);
    doc.text("DATA", MARGIN_LEFT + colWidth / 2, tableY + tableCellHeight * 0.7, { align: 'center' });

    doc.rect(MARGIN_LEFT + colWidth, tableY, colWidth, tableCellHeight);
    doc.text("POLITEC", MARGIN_LEFT + colWidth + colWidth / 2, tableY + tableCellHeight * 0.7, { align: 'center' });

    doc.rect(MARGIN_LEFT + colWidth * 2, tableY, colWidth, tableCellHeight);
    doc.text("ASSINATURA", MARGIN_LEFT + colWidth * 2 + colWidth / 2, tableY + tableCellHeight * 0.7, { align: 'center' });

    // Empty cells below headers
    doc.rect(MARGIN_LEFT, tableY + tableCellHeight, colWidth, tableDataCellHeight);
    doc.rect(MARGIN_LEFT + colWidth, tableY + tableCellHeight, colWidth, tableDataCellHeight);
    doc.rect(MARGIN_LEFT + colWidth * 2, tableY + tableCellHeight, colWidth, tableDataCellHeight);
    
    // yPos update after table (not strictly needed if it's the last element before footer)
    // yPos = tableY + tableCellHeight + tableDataCellHeight + LINE_HEIGHT;

    // Add standard footer (page number etc.)
    addStandardFooterContent(doc, data);
};
