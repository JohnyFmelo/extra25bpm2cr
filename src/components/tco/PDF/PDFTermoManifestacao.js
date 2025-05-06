// src/components/tco/PDF/PDFTermoManifestacao.js
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addWrappedText, addSignatureWithNameAndRole, checkPageBreak
} from './pdfUtils.js';

/** Adiciona Termo de Manifestação da Vítima (em página nova) */
export const addTermoManifestacao = (doc, data) => {
    const vitima = data.vitimas?.find(v => v?.nome);
    if (!vitima) {
        console.warn("Nenhuma vítima com nome informado, pulando Termo de Manifestação.");
        return null;
    }

    let yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];

    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("TERMO DE MANIFESTAÇÃO DA VÍTIMA", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    yPos = addWrappedText(doc, yPos, "EU, VÍTIMA ABAIXO ASSINADA, POR ESTE INSTRUMENTO MANIFESTO O MEU INTERESSE EM:", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
    yPos += 5;

    let manifestacaoOption1 = '(   )';
    let manifestacaoOption2 = '(   )';
    if (data.representacao === 'representar') {
        manifestacaoOption1 = '( X )';
    } else if (data.representacao === 'decidir_posteriormente') {
        manifestacaoOption2 = '( X )';
    } else {
        console.warn("Opção 'representacao' não definida ou inválida nos dados. Ambas as opções ficarão desmarcadas.");
    }

    const option1Text = `${manifestacaoOption1} EXERCER O DIREITO DE REPRESENTAÇÃO OU QUEIXA CONTRA O AUTOR DO FATO, JÁ QUALIFICADO NESTE TCO/PM (FICA CIENTIFICADA QUE EM CASO DE QUEIXA-CRIME, A VÍTIMA DEVERÁ CONSTITUIR ADVOGADO).`;
    yPos = addWrappedText(doc, yPos, option1Text, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    const option2Text = `${manifestacaoOption2} DECIDIR POSTERIORMENTE, ESTANDO CIENTE, PARA OS FINS PREVISTOS NO ART. 103 DO CÓDIGO PENAL E ART. 38 CÓDIGO DE PROCESSO PENAL QUE DEVO EXERCER O DIREITO DE REPRESENTAÇÃO OU DE QUEIXA, NO PRAZO DE 06 (SEIS) MESES, A CONTAR DESTA DATA, SENDO CERTO QUE MEU SILÊNCIO, ACARRETARÁ A EXTINÇÃO DE PUNIBILIDADE, NA FORMA DO ART. 107, INC. IV, DO CÓDIGO PENAL.`;
    yPos = addWrappedText(doc, yPos, option2Text, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    yPos = addSignatureWithNameAndRole(doc, yPos, vitima?.nome, "VÍTIMA", data);
    const nomeCondutorManif = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutorManif, "CONDUTOR DA OCORRENCIA", data);

    return yPos;
};
