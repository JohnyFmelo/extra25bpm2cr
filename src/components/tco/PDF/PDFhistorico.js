
const MARGIN_LEFT = 15;

function addWrappedText(doc, text, x, y, maxWidth = 180, lineHeight = 7) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 20; // Margin from bottom of the page
    let textLines = doc.splitTextToSize(text, maxWidth);
    
    // Check if there is enough space for the whole block, add new page if not
    if (y + textLines.length * lineHeight > pageHeight - marginBottom) {
        doc.addPage();
        y = 20; // Reset y to top margin on new page
    }

    textLines.forEach(line => {
        // Check for each line as well
        if (y > pageHeight - marginBottom) {
            doc.addPage();
            y = 20; // Reset y to top margin on new page
        }
        doc.text(line, x, y);
        y += lineHeight;
    });
    return y;
}

export const generateHistoricoContent = (doc, y, data) => {
    return new Promise((resolve) => {
        let currentY = y;
        const isDrugCase = Array.isArray(data.drogas) && data.drogas.length > 0;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        currentY = addWrappedText(doc, "HISTÓRICO DA OCORRÊNCIA", MARGIN_LEFT, currentY);
        currentY += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        // --- Histórico Policial ---
        let historicoText = data.relatoPolicial || '';
        if (historicoText.trim() !== "") {
            currentY = addWrappedText(doc, historicoText, MARGIN_LEFT, currentY);
        } else {
            currentY = addWrappedText(doc, "Nenhum histórico policial foi adicionado.", MARGIN_LEFT, currentY);
        }
        currentY += 10;

        // --- Versões das Partes ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        currentY = addWrappedText(doc, "VERSÕES DOS ENVOLVIDOS", MARGIN_LEFT, currentY);
        currentY += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        // Versão dos autores
        const autoresComRelato = data.autores ? data.autores.filter(a => a?.relato && a.relato.trim() !== '') : [];
        if (autoresComRelato.length > 0) {
            autoresComRelato.forEach(autor => {
                const relatoText = `Versão do Autor ${autor.nome}: ${autor.relato}`;
                currentY = addWrappedText(doc, relatoText, MARGIN_LEFT, currentY);
            });
        } else {
            currentY = addWrappedText(doc, "Autor(es) não apresentaram versão.", MARGIN_LEFT, currentY);
        }
        currentY += 7;

        // Versão das vítimas
        const vitimasComRelato = !isDrugCase && data.vitimas ? data.vitimas.filter(v => v?.relato && v.relato.trim() !== '') : [];
        if (vitimasComRelato.length > 0) {
            vitimasComRelato.forEach(vitima => {
                const relatoText = `Versão da Vítima ${vitima.nome}: ${vitima.relato}`;
                currentY = addWrappedText(doc, relatoText, MARGIN_LEFT, currentY);
            });
        } else if (!isDrugCase) {
            currentY = addWrappedText(doc, "Vítima(s) não apresentou versão.", MARGIN_LEFT, currentY);
        }
        currentY += 7;

        // Versão das testemunhas
        const testemunhasComRelato = data.testemunhas ? data.testemunhas.filter(t => t?.relato && t.relato.trim() !== '') : [];
        if (testemunhasComRelato.length > 0) {
            testemunhasComRelato.forEach(testemunha => {
                const relatoText = `Versão da Testemunha ${testemunha.nome}: ${testemunha.relato}`;
                currentY = addWrappedText(doc, relatoText, MARGIN_LEFT, currentY);
            });
        } else {
            currentY = addWrappedText(doc, "Nenhuma testemunha apresentou versão.", MARGIN_LEFT, currentY);
        }
        currentY += 10;

        resolve(currentY);
    });
};
