// PDFtermoDeposito.ts
import jsPDF from 'jspdf';
import { getPageConstants, addNewPage, addStandardFooterContent } from './pdfUtils.js'; // Ensure these are correctly imported

const ensureAndProcessText = (text: any, toUpperCase = true, fallback = 'NÃO INFORMADO'): string => {
    if (typeof text === 'string' && text.trim() !== '') {
        const trimmedText = text.trim();
        return toUpperCase ? trimmedText.toUpperCase() : trimmedText;
    }
    if (typeof text === 'number') {
        return String(text);
    }
    return fallback;
};

export const addTermoDeposito = (doc: jsPDF, data: any) => {
    // This log now includes whether autores array exists and its length.
    console.log("[addTermoDeposito] Função CHAMADA. Checando autores. Qtd:", data?.autores?.length ?? "Autores array ausente/nulo");

    // Find the FIRST author who is a qualified faithful depositary
    const depositario = data?.autores?.find((a: any) =>
        a &&
        typeof a.fielDepositario === 'string' && a.fielDepositario.trim().toLowerCase() === 'sim' &&
        typeof a.nome === 'string' && a.nome.trim() !== '' &&
        typeof a.objetoDepositado === 'string' && a.objetoDepositado.trim() !== '' // Crucial: Must have an object to deposit
    );

    if (!depositario) {
        console.log("[addTermoDeposito] Nenhum depositário qualificado (com nome, 'Sim' e objetoDepositado) encontrado. Termo de Depósito NÃO será gerado.");
        return; // Gracefully exit if no suitable depositario is found
    }

    console.log(`[addTermoDeposito] Depositário encontrado: ${depositario.nome}, Objeto: "${depositario.objetoDepositado}". Gerando termo.`);

    try {
        const { PAGE_WIDTH, MARGIN_LEFT, MARGIN_RIGHT, MAX_LINE_WIDTH } = getPageConstants(doc);
        let y = addNewPage(doc, data); // This function should handle adding headers/footers for new pages

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("TERMO DE DEPÓSITO", PAGE_WIDTH / 2, y, { align: 'center' });
        y += 15;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const introText = `Nomeio como fiel depositário, ficando ciente de que não poderá vender, usufruir, emprestar os bens mencionados, conforme os artigos 647 e 648 do CC.`;
        const introTextLines = doc.splitTextToSize(introText, MAX_LINE_WIDTH > 0 ? MAX_LINE_WIDTH : (PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT));
        doc.text(introTextLines, MARGIN_LEFT, y);
        y += (introTextLines.length * 4) + 8; // Approximate height; adjust if needed

        const now = new Date();
        const dataHoje = now.toLocaleDateString('pt-BR');
        const horaAtual = now.toTimeString().slice(0, 5);
        const cellHeight = 8;

        const nomeDepositario = ensureAndProcessText(depositario.nome);
        const cpfDepositario = ensureAndProcessText(depositario.cpf, false);
        const filiacaoPaiDepositario = ensureAndProcessText(depositario.filiacaoPai);
        const filiacaoMaeDepositario = ensureAndProcessText(depositario.filiacaoMae);
        const enderecoDepositario = ensureAndProcessText(depositario.endereco);
        const celularDepositario = ensureAndProcessText(depositario.celular, false);
        const objetoDepositadoText = ensureAndProcessText(depositario.objetoDepositado); // Already confirmed it's a non-empty string

        const bairro = (typeof depositario.endereco === 'string' && depositario.endereco.trim() !== '') ?
            (depositario.endereco.trim().split(',').pop()?.trim().toUpperCase() || 'NÃO INFORMADO')
            : 'NÃO INFORMADO';

        const tableStartY = y;
        const tableHeight = cellHeight * 8;
        doc.rect(MARGIN_LEFT, tableStartY, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, tableHeight);
        doc.setFontSize(8);
        y = tableStartY;

        // Simplified table drawing for clarity (actual implementation might be more complex)
        const fields = [
            { label: "NOME OU RAZÃO SOCIAL", value: nomeDepositario },
            { label: "CPF/CNPJ", value: cpfDepositario },
            { label: "FILIAÇÃO PAI", value: filiacaoPaiDepositario },
            { label: "FILIAÇÃO MÃE", value: filiacaoMaeDepositario },
            { label: "ENDEREÇO", value: enderecoDepositario, additional: `BAIRRO: ${bairro}`, additionalX: MARGIN_LEFT + 120 },
            { label: "MUNICÍPIO", value: "Várzea Grande", parts: [{ t: `UF: MT`, x: 60 }, { t: `TEL: ${celularDepositario}`, x: 140 }] },
            { label: "LOCAL DO DEPÓSITO", value: enderecoDepositario, parts: [{ t: `DATA: ${dataHoje}`, x: 120 }, { t: `HORA: ${horaAtual}`, x: 160 }] },
            { label: "DESCRIÇÃO DO BEM", value: objetoDepositadoText, multiline: true }
        ];

        fields.forEach(fieldInfo => {
            const currentLineY = y + 5; // Text slightly offset from line
            if (fieldInfo.multiline && typeof fieldInfo.value === 'string') {
                const labelText = `${fieldInfo.label}: `;
                doc.text(labelText, MARGIN_LEFT + 2, currentLineY);
                const valueX = MARGIN_LEFT + 2 + doc.getStringUnitWidth(labelText) * doc.getFontSize() / doc.internal.scaleFactor + 1;
                const valueMaxWidth = (PAGE_WIDTH - MARGIN_RIGHT) - valueX;
                const valueLines = doc.splitTextToSize(fieldInfo.value, valueMaxWidth > 10 ? valueMaxWidth : 50); // Ensure positive width
                
                let lineOffset = 0;
                valueLines.forEach((line, lineIndex) => {
                    doc.text(line, valueX, currentLineY + lineOffset);
                    if (lineIndex < valueLines.length -1) lineOffset += 4; // Approx line height
                });
                y += cellHeight + (valueLines.length > 1 ? (valueLines.length -1) * 4 : 0);
            } else {
                doc.text(`${fieldInfo.label}: ${fieldInfo.value}`, MARGIN_LEFT + 2, currentLineY);
                 if(fieldInfo.additional) {
                     doc.text(fieldInfo.additional, fieldInfo.additionalX || MARGIN_LEFT + 120, currentLineY);
                 }
                 if(fieldInfo.parts) {
                     fieldInfo.parts.forEach(p => doc.text(p.t, MARGIN_LEFT + p.x, currentLineY));
                 }
                y += cellHeight;
            }
            if (y < tableStartY + tableHeight -1) { // Draw line until the last logical cell
                doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
            }
        });
        y = tableStartY + tableHeight; // Ensure y is at table bottom

        y += 15; // Spacing

        doc.setFontSize(10);
        doc.text(`RECEBI OS BENS DEPOSITADOS EM: ${dataHoje}`, MARGIN_LEFT + 2, y);
        y += 25;

        doc.setLineWidth(0.3);
        doc.line(MARGIN_LEFT + 40, y, PAGE_WIDTH - MARGIN_RIGHT - 40, y);
        doc.text(nomeDepositario, PAGE_WIDTH / 2, y + 5, { align: 'center' });
        doc.text("Fiel Depositário", PAGE_WIDTH / 2, y + 10, { align: 'center' });
        y += 25;

        // Testemunha details (simplified for brevity)
        const testemunha = data.testemunhas?.find((t: any) => t?.nome?.trim());
        doc.setFont('helvetica', 'bold'); doc.text(`TESTEMUNHA`, MARGIN_LEFT + 2, y); y += 7;
        doc.setFont('helvetica', 'normal'); doc.text(`NOME: ${ensureAndProcessText(testemunha?.nome)}`, MARGIN_LEFT + 2, y); y += 7;
        doc.text(`ASSINATURA: _________________________________________`, MARGIN_LEFT + 2, y); y += 15;


        // Condutor details (simplified for brevity)
        const condutor = data.componentesGuarnicao?.find((c: any) => c?.nome?.trim() && !c.apoio) || data.componentesGuarnicao?.[0];
        doc.setFont('helvetica', 'bold'); doc.text(`CONDUTOR DA OCORRÊNCIA`, MARGIN_LEFT + 2, y); y += 7;
        doc.setFont('helvetica', 'normal'); doc.text(`NOME COMPLETO: ${ensureAndProcessText(condutor?.nome)}`, MARGIN_LEFT + 2, y); y += 7;
        doc.text(`POSTO/GRADUAÇÃO: ${ensureAndProcessText(condutor?.posto)}`, MARGIN_LEFT + 2, y); y += 7;
        doc.text(`ASSINATURA: _________________________________________`, MARGIN_LEFT + 2, y);

        addStandardFooterContent(doc); // Ensure footer is added
        console.log("[addTermoDeposito] Geração do conteúdo do Termo de Depósito CONCLUÍDA para:", depositario.nome);

    } catch (error) {
        console.error("[addTermoDeposito] ERRO INTERNO durante a geração do conteúdo:", error, error.stack);
    }
};
