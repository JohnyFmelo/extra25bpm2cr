
import jsPDF from 'jspdf';
import { getPageConstants, addNewPage, addStandardFooterContent } from './pdfUtils.js';

// Helper function to ensure text is a valid string
const ensureValidText = (text: any): string => {
    if (text === undefined || text === null) return '';
    return String(text).trim();
};

export const addTermoDeposito = (doc: jsPDF, data: any) => {
    const { PAGE_WIDTH, MARGIN_LEFT, MARGIN_RIGHT } = getPageConstants(doc);

    // Filter authors who are designated as faithful depositary, with better validation
    const depositarios = data.autores?.filter((a: any) => {
        return a && a.fielDepositario === 'Sim' && a.nome && a.nome.trim() !== '';
    }) || [];
    
    if (depositarios.length === 0) return;

    depositarios.forEach((depositario: any) => {
        try {
            let y = addNewPage(doc, data);
            
            // Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text("TERMO DE DEPÓSITO", PAGE_WIDTH / 2, y, { align: 'center' });
            y += 15;

            // Introduction text
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const text = `Nomeio como fiel depositário, ficando ciente de que não poderá vender, usufruir, emprestar os bens mencionados, conforme os artigos 647 e 648 do CC.`;
            const textLines = doc.splitTextToSize(text, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT);
            doc.text(textLines, MARGIN_LEFT, y);
            y += textLines.length * 4 + 8;
            
            // Current date and time
            const now = new Date();
            const dataHoje = now.toLocaleDateString('pt-BR');
            const horaAtual = now.toTimeString().slice(0, 5);
            const cellHeight = 8;
            
            // Ensure all values have fallbacks
            const nomeDepositario = depositario.nome ? depositario.nome.toUpperCase() : 'NÃO INFORMADO';
            const cpfDepositario = depositario.cpf || 'Não informado';
            const filiacaoPaiDepositario = depositario.filiacaoPai ? depositario.filiacaoPai.toUpperCase() : 'NÃO INFORMADO';
            const filiacaoMaeDepositario = depositario.filiacaoMae ? depositario.filiacaoMae.toUpperCase() : 'NÃO INFORMADO';
            const enderecoDepositario = depositario.endereco ? depositario.endereco.toUpperCase() : 'NÃO INFORMADO';
            const celularDepositario = depositario.celular || 'Não informado';
            
            // Ensure objetoDepositadoText is a valid string and has a default value if empty
            let objetoDepositadoText = 'NÃO INFORMADO';
            if (depositario.objetoDepositado && typeof depositario.objetoDepositado === 'string') {
                const trimmed = depositario.objetoDepositado.trim();
                if (trimmed !== '') {
                    objetoDepositadoText = trimmed.toUpperCase();
                }
            }

            // Draw table container
            const tableHeight = cellHeight * 8;
            doc.rect(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, tableHeight);
            
            // Table content
            doc.setFontSize(8);
            
            // Line 1: Nome
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
            const bairro = depositario.endereco ? 
                (ensureValidText(depositario.endereco).split(',').pop() || '').trim() || 'NÃO INFORMADO'
                : 'NÃO INFORMADO';
                
            doc.text(`ENDEREÇO: ${enderecoDepositario}`, MARGIN_LEFT + 2, y + 5);
            doc.text(`BAIRRO: ${bairro}`, MARGIN_LEFT + 120, y + 5);
            y += cellHeight;
            doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

            // Line 6: Município, UF, CEP, Tel
            doc.text(`MUNICÍPIO: Várzea Grande`, MARGIN_LEFT + 2, y + 5);
            doc.text(`UF: MT`, MARGIN_LEFT + 60, y + 5);
            doc.text(`CEP: [Não informado]`, MARGIN_LEFT + 90, y + 5);
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
            doc.text(`DESCRIÇÃO DO BEM: ${objetoDepositadoText}`, MARGIN_LEFT + 2, y + 5);
            y += cellHeight;

            y += 15;
            
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

            // Testemunha
            const testemunha = data.testemunhas?.find((t: any) => t && t.nome && t.nome.trim() !== "");
            doc.setFont('helvetica', 'bold');
            doc.text(`TESTEMUNHA`, MARGIN_LEFT + 2, y);
            y += 7;
            doc.setFont('helvetica', 'normal');
            doc.text(`NOME: ${testemunha ? testemunha.nome.toUpperCase() : 'NÃO INFORMADO'}`, MARGIN_LEFT + 2, y);
            y += 7;
            doc.text(`CPF: ${testemunha ? testemunha.cpf || 'Não informado' : 'Não informado'}`, MARGIN_LEFT + 2, y);
            y += 7;
            doc.text(`ASSINATURA: _________________________________________`, MARGIN_LEFT + 2, y);
            y += 15;

            // Condutor
            const condutor = data.componentesGuarnicao?.find((c: any) => c && c.nome && c.posto && !c.apoio) || data.componentesGuarnicao?.[0];
            doc.setFont('helvetica', 'bold');
            doc.text(`CONDUTOR DA OCORRÊNCIA`, MARGIN_LEFT + 2, y);
            y += 7;
            doc.setFont('helvetica', 'normal');
            if (condutor) {
                const nomeCondutor = condutor.nome ? condutor.nome.toUpperCase() : 'NÃO INFORMADO';
                const postoCondutor = condutor.posto ? condutor.posto.toUpperCase() : 'NÃO INFORMADO';
                const rgCondutor = condutor.rg || 'NÃO INFORMADO';
                
                doc.text(`NOME COMPLETO: ${nomeCondutor}`, MARGIN_LEFT + 2, y);
                y += 7;
                doc.text(`POSTO/GRADUAÇÃO: ${postoCondutor}`, MARGIN_LEFT + 2, y);
                y += 7;
                doc.text(`RG PMMT: ${rgCondutor}`, MARGIN_LEFT + 2, y);
                y += 7;
            } else {
                doc.text(`NOME COMPLETO: NÃO INFORMADO`, MARGIN_LEFT + 2, y);
                y += 7;
                doc.text(`POSTO/GRADUAÇÃO: NÃO INFORMADO`, MARGIN_LEFT + 2, y);
                y += 7;
                doc.text(`RG PMMT: NÃO INFORMADO`, MARGIN_LEFT + 2, y);
                y += 7;
            }
            
            doc.text(`ASSINATURA: _________________________________________`, MARGIN_LEFT + 2, y);
            
            addStandardFooterContent(doc);
        } catch (error) {
            console.error("Erro ao gerar termo de depósito:", error);
            // Continue processing other depositários if possible
        }
    });
};
