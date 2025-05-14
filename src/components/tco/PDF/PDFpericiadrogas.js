
// src/components/tco/PDF/PDFpericiadrogas.js
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants, getDataAtualExtenso,
    addNewPage, addWrappedText, checkPageBreak, formatarDataSimples
} from './pdfUtils.js';

/** Adiciona Requisição de Exame em Drogas de Abuso (em página nova) */
export const addRequisicaoExameDrogas = (doc, data) => {
    let yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    const autor = data.autores?.[0];
    const lacreNumero = data.lacreNumero || "00000000";
    const drogaQuantidade = data.drogaQuantidade || "01 (UMA)";
    const drogaNomeComum = data.drogaNomeComum || "ENTORPECENTE";

    // Título
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("REQUISIÇÃO DE EXAME EM DROGAS DE ABUSO", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    // Conteúdo principal
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    
    // Determine o gênero do autor para flexão correta
    const generoAutor = autor?.sexo === "Feminino" ? "A" : "O";
    const autorTexto = `${generoAutor} AUTOR${autor?.sexo === "Feminino" ? "A" : ""} DO FATO ${autor?.nome || "[NOME NÃO INFORMADO]"}`;
    
    const textoRequisicao = `REQUISITO A POLITEC, NOS TERMOS DO ARTIGO 159 E SEGUINTES DO CPP COMBINADO COM O ARTIGO 69, CAPUT DA LEI N° 9.99/95, COMBINADO COM O ARTIGO 48, §2 E ARTIGO 50, §1° DA LEI N° 11,343/2006, SOLICITO A REALIZAÇÃO DE EXAME QUÍMICO NA SUBSTÂNCIA ANÁLOGA A ENTORPECENTE APENSADO SOB LACRE N° ${lacreNumero}, ENCONTRADO EM POSSE D${generoAutor} ${autorTexto}, QUALIFICAD${generoAutor} NESTE TCO, DE NATUREZA PORTE ILEGAL DE DROGAS, OCORRIDO NA DATA DE ${formatarDataSimples(data.dataFato) || "20/02/2025"}.`;
    
    yPos = addWrappedText(doc, yPos, textoRequisicao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Adiciona a descrição do material apreendido
    const textoApenso = `APENSO: - ${drogaQuantidade} PORÇÃO DE SUBSTÂNCIA ANÁLOGA A ${drogaNomeComum}.`;
    yPos = addWrappedText(doc, yPos, textoApenso, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Adiciona os quesitos
    const textoQuesitos = `PARA TANTO, SOLICITO DE VOSSA SENHORIA, QUE SEJA CONFECCIONADO O RESPECTIVO LAUDO PERICIAL DEFINITIVO, DEVENDO OS PERITOS RESPONDEREM AOS QUESITOS, CONFORME ABAIXO:`;
    yPos = addWrappedText(doc, yPos, textoQuesitos, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Lista de quesitos numerados
    const quesitos = [
        "QUAL A NATUREZA E CARACTERÍSTICAS DAS SUBSTÂNCIAS ENVIADAS A EXAME?",
        "PODEM AS MESMAS CAUSAR DEPENDÊNCIA FÍSICA/PSÍQUICAS?",
        "QUAL O PESO DAS SUBSTÂNCIAS ENVIADAS A EXAME?"
    ];

    quesitos.forEach((quesito, index) => {
        const textoQuesito = `${index + 1}. ${quesito}`;
        yPos = addWrappedText(doc, yPos, textoQuesito, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 3;
    });
    
    yPos += 5;

    // Adiciona a localidade e data
    const cidadeTermo = data.municipio || "VÁRZEA GRANDE";
    const dataAtualExtenso = getDataAtualExtenso();
    const dataLocal = `${cidadeTermo.toUpperCase()}-MT, ${dataAtualExtenso}.`;
    yPos = checkPageBreak(doc, yPos, 10, data);
    doc.text(dataLocal, PAGE_WIDTH - MARGIN_RIGHT, yPos, { align: 'right' });
    yPos += 15;

    // Adiciona a assinatura
    const nomeCondutor = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = checkPageBreak(doc, yPos, 20, data);
    const linhaAssinaturaX = PAGE_WIDTH / 2;
    const linhaAssinaturaWidth = 100;
    doc.setLineWidth(0.3);
    doc.line((PAGE_WIDTH - linhaAssinaturaWidth) / 2, yPos, (PAGE_WIDTH + linhaAssinaturaWidth) / 2, yPos);
    yPos += 5;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(nomeCondutor.toUpperCase(), PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 4;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("CONDUTOR DA OCORRÊNCIA", PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 10;

    return yPos;
};
