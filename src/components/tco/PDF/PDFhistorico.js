import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addSectionTitle, addField, addWrappedText, formatarDataHora, formatarDataSimples,
    checkPageBreak, addSignatureWithNameAndRole
} from './pdfUtils.js';
import QRCode from 'qrcode';

/**
 * Gera o conteúdo das seções 1 a 5 do TCO.
 * Assume que começa após uma chamada a `addNewPage`.
 * Retorna a posição Y final após adicionar todo o conteúdo.
 */
export const generateHistoricoContent = async (doc, currentY, data) => {
    let yPos = currentY;
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);

    // --- SEÇÃO 1: DADOS GERAIS ---
    yPos = addSectionTitle(doc, yPos, "DADOS GERAIS E IDENTIFICADORES DA OCORRÊNCIA", "1", 1, data);
    yPos = addField(doc, yPos, "NATUREZA DA OCORRÊNCIA", data.natureza, data);
    yPos = addField(doc, yPos, "TIPIFICAÇÃO LEGAL", data.tipificacao, data);
    yPos = addField(doc, yPos, "DATA E HORA DO FATO", formatarDataHora(data.dataFato, data.horaFato), data);
    yPos = addField(doc, yPos, "DATA E HORA DO INÍCIO DO REGISTRO", formatarDataHora(data.dataInicioRegistro, data.horaInicioRegistro), data);
    yPos = addField(doc, yPos, "DATA E HORA DO TÉRMINO DO REGISTRO", formatarDataHora(data.dataTerminoRegistro, data.horaTerminoRegistro), data);
    yPos = addField(doc, yPos, "LOCAL DO FATO", data.localFato, data);
    yPos = addField(doc, yPos, "ENDEREÇO", data.endereco, data);
    yPos = addField(doc, yPos, "MUNICÍPIO", data.municipio, data);
    yPos = addField(doc, yPos, "COMUNICANTE", data.comunicante, data);

    // --- SEÇÃO 2: ENVOLVIDOS ---
    yPos = addSectionTitle(doc, yPos, "ENVOLVIDOS", "2", 1, data);

    // Seção 2.1: Autor(es) - Ajusta singular/plural
    const autoresValidos = data.autores ? data.autores.filter(a => a?.nome) : [];
    const autorTitle = autoresValidos.length === 1 ? "AUTOR DO FATO" : "AUTORES DO FATO";
    yPos = addSectionTitle(doc, yPos, autorTitle, "2.1", 2, data);
    if (autoresValidos.length > 0) {
        autoresValidos.forEach((autor, index) => {
            if (index > 0) {
                yPos += 3; yPos = checkPageBreak(doc, yPos, 5, data);
                doc.setLineWidth(0.1); doc.setDrawColor(150);
                doc.line(MARGIN_LEFT, yPos - 1, PAGE_WIDTH - MARGIN_RIGHT, yPos - 1);
                doc.setDrawColor(0); yPos += 2;
            }
            yPos = addField(doc, yPos, "NOME", autor.nome, data);
            yPos = addField(doc, yPos, "SEXO", autor.sexo, data);
            yPos = addField(doc, yPos, "ESTADO CIVIL", autor.estadoCivil, data);
            yPos = addField(doc, yPos, "PROFISSÃO", autor.profissao, data);
            yPos = addField(doc, yPos, "ENDEREÇO", autor.endereco, data);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(autor.dataNascimento), data);
            yPos = addField(doc, yPos, "NATURALIDADE", autor.naturalidade, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", autor.filiacaoMae, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", autor.filiacaoPai, data);
            yPos = addField(doc, yPos, "RG", autor.rg, data);
            yPos = addField(doc, yPos, "CPF", autor.cpf, data);
            yPos = addField(doc, yPos, "CELULAR", autor.celular, data);
            yPos = addField(doc, yPos, "E-MAIL", autor.email, data);
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhum autor informado.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // Seção 2.2: Vítima(s)
    const vitimasValidas = data.vitimas ? data.vitimas.filter(v => v?.nome) : [];
    const vitimaTitle = vitimasValidas.length === 1 ? "VÍTIMA" : "VÍTIMAS";
    yPos = addSectionTitle(doc, yPos, vitimaTitle, "2.2", 2, data);
    if (vitimasValidas.length > 0 && data.natureza !== "Porte de drogas para consumo") {
        vitimasValidas.forEach((vitima, index) => {
            if (index > 0) {
                yPos += 3; yPos = checkPageBreak(doc, yPos, 5, data);
                doc.setLineWidth(0.1); doc.setDrawColor(150);
                doc.line(MARGIN_LEFT, yPos - 1, PAGE_WIDTH - MARGIN_RIGHT, yPos - 1);
                doc.setDrawColor(0); yPos += 2;
            }
            yPos = addField(doc, yPos, "NOME", vitima.nome, data);
            yPos = addField(doc, yPos, "SEXO", vitima.sexo, data);
            yPos = addField(doc, yPos, "ESTADO CIVIL", vitima.estadoCivil, data);
            yPos = addField(doc, yPos, "PROFISSÃO", vitima.profissao, data);
            yPos = addField(doc, yPos, "ENDEREÇO", vitima.endereco, data);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(vitima.dataNascimento), data);
            yPos = addField(doc, yPos, "NATURALIDADE", vitima.naturalidade, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", vitima.filiacaoMae, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", vitima.filiacaoPai, data);
            yPos = addField(doc, yPos, "RG", vitima.rg, data);
            yPos = addField(doc, yPos, "CPF", vitima.cpf, data);
            yPos = addField(doc, yPos, "CELULAR", vitima.celular, data);
            yPos = addField(doc, yPos, "E-MAIL", vitima.email, data);
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhuma vítima informada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // Seção 2.3: Testemunha(s)
    const testemunhasValidas = data.testemunhas ? data.testemunhas.filter(t => t?.nome) : [];
    const testemunhaTitle = testemunhasValidas.length === 1 ? "TESTEMUNHA" : "TESTEMUNHAS";
    yPos = addSectionTitle(doc, yPos, testemunhaTitle, "2.3", 2, data);
    if (testemunhasValidas.length > 0) {
        testemunhasValidas.forEach((testemunha, index) => {
            if (index > 0) {
                yPos += 3; yPos = checkPageBreak(doc, yPos, 5, data);
                doc.setLineWidth(0.1); doc.setDrawColor(150);
                doc.line(MARGIN_LEFT, yPos - 1, PAGE_WIDTH - MARGIN_RIGHT, yPos - 1);
                doc.setDrawColor(0); yPos += 2;
            }
            yPos = addField(doc, yPos, "NOME", testemunha.nome, data);
            yPos = addField(doc, yPos, "SEXO", testemunha.sexo, data);
            yPos = addField(doc, yPos, "ESTADO CIVIL", testemunha.estadoCivil, data);
            yPos = addField(doc, yPos, "PROFISSÃO", testemunha.profissao, data);
            yPos = addField(doc, yPos, "ENDEREÇO", testemunha.endereco, data);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(testemunha.dataNascimento), data);
            yPos = addField(doc, yPos, "NATURALIDADE", testemunha.naturalidade, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", testemunha.filiacaoMae, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", testemunha.filiacaoPai, data);
            yPos = addField(doc, yPos, "RG", testemunha.rg, data);
            yPos = addField(doc, yPos, "CPF", testemunha.cpf, data);
            yPos = addField(doc, yPos, "CELULAR", testemunha.celular, data);
            yPos = addField(doc, yPos, "E-MAIL", testemunha.email, data);
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhuma testemunha informada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // --- SEÇÃO 3: HISTÓRICO ---
    yPos = addSectionTitle(doc, yPos, "HISTÓRICO", "3", 1, data);

    // Seção 3.1: Relato Policial
    yPos = addSectionTitle(doc, yPos, "RELATO POLICIAL", "3.1", 2, data);
    if (data.relatoPolicial) {
        yPos = addWrappedText(doc, yPos, data.relatoPolicial, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 5;
        yPos = checkPageBreak(doc, yPos, 20, data);
        const policial = data.componentesGuarnicao && data.componentesGuarnicao[0] ?
            `${data.componentesGuarnicao[0].posto} PM ${data.componentesGuarnicao[0].nome}` : "Policial Responsável";
        yPos = addSignatureWithNameAndRole(doc, yPos, policial, "Condutor", data);
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhum relato policial informado.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // Seção 3.2: Relato do(s) Autor(es)
    yPos = addSectionTitle(doc, yPos, autorTitle, "3.2", 2, data);
    if (data.relatoAutor) {
        yPos = addWrappedText(doc, yPos, data.relatoAutor, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 5;
        yPos = checkPageBreak(doc, yPos, 20, data);
        autoresValidos.forEach((autor) => {
            yPos = addSignatureWithNameAndRole(doc, yPos, autor.nome, "Autor", data);
            yPos += 5; yPos = checkPageBreak(doc, yPos, 20, data);
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhum relato do autor informado.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // Seção 3.3: Relato da(s) Vítima(s)
    if (data.natureza !== "Porte de drogas para consumo") {
        yPos = addSectionTitle(doc, yPos, vitimaTitle, "3.3", 2, data);
        if (data.relatoVitima) {
            yPos = addWrappedText(doc, yPos, data.relatoVitima, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
            yPos += 2;
            if (data.representacao) {
                const repText = data.representacao === "representar" ?
                    "A vítima manifestou desejo de representar contra o(s) autor(es)." :
                    "A vítima optou por decidir sobre a representação posteriormente (prazo de 6 meses).";
                yPos = addWrappedText(doc, yPos, repText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
            }
            yPos += 5;
            yPos = checkPageBreak(doc, yPos, 20, data);
            vitimasValidas.forEach((vitima) => {
                yPos = addSignatureWithNameAndRole(doc, yPos, vitima.nome, "Vítima", data);
                yPos += 5; yPos = checkPageBreak(doc, yPos, 20, data);
            });
        } else {
            yPos = addWrappedText(doc, yPos, "Nenhum relato da vítima informado.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
            yPos += 2;
        }
    }

    // Seção 3.4: Relato da(s) Testemunha(s)
    yPos = addSectionTitle(doc, yPos, testemunhaTitle, "3.4", 2, data);
    if (data.relatoTestemunha) {
        yPos = addWrappedText(doc, yPos, data.relatoTestemunha, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 5;
        yPos = checkPageBreak(doc, yPos, 20, data);
        testemunhasValidas.forEach((testemunha) => {
            yPos = addSignatureWithNameAndRole(doc, yPos, testemunha.nome, "Testemunha", data);
            yPos += 5; yPos = checkPageBreak(doc, yPos, 20, data);
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhum relato de testemunha informado.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // --- SEÇÃO 4: APREENSÕES ---
    yPos = addSectionTitle(doc, yPos, "APREENSÕES", "4", 1, data);

    // Seção 4.1: Descrição das Apreensões
    yPos = addSectionTitle(doc, yPos, "DESCRIÇÃO DAS APREENSÕES", "4.1", 2, data);
    if (data.apreensoes) {
        yPos = addWrappedText(doc, yPos, data.apreensoes, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 2;
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhum objeto ou documento apreendido.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // Seção 4.2: Dados da Droga (se aplicável)
    if (data.natureza === "Porte de drogas para consumo") {
        yPos = addSectionTitle(doc, yPos, "DADOS DA DROGA APREENDIDA", "4.2", 2, data);
        yPos = addField(doc, yPos, "QUANTIDADE", data.drogaQuantidade, data);
        yPos = addField(doc, yPos, "TIPO", data.drogaTipo, data);
        yPos = addField(doc, yPos, "COR", data.drogaCor, data);
        yPos = addField(doc, yPos, "NOME COMUM", data.drogaNomeComum, data);
        if (data.drogaIsUnknown && data.drogaCustomDesc) {
            yPos = addField(doc, yPos, "DESCRIÇÃO DO MATERIAL DESCONHECIDO", data.drogaCustomDesc, data);
        }
        yPos = addField(doc, yPos, "NÚMERO DO LACRE", data.lacreNumero, data);
    }

    // Seção 4.3: Fotos e Vídeos
    yPos = addSectionTitle(doc, yPos, "FOTOS E VÍDEOS", "4.3", 2, data);
    const objetosApreendidos = Array.isArray(data.objetosApreendidos) ? data.objetosApreendidos : [];
    const videoLinks = Array.isArray(data.videoLinks) ? data.videoLinks : [];

    if (objetosApreendidos.length > 0 || videoLinks.length > 0) {
        if (objetosApreendidos.length > 0) {
            yPos = addWrappedText(doc, yPos, "Fotos anexadas disponíveis via links:", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
            yPos += 2;
            objetosApreendidos.forEach((url, index) => {
                yPos = checkPageBreak(doc, yPos, 15, data);
                try {
                    // Validate URL
                    new URL(url);
                    yPos = addWrappedText(doc, yPos, `Foto ${index + 1}: ${url}`, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
                    yPos += 2;
                } catch (error) {
                    console.warn(`URL inválida para foto ${index + 1}: ${url}`);
                    yPos = addWrappedText(doc, yPos, `Foto ${index + 1}: [URL inválida]`, MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
                    yPos += 2;
                }
            });
        }

        if (videoLinks.length > 0) {
            yPos += 2;
            yPos = addWrappedText(doc, yPos, "Vídeos anexados (QR Codes):", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
            yPos += 2;
            for (let index = 0; index < videoLinks.length; index++) {
                const link = videoLinks[index];
                yPos = checkPageBreak(doc, yPos, 40, data); // Reserve espaço para QR code
                try {
                    // Validate URL
                    new URL(link);
                    // Gera QR Code como Data URL
                    const qrCodeDataUrl = await QRCode.toDataURL(link, { width: 100, margin: 1 });
                    // Adiciona QR Code ao PDF
                    doc.addImage(qrCodeDataUrl, 'PNG', MARGIN_LEFT, yPos, 30, 30);
                    // Adiciona texto ao lado do QR Code
                    doc.setFontSize(10); doc.setFont("helvetica", "normal");
                    doc.text(`Vídeo ${index + 1}: ${link}`, MARGIN_LEFT + 35, yPos + 5, { maxWidth: MAX_LINE_WIDTH - 35 });
                    yPos += 35;
                } catch (error) {
                    console.warn(`Erro ao gerar QR Code para vídeo ${index + 1}: ${link}`, error);
                    yPos = addWrappedText(doc, yPos, `Vídeo ${index + 1}: [URL inválida]`, MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
                    yPos += 2;
                }
            }
        }
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhuma foto ou vídeo anexado.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // --- SEÇÃO 5: CONCLUSÃO POLICIAL ---
    yPos = addSectionTitle(doc, yPos, "CONCLUSÃO POLICIAL", "5", 1, data);
    if (data.conclusaoPolicial) {
        yPos = addWrappedText(doc, yPos, data.conclusaoPolicial, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 5;
        yPos = checkPageBreak(doc, yPos, 20, data);
        const policial = data.componentesGuarnicao && data.componentesGuarnicao[0] ?
            `${data.componentesGuarnicao[0].posto} PM ${data.componentesGuarnicao[0].nome}` : "Policial Responsável";
        yPos = addSignatureWithNameAndRole(doc, yPos, policial, "Condutor", data);
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhuma conclusão policial informada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    return yPos;
};
