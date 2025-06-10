// PDFtermoDeposito.ts
import jsPDF from 'jspdf';
import { getPageConstants, addNewPage, addStandardFooterContent } from './pdfUtils.js';

// Helper function to ensure text is a valid string and then process it
const ensureAndProcessText = (text: any, toUpperCase = true, fallback = 'NÃO INFORMADO'): string => {
    if (typeof text === 'string' && text.trim() !== '') {
        const trimmedText = text.trim();
        return toUpperCase ? trimmedText.toUpperCase() : trimmedText;
    }
    return fallback;
};


export const addTermoDeposito = (doc: jsPDF, data: any) => {
    const { PAGE_WIDTH, MARGIN_LEFT, MARGIN_RIGHT } = getPageConstants(doc);

    const depositarios = data.autores?.filter((a: any) => {
        // Filter ensures a.nome is a non-empty string and fielDepositario is 'Sim'
        return a && typeof a.fielDepositario === 'string' && a.fielDepositario.trim().toLowerCase() === 'sim' &&
               typeof a.nome === 'string' && a.nome.trim() !== '';
    }) || [];
    
    if (depositarios.length === 0) return;

    depositarios.forEach((depositario: any) => {
        try {
            let y = addNewPage(doc, data);
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text("TERMO DE DEPÓSITO", PAGE_WIDTH / 2, y, { align: 'center' });
            y += 15;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const introText = `Nomeio como fiel depositário, ficando ciente de que não poderá vender, usufruir, emprestar os bens mencionados, conforme os artigos 647 e 648 do CC.`;
            const introTextLines = doc.splitTextToSize(introText, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT);
            doc.text(introTextLines, MARGIN_LEFT, y);
            y += introTextLines.length * 4 + 8; // Assuming line height of 4mm approx
            
            const now = new Date();
            const dataHoje = now.toLocaleDateString('pt-BR');
            const horaAtual = now.toTimeString().slice(0, 5);
            const cellHeight = 8;
            
            // Robustly get and process depositario data
            const nomeDepositario = ensureAndProcessText(depositario.nome); // Already filtered for string
            const cpfDepositario = ensureAndProcessText(depositario.cpf, false, 'Não informado');
            const filiacaoPaiDepositario = ensureAndProcessText(depositario.filiacaoPai);
            const filiacaoMaeDepositario = ensureAndProcessText(depositario.filiacaoMae);
            const enderecoDepositario = ensureAndProcessText(depositario.endereco);
            const celularDepositario = ensureAndProcessText(depositario.celular, false, 'Não informado');
            const objetoDepositadoText = ensureAndProcessText(depositario.objetoDepositado);
            
            const bairro = typeof depositario.endereco === 'string' && depositario.endereco.trim() !== '' ?
                (depositario.endereco.trim().split(',').pop() || '').trim().toUpperCase() || 'NÃO INFORMADO'
                : 'NÃO INFORMADO';

            const tableHeight = cellHeight * 8;
            doc.rect(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, tableHeight);
            
            doc.setFontSize(8);
            
            doc.text(`NOME OU RAZÃO SOCIAL: ${nomeDepositario}`, MARGIN_LEFT + 2, y + 5);
            y += cellHeight;
            doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
            
            doc.text(`CPF/CNPJ: ${cpfDepositario}`, MARGIN_LEFT + 2, y + 5);
            y += cellHeight;
            doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
            
            doc.text(`FILIAÇÃO PAI: ${filiacaoPaiDepositario}`, MARGIN_LEFT + 2, y + 5);
            y += cellHeight;
            doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
            
            doc.text(`FILIAÇÃO MÃE: ${filiacaoMaeDepositario}`, MARGIN_LEFT + 2, y + 5);
            y += cellHeight;
            doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
            
            doc.text(`ENDEREÇO: ${enderecoDepositario}`, MARGIN_LEFT + 2, y + 5);
            doc.text(`BAIRRO: ${bairro}`, MARGIN_LEFT + 120, y + 5);
            y += cellHeight;
            doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

            doc.text(`MUNICÍPIO: Várzea Grande`, MARGIN_LEFT + 2, y + 5);
            doc.text(`UF: MT`, MARGIN_LEFT + 60, y + 5);
            doc.text(`CEP: [Não informado]`, MARGIN_LEFT + 90, y + 5); // CEP not in data model
            doc.text(`TEL: ${celularDepositario}`, MARGIN_LEFT + 140, y + 5);
            y += cellHeight;
            doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

            doc.text(`LOCAL DO DEPÓSITO: ${enderecoDepositario}`, MARGIN_LEFT + 2, y + 5);
            doc.text(`DATA: ${dataHoje}`, MARGIN_LEFT + 120, y + 5);
            doc.text(`HORA: ${horaAtual}`, MARGIN_LEFT + 160, y + 5);
            y += cellHeight;
            doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

            doc.text(`DESCRIÇÃO DO BEM: ${objetoDepositadoText}`, MARGIN_LEFT + 2, y + 5);
            y += cellHeight; // End of table content

            y += 15;
            
            doc.setFontSize(10);
            doc.text(`RECEBI OS BENS DEPOSITADOS EM: ${dataHoje}`, MARGIN_LEFT + 2, y);
            y += 25;
            
            doc.setLineWidth(0.3);
            doc.line(MARGIN_LEFT + 40, y, PAGE_WIDTH - MARGIN_RIGHT - 40, y);
            doc.text(nomeDepositario, PAGE_WIDTH / 2, y + 5, { align: 'center' });
            doc.text("Fiel Depositário", PAGE_WIDTH / 2, y + 10, { align: 'center' });
            y += 25;

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

            const condutor = data.componentesGuarnicao?.find((c: any) => c && typeof c.nome === 'string' && c.nome.trim() !== '' && typeof c.posto === 'string' && c.posto.trim() !== '' && !c.apoio) || 
                             data.componentesGuarnicao?.find((c: any) => c && typeof c.nome === 'string' && c.nome.trim() !== '' && typeof c.posto === 'string' && c.posto.trim() !== ''); // Fallback to any valid
            
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
        } catch (error) {
            console.error("Erro ao gerar termo de depósito para um depositário:", error);
            // Optionally, you could add a fallback page here indicating an error for this specific term.
        }
    });
};
