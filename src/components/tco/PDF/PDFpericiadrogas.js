import jsPDF from "jspdf";
import {
    addNewPage,
    addStandardFooterContent,
    MARGIN_TOP,
    MARGIN_LEFT,
    MARGIN_RIGHT,
    formatarDataSimples,
    addWrappedText,
    getPageConstants,
} from "./pdfUtils";

// Constante temporária para LINE_HEIGHT
const LINE_HEIGHT = 10 * 0.3528 * 1.2; // Aproximadamente 4.23mm para fonte tamanho 10

// Helper function to convert number to text (0-10) for quantity
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

    const { PAGE_WIDTH, MAX_LINE_WIDTH: CONTENT_WIDTH } = getPageConstants(doc);

    // Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    yPos = addWrappedText(doc, yPos + LINE_HEIGHT, "REQUISIÇÃO DE EXAME EM DROGAS DE ABUSO", MARGIN_LEFT, 12, "bold", CONTENT_WIDTH, 'center', data);
    yPos += LINE_HEIGHT * 3; // Increased spacing after title

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Main text body
    const autorNome = data.autores && data.autores.length > 0 ? data.autores[0].nome.toUpperCase() : "[AUTOR PENDENTE]";
    const dataFatoFormatada = data.dataFato ? formatarDataSimples(data.dataFato) : "[DATA PENDENTE]";
    
    const textBody1 = `Requisito a POLITEC, nos termos do Artigo 159 e seguintes do CPP combinado com o Artigo 69, Caput da Lei nº 9.99/95, combinado com o Artigo 48 paragrafo 2 e artigo 50 paragrafo 1º da Lei nº 11,343/2006, solicito a realização de exame químico na substância análoga a entorpecente apensado sob Lacre Nº ${data.lacreNumero || "[LACRE PENDENTE]"}, encontrado em posse do sr, autor do fato ${autorNome}, qualificado neste TCO, de natureza porte ilegal de drogas, ocorrido na data de ${dataFatoFormatada}.`;
    yPos = addWrappedText(doc, yPos, textBody1, MARGIN_LEFT, 10, "normal", CONTENT_WIDTH, 'left', data);
    yPos += LINE_HEIGHT * 0.5;

    // Apenso
    const quantidadeNumStr = data.drogaQuantidade || "1"; // e.g., "02"
    const quantidadeNum = parseInt(quantidadeNumStr, 10);
    const quantidadeText = numberToTextLocal(quantidadeNumStr); // e.g., "DUAS"
    const porcaoText = quantidadeNum > 1 ? "PORÇÕES" : "PORÇÃO";
    const drogaNome = data.drogaNomeComum ? data.drogaNomeComum.toUpperCase() : "[SUBSTÂNCIA PENDENTE]";
    
    const apensoText = `Apenso:  - ${quantidadeNumStr} (${quantidadeText.toUpperCase()}) ${porcaoText} DE SUBSTÂNCIA ANÁLOGA A ${drogaNome}.`;
    doc.setFont("helvetica", "bold");
    yPos = addWrappedText(doc, yPos, apensoText, MARGIN_LEFT, 10, "bold", CONTENT_WIDTH, 'left', data);
    yPos += LINE_HEIGHT * 2;
    doc.setFont("helvetica", "normal");

    // Questions Intro
    const questionIntroText = `Para tanto, solicito de Vossa Senhoria, que seja confeccionado o respectivo Laudo Pericial definitivo, devendo os peritos responderem aos quesitos, conforme abaixo:`;
    yPos = addWrappedText(doc, yPos, questionIntroText, MARGIN_LEFT, 10, "normal", CONTENT_WIDTH, 'left', data);
    yPos += LINE_HEIGHT * 0.5;

    // Questions List
    const questions = [
        "1.    Qual a natureza e характеристики das substâncias enviadas a exame?",
        "2.    Podem as mesmas causar dependência física/psíquicas?",
        "3.    Qual o peso das substâncias enviadas a exame?"
    ];

    questions.forEach(q => {
        yPos = addWrappedText(doc, yPos, q, MARGIN_LEFT + 5, 10, "normal", CONTENT_WIDTH - 5, 'left', data);
        yPos += LINE_HEIGHT * 0.2; // Small space between questions
    });
    yPos += LINE_HEIGHT * 2;

    // Location and Date (Aligned Right)
    const localDateText = `Várzea Grande-MT, ${dataFatoFormatada}.`;
    yPos = addWrappedText(doc, yPos, localDateText, MARGIN_LEFT, 10, "normal", CONTENT_WIDTH, 'right', data);
    yPos += LINE_HEIGHT * 3; // Space for signature line

    // Signature block
    const condutor = data.componentesGuarnicao && data.componentesGuarnicao.length > 0 ? data.componentesGuarnicao[0] : null;
    const condutorNome = condutor ? condutor.nome.toUpperCase() : "[NOME CONDUTOR PENDENTE]";
    const condutorPosto = condutor ? condutor.posto.toUpperCase() : "[POSTO PENDENTE]";
    const condutorRg = condutor ? condutor.rg : "[RG PENDENTE]";

    const signatureLineWidth = 80; // Width of the signature line
    const signatureLineX = (PAGE_WIDTH - signatureLineWidth) / 2; // Centered
    doc.line(signatureLineX, yPos, signatureLineX + signatureLineWidth, yPos); // Signature line
    yPos += LINE_HEIGHT * 0.8; // Space between line and text

    yPos = addWrappedText(doc, yPos, `${condutorNome} - ${condutorPosto} PM`, MARGIN_LEFT, 10, "normal", CONTENT_WIDTH, 'center', data);
    yPos += LINE_HEIGHT;
    yPos = addWrappedText(doc, yPos, `RG ${condutorRg} PMMT`, MARGIN_LEFT, 10, "normal", CONTENT_WIDTH, 'center', data);
    yPos += LINE_HEIGHT;
    yPos = addWrappedText(doc, yPos, `CONDUTOR DA OCORRÊNCIA`, MARGIN_LEFT, 10, "normal", CONTENT_WIDTH, 'center', data);
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
    
    // Add standard footer
    addStandardFooterContent(doc);
};
