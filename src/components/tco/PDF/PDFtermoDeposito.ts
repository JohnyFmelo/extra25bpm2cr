// PDFtermoDeposito.ts (relevant snippet)
// ... (imports, ensureAndProcessText, initial logs, depositario find)

    try {
        const { PAGE_WIDTH, MARGIN_LEFT, MARGIN_RIGHT, MAX_LINE_WIDTH } = getPageConstants(doc); // 1. Check this
        let y = addNewPage(doc, data); // Draws headers etc.

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("TERMO DE DEPÓSITO", PAGE_WIDTH / 2, y, { align: 'center' });
        y += 15;

        // ***** ERROR LIKELY OCCURS IN THIS BLOCK OR SHORTLY AFTER *****
        console.log("[addTermoDeposito] AFTER TITLE. Current y:", y, "MAX_LINE_WIDTH:", MAX_LINE_WIDTH); // Log before intro text

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const introText = `Nomeio como fiel depositário, ficando ciente de que não poderá vender, usufruir, emprestar os bens mencionados, conforme os artigos 647 e 648 do CC.`;
        
        // 2. Check splitTextToSize and text drawing
        let introTextLines = ["Error: MAX_LINE_WIDTH problem or introText null/undefined"]; // Default error message
        if (typeof introText === 'string' && MAX_LINE_WIDTH && MAX_LINE_WIDTH > 0) {
             try {
                introTextLines = doc.splitTextToSize(introText, MAX_LINE_WIDTH);
             } catch (splitError) {
                console.error("[addTermoDeposito] Error in doc.splitTextToSize:", splitError);
                introTextLines = [`Error during text split: ${splitError.message}`];
             }
        } else {
            console.warn("[addTermoDeposito] Problem with introText or MAX_LINE_WIDTH. introText type:", typeof introText, "MAX_LINE_WIDTH:", MAX_LINE_WIDTH);
            if (!introText) introTextLines = ["Error: Intro text is null or undefined."];
            if (!MAX_LINE_WIDTH || MAX_LINE_WIDTH <=0) introTextLines = ["Error: MAX_LINE_WIDTH is invalid."];
        }
        
        console.log("[addTermoDeposito] Intro text lines:", introTextLines);
        doc.text(introTextLines, MARGIN_LEFT, y); // This draws the lines
        y += (introTextLines.length * 4) + 8; // Approximate height; adjust if needed
        console.log("[addTermoDeposito] AFTER intro text. Current y:", y);
        // ***** END OF POTENTIAL ERROR BLOCK *****

        const now = new Date();
        // ... rest of the table drawing and content
        // ...

        addStandardFooterContent(doc);
        console.log("[addTermoDeposito] Geração do conteúdo do Termo de Depósito CONCLUÍDA para:", depositario.nome);

    } catch (error) {
        // This catch block is likely being hit.
        console.error("[addTermoDeposito] ERRO INTERNO durante a geração do conteúdo (after title):", error, error.stack);
    }
// ...
