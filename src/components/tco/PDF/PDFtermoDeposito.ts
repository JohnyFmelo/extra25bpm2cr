// PDFtermoDeposito.ts
// ... (imports and ensureAndProcessText)

export const addTermoDeposito = (doc: jsPDF, data: any) => {
    const depositario = data.autores?.find((a: any) =>
        a && typeof a.fielDepositario === 'string' && a.fielDepositario.trim().toLowerCase() === 'sim' &&
        typeof a.nome === 'string' && a.nome.trim() !== ''
    );

    if (!depositario) {
        console.log("Nenhum fiel depositário qualificado encontrado para o Termo de Depósito.");
        return;
    }

    try {
        console.log("FOUND DEPOSITARIO:", JSON.stringify(depositario));
        let y = addNewPage(doc, data); // Draws header, sets y

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("TERMO DE DEPÓSITO", doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 15;

        // ONLY ADD THIS LINE FOR TESTING
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text("TESTING CONTENT - INTRO TEXT WOULD GO HERE", 20, y); // Use hardcoded X, Y for simplicity
        y += 10;
        doc.text(`Depositario Name: ${depositario.nome || 'N/A'}`, 20, y); // Try to print just one field
        y += 10;
         doc.text(`Objeto: ${depositario.objetoDepositado || 'N/A'}`, 20, y);


        addStandardFooterContent(doc); // Still try to add footer

        console.log("Simplified Termo de Depósito content attempted.");

    } catch (error) {
        console.error("ERROR IN SIMPLIFIED addTermoDeposito:", error, error.stack);
    }
};
