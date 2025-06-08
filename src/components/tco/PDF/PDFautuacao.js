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
    const { PAGE_WIDTH } = getPageConstants(doc);
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

    // --- LÓGICA CORRIGIDA E ROBUSTA PARA VÍTIMAS EM LISTA VERTICAL ---
    if (data.vitimas && data.vitimas.length > 0) {
        const labelText = data.vitimas.length > 1 ? "VÍTIMAS:" : "VÍTIMA:";
        const labelWidth = 40; // Largura fixa para o rótulo, para alinhar os nomes
        const valueX = MARGIN_LEFT + labelWidth;
        const lineHeight = 6; // Aumentei um pouco para melhor legibilidade
    
        // Prepara a lista de nomes
        const vitimasNomes = data.vitimas.map(v => v.nome ? v.nome.toUpperCase() : "NOME NÃO INFORMADO");
        
        // --- Desenho da Lista ---
        
        // Vamos usar uma variável local 'currentLineY' para gerenciar a posição vertical da lista.
        // Primeiro, verificamos se o rótulo e a primeira vítima cabem na página.
        let currentLineY = checkPageBreak(doc, yPos, lineHeight, data);
        
        // Desenha o rótulo ("VÍTIMA:" ou "VÍTIMAS:")
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(labelText, MARGIN_LEFT, currentLineY);
    
        // Agora, iteramos sobre cada nome e o desenhamos, um por linha.
        doc.setFont("helvetica", "normal");
        vitimasNomes.forEach((nome, index) => {
            // Se não for o primeiro nome, precisamos avançar para a próxima linha
            if (index > 0) {
                // Calcula a posição da próxima linha
                currentLineY += lineHeight;
                // E verifica se essa nova linha causa uma quebra de página
                currentLineY = checkPageBreak(doc, currentLineY, lineHeight, data);
            }
            // Desenha o nome na posição correta (seja na mesma página ou na nova)
            doc.text(nome, valueX, currentLineY);
        });
    
        // Ao final do loop, atualizamos a variável principal 'yPos'
        // para a posição logo abaixo do último nome adicionado, mais um espaço.
        yPos = currentLineY + lineHeight + 5;
    }

    yPos += 15; // Espaço extra
    // --- Título "AUTUAÇÃO" ---
    yPos = checkPageBreak(doc, yPos, 85, data);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("AUTUAÇÃO", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 15;

    // --- Texto da Autuação ---
    const dataAtualExtenso = getDataAtualExtenso();
    const cidadeAutuacao = data.municipio || "VÁRZEA GRANDE";
    const localAutuacao = data.localEncerramento || "NO CISC DO PARQUE DO LADGO";
    const autuacaoText = `${dataAtualExtenso}, NESTA CIDADE DE ${cidadeAutuacao.toUpperCase()}, ESTADO DE MATO GROSSO, ${localAutuacao.toUpperCase()}, AUTUO AS PEÇAS QUE ADIANTE SE SEGUEM, DO QUE PARA CONSTAR, LAVREI E ASSINO ESTE TERMO.`;
    yPos = addWrappedText(doc, yPos, autuacaoText, MARGIN_LEFT, 12, "normal", null, 'justify', data);
    yPos += 20; // Espaço antes da assinatura

    // --- Assinatura do Condutor na Autuação ---
    yPos = checkPageBreak(doc, yPos, 35, data);
    const condutorAutuacao = data.componentesGuarnicao?.[0];
    const signatureLineLength = 80;
    const signatureLineStartX = (PAGE_WIDTH - signatureLineLength) / 2;
    const signatureLineY = yPos;
    doc.setLineWidth(0.3);
    doc.line(signatureLineStartX, signatureLineY, signatureLineStartX + signatureLineLength, signatureLineY);
    yPos += 5;

    const nomeCondutor = condutorAutuacao?.nome || "NOME NÃO INFORMADO";
    const postoCondutor = condutorAutuacao?.posto || "POSTO NÃO INFORMADO";
    const rgCondutor = condutorAutuacao?.rg || "NÃO INFORMADO";

    const linhaNomePosto = `${nomeCondutor} - ${postoCondutor}`.toUpperCase();
    const linhaRg = `RG PMMT: ${rgCondutor}`.toUpperCase();

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(linhaNomePosto, PAGE_WIDTH / 2, yPos, { align: "center" }); yPos += 4;
    doc.text(linhaRg, PAGE_WIDTH / 2, yPos, { align: "center" }); yPos += 4;
    doc.text("CONDUTOR DA OCORRÊNCIA", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    // --- Rodapé Específico da Página 1 ---
    addStandardFooterContent(doc);

    return yPos;
};
