// src/components/tco/PDF/PDFpericiadrogas.js
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants, /* getDataAtualExtenso, (assuming this is replaced or you'll adapt) */
    addNewPage, addWrappedText, checkPageBreak, formatarDataSimples
} from './pdfUtils.js';

// Helper function for date formatting as per user request: "X DE MONTHNAME DE CURRENT_YEAR"
// Month names will be in uppercase.
const getCustomDataAtualExtenso = () => {
    const hoje = new Date();
    const dia = hoje.getDate();
    const meses = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    const mes = meses[hoje.getMonth()];
    const ano = hoje.getFullYear(); // Ano atual
    return `${dia} DE ${mes} DE ${ano}`;
};

/** Adiciona Requisição de Exame em Drogas de Abuso (em página nova) */
export const addRequisicaoExameDrogas = (doc, data) => {
    let yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    const autor = data.autores?.[0];

    // Use raw values here; .toUpperCase() will be applied to the final strings
    const lacreNumero = data.lacreNumero || "00000000";
    const drogaQuantidade = data.drogaQuantidade || "01 (UMA)";
    const drogaNomeComum = data.drogaNomeComum || "ENTORPECENTE";
    const nomeAutor = autor?.nome || "[NOME NÃO INFORMADO]";
    const dataFatoStr = formatarDataSimples(data.dataFato) || "20/02/2025"; // Format like DD/MM/YYYY

    // Título
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("REQUISIÇÃO DE EXAME EM DROGAS DE ABUSO".toUpperCase(), PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    // Conteúdo principal
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    
    const generoAutor = autor?.sexo === "Feminino" ? "A" : "O";
    // This fragment will be part of textoRequisicao and uppercased with it
    const autorTextoFragment = `D${generoAutor} ${generoAutor} AUTOR${autor?.sexo === "Feminino" ? "A" : ""} DO FATO ${nomeAutor}, QUALIFICAD${generoAutor} NESTE TCO`;
    
    const textoRequisicao = `REQUISITO A POLITEC, NOS TERMOS DO ARTIGO 159 E SEGUINTES DO CPP COMBINADO COM O ARTIGO 69, CAPUT DA LEI N° 9.99/95, COMBINADO COM O ARTIGO 48, §2 E ARTIGO 50, §1° DA LEI N° 11,343/2006, SOLICITO A REALIZAÇÃO DE EXAME QUÍMICO NA SUBSTÂNCIA ANÁLOGA A ENTORPECENTE APENSADO SOB LACRE N° ${lacreNumero}, ENCONTRADO EM POSSE ${autorTextoFragment}, DE NATUREZA PORTE ILEGAL DE DROGAS, OCORRIDO NA DATA DE ${dataFatoStr}.`.toUpperCase();
    
    yPos = addWrappedText(doc, yPos, textoRequisicao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Adiciona a descrição do material apreendido
    const textoApenso = `APENSO: - ${drogaQuantidade} PORÇÃO DE SUBSTÂNCIA ANÁLOGA A ${drogaNomeComum}.`.toUpperCase();
    yPos = addWrappedText(doc, yPos, textoApenso, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Adiciona os quesitos
    const textoQuesitos = `PARA TANTO, SOLICITO DE VOSSA SENHORIA, QUE SEJA CONFECCIONADO O RESPECTIVO LAUDO PERICIAL DEFINITIVO, DEVENDO OS PERITOS RESPONDEREM AOS QUESITOS, CONFORME ABAIXO:`.toUpperCase();
    yPos = addWrappedText(doc, yPos, textoQuesitos, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Lista de quesitos numerados
    const quesitos = [
        "QUAL A NATUREZA E CARACTERÍSTICAS DAS SUBSTÂNCIAS ENVIADAS A EXAME?",
        "PODEM AS MESMAS CAUSAR DEPENDÊNCIA FÍSICA/PSÍQUICAS?",
        "QUAL O PESO DAS SUBSTÂNCIAS ENVIADAS A EXAME?"
    ];

    quesitos.forEach((quesito, index) => {
        const textoQuesito = `${index + 1}. ${quesito}`.toUpperCase();
        yPos = addWrappedText(doc, yPos, textoQuesito, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 3;
    });
    
    yPos += 5;

    // Adiciona a localidade e data
    const cidadeTermo = (data.municipio || "VÁRZEA GRANDE").toUpperCase(); // City is uppercased
    const dataAtualFormatada = getCustomDataAtualExtenso(); // Date string is already formatted with uppercase month
    const dataLocal = `${cidadeTermo}-MT, ${dataAtualFormatada}.`; // Entire string will be uppercase
    
    yPos = checkPageBreak(doc, yPos, 10, data);
    doc.text(dataLocal, PAGE_WIDTH - MARGIN_RIGHT, yPos, { align: 'right' });
    yPos += 15;

    // Adiciona a assinatura
    const nomeCondutorCompleto = (`${condutor?.posto || ""} ${condutor?.nome || ""}`.trim()).toUpperCase();
    yPos = checkPageBreak(doc, yPos, 20, data);
    const linhaAssinaturaWidth = 100;
    doc.setLineWidth(0.3);
    doc.line((PAGE_WIDTH - linhaAssinaturaWidth) / 2, yPos, (PAGE_WIDTH + linhaAssinaturaWidth) / 2, yPos);
    yPos += 5;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(nomeCondutorCompleto, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 4;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("CONDUTOR DA OCORRÊNCIA".toUpperCase(), PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 10;

    // Adiciona a tabela abaixo da assinatura
    const tableRowHeight = 10; 
    const tableHeaderFontSize = 10;
    const tableNumRows = 2;
    const tableNumCols = 3;

    // Check for page break before drawing table
    yPos = checkPageBreak(doc, yPos, (tableNumRows * tableRowHeight) + 15, data); // Added a bit more buffer

    const tableTopY = yPos;
    const tableContentWidth = MAX_LINE_WIDTH; // Align table with wrapped text width
    const colWidth = tableContentWidth / tableNumCols;
    const tableHeaders = ["DATA", "POLITEC", "ASINATURA"];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(tableHeaderFontSize);
    doc.setLineWidth(0.3); 

    // Desenhar a primeira linha (cabeçalhos)
    for (let j = 0; j < tableNumCols; j++) {
        const cellX = MARGIN_LEFT + j * colWidth;
        doc.rect(cellX, tableTopY, colWidth, tableRowHeight); // Desenha a célula
        // Headers are already uppercase in the array, but .toUpperCase() is safe
        doc.text(tableHeaders[j].toUpperCase(), cellX + colWidth / 2, tableTopY + tableRowHeight / 2, { align: 'center', baseline: 'middle' });
    }

    // Desenhar a segunda linha (vazia)
    const secondRowY = tableTopY + tableRowHeight;
    // No need to change font for empty cells, but ensure line width is still set for rect
    // doc.setFont("helvetica", "normal"); // Not strictly needed if no text
    for (let j = 0; j < tableNumCols; j++) {
        const cellX = MARGIN_LEFT + j * colWidth;
        doc.rect(cellX, secondRowY, colWidth, tableRowHeight); // Desenha a célula
    }
    
    // Atualiza yPos para depois da tabela
    yPos = secondRowY + tableRowHeight + 10;

    // Reset font to document defaults if needed for subsequent content
    doc.setFont("helvetica", "normal"); 
    doc.setFontSize(12); // Assuming 12 is a common default size

    return yPos;
};
