import jsPDF from "jspdf";
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addWrappedText, addSignatureWithNameAndRole, addField, checkPageBreak, formatarDataHora
} from './pdfUtils.js';

// Função para converter números até 10 em texto
const numberToText = (num) => {
    const numbers = [
        "ZERO", "UMA", "DUAS", "TRÊS", "QUATRO",
        "CINCO", "SEIS", "SETE", "OITO", "NOVE", "DEZ"
    ];
    return num >= 0 && num <= 10 ? numbers[num] : num.toString();
};

/** Adiciona Termo de Apreensão (em página nova) */
export function addTermoApreensao(doc, data) {
    console.log("[PDFTermoApreensao] Iniciando renderização do Termo de Apreensão");
    console.log("[PDFTermoApreensao] Condutor telefone:", data.componentesGuarnicao?.[0]?.telefone);
    console.log("[PDFTermoApreensao] Autor sexo:", data.autores?.[0]?.sexo);

    let yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    const autor = data.autores?.[0];
    const isDroga = data.natureza && data.natureza.toLowerCase() === "porte de drogas para consumo";
    const lacreNumero = data.lacreNumero || "00000000";

    // Título com lacre para droga
    const titulo = isDroga ? `TERMO DE APREENSÃO LACRE Nº ${lacreNumero}` : "TERMO DE APREENSÃO";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text(titulo, PAGE_WIDTH / 2, yPos, { align: "center" });
    console.log("[PDFTermoApreensao] Título renderizado:", titulo);
    yPos += 10;

    // Função addField com correção de dois-pontos
    function addFieldWrapper(doc, yPos, label, value, data) {
        const cleanLabel = label.replace(/:+$/, '');
        const text = `${cleanLabel}: ${value || "Não informado"}`;
        console.log("[PDFTermoApreensao] Renderizando campo:", text);
        return addField(doc, yPos, cleanLabel, value, data);
    }

    // Usa dataTerminoRegistro e horaTerminoRegistro
    const dataHoraApreensao = formatarDataHora(data.dataTerminoRegistro || data.dataFato, data.horaTerminoRegistro || data.horaFato);
    if (!isDroga) {
        yPos = addFieldWrapper(doc, yPos, "LACRE", lacreNumero, data);
    }
    yPos = addFieldWrapper(doc, yPos, "DATA/HORA", dataHoraApreensao, data);
    yPos = addFieldWrapper(doc, yPos, "LOCAL", "25º BPM", data);
    yPos = addFieldWrapper(doc, yPos, "NOME DO POLICIAL MILITAR", condutor?.nome, data);
    yPos = addFieldWrapper(doc, yPos, "GRADUAÇÃO", condutor?.posto, data);
    yPos = addFieldWrapper(doc, yPos, "RGPM", condutor?.rg, data);
    yPos = addFieldWrapper(doc, yPos, "FILIAÇÃO - PAI", condutor?.pai, data);
    yPos = addFieldWrapper(doc, yPos, "FILIAÇÃO - MÃE", condutor?.mae, data);
    yPos = addFieldWrapper(doc, yPos, "NATURALIDADE", condutor?.naturalidade, data);
    yPos = addFieldWrapper(doc, yPos, "CPF", condutor?.cpf, data);
    yPos = addFieldWrapper(doc, yPos, "TELEFONE", condutor?.telefone, data);
    yPos = addFieldWrapper(doc, yPos, "ENDEREÇO", "AV. DR. PARANÁ, S/N° COMPLEXO DA UNIVAG, AO LADO DO NÚCLEO DE PRÁTICA JURÍDICA. BAIRRO CRISTO REI CEP 78.110-100, VÁRZEA GRANDE - MT", data);
    yPos = addFieldWrapper(doc, yPos, "MUNICÍPIO", "VÁRZEA GRANDE - MT", data);
    yPos += 2;

    // Adiciona Constatação Preliminar de Droga se for natureza "Porte de drogas para consumo"
    if (isDroga) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        yPos = checkPageBreak(doc, yPos, 15, data);
        doc.text("CONSTAÇÃO PRELIMINAR DE DROGA", MARGIN_LEFT, yPos);
        yPos += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    let textoApreensao = data.apreensoes || "Nenhum objeto/documento descrito para apreensão.";
    if (isDroga) {
        const quantidadeNum = parseInt(data.drogaQuantidade.match(/\d+/)?.[0] || "1", 10);
        const quantidadeText = quantidadeNum <= 10 ? numberToText(quantidadeNum) : quantidadeNum.toString();
        const plural = quantidadeNum > 1 ? "PORÇÕES" : "PORÇÃO";
        textoApreensao = data.drogaIsUnknown
            ? `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA DE MATERIAL DESCONHECIDO, ${data.drogaCustomDesc || "[DESCRIÇÃO]"}, CONFORME FOTO EM ANEXO.`
            : `${quantidadeText} ${plural} PEQUENA DE SUBSTÂNCIA ANÁLOGA A ${data.drogaNomeComum.toUpperCase()}, ${data.drogaCustomDesc || "[DESCRIÇÃO]"}, CONFORME FOTO EM ANEXO.`;
    }
    yPos = addWrappedText(doc, yPos, textoApreensao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    const textoLegal = "O PRESENTE TERMO DE APREENSÃO FOI LAVRADO COM BASE NO ART. 6º, II, DO CÓDIGO DE PROCESSO PENAL, E ART. 92 DA LEI 9.099/1995.";
    yPos = addWrappedText(doc, yPos, textoLegal, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 10;

    // Usa "AUTORA DOS FATOS" para sexo "Feminino", "AUTOR DOS FATOS" para "Masculino" ou não informado
    const autorLabel = autor?.sexo === "Feminino" ? "AUTORA DOS FATOS" : "AUTOR DOS FATOS";
    yPos = addSignatureWithNameAndRole(doc, yPos, autor?.nome, autorLabel, data);
    const nomeCondutor = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutor, "CONDUTOR DA OCORRÊNCIA", data);

    console.log("[PDFTermoApreensao] Termo de Apreensão finalizado, yPos:", yPos);
    return yPos;
}
