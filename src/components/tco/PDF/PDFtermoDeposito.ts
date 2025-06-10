// PDFtermoDeposito.ts
import jsPDF from 'jspdf';
import { getPageConstants, addNewPage, addStandardFooterContent } from './pdfUtils.js'; // Assuming MAX_LINE_WIDTH is exported or calculated

// Helper function to ensure text is a valid string and then process it
const ensureAndProcessText = (text: any, toUpperCase = true, fallback = 'NÃO INFORMADO'): string => {
    if (typeof text === 'string' && text.trim() !== '') {
        const trimmedText = text.trim();
        return toUpperCase ? trimmedText.toUpperCase() : trimmedText;
    }
    if (typeof text === 'number') { // Handle if a numeric value was mistakenly passed
        return String(text);
    }
    return fallback;
};

export const addTermoDeposito = (doc: jsPDF, data: any) => {
    const { PAGE_WIDTH, MARGIN_LEFT, MARGIN_RIGHT, MAX_LINE_WIDTH } = getPageConstants(doc);

    // Find the FIRST author who is designated as a faithful depositary
    const depositario = data.autores?.find((a: any) =>
        a &&
        typeof a.fielDepositario === 'string' && a.fielDepositario.trim().toLowerCase() === 'Sim' &&
        typeof a.nome === 'string' && a.nome.trim() !== ''
    );

    if (!depositario) {
        console.log("Nenhum fiel depositário qualificado encontrado para o Termo de Depósito.");
        return; // No qualifying depositario, so no page will be added for this term.
    }

    // If a depositario is found, proceed to generate ONE page for this depositario
    try {
        console.log("Gerando Termo de Depósito para:", JSON.stringify(depositario, null, 2));
        let y = addNewPage(doc, data); // This adds standard header and resets y

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("TERMO DE DEPÓSITO", PAGE_WIDTH / 2, y, { align: 'center' });
        y += 15;

        // Introduction text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10); // Standard text size for intro
        const introText = `Nomeio como fiel depositário, ficando ciente de que não poderá vender, usufruir, emprestar os bens mencionados, conforme os artigos 647 e 648 do CC.`;
        // Using splitTextToSize to handle wrapping, assuming introText is relatively short
        const introTextLines = doc.splitTextToSize(introText, MAX_LINE_WIDTH);
        doc.text(introTextLines, MARGIN_LEFT, y);
        y += (introTextLines.length * 4) + 8; // Estimate line height around 4mm for font size 10


        // Current date and time
        const now = new Date();
        const dataHoje = now.toLocaleDateString('pt-BR');
        const horaAtual = now.toTimeString().slice(0, 5);
        const cellHeight = 8;

        // Robustly get and process depositario data
        const nomeDepositario = ensureAndProcessText(depositario.nome);
        const cpfDepositario = ensureAndProcessText(depositario.cpf, false, 'Não informado');
        const filiacaoPaiDepositario = ensureAndProcessText(depositario.filiacaoPai);
        const filiacaoMaeDepositario = ensureAndProcessText(depositario.filiacaoMae);
        const enderecoDepositario = ensureAndProcessText(depositario.endereco);
        const celularDepositario = ensureAndProcessText(depositario.celular, false, 'Não informado');
        const objetoDepositadoText = ensureAndProcessText(depositario.objetoDepositado);

        const bairro = typeof depositario.endereco === 'string' && depositario.endereco.trim() !== '' ?
            (depositario.endereco.trim().split(',').pop()?.trim().toUpperCase() || 'NÃO INFORMADO')
            : 'NÃO INFORMADO';

        // Draw table container
        const tableStartY = y;
        const tableHeight = cellHeight * 8;
        doc.rect(MARGIN_LEFT, tableStartY, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, tableHeight);

        doc.setFontSize(8); // Smaller font for table content

        // Line 1: Nome
        y = tableStartY; // Reset y to top of table for content drawing
        doc.text(`NOME OU RAZÃO SOCIAL: ${nomeDepositario}`, MARGIN_LEFT + 2, y + 5);
        y += cellHeight;
        doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

        // Line 2: CPF
        doc.text(`CPF/CNPJ: ${cpfDepositario}`, MARGIN_LEFT + 2, y + 5);
        y += cellHeight;
        doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

        // Line 3: Filiação Pai
        doc.text(`FILIAÇÃO PAI: ${filiacaoPaiDepositario}`, MARGIN_LEFT + 2, y + 5);
        y += cellHeight;
        doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

        // Line 4: Filiação Mãe
        doc.text(`FILIAÇÃO MÃE: ${filiacaoMaeDepositario}`, MARGIN_LEFT + 2, y + 5);
        y += cellHeight;
        doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

        // Line 5: Endereço e Bairro
        doc.text(`ENDEREÇO: ${enderecoDepositario}`, MARGIN_LEFT + 2, y + 5);
        doc.text(`BAIRRO: ${bairro}`, MARGIN_LEFT + 120, y + 5); // Adjust X pos if needed
        y += cellHeight;
        doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

        // Line 6: Município, UF, CEP, Tel
        doc.text(`MUNICÍPIO: Várzea Grande`, MARGIN_LEFT + 2, y + 5);
        doc.text(`UF: MT`, MARGIN_LEFT + 60, y + 5);
        doc.text(`CEP: [Não informado]`, MARGIN_LEFT + 90, y + 5); // CEP still not in PersonalInfo
        doc.text(`TEL: ${celularDepositario}`, MARGIN_LEFT + 140, y + 5);
        y += cellHeight;
        doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

        // Line 7: Local do depósito, data e hora
        doc.text(`LOCAL DO DEPÓSITO: ${enderecoDepositario}`, MARGIN_LEFT + 2, y + 5);
        doc.text(`DATA: ${dataHoje}`, MARGIN_LEFT + 120, y + 5);
        doc.text(`HORA: ${horaAtual}`, MARGIN_LEFT + 160, y + 5);
        y += cellHeight;
        doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

        // Line 8: Descrição do bem
        const descBemLabel = `DESCRIÇÃO DO BEM: `;
        const descBemX = MARGIN_LEFT + 2;
        const descBemY = y + 5;
        const availableWidthForObjeto = (PAGE_WIDTH - MARGIN_RIGHT) - descBemX - doc.getStringUnitWidth(descBemLabel) * doc.getFontSize() / doc.internal.scaleFactor;
        
        let objetoLines = [objetoDepositadoText]; // Default to single line
        if (objetoDepositadoText !== 'NÃO INFORMADO') {
             objetoLines = doc.splitTextToSize(objetoDepositadoText, availableWidthForObjeto > 0 ? availableWidthForObjeto : 100); // Ensure positive width
        }

        if (objetoLines.length === 1) {
            doc.text(`${descBemLabel}${objetoLines[0]}`, descBemX, descBemY);
        } else {
            doc.text(descBemLabel, descBemX, descBemY);
            let currentYForObjeto = descBemY;
            // Check if label + first line fits before drawing subsequent lines of objeto
            const labelWidth = doc.getStringUnitWidth(descBemLabel) * doc.getFontSize() / doc.internal.scaleFactor;
            const firstLineOfObjetoX = descBemX + labelWidth + 1; // Small gap after label

            objetoLines.forEach((line, index) => {
                if (index === 0) {
                     doc.text(line, firstLineOfObjetoX , currentYForObjeto);
                } else {
                    // For subsequent lines, start them aligned with the first line of the object description text
                     currentYForObjeto += 4; // Adjust line height for font size 8
                     doc.text(line, firstLineOfObjetoX , currentYForObjeto);
                }
            });
            // Adjust main y based on how many lines `objetoDepositadoText` took
             y = currentYForObjeto - 5 + cellHeight; // Ensure y is at the bottom of this cell
        }
        
        // If objetoLines.length === 1 (common case, didn't use multi-line logic)
        if (objetoLines.length === 1) {
           y += cellHeight; // Advance y normally if single line
        }
        // Ensure y is at least at the bottom of the defined table cell regardless of objetoLines
        y = Math.max(y, tableStartY + tableHeight);


        // Space after table
        y += 15;

        // Receipt confirmation
        doc.setFontSize(10);
        doc.text(`RECEBI OS BENS DEPOSITADOS EM: ${dataHoje}`, MARGIN_LEFT + 2, y);
        y += 25;

        // Fiel Depositario Signature
        doc.setLineWidth(0.3);
        doc.line(MARGIN_LEFT + 40, y, PAGE_WIDTH - MARGIN_RIGHT - 40, y); // Centered line
        doc.text(nomeDepositario, PAGE_WIDTH / 2, y + 5, { align: 'center' });
        doc.text("Fiel Depositário", PAGE_WIDTH / 2, y + 10, { align: 'center' });
        y += 25;

        // Testemunha details
        const testemunha = data.testemunhas?.find((t: any) => t && typeof t.nome === 'string' && t.nome.trim() !== "");
        const nomeTestemunha = testemunha ? ensureAndProcessText(testemunha.nome) : 'NÃO INFORMADO';
        const cpfTestemunha = testemunha ? ensureAndProcessText(testemunha.cpf, false, 'Não informado') : 'Não informado';

        doc.setFont('helvetica', 'bold');
        doc.text(`TESTEMUNHA`, MARGIN_LEFT + 2, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(`NOME: ${nomeTestemunha}`, MARGIN_LEFT + 2, y);
        y += 7;
        doc.text(`CPF: ${cpfTestemunha}`, MARGIN_LEFT + 2, y);
        y += 7;
        doc.text(`ASSINATURA: _________________________________________`, MARGIN_LEFT + 2, y);
        y += 15;

        // Condutor details
        const condutor = data.componentesGuarnicao?.find((c: any) => c && typeof c.nome === 'string' && c.nome.trim() !== '' && typeof c.posto === 'string' && c.posto.trim() !== '' && !c.apoio) ||
            data.componentesGuarnicao?.find((c: any) => c && typeof c.nome === 'string' && c.nome.trim() !== '' && typeof c.posto === 'string' && c.posto.trim() !== ''); // Fallback to any valid component

        const nomeCondutor = condutor ? ensureAndProcessText(condutor.nome) : 'NÃO INFORMADO';
        const postoCondutor = condutor ? ensureAndProcessText(condutor.posto) : 'NÃO INFORMADO';
        const rgCondutor = condutor ? ensureAndProcessText(condutor.rg, false, 'NÃO INFORMADO') : 'NÃO INFORMADO';

        doc.setFont('helvetica', 'bold');
        doc.text(`CONDUTOR DA OCORRÊNCIA`, MARGIN_LEFT + 2, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(`NOME COMPLETO: ${nomeCondutor}`, MARGIN_LEFT + 2, y);
        y += 7;
        doc.text(`POSTO/GRADUAÇÃO: ${postoCondutor}`, MARGIN_LEFT + 2, y);
        y += 7;
        doc.text(`RG PMMT: ${rgCondutor}`, MARGIN_LEFT + 2, y);
        y += 7;
        doc.text(`ASSINATURA: _________________________________________`, MARGIN_LEFT + 2, y);

        addStandardFooterContent(doc); // Add footer at the end of the page

    } catch (error) {
        console.error("Erro detalhado ao gerar Termo de Depósito para o depositário:", depositario?.nome , error, error.stack);
        // Optionally, add a fallback page indicating an error for this specific term.
        // For now, just logging thoroughly.
    }
};
