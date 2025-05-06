// src/components/tco/PDF/PDFTermoApreensao.js
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addWrappedText, addSignatureWithNameAndRole, addField, checkPageBreak, formatarDataHora
} from './pdfUtils.js';

/** Adiciona Termo de Apreensão (em página nova) */
export const addTermoApreensao = (doc, data) => {
    let yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    const autor = data.autores?.[0];

    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("TERMO DE APREENSÃO", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    const dataHoraApreensao = formatarDataHora(data.dataFato, data.horaFato);
    yPos = addField(doc, yPos, "DATA/HORA:", dataHoraApreensao, data);
    yPos = addField(doc, yPos, "NOME DO POLICIAL MILITAR:", condutor?.nome, data);
    yPos = addField(doc, yPos, "FILIAÇÃO - PAI:", data.policialPai || condutor?.pai || "Não informado", data);
    yPos = addField(doc, yPos, "FILIAÇÃO - MÃE:", data.policialMae || condutor?.mae || "Não informado", data);
    yPos = addField(doc, yPos, "NATURALIDADE:", data.policialNaturalidade || condutor?.naturalidade || "Não informado", data);
    yPos = addField(doc, yPos, "RG:", data.policialRg || condutor?.rg, data);
    yPos = addField(doc, yPos, "CPF:", data.policialCpf || condutor?.cpf || "Não informado", data);
    yPos = addField(doc, yPos, "TELEFONE:", data.policialTelefone || condutor?.celular || "Não informado", data);
    yPos = addField(doc, yPos, "LOCAL:", "25º BPM/2° CR – VÁRZEA GRANDE/MT", data);
    yPos = addField(doc, yPos, "ENDEREÇO:", "AV. DR. PARANÁ, S/N° COMPLEXO DA UNIVAG, AO LADO DO NÚCLEO DE PRATICA JURÍDICA. BAIRRO CRISTO REI CEP 78.110-100, VÁRZEA GRANDE - MT", data);
    yPos += 2;

    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    const textoApreensao = `FICA APREENDIDO(A): ${data.apreensaoDescricao || data.apreensoes || "Nenhum objeto/documento descrito para apreensão."}`;
    yPos = addWrappedText(doc, yPos, textoApreensao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    const textoLegal = "O PRESENTE TERMO DE APREENSÃO FOI LAVRADO COM BASE NO ART. 6º, II, DO CÓDIGO DE PROCESSO PENAL, E ART. 92 DA LEI 9.099/1995.";
    yPos = addWrappedText(doc, yPos, textoLegal, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 10;

    yPos = addSignatureWithNameAndRole(doc, yPos, autor?.nome, "AUTOR DOS FATOS", data);
    const nomeCondutor = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutor, "CONDUTOR DA OCORRÊNCIA", data);

    return yPos;
};
