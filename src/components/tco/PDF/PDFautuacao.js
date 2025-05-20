
import {
    MARGIN_LEFT, MARGIN_RIGHT, MARGIN_TOP, getPageConstants,
    getDataAtualExtenso, addFieldBoldLabel, addWrappedText, addStandardFooterContent,
    checkPageBreak
} from './pdfUtils.js';

/**
 * Gera o conteúdo da primeira página (Autuação).
 * Assume que está começando em uma página nova (página 1).
 * Retorna a posição Y final nesta página.
 */
export const generateAutuacaoPage = (doc, currentY, data) => {
    const { PAGE_WIDTH, PAGE_HEIGHT, FOOTER_AREA_HEIGHT } = getPageConstants(doc);
    let yPos = currentY; // Geralmente MARGIN_TOP

    // --- Cabeçalho Específico da Página 1 ---
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("ESTADO DE MATO GROSSO", PAGE_WIDTH / 2, yPos, { align: "center" }); yPos += 4;
    doc.text("POLÍCIA MILITAR", PAGE_WIDTH / 2, yPos, { align: "center" }); yPos += 4;
    doc.text("25º BPM / 2º CR", PAGE_WIDTH / 2, yPos, { align: "center" }); yPos += 5;
    doc.setDrawColor(0); doc.setLineWidth(0.2);
    doc.line(MARGIN_LEFT, yPos, PAGE_WIDTH - MARGIN_RIGHT, yPos); yPos += 4; // Linha
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    const year = new Date().getFullYear(); // Pega o ano atual dinamicamente
    doc.text(`TERMO CIRCUNSTANCIADO DE OCORRÊNCIA Nº ${data.tcoNumber || "Não informado."}/25ºBPM/2ºCR/${year}`, PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 12; // Espaço após o título TCO

    // --- Informações Principais (Natureza, Autor, Vítima) ---
    const primeiroAutor = data.autores?.[0];
    const primeiraVitima = data.vitimas?.[0];

    // Adiciona campos usando a função utilitária, passando doc, yPos e data
    yPos = addFieldBoldLabel(doc, yPos, "NATUREZA", data.natureza, data);
    yPos = addFieldBoldLabel(doc, yPos, "AUTOR DO FATO", primeiroAutor?.nome, data);

    // Verifica se a natureza está relacionada a drogas (case-insensitive)
    const isDrugRelated = data.natureza && /droga|narcotráfico/i.test(data.natureza);
    if (!isDrugRelated) {
        yPos = addFieldBoldLabel(doc, yPos, "VÍTIMA", primeiraVitima?.nome, data);
    }

    yPos += 15; // Espaço extra

    // --- Título "AUTUAÇÃO" ---
    // Calcula espaço necessário: Título + Texto + Assinatura = ~15 + 40 + 30 = 85
    const necessarySpace = 85;
    const footerPosition = PAGE_HEIGHT - FOOTER_AREA_HEIGHT;
    
    // Verifica se há espaço suficiente até a área de rodapé
    if (yPos + necessarySpace > footerPosition) {
        // Se não houver espaço, inicia nova página
        yPos = checkPageBreak(doc, yPos, necessarySpace, data);
    }
    
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("AUTUAÇÃO", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 15;

    // --- Texto da Autuação ---
    const dataAtualExtenso = getDataAtualExtenso();
    const cidadeAutuacao = data.municipio || "VÁRZEA GRANDE"; // Usa município do TCO ou padrão
    const localAutuacao = data.localEncerramento || "NO CISC DO PARQUE DO LADGO"; // Local padrão
    const autuacaoText = `${dataAtualExtenso}, NESTA CIDADE DE ${cidadeAutuacao.toUpperCase()}, ESTADO DE MATO GROSSO, ${localAutuacao.toUpperCase()}, AUTUO AS PEÇAS QUE ADIANTE SE SEGUEM, DO QUE PARA CONSTAR, LAVREI E ASSINO ESTE TERMO.`;
    
    // Usa MAX_LINE_WIDTH implícito pelo getPageConstants dentro de addWrappedText
    yPos = addWrappedText(doc, yPos, autuacaoText, MARGIN_LEFT, 12, "normal", null, 'justify', data);
    yPos += 20; // Espaço antes da assinatura

    // --- Assinatura do Condutor na Autuação ---
    // Garante que a assinatura não vai ultrapassar a área de rodapé
    const signatureHeight = 30;
    // Use Math.min para garantir que a posição Y não ultrapasse o limite do rodapé
    yPos = Math.min(yPos, footerPosition - signatureHeight);

    const condutorAutuacao = data.componentesGuarnicao?.[0];
    const signatureLineLength = 80;
    const signatureLineStartX = (PAGE_WIDTH - signatureLineLength) / 2; // Centraliza a linha
    const signatureLineY = yPos;
    doc.setLineWidth(0.3);
    doc.line(signatureLineStartX, signatureLineY, signatureLineStartX + signatureLineLength, signatureLineY);
    yPos += 5; // Espaço após linha

    const condutorNomeCompleto = `${condutorAutuacao?.posto || ""} ${condutorAutuacao?.nome || "Não informado"} RGPM: ${condutorAutuacao?.rg || "Não informado."}`.trim().toUpperCase();

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    // Centraliza o texto da assinatura
    doc.text(condutorNomeCompleto, PAGE_WIDTH / 2, yPos, { align: "center" }); yPos += 4;
    doc.text("CONDUTOR DA OCORRÊNCIA", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10; // Espaço após assinatura

    // --- Rodapé Específico da Página 1 ---
    addStandardFooterContent(doc); // Adiciona o rodapé padrão

    return yPos; // Retorna a posição Y final nesta página
};
