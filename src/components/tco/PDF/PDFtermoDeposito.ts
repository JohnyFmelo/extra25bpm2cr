
// PDFtermoDeposito.ts
import jsPDF from 'jspdf';
import { getPageConstants, addNewPage, addStandardFooterContent } from './pdfUtils.js';

// Helper function to ensure text is a valid string and then process it
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
    const { PAGE_WIDTH, MARGIN_LEFT, MARGIN_RIGHT, MAX_LINE_WIDTH } = getPageConstants(doc);

    console.log("Iniciando geração do Termo de Depósito");
    console.log("Dados dos autores:", JSON.stringify(data.autores, null, 2));

    // Find the FIRST author who is designated as a faithful depositary
    const depositario = data.autores?.find((a: any) => {
        const isValidDepo = a && 
            typeof a.fielDepositario === 'string' && 
            a.fielDepositario.trim().toLowerCase() === 'sim' &&
            typeof a.nome === 'string' && 
            a.nome.trim() !== '';
        
        console.log(`Verificando autor ${a?.nome}: fielDepositario="${a?.fielDepositario}", válido=${isValidDepo}`);
        return isValidDepo;
    });

    if (!depositario) {
        console.log("Nenhum fiel depositário qualificado encontrado para o Termo de Depósito.");
        return;
    }

    console.log("Fiel depositário encontrado:", depositario.nome);

    try {
        let y = addNewPage(doc, data);
        console.log("Posição Y inicial após addNewPage:", y);

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("TERMO DE DEPÓSITO", PAGE_WIDTH / 2, y, { align: 'center' });
        y += 15;
        console.log("Posição Y após título:", y);

        // Introduction text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const introText = `Nomeio como fiel depositário, ficando ciente de que não poderá vender, usufruir, emprestar os bens mencionados, conforme os artigos 647 e 648 do CC.`;
        const introTextLines = doc.splitTextToSize(introText, MAX_LINE_WIDTH);
        doc.text(introTextLines, MARGIN_LEFT, y);
        y += (introTextLines.length * 4) + 8;
        console.log("Posição Y após texto introdutório:", y);

        // Current date and time
        const now = new Date();
        const dataHoje = now.toLocaleDateString('pt-BR');
        const horaAtual = now.toTimeString().slice(0, 5);

        // Process depositario data
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

        console.log("Dados processados do depositário:", {
            nome: nomeDepositario,
            cpf: cpfDepositario,
            endereco: enderecoDepositario,
            objeto: objetoDepositadoText
        });

        // Start table section
        const tableStartY = y;
        const rowHeight = 8;
        
        // Table header and structure similar to Termo de Apreensão
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        // Table border
        const tableWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
        const tableHeight = rowHeight * 8; // 8 rows
        doc.rect(MARGIN_LEFT, tableStartY, tableWidth, tableHeight);
        
        let currentY = tableStartY;
        
        // Row 1: Nome
        currentY += rowHeight;
        doc.text(`NOME OU RAZÃO SOCIAL: ${nomeDepositario}`, MARGIN_LEFT + 2, currentY - 3);
        doc.line(MARGIN_LEFT, currentY, PAGE_WIDTH - MARGIN_RIGHT, currentY);
        
        // Row 2: CPF
        currentY += rowHeight;
        doc.text(`CPF/CNPJ: ${cpfDepositario}`, MARGIN_LEFT + 2, currentY - 3);
        doc.line(MARGIN_LEFT, currentY, PAGE_WIDTH - MARGIN_RIGHT, currentY);
        
        // Row 3: Filiação Pai
        currentY += rowHeight;
        doc.text(`FILIAÇÃO PAI: ${filiacaoPaiDepositario}`, MARGIN_LEFT + 2, currentY - 3);
        doc.line(MARGIN_LEFT, currentY, PAGE_WIDTH - MARGIN_RIGHT, currentY);
        
        // Row 4: Filiação Mãe
        currentY += rowHeight;
        doc.text(`FILIAÇÃO MÃE: ${filiacaoMaeDepositario}`, MARGIN_LEFT + 2, currentY - 3);
        doc.line(MARGIN_LEFT, currentY, PAGE_WIDTH - MARGIN_RIGHT, currentY);
        
        // Row 5: Endereço e Bairro
        currentY += rowHeight;
        doc.text(`ENDEREÇO: ${enderecoDepositario}`, MARGIN_LEFT + 2, currentY - 3);
        doc.text(`BAIRRO: ${bairro}`, MARGIN_LEFT + 120, currentY - 3);
        doc.line(MARGIN_LEFT, currentY, PAGE_WIDTH - MARGIN_RIGHT, currentY);
        
        // Row 6: Município, UF, CEP, Tel
        currentY += rowHeight;
        doc.text(`MUNICÍPIO: Várzea Grande`, MARGIN_LEFT + 2, currentY - 3);
        doc.text(`UF: MT`, MARGIN_LEFT + 60, currentY - 3);
        doc.text(`CEP: [Não informado]`, MARGIN_LEFT + 90, currentY - 3);
        doc.text(`TEL: ${celularDepositario}`, MARGIN_LEFT + 140, currentY - 3);
        doc.line(MARGIN_LEFT, currentY, PAGE_WIDTH - MARGIN_RIGHT, currentY);
        
        // Row 7: Local do depósito, data e hora
        currentY += rowHeight;
        doc.text(`LOCAL DO DEPÓSITO: ${enderecoDepositario}`, MARGIN_LEFT + 2, currentY - 3);
        doc.text(`DATA: ${dataHoje}`, MARGIN_LEFT + 120, currentY - 3);
        doc.text(`HORA: ${horaAtual}`, MARGIN_LEFT + 160, currentY - 3);
        doc.line(MARGIN_LEFT, currentY, PAGE_WIDTH - MARGIN_RIGHT, currentY);
        
        // Row 8: Descrição do bem
        currentY += rowHeight;
        doc.text(`DESCRIÇÃO DO BEM: ${objetoDepositadoText}`, MARGIN_LEFT + 2, currentY - 3);
        
        // Update Y position to after the table
        y = tableStartY + tableHeight + 15;
        console.log("Posição Y após tabela:", y);

        // Receipt confirmation
        doc.setFontSize(10);
        doc.text(`RECEBI OS BENS DEPOSITADOS EM: ${dataHoje}`, MARGIN_LEFT + 2, y);
        y += 25;

        // Fiel Depositario Signature
        doc.setLineWidth(0.3);
        doc.line(MARGIN_LEFT + 40, y, PAGE_WIDTH - MARGIN_RIGHT - 40, y);
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
            data.componentesGuarnicao?.find((c: any) => c && typeof c.nome === 'string' && c.nome.trim() !== '' && typeof c.posto === 'string' && c.posto.trim() !== '');

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

        addStandardFooterContent(doc);
        console.log("Termo de Depósito gerado com sucesso para:", nomeDepositario);

    } catch (error) {
        console.error("Erro detalhado ao gerar Termo de Depósito:", error);
        console.error("Stack trace:", error.stack);
    }
};
