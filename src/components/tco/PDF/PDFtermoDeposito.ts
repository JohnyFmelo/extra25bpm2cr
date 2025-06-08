import jsPDF from 'jspdf';
import { getPageConstants, addNewPage, addStandardFooterContent, addLine } from './pdfUtils.js';

const drawTableCell = (doc: jsPDF, text: string, x: number, y: number, width: number, height: number) => {
    doc.rect(x, y, width, height);
    doc.text(text, x + 2, y + height / 2, { baseline: 'middle' });
};

export const addTermoDeposito = (doc: jsPDF, data: any) => {
    const { PAGE_WIDTH, MARGIN_LEFT, MARGIN_RIGHT } = getPageConstants(doc);

    const depositarios = data.autores.filter((a: any) => a.fielDepositario === 'Sim');
    if (depositarios.length === 0) return;

    depositarios.forEach((depositario: any) => {
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
        const write = (txt: string, yPos: number, xPos = MARGIN_LEFT + 2) => doc.text(txt, xPos, yPos);

        write(`NOME OU RAZÃO SOCIAL: ${depositario.nome.toUpperCase()}`, y + 5); y += cellHeight; line(y);
        write(`CPF/CNPJ: ${depositario.cpf || 'Não informado'}`, y + 5); y += cellHeight; line(y);
        write(`FILIAÇÃO PAI: ${depositario.filiacaoPai.toUpperCase() || 'NÃO INFORMADO'}`, y + 5); y += cellHeight; line(y);
        write(`FILIAÇÃO MÃE: ${depositario.filiacaoMae.toUpperCase() || 'NÃO INFORMADO'}`, y + 5); y += cellHeight; line(y);
        
        const Bairro = (depositario.endereco.split(',').pop() || '').trim().toUpperCase() || 'NÃO INFORMADO';
        write(`ENDEREÇO: ${depositario.endereco.toUpperCase() || 'NÃO INFORMADO'}`, y + 5); 
        write(`BAIRRO: ${Bairro}`, MARGIN_LEFT + 120, y + 5); 
        y += cellHeight; line(y);

        write(`MUNICÍPIO: Várzea Grande`, y + 5);
        write(`UF: MT`, MARGIN_LEFT + 60, y + 5);
        write(`CEP: [Não informado]`, MARGIN_LEFT + 90, y + 5);
        write(`TEL: ${depositario.celular || 'Não informado'}`, MARGIN_LEFT + 140, y + 5);
        y += cellHeight; line(y);

        write(`LOCAL DO DEPÓSITO: ${depositario.endereco.toUpperCase()}`, y + 5);
        write(`DATA: ${dataHoje}`, MARGIN_LEFT + 120, y + 5);
        write(`HORA: ${horaAtual}`, MARGIN_LEFT + 160, y + 5);
        y += cellHeight; line(y);

        const descLines = doc.splitTextToSize(depositario.objetoDepositado.toUpperCase(), PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - 35);
        write(`DESCRIÇÃO DO BEM: ${descLines[0]}`, y + 5);
        if(descLines.length > 1) {
            doc.text(descLines.slice(1), MARGIN_LEFT + 35, y + 10);
        }
        y += cellHeight;

        y += 15;
        write(`RECEBI OS BENS DEPOSITADOS EM: ${dataHoje}`, y); y += 25;
        
        // Fiel Depositario Signature
        addLine(doc, MARGIN_LEFT + 40, y, PAGE_WIDTH - MARGIN_RIGHT - 40);
        doc.text(`${depositario.nome.toUpperCase()}`, PAGE_WIDTH / 2, y + 5, { align: 'center' });
        doc.text("Fiel Depositário", PAGE_WIDTH / 2, y + 10, { align: 'center' });
        y += 25;

        // Testemunha
        const testemunha = data.testemunhas?.find((t: any) => t.nome && t.nome.trim() !== "");
        doc.setFont('helvetica', 'bold');
        write(`TESTEMUNHA`, y); y += 7;
        doc.setFont('helvetica', 'normal');
        write(`NOME: ${testemunha ? testemunha.nome.toUpperCase() : ''}`, y); y += 7;
        write(`CPF: ${testemunha ? testemunha.cpf : ''}`, y); y += 7;
        write(`ASSINATURA: _________________________________________`, y); y += 15;

        // Condutor
        const condutor = data.componentesGuarnicao?.find((c: any) => c.nome && c.posto && !c.apoio) || data.componentesGuarnicao[0];
        doc.setFont('helvetica', 'bold');
        write(`CONDUTOR DA OCORRÊNCIA`, y); y += 7;
        doc.setFont('helvetica', 'normal');
        if (condutor) {
            write(`NOME COMPLETO: ${condutor.nome.toUpperCase()}`, y); y += 7;
            write(`POSTO/GRADUAÇÃO: ${condutor.posto.toUpperCase()}`, y); y += 7;
            write(`RG PMMT: ${condutor.rg}`, y); y += 7;
        }
        write(`ASSINATURA: _________________________________________`, y);
        
        addStandardFooterContent(doc);
    });
};
