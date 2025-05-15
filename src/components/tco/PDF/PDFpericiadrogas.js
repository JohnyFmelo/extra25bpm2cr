
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addWrappedText, checkPageBreak, formatarDataSimples
} from './pdfUtils.js';

// Helper function for date formatting as per user request: "DD DE MMMM DE AAAA"
const getCustomDataAtualExtenso = () => {
    const hoje = new Date();
    const dia = hoje.getDate();
    const meses = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    const mes = meses[hoje.getMonth()];
    const ano = hoje.getFullYear();
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
    const autorTextoFragment = `D${generoAutor} ${generoAutor} AUTOR${autor?.sexo === "Feminino" ? "A" : ""} DO FATO ${nomeAutor}, QUALIFICAD${generoAutor} NESTE TCO`;
    
    const textoRequisicao = `REQUISITO A POLITEC, NOS TERMOS DO ARTIGO 159 E SEGUINTES DO CPP COMBINADO COM O ARTIGO 69, CAPUT DA LEI N° 9.99/95, COMBINADO COM O ARTIGO 48, §2 E ARTIGO 50, §1° DA LEI N° 11,343/2006, SOLICITO A REALIZAÇÃO DE EXAME QUÍMICO NA SUBSTÂNCIA ANÁLOGA A ENTORPECENTE APENSADO SOB LACRE N° ${lacreNumero}, ENCONTRADO EM POSSE ${autorTextoFragment}, DE NATUREZA PORTE ILEGAL DE DROGAS, OCORRIDO NA DATA DE ${dataFatoStr}.`.toUpperCase();
    
    yPos = addWrappedText(doc, yPos, textoRequisicao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Handle quantity and singular/plural
    const qtdeNum = parseInt(data.drogaQuantidade) || 1;
    const numberWords = ["ZERO", "UMA", "DUAS", "TRÊS", "QUATRO", "CINCO", "SEIS", "SETE", "OITO", "NOVE", "DEZ"];
    const qtdeText = qtdeNum <= 10 ? numberWords[qtdeNum] : qtdeNum.toString();
    const porcaoText = qtdeNum === 1 ? "PORÇÃO" : "PORÇÕES";

    // Adiciona a descrição do material apreendido
    const textoApenso = `APENSO: ${qtdeText} ${porcaoText} DE SUBSTÂNCIA ANÁLOGA A ${drogaNomeComum}.`.toUpperCase();
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
    const cidadeTermo = (data.municipio || "VÁRZEA GRANDE").toUpperCase();
    const dataAtualFormatada = getCustomDataAtualExtenso();
    const dataLocal = `${cidadeTermo}-MT, ${dataAtualFormatada}.`;
    
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
    yPos = checkPageBreak(doc, yPos, (tableNumRows * tableRowHeight) + 15, data);

    const tableTopY = yPos;
    const tableContentWidth = MAX_LINE_WIDTH;
    const colWidth = tableContentWidth / tableNumCols;
    const tableHeaders = ["DATA", "POLITEC", "ASSINATURA"];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(tableHeaderFontSize);
    doc.setLineWidth(0.3); 

    // Desenhar a primeira linha (cabeçalhos)
    for (let j = 0; j < tableNumCols; j++) {
        const cellX = MARGIN_LEFT + j * colWidth;
        doc.rect(cellX, tableTopY, colWidth, tableRowHeight);
        doc.text(tableHeaders[j].toUpperCase(), cellX + colWidth / 2, tableTopY + tableRowHeight / 2, { align: 'center', baseline: 'middle' });
    }

    // Desenhar a segunda linha (vazia)
    const secondRowY = tableTopY + tableRowHeight;
    for (let j = 0; j < tableNumCols; j++) {
        const cellX = MARGIN_LEFT + j * colWidth;
        doc.rect(cellX, secondRowY, colWidth, tableRowHeight);
    }
    
    // Atualiza yPos para depois da tabela
    yPos = secondRowY + tableRowHeight + 10;

    // Reset font to document defaults
    doc.setFont("helvetica", "normal"); 
    doc.setFontSize(12);

    return yPos;
};
