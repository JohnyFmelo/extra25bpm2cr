import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addSectionTitle, addField, addWrappedText, formatarDataHora, formatarDataSimples,
    checkPageBreak, addSignatureWithNameAndRole, addNewPage
} from './pdfUtils.js';
import QRCode from 'qrcode';

// Função auxiliar para adicionar imagens (copiada ou importada)
const addImagesToPDF = (doc, yPosition, images, pageWidth, pageHeight) => {
    const maxImageWidth = pageWidth - MARGIN_RIGHT * 2; // Largura máxima da imagem
    const maxImageHeight = 100; // Altura máxima por imagem (ajustável)
    const marginBetweenImages = 10; // Espaço entre imagens
    let currentY = yPosition;

    for (const image of images) {
        try {
            // Extrai o formato da imagem a partir do início da string base64
            const formatMatch = image.data.match(/^data:image\/(jpeg|png);base64,/);
            const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG'; // Default para JPEG

            // Remove o prefixo "data:image/..." para obter apenas os dados base64
            const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '');

            // Verifica se a posição atual ultrapassa o limite da página
            if (currentY + maxImageHeight + 10 > pageHeight) {
                currentY = addNewPage(doc, {});
                currentY = 10; // Reseta a posição Y (ajuste conforme MARGIN_TOP)
            }

            // Adiciona a imagem ao PDF
            doc.addImage(base64Data, format, MARGIN_RIGHT, currentY, maxImageWidth, 0); // Altura 0 para manter proporção

            // Obtém as dimensões reais da imagem adicionada
            const imgProps = doc.getImageProperties(base64Data);
            const imgHeight = (imgProps.height * maxImageWidth) / imgProps.width; // Calcula altura proporcional

            // Atualiza a posição Y
            currentY += imgHeight + marginBetweenImages;

            // Adiciona o nome do arquivo como legenda
            doc.setFontSize(8);
            doc.text(`Imagem: ${image.name}`, MARGIN_RIGHT, currentY);
            currentY += 5; // Espaço após a legenda
        } catch (error) {
            console.error(`Erro ao adicionar imagem ${image.name}:`, error);
        }
    }

    return currentY; // Retorna a nova posição Y
};

/**
 * Gera o conteúdo das seções 1 a 5 do TCO.
 * Assume que começa após uma chamada a `addNewPage`.
 * Retorna a posição Y final após adicionar todo o conteúdo.
 */
export const generateHistoricoContent = async (doc, currentY, data) => {
    let yPos = currentY;
    const { PAGE_WIDTH, MAX_LINE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc);

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
    const hasImages = data.imageBase64 && data.imageBase64.length > 0;
    let sectionTitle = "FOTOS E VÍDEOS";
    if (hasPhotos && !hasVideos && !hasImages) {
        sectionTitle = "FOTOS";
    } else if (!hasPhotos && hasVideos && !hasImages) {
        sectionTitle = "VÍDEOS";
    } else if (!hasPhotos && !hasVideos && hasImages) {
        sectionTitle = "IMAGENS ADICIONAIS";
    } else if (hasImages && (hasPhotos || hasVideos)) {
        sectionTitle = "FOTOS, VÍDEOS E IMAGENS ADICIONAIS";
    }

    if (hasPhotos || hasVideos || hasImages) {
        yPos = addSectionTitle(doc, yPos, sectionTitle, "4.3", 2, data);

        // Adicionar Fotos (data.objetosApreendidos)
        if (hasPhotos) {
            const photoWidth = 50; // Largura de cada foto
            const photoHeight = 50; // Altura de cada foto
            let xPos = MARGIN_LEFT;

            for (let i = 0; i < data.objetosApreendidos.length; i++) {
                const photo = data.objetosApreendidos[i];
                yPos = checkPageBreak(doc, yPos, photoHeight + 5, data);

                try {
                    let imageData = photo;
                    if (photo instanceof File) {
                        imageData = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(photo);
                        });
                    }
                    doc.addImage(imageData, 'JPEG', xPos, yPos, photoWidth, photoHeight);
                    xPos += photoWidth + 5; // Espaço entre fotos

                    if (xPos + photoWidth > PAGE_WIDTH - MARGIN_RIGHT) {
                        xPos = MARGIN_LEFT;
                        yPos += photoHeight + 5;
                    }
                } catch (error) {
                    console.error(`Erro ao adicionar foto ${i + 1}:`, error);
                    doc.text(`[Erro ao carregar foto ${i + 1}]`, xPos, yPos + 5);
                    xPos += photoWidth + 5;
                    if (xPos + photoWidth > PAGE_WIDTH - MARGIN_RIGHT) {
                        xPos = MARGIN_LEFT;
                        yPos += photoHeight + 5;
                    }
                }
            }
            yPos = xPos !== MARGIN_LEFT ? yPos + photoHeight + 5 : yPos; // Ajusta yPos após as fotos
        }

        // Adicionar QR Codes para os links de vídeos
        if (hasVideos) {
            const qrSize = 30; // Tamanho do QR code
            let xPos = MARGIN_LEFT;

            for (let i = 0; i < data.videoLinks.length; i++) {
                const link = data.videoLinks[i];
                yPos = checkPageBreak(doc, yPos, qrSize + 10, data);

                try {
                    const qrCodeDataUrl = await QRCode.toDataURL(link, { width: qrSize, margin: 1 });
                    doc.addImage(qrCodeDataUrl, 'PNG', xPos, yPos, qrSize, qrSize);
                    
                    doc.setFontSize(8);
                    doc.text(`Vídeo ${i + 1}`, xPos, yPos + qrSize + 5);
                    xPos += qrSize + 10;

                    if (xPos + qrSize > PAGE_WIDTH - MARGIN_RIGHT) {
                        xPos = MARGIN_LEFT;
                        yPos += qrSize + 10;
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
            yPos = xPos !== MARGIN_LEFT ? yPos + qrSize + 10 : yPos;
        }

        // Adicionar Imagens de data.imageBase64
        if (hasImages) {
            yPos = checkPageBreak(doc, yPos, 100, data); // Reserva espaço para imagens
            yPos = addImagesToPDF(doc, yPos, data.imageBase64, PAGE_WIDTH, PAGE_HEIGHT);
        }
    } else {
        yPos = addSectionTitle(doc, yPos, "FOTOS E VÍDEOS", "4.3", 2, data);
        yPos = addWrappedText(doc, yPos, "Nenhuma foto, vídeo ou imagem adicional anexada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
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
