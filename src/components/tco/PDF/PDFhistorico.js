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

    // Seção 2.2: Vítima(s) - Ajusta singular/plural
    const vitimasValidas = data.vitimas ? data.vitimas.filter(v => v?.nome) : [];
    const vitimaTitle = vitimasValidas.length === 1 ? "VÍTIMA" : "VÍTIMAS";
    yPos = addSectionTitle(doc, yPos, vitimaTitle, "2.2", 2, data);
    if (vitimasValidas.length > 0) {
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

    // Seção 2.3: Testemunha(s) - Ajusta singular/plural
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
    const primeiroAutor = data.autores?.[0];
    const primeiraVitima = vitimasValidas.length > 0 ? vitimasValidas[0] : null;
    const primeiraTestemunha = testemunhasValidas.length > 0 ? testemunhasValidas[0] : null;

    yPos = addSectionTitle(doc, yPos, "HISTÓRICO", "3", 1, data);
    yPos = addSectionTitle(doc, yPos, "RELATO DO POLICIAL MILITAR", "3.1", 2, data);
    yPos = addWrappedText(doc, yPos, data.relatoPolicial, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "RELATO DO AUTOR DO FATO", "3.2", 2, data);
    yPos = addWrappedText(doc, yPos, data.relatoAutor, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    if (primeiroAutor) {
        yPos = addSignatureWithNameAndRole(doc, yPos, primeiroAutor?.nome, "AUTOR DO FATO", data);
    } else {
        yPos += 10;
    }

    yPos = addSectionTitle(doc, yPos, "RELATO DA VÍTIMA", "3.3", 2, data);
    const relatoVitimaText = primeiraVitima ? (data.relatoVitima || "Relato não fornecido pela vítima.") : "Nenhuma vítima identificada para fornecer relato.";
    yPos = addWrappedText(doc, yPos, relatoVitimaText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    if (primeiraVitima) {
        yPos = addSignatureWithNameAndRole(doc, yPos, primeiraVitima?.nome, "VÍTIMA", data);
    } else {
        yPos += 10;
    }

    yPos = addSectionTitle(doc, yPos, "RELATO DA TESTEMUNHA", "3.4", 2, data);
    let relatoTestText = "Nenhuma testemunha identificada.";
    if (primeiraTestemunha) {
        relatoTestText = data.relatoTestemunha || "Relato não fornecido pela testemunha.";
    }
    yPos = addWrappedText(doc, yPos, relatoTestText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    if (primeiraTestemunha) {
        yPos = addSignatureWithNameAndRole(doc, yPos, primeiraTestemunha?.nome, "TESTEMUNHA", data);
    } else {
        yPos += 10;
    }

    yPos = addSectionTitle(doc, yPos, "CONCLUSÃO DO POLICIAL", "3.5", 2, data);
    yPos = addWrappedText(doc, yPos, data.conclusaoPolicial, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    // --- SEÇÃO 4: PROVIDÊNCIAS E ANEXOS ---
    yPos = addSectionTitle(doc, yPos, "PROVIDÊNCIAS", "4", 1, data);
    yPos = addWrappedText(doc, yPos, data.providencias || "Não informado.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "DOCUMENTOS ANEXOS", "4.1", 2, data);
    yPos = addWrappedText(doc, yPos, data.documentosAnexos || "Nenhum.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "DESCRIÇÃO DOS OBJETOS/DOCUMENTOS APREENDIDOS", "4.2", 2, data);
    yPos = addWrappedText(doc, yPos, data.apreensaoDescricao || data.apreensoes || "Nenhum.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
    yPos += 2;

    // --- SEÇÃO 4.3: FOTOS E/OU VÍDEOS ---
    const hasPhotos = data.objetosApreendidos && data.objetosApreendidos.length > 0;
    const hasVideos = data.videoLinks && data.videoLinks.length > 0;
    let sectionTitle = "FOTOS E VÍDEOS";
    if (hasPhotos && !hasVideos) {
        sectionTitle = "FOTOS";
    } else if (!hasPhotos && hasVideos) {
        sectionTitle = "VÍDEOS";
    }

    yPos = addSectionTitle(doc, yPos, sectionTitle, "4.3", 2, data);

    // Adicionar Fotos
    if (hasPhotos) {
        const photoWidth = 50; // Largura de cada foto
        const photoHeight = 50; // Altura de cada foto
        let xPos = MARGIN_LEFT;
        let photosInRow = 0;

        console.log(`Adicionando ${data.objetosApreendidos.length} fotos ao PDF`);

        for (let i = 0; i < data.objetosApreendidos.length; i++) {
            const photo = data.objetosApreendidos[i];
            yPos = checkPageBreak(doc, yPos, photoHeight + 5, data);

            try {
                // Adiciona imagem ao PDF
                doc.addImage(photo, 'JPEG', xPos, yPos, photoWidth, photoHeight);
                photosInRow++;
                xPos += photoWidth + 5; // Espaço entre fotos

                // Verifica se precisa quebrar a linha
                if (photosInRow >= 3 || xPos + photoWidth > PAGE_WIDTH - MARGIN_RIGHT) {
                    xPos = MARGIN_LEFT;
                    yPos += photoHeight + 5;
                    photosInRow = 0;
                }
            } catch (error) {
                console.error(`Erro ao adicionar foto ${i + 1}:`, error);
                doc.text(`[Erro ao carregar foto ${i + 1}]`, xPos, yPos + 5);
                xPos += photoWidth + 5;
                if (xPos + photoWidth > PAGE_WIDTH - MARGIN_RIGHT) {
                    xPos = MARGIN_LEFT;
                    yPos += 10;
                }
            }
        }
        
        // Ajusta yPos após as fotos se não estiver no início de uma linha
        if (photosInRow > 0) {
            yPos += photoHeight + 5;
        }
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhuma foto anexada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // Adicionar QR Codes para os links de vídeos
    if (hasVideos) {
        const qrSize = 30; // Tamanho do QR code
        let xPos = MARGIN_LEFT;
        let qrCodesInRow = 0;

        yPos += 5; // Espaço adicional antes dos QR codes

        for (let i = 0; i < data.videoLinks.length; i++) {
            const link = data.videoLinks[i];
            yPos = checkPageBreak(doc, yPos, qrSize + 10, data);

            try {
                const qrCodeDataUrl = await QRCode.toDataURL(link, { width: qrSize, margin: 1 });
                doc.addImage(qrCodeDataUrl, 'PNG', xPos, yPos, qrSize, qrSize);
                
                doc.setFontSize(8);
                doc.text(`Vídeo ${i + 1}`, xPos, yPos + qrSize + 5);
                qrCodesInRow++;
                xPos += qrSize + 10;

                if (qrCodesInRow >= 4 || xPos + qrSize > PAGE_WIDTH - MARGIN_RIGHT) {
                    xPos = MARGIN_LEFT;
                    yPos += qrSize + 10;
                    qrCodesInRow = 0;
                }
            } catch (error) {
                console.error(`Erro ao gerar QR code para o vídeo ${i + 1}:`, error);
                doc.text(`[Erro ao gerar QR code para vídeo ${i + 1}]`, xPos, yPos + 5);
                xPos += qrSize + 10;
                if (xPos + qrSize > PAGE_WIDTH - MARGIN_RIGHT) {
                    xPos = MARGIN_LEFT;
                    yPos += qrSize + 10;
                }
            }
        }
        
        // Ajusta yPos após os QR codes se não estiver no início de uma linha
        if (qrCodesInRow > 0) {
            yPos += qrSize + 10;
        }
    } else if (!hasPhotos) {
        yPos = addWrappedText(doc, yPos, "Nenhum vídeo anexado.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // --- SEÇÃO 5: IDENTIFICAÇÃO DA GUARNIÇÃO ---
    yPos = addSectionTitle(doc, yPos, "IDENTIFICAÇÃO DA GUARNIÇÃO", "5", 1, data);
    if (data.componentesGuarnicao && data.componentesGuarnicao.length > 0) {
        data.componentesGuarnicao.forEach((componente, index) => {
            if (index > 0) {
                yPos += 5;
                yPos = checkPageBreak(doc, yPos, 5 + 50, data);
            }
            yPos = addField(doc, yPos, "NOME COMPLETO", componente.nome, data);
            yPos = addField(doc, yPos, "POSTO/GRADUAÇÃO", componente.posto, data);
            yPos = addField(doc, yPos, "RG PMMT", componente.rg, data);
            yPos = checkPageBreak(doc, yPos, 5, data);
            const sigLineY = yPos;
            doc.setFont("helvetica", "normal"); doc.setFontSize(12);
            doc.text("ASSINATURA:", MARGIN_LEFT, sigLineY);
            const labelWidth = doc.getTextWidth("ASSINATURA:");
            const lineStartX = MARGIN_LEFT + labelWidth + 2;
            const lineEndX = lineStartX + 80;
            doc.setLineWidth(0.3); doc.line(lineStartX, sigLineY, lineEndX, sigLineY);
            yPos = sigLineY + 2;
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Dados da Guarnição não informados.", MARGIN_LEFT, 12, 'italic', MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    return yPos;
};
