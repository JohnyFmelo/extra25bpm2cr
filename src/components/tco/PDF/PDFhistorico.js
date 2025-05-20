
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addSectionTitle, addField, addWrappedText, formatarDataHora, formatarDataSimples,
    checkPageBreak, addSignatureWithNameAndRole, addNewPage
} from './pdfUtils.js';
import QRCode from 'qrcode';

// Função auxiliar para adicionar imagens (copiada ou importada)
const addImagesToPDF = (doc, yPosition, images, pageWidth, pageHeight) => {
    if (!Array.isArray(images) || images.length === 0) {
        return yPosition; // No images to add
    }
    
    const maxImageWidth = pageWidth - MARGIN_RIGHT * 2; // Largura máxima da imagem
    const maxImageHeight = 100; // Altura máxima por imagem (ajustável)
    const marginBetweenImages = 10; // Espaço entre imagens
    let currentY = yPosition;

    for (const image of images) {
        try {
            if (!image || !image.data) {
                console.warn("Image data is missing or invalid");
                continue;
            }
            
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
            doc.text(`Imagem: ${image.name || "Sem nome"}`, MARGIN_RIGHT, currentY);
            currentY += 5; // Espaço após a legenda
        } catch (error) {
            console.error(`Erro ao adicionar imagem:`, error);
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
    
    // Handle case where data.natureza is undefined
    const natureza = data.natureza || "";
    const isDrugCase = natureza === "Porte de drogas para consumo";

    // Ensure data is not undefined in nested properties
    const safeData = {
        ...data,
        autores: Array.isArray(data.autores) ? data.autores : [],
        vitimas: Array.isArray(data.vitimas) ? data.vitimas : [],
        testemunhas: Array.isArray(data.testemunhas) ? data.testemunhas : [],
        componentesGuarnicao: Array.isArray(data.componentesGuarnicao) ? data.componentesGuarnicao : [],
        imageBase64: Array.isArray(data.imageBase64) ? data.imageBase64 : [],
        videoLinks: Array.isArray(data.videoLinks) ? data.videoLinks : [],
        objetosApreendidos: Array.isArray(data.objetosApreendidos) ? data.objetosApreendidos : []
    };

    // Convert general information data to uppercase
    const upperCaseData = {
        ...safeData,
        natureza: safeData.natureza ? safeData.natureza.toUpperCase() : '',
        tipificacao: safeData.tipificacao ? safeData.tipificacao.toUpperCase() : '',
        localFato: safeData.localFato ? safeData.localFato.toUpperCase() : '',
        endereco: safeData.endereco ? safeData.endereco.toUpperCase() : '',
        municipio: safeData.municipio ? safeData.municipio.toUpperCase() : '',
        comunicante: safeData.comunicante ? safeData.comunicante.toUpperCase() : '',
    };

    // --- SEÇÃO 1: DADOS GERAIS ---
    yPos = addSectionTitle(doc, yPos, "DADOS GERAIS E IDENTIFICADORES DA OCORRÊNCIA", "1", 1, safeData);
    yPos = addField(doc, yPos, "NATUREZA DA OCORRÊNCIA", upperCaseData.natureza, safeData);
    yPos = addField(doc, yPos, "TIPIFICAÇÃO LEGAL", upperCaseData.tipificacao, safeData);
    yPos = addField(doc, yPos, "DATA E HORA DO FATO", formatarDataHora(safeData.dataFato, safeData.horaFato), safeData);
    yPos = addField(doc, yPos, "DATA E HORA DO INÍCIO DO REGISTRO", formatarDataHora(safeData.dataInicioRegistro, safeData.horaInicioRegistro), safeData);
    yPos = addField(doc, yPos, "DATA E HORA DO TÉRMINO DO REGISTRO", formatarDataHora(safeData.dataTerminoRegistro, safeData.horaTerminoRegistro), safeData);
    yPos = addField(doc, yPos, "LOCAL DO FATO", upperCaseData.localFato, safeData);
    yPos = addField(doc, yPos, "ENDEREÇO", upperCaseData.endereco, safeData);
    yPos = addField(doc, yPos, "MUNICÍPIO", upperCaseData.municipio, safeData);
    yPos = addField(doc, yPos, "COMUNICANTE", upperCaseData.comunicante, safeData);

    // --- SEÇÃO 2: ENVOLVIDOS ---
    yPos = addSectionTitle(doc, yPos, "ENVOLVIDOS", "2", 1, safeData);

    // Seção 2.1: Autor(es) - Ajusta singular/plural e aplica flexão de gênero
    const autoresValidos = safeData.autores.filter(a => a?.nome);
    
    // Determina o título com base na quantidade e gênero
    let autorTitle;
    if (autoresValidos.length === 1) {
        autorTitle = autoresValidos[0]?.sexo?.toLowerCase() === 'feminino' ? "AUTORA DO FATO" : "AUTOR DO FATO";
    } else {
        autorTitle = "AUTORES DO FATO"; // Plural para múltiplos autores, independente do gênero
    }
    
    yPos = addSectionTitle(doc, yPos, autorTitle, "2.1", 2, safeData);
    if (autoresValidos.length > 0) {
        autoresValidos.forEach((autor, index) => {
            // Create uppercase version of author data
            const upperAutor = {
                ...autor,
                nome: autor.nome ? autor.nome.toUpperCase() : '',
                sexo: autor.sexo ? autor.sexo.toUpperCase() : '',
                estadoCivil: autor.estadoCivil ? autor.estadoCivil.toUpperCase() : '',
                profissao: autor.profissao ? autor.profissao.toUpperCase() : '',
                endereco: autor.endereco ? autor.endereco.toUpperCase() : '',
                naturalidade: autor.naturalidade ? autor.naturalidade.toUpperCase() : '',
                filiacaoMae: autor.filiacaoMae ? autor.filiacaoMae.toUpperCase() : '',
                filiacaoPai: autor.filiacaoPai ? autor.filiacaoPai.toUpperCase() : '',
                rg: autor.rg ? autor.rg.toUpperCase() : '',
                cpf: autor.cpf ? autor.cpf.toUpperCase() : '',
                celular: autor.celular ? autor.celular.toUpperCase() : '',
                email: autor.email ? autor.email.toUpperCase() : '',
            };
            
            if (index > 0) {
                yPos += 3; yPos = checkPageBreak(doc, yPos, 5, safeData);
                doc.setLineWidth(0.1); doc.setDrawColor(150);
                doc.line(MARGIN_LEFT, yPos - 1, PAGE_WIDTH - MARGIN_RIGHT, yPos - 1);
                doc.setDrawColor(0); yPos += 2;
            }
            yPos = addField(doc, yPos, "NOME", upperAutor.nome, safeData);
            yPos = addField(doc, yPos, "SEXO", upperAutor.sexo, safeData);
            yPos = addField(doc, yPos, "ESTADO CIVIL", upperAutor.estadoCivil, safeData);
            yPos = addField(doc, yPos, "PROFISSÃO", upperAutor.profissao, safeData);
            yPos = addField(doc, yPos, "ENDEREÇO", upperAutor.endereco, safeData);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(autor.dataNascimento), safeData);
            yPos = addField(doc, yPos, "NATURALIDADE", upperAutor.naturalidade, safeData);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", upperAutor.filiacaoMae, safeData);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", upperAutor.filiacaoPai, safeData);
            yPos = addField(doc, yPos, "RG", upperAutor.rg, safeData);
            yPos = addField(doc, yPos, "CPF", upperAutor.cpf, safeData);
            yPos = addField(doc, yPos, "CELULAR", upperAutor.celular, safeData);
            yPos = addField(doc, yPos, "E-MAIL", upperAutor.email, safeData);
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhum autor informado.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', safeData);
        yPos += 2;
    }

    // Seção 2.2: Vítima(s) - Skip completely for drug cases
    if (!isDrugCase) {
        const vitimasValidas = safeData.vitimas.filter(v => v?.nome);
        const vitimaTitle = vitimasValidas.length === 1 ? "VÍTIMA" : "VÍTIMAS";
        yPos = addSectionTitle(doc, yPos, vitimaTitle, "2.2", 2, safeData);
        if (vitimasValidas.length > 0) {
            vitimasValidas.forEach((vitima, index) => {
                // Create uppercase version of victim data
                const upperVitima = {
                    ...vitima,
                    nome: vitima.nome ? vitima.nome.toUpperCase() : '',
                    sexo: vitima.sexo ? vitima.sexo.toUpperCase() : '',
                    estadoCivil: vitima.estadoCivil ? vitima.estadoCivil.toUpperCase() : '',
                    profissao: vitima.profissao ? vitima.profissao.toUpperCase() : '',
                    endereco: vitima.endereco ? vitima.endereco.toUpperCase() : '',
                    naturalidade: vitima.naturalidade ? vitima.naturalidade.toUpperCase() : '',
                    filiacaoMae: vitima.filiacaoMae ? vitima.filiacaoMae.toUpperCase() : '',
                    filiacaoPai: vitima.filiacaoPai ? vitima.filiacaoPai.toUpperCase() : '',
                    rg: vitima.rg ? vitima.rg.toUpperCase() : '',
                    cpf: vitima.cpf ? vitima.cpf.toUpperCase() : '',
                    celular: vitima.celular ? vitima.celular.toUpperCase() : '',
                    email: vitima.email ? vitima.email.toUpperCase() : '',
                };
                
                if (index > 0) {
                    yPos += 3; yPos = checkPageBreak(doc, yPos, 5, safeData);
                    doc.setLineWidth(0.1); doc.setDrawColor(150);
                    doc.line(MARGIN_LEFT, yPos - 1, PAGE_WIDTH - MARGIN_RIGHT, yPos - 1);
                    doc.setDrawColor(0); yPos += 2;
                }
                yPos = addField(doc, yPos, "NOME", upperVitima.nome, safeData);
                yPos = addField(doc, yPos, "SEXO", upperVitima.sexo, safeData);
                yPos = addField(doc, yPos, "ESTADO CIVIL", upperVitima.estadoCivil, safeData);
                yPos = addField(doc, yPos, "PROFISSÃO", upperVitima.profissao, safeData);
                yPos = addField(doc, yPos, "ENDEREÇO", upperVitima.endereco, safeData);
                yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(vitima.dataNascimento), safeData);
                yPos = addField(doc, yPos, "NATURALIDADE", upperVitima.naturalidade, safeData);
                yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", upperVitima.filiacaoMae, safeData);
                yPos = addField(doc, yPos, "FILIAÇÃO - PAI", upperVitima.filiacaoPai, safeData);
                yPos = addField(doc, yPos, "RG", upperVitima.rg, safeData);
                yPos = addField(doc, yPos, "CPF", upperVitima.cpf, safeData);
                yPos = addField(doc, yPos, "CELULAR", upperVitima.celular, safeData);
                yPos = addField(doc, yPos, "E-MAIL", upperVitima.email, safeData);
            });
        } else {
            yPos = addWrappedText(doc, yPos, "Nenhuma vítima informada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', safeData);
            yPos += 2;
        }
    }

    // Seção 2.3: Testemunha(s) - Ajusta singular/plural
    const testemunhasValidas = safeData.testemunhas.filter(t => t?.nome);
    const testemunhaTitle = testemunhasValidas.length === 1 ? "TESTEMUNHA" : "TESTEMUNHAS";
    yPos = addSectionTitle(doc, yPos, testemunhaTitle, "2.3", 2, safeData);
    if (testemunhasValidas.length > 0) {
        testemunhasValidas.forEach((testemunha, index) => {
            // Create uppercase version of witness data
            const upperTestemunha = {
                ...testemunha,
                nome: testemunha.nome ? testemunha.nome.toUpperCase() : '',
                sexo: testemunha.sexo ? testemunha.sexo.toUpperCase() : '',
                estadoCivil: testemunha.estadoCivil ? testemunha.estadoCivil.toUpperCase() : '',
                profissao: testemunha.profissao ? testemunha.profissao.toUpperCase() : '',
                endereco: testemunha.endereco ? testemunha.endereco.toUpperCase() : '',
                naturalidade: testemunha.naturalidade ? testemunha.naturalidade.toUpperCase() : '',
                filiacaoMae: testemunha.filiacaoMae ? testemunha.filiacaoMae.toUpperCase() : '',
                filiacaoPai: testemunha.filiacaoPai ? testemunha.filiacaoPai.toUpperCase() : '',
                rg: testemunha.rg ? testemunha.rg.toUpperCase() : '',
                cpf: testemunha.cpf ? testemunha.cpf.toUpperCase() : '',
                celular: testemunha.celular ? testemunha.celular.toUpperCase() : '',
                email: testemunha.email ? testemunha.email.toUpperCase() : '',
            };
            
            if (index > 0) {
                yPos += 3; yPos = checkPageBreak(doc, yPos, 5, safeData);
                doc.setLineWidth(0.1); doc.setDrawColor(150);
                doc.line(MARGIN_LEFT, yPos - 1, PAGE_WIDTH - MARGIN_RIGHT, yPos - 1);
                doc.setDrawColor(0); yPos += 2;
            }
            yPos = addField(doc, yPos, "NOME", upperTestemunha.nome, safeData);
            yPos = addField(doc, yPos, "SEXO", upperTestemunha.sexo, safeData);
            yPos = addField(doc, yPos, "ESTADO CIVIL", upperTestemunha.estadoCivil, safeData);
            yPos = addField(doc, yPos, "PROFISSÃO", upperTestemunha.profissao, safeData);
            yPos = addField(doc, yPos, "ENDEREÇO", upperTestemunha.endereco, safeData);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(testemunha.dataNascimento), safeData);
            yPos = addField(doc, yPos, "NATURALIDADE", upperTestemunha.naturalidade, safeData);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", upperTestemunha.filiacaoMae, safeData);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", upperTestemunha.filiacaoPai, safeData);
            yPos = addField(doc, yPos, "RG", upperTestemunha.rg, safeData);
            yPos = addField(doc, yPos, "CPF", upperTestemunha.cpf, safeData);
            yPos = addField(doc, yPos, "CELULAR", upperTestemunha.celular, safeData);
            yPos = addField(doc, yPos, "E-MAIL", upperTestemunha.email, safeData);
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhuma testemunha informada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', safeData);
        yPos += 2;
    }

    // --- SEÇÃO 3: HISTÓRICO ---
    const primeiroAutor = safeData.autores.find(a => a?.nome);
    const primeiraVitima = !isDrugCase ? safeData.vitimas.find(v => v?.nome) : null;
    const primeiraTestemunha = safeData.testemunhas.find(t => t?.nome);

    yPos = addSectionTitle(doc, yPos, "HISTÓRICO", "3", 1, safeData);
    yPos = addSectionTitle(doc, yPos, "RELATO DO POLICIAL MILITAR", "3.1", 2, safeData);
    yPos = addWrappedText(doc, yPos, safeData.relatoPolicial || "Não informado.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', safeData);
    yPos += 2;

    // Aplica flexão de gênero no título do relato do autor
    const tituloRelatoAutor = primeiroAutor?.sexo?.toLowerCase() === 'feminino' ? "RELATO DA AUTORA DO FATO" : "RELATO DO AUTOR DO FATO";
    yPos = addSectionTitle(doc, yPos, tituloRelatoAutor, "3.2", 2, safeData);
    yPos = addWrappedText(doc, yPos, safeData.relatoAutor || "Não informado.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', safeData);
    
    if (primeiroAutor) {
        const autorLabel = primeiroAutor?.sexo?.toLowerCase() === 'feminino' ? "AUTORA DO FATO" : "AUTOR DO FATO";
        yPos = addSignatureWithNameAndRole(doc, yPos, primeiroAutor?.nome, autorLabel, safeData);
    } else {
        yPos += 10;
    }

    // Only include victim section if it's not a drug case
    if (!isDrugCase) {
        yPos = addSectionTitle(doc, yPos, "RELATO DA VÍTIMA", "3.3", 2, safeData);
        const relatoVitimaText = primeiraVitima ? (safeData.relatoVitima || "Relato não fornecido pela vítima.") : "Nenhuma vítima identificada para fornecer relato.";
        yPos = addWrappedText(doc, yPos, relatoVitimaText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', safeData);
        if (primeiraVitima) {
            yPos = addSignatureWithNameAndRole(doc, yPos, primeiraVitima?.nome, "VÍTIMA", safeData);
        } else {
            yPos += 10;
        }
    }

    // Adjust section numbering for witness report based on whether victim section exists
    const testemunhaSection = isDrugCase ? "3.3" : "3.4";
    yPos = addSectionTitle(doc, yPos, "RELATO DA TESTEMUNHA", testemunhaSection, 2, safeData);
    let relatoTestText = "Nenhuma testemunha identificada.";
    if (primeiraTestemunha) {
        relatoTestText = safeData.relatoTestemunha || "Relato não fornecido pela testemunha.";
    }
    yPos = addWrappedText(doc, yPos, relatoTestText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', safeData);
    if (primeiraTestemunha) {
        yPos = addSignatureWithNameAndRole(doc, yPos, primeiraTestemunha?.nome, "TESTEMUNHA", safeData);
    } else {
        yPos += 10;
    }

    // Adjust section numbering for conclusion based on whether victim section exists
    const conclusaoSection = isDrugCase ? "3.4" : "3.5";
    yPos = addSectionTitle(doc, yPos, "CONCLUSÃO DO POLICIAL", conclusaoSection, 2, safeData);
    yPos = addWrappedText(doc, yPos, safeData.conclusaoPolicial || "Não informado.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', safeData);
    yPos += 2;

    // --- SEÇÃO 4: PROVIDÊNCIAS E ANEXOS ---
    yPos = addSectionTitle(doc, yPos, "PROVIDÊNCIAS", "4", 1, safeData);
    yPos = addWrappedText(doc, yPos, safeData.providencias || "Não informado.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', safeData);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "DOCUMENTOS ANEXOS", "4.1", 2, safeData);
    yPos = addWrappedText(doc, yPos, safeData.documentosAnexos || "Nenhum.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', safeData);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "DESCRIÇÃO DOS OBJETOS/DOCUMENTOS APREENDIDOS", "4.2", 2, safeData);
    yPos = addWrappedText(doc, yPos, safeData.apreensaoDescricao || safeData.apreensoes || "Nenhum.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', safeData);
    yPos += 2;

    // --- SEÇÃO 4.3: FOTOS E/OU VÍDEOS ---
    const hasPhotos = safeData.objetosApreendidos && safeData.objetosApreendidos.length > 0;
    const hasVideos = safeData.videoLinks && safeData.videoLinks.length > 0;
    const hasImages = safeData.imageBase64 && safeData.imageBase64.length > 0;
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
        yPos = addSectionTitle(doc, yPos, sectionTitle, "4.3", 2, safeData);

        // Adicionar Fotos (data.objetosApreendidos)
        if (hasPhotos) {
            const photoWidth = 50; // Largura de cada foto
            const photoHeight = 50; // Altura de cada foto
            let xPos = MARGIN_LEFT;

            for (let i = 0; i < safeData.objetosApreendidos.length; i++) {
                const photo = safeData.objetosApreendidos[i];
                if (!photo) continue; // Skip if photo is null or undefined
                
                yPos = checkPageBreak(doc, yPos, photoHeight + 5, safeData);

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

            for (let i = 0; i < safeData.videoLinks.length; i++) {
                const link = safeData.videoLinks[i];
                if (!link) continue; // Skip if link is null or undefined
                
                yPos = checkPageBreak(doc, yPos, qrSize + 10, safeData);

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
            yPos = checkPageBreak(doc, yPos, 100, safeData); // Reserva espaço para imagens
            yPos = addImagesToPDF(doc, yPos, safeData.imageBase64, PAGE_WIDTH, PAGE_HEIGHT);
        }
    } else {
        yPos = addSectionTitle(doc, yPos, "FOTOS E VÍDEOS", "4.3", 2, safeData);
        yPos = addWrappedText(doc, yPos, "Nenhuma foto, vídeo ou imagem adicional anexada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', safeData);
        yPos += 2;
    }

    // --- SEÇÃO 5: IDENTIFICAÇÃO DA GUARNIÇÃO ---
    yPos = addSectionTitle(doc, yPos, "IDENTIFICAÇÃO DA GUARNIÇÃO", "5", 1, safeData);
    
    if (safeData.componentesGuarnicao && safeData.componentesGuarnicao.length > 0) {
        safeData.componentesGuarnicao.forEach((componente, index) => {
            if (!componente) return; // Skip if componente is null or undefined
            
            if (index > 0) { 
                yPos += 15;  // Aumentado para 15 para criar mais espaço entre identificações
                yPos = checkPageBreak(doc, yPos, 5 + 50, safeData);
                
                // Adicionando uma linha separadora entre os militares
                doc.setLineWidth(0.1);
                doc.setDrawColor(200, 200, 200);
                doc.line(MARGIN_LEFT, yPos - 10, PAGE_WIDTH - MARGIN_RIGHT, yPos - 10);
                doc.setDrawColor(0);
                
                yPos += 5; // Espaço adicional após a linha
            }
    
            yPos = addField(doc, yPos, "NOME COMPLETO", componente.nome || "Não informado", safeData);
            yPos = addField(doc, yPos, "POSTO/GRADUAÇÃO", componente.posto || "Não informado", safeData);
            yPos = addField(doc, yPos, "RG PMMT", componente.rg || "Não informado", safeData);
            yPos = checkPageBreak(doc, yPos, 5, safeData);
    
            const sigLineY = yPos;
            doc.setFont("helvetica", "normal"); 
            doc.setFontSize(12);
            doc.text("ASSINATURA:", MARGIN_LEFT, sigLineY);
            const labelWidth = doc.getTextWidth("ASSINATURA:");
            const lineStartX = MARGIN_LEFT + labelWidth + 2;
            const lineEndX = lineStartX + 80;
            doc.setLineWidth(0.3); 
            doc.line(lineStartX, sigLineY, lineEndX, sigLineY);
            yPos = sigLineY + 2;
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Dados da Guarnição não informados.", MARGIN_LEFT, 12, 'italic', MAX_LINE_WIDTH, 'left', safeData);
        yPos += 2;
    }
    
    return yPos;
};
