
import jsPDF from 'jspdf';
import { getPageConstants, addNewPage, addStandardFooterContent } from './pdfUtils.js';

// Helper function to ensure text is a valid string
const ensureValidText = (text: any): string => {
    if (text === undefined || text === null) return '';
    return String(text).trim();
};

const drawTableCell = (doc: jsPDF, text: string, x: number, y: number, width: number, height: number) => {
    doc.rect(x, y, width, height);
    doc.text(ensureValidText(text), x + 2, y + height / 2, { baseline: 'middle' });
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
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text("TERMO DE DEPÓSITO", PAGE_WIDTH / 2, y, { align: 'center' });
            y += 15;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const text = `Nomeio como fiel depositário, ficando ciente de que não poderá vender, usufruir, emprestar os bens mencionados, conforme os artigos 647 e 648 do CC.`;
            const textLines = doc.splitTextToSize(text, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT);
            doc.text(textLines, MARGIN_LEFT, y);
            y += textLines.length * 4 + 8;
            
            const now = new Date();
            const dataHoje = now.toLocaleDateString('pt-BR');
            const horaAtual = now.toTimeString().slice(0, 5);
            const cellHeight = 8;
            
            doc.rect(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, cellHeight * 8); // Container for table
            
            const line = (yPos: number) => doc.line(MARGIN_LEFT, yPos, PAGE_WIDTH - MARGIN_RIGHT, yPos);
            const write = (txt: string, yPos: number, xPos = MARGIN_LEFT + 2) => doc.text(ensureValidText(txt), xPos, yPos);

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

            write(`NOME OU RAZÃO SOCIAL: ${nomeDepositario}`, y + 5); y += cellHeight; line(y);
            write(`CPF/CNPJ: ${cpfDepositario}`, y + 5); y += cellHeight; line(y);
            write(`FILIAÇÃO PAI: ${filiacaoPaiDepositario}`, y + 5); y += cellHeight; line(y);
            write(`FILIAÇÃO MÃE: ${filiacaoMaeDepositario}`, y + 5); y += cellHeight; line(y);
            
            const Bairro = depositario.endereco ? 
                (ensureValidText(depositario.endereco).split(',').pop() || '').trim() || 'NÃO INFORMADO'
                : 'NÃO INFORMADO';
                
            write(`ENDEREÇO: ${enderecoDepositario}`, y + 5); 
            write(`BAIRRO: ${Bairro}`, MARGIN_LEFT + 120, y + 5); 
            y += cellHeight; line(y);

            write(`MUNICÍPIO: Várzea Grande`, y + 5);
            write(`UF: MT`, MARGIN_LEFT + 60, y + 5);
            write(`CEP: [Não informado]`, MARGIN_LEFT + 90, y + 5);
            write(`TEL: ${celularDepositario}`, MARGIN_LEFT + 140, y + 5);
            y += cellHeight; line(y);

            write(`LOCAL DO DEPÓSITO: ${enderecoDepositario}`, y + 5);
            write(`DATA: ${dataHoje}`, MARGIN_LEFT + 120, y + 5);
            write(`HORA: ${horaAtual}`, MARGIN_LEFT + 160, y + 5);
            y += cellHeight; line(y);

            // Write description directly with safe fallback
            write(`DESCRIÇÃO DO BEM: ${objetoDepositadoText}`, y + 5);
            y += cellHeight;

            y += 15;
            write(`RECEBI OS BENS DEPOSITADOS EM: ${dataHoje}`, y); y += 25;
            
            // Fiel Depositario Signature - using doc.line directly
            doc.setLineWidth(0.3);
            doc.line(MARGIN_LEFT + 40, y, PAGE_WIDTH - MARGIN_RIGHT - 40, y);
            doc.text(nomeDepositario, PAGE_WIDTH / 2, y + 5, { align: 'center' });
            doc.text("Fiel Depositário", PAGE_WIDTH / 2, y + 10, { align: 'center' });
            y += 25;

            // Testemunha
            const testemunha = data.testemunhas?.find((t: any) => t && t.nome && t.nome.trim() !== "");
            doc.setFont('helvetica', 'bold');
            write(`TESTEMUNHA`, y); y += 7;
            doc.setFont('helvetica', 'normal');
            write(`NOME: ${testemunha ? testemunha.nome.toUpperCase() : 'NÃO INFORMADO'}`, y); y += 7;
            write(`CPF: ${testemunha ? testemunha.cpf || 'Não informado' : 'Não informado'}`, y); y += 7;
            write(`ASSINATURA: _________________________________________`, y); y += 15;

            // Condutor
            const condutor = data.componentesGuarnicao?.find((c: any) => c && c.nome && c.posto && !c.apoio) || data.componentesGuarnicao?.[0];
            doc.setFont('helvetica', 'bold');
            write(`CONDUTOR DA OCORRÊNCIA`, y); y += 7;
            doc.setFont('helvetica', 'normal');
            if (condutor) {
                const nomeCondutor = condutor.nome ? condutor.nome.toUpperCase() : 'NÃO INFORMADO';
                const postoCondutor = condutor.posto ? condutor.posto.toUpperCase() : 'NÃO INFORMADO';
                const rgCondutor = condutor.rg || 'NÃO INFORMADO';
                
                write(`NOME COMPLETO: ${nomeCondutor}`, y); y += 7;
                write(`POSTO/GRADUAÇÃO: ${postoCondutor}`, y); y += 7;
                write(`RG PMMT: ${rgCondutor}`, y); y += 7;
            } else {
                write(`NOME COMPLETO: NÃO INFORMADO`, y); y += 7;
                write(`POSTO/GRADUAÇÃO: NÃO INFORMADO`, y); y += 7;
                write(`RG PMMT: NÃO INFORMADO`, y); y += 7;
            }
            
            write(`ASSINATURA: _________________________________________`, y);
            
            addStandardFooterContent(doc);
        } catch (error) {
            console.error("Erro ao gerar termo de depósito:", error);
            // Continue processing other depositários if possible
        }
    });
};
