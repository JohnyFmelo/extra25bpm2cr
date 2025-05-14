import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addWrappedText, addSignatureWithNameAndRole, checkPageBreak, getDataAtualExtenso
} from './pdfUtils.js';

/** Adiciona Termo de Encerramento e Remessa (em página nova) */
export const addTermoEncerramentoRemessa = (doc, data) => {
    let yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    const autor = data.autores?.[0];

    const dataEncerramentoExtenso = getDataAtualExtenso();
    const cidadeEncerramento = data.municipio || "VÁRZEA GRANDE";
    const local = data.localEncerramento || "NO QUARTEL DO 25º BATALHÃO DE POLÍCIA MILITAR 2º COMANDO REGIONAL";
    const year = new Date().getFullYear();
    const tcoRef = data.tcoRefEncerramento || `Nº ${data.tcoNumber || 'INDEFINIDO'}/25ºBPM/2ºCR/${year}`;
    
    // Determine gender-specific prefix based on autor.sexo
    let prefix;
    if (autor?.sexo === "M") {
        prefix = "do Sr.";
    } else if (autor?.sexo === "F") {
        prefix = "da Sra.";
    } else {
        prefix = "do(a) Sr(a)."; // Fallback if gender is not specified
    }
    const nomeAutorMencao = autor?.nome ? `${prefix} ${autor.nome.toUpperCase()}` : "do(a) envolvido(a) qualificado(a) nos autos";

    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("TERMO DE ENCERRAMENTO E REMESSA", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    const textoEncerramento = `${dataEncerramentoExtenso}, nesta cidade de ${cidadeEncerramento.toUpperCase()}, ESTADO DE MATO GROSSO, ${local.toUpperCase()}, por determinação da Autoridade Policial Militar signatária deste TCO, dou por encerrada a lavratura do presente Termo Circunstanciado de Ocorrência ${tcoRef}, instaurado em desfavor ${nomeAutorMencao}, para as providências de remessa dos autos ao Poder Judiciário competente (Juizado Especial Criminal ou Vara competente conforme o caso), por meio eletrônico ou físico conforme normativas vigentes, a quem compete deliberar sobre o fato delituoso noticiado.`;
    yPos = addWrappedText(doc, yPos, textoEncerramento, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 15;

    const nomeCondutor = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutor, "POLICIAL MILITAR RESPONSÁVEL PELA LAVRATURA", data);

    return yPos;
};
