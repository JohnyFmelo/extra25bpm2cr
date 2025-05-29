import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addSectionTitle, addField, addWrappedText, formatarDataHora, formatarDataSimples,
    checkPageBreak, addSignatureWithNameAndRole, addNewPage
} from './pdfUtils.js';
import QRCode from 'qrcode';

// Função auxiliar para adicionar imagens (mantida sem alterações)
const addImagesToPDF = (doc, yPosition, images, pageWidth, pageHeight) => {
    const maxImageWidth = pageWidth - MARGIN_RIGHT * 2;
    const maxImageHeight = 100;
    const marginBetweenImages = 10;
    let currentY = yPosition;

    for (const image of images) {
        try {
            const formatMatch = image.data.match(/^data:image\/(jpeg|png);base64,/);
            const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG';
            const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '');
            if (currentY + maxImageHeight + 10 > pageHeight) {
                currentY = addNewPage(doc, {});
            }
            doc.addImage(base64Data, format, MARGIN_LEFT, currentY, maxImageWidth, 0);
            const imgProps = doc.getImageProperties(base64Data);
            const imgHeight = (imgProps.height * maxImageWidth) / imgProps.width;
            currentY += imgHeight + marginBetweenImages;
            doc.setFontSize(8);
            doc.text(`Imagem: ${image.name}`, MARGIN_LEFT, currentY);
            currentY += 5;
        } catch (error) {
            console.error(`Erro ao adicionar imagem ${image.name}:`, error);
        }
    }
    return currentY;
};

// Função para adicionar QR Code ao PDF (mantida sem alterações)
const addQRCodeToPDF = async (doc, x, y, url, label, size = 30) => {
    try {
        const qrCodeDataURL = await QRCode.toDataURL(url, {
            margin: 1,
            width: size
        });
        doc.addImage(qrCodeDataURL, 'PNG', x, y, size, size);
        doc.setFontSize(8);
        const textWidth = doc.getTextWidth(label);
        const centerX = x + (size / 2) - (textWidth / 2);
        doc.text(label, centerX, y + size + 5);
        return y + size + 10;
    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        doc.setFontSize(8);
        doc.setTextColor(255, 0, 0);
        doc.text(`Erro ao gerar QR Code para: ${url}`, x, y + 5);
        doc.setTextColor(0, 0, 0);
        return y + 10;
    }
};

// Função principal para gerar o conteúdo do PDF
export const generateHistoricoContent = async (doc, currentY, data) => {
    let yPos = currentY;
    const { PAGE_WIDTH, MAX_LINE_WIDTH, PAGE_HEIGHT, MARGIN_TOP } = getPageConstants(doc);
    const isDrugCase = data.natureza === "Porte de drogas para consumo";

    // Convert general information data to uppercase
    const upperCaseData = {
        ...data,
        natureza: data.natureza ? data.natureza.toUpperCase() : '',
        tipificacao: data.tipificacao ? data.tipificacao.toUpperCase() : '',
        localFato: data.localFato ? data.localFato.toUpperCase() : '',
        endereco: data.endereco ? data.endereco.toUpperCase() : '',
        municipio: data.municipio ? data.municipio.toUpperCase() : '',
        comunicante: data.comunicante ? data.comunicante.toUpperCase() : '',
    };

    // --- SEÇÃO 1: DADOS GERAIS ---
    yPos = addSectionTitle(doc, yPos, "DADOS GERAIS E IDENTIFICADORES DA OCORRÊNCIA", "1", 1, data);
    yPos = addField(doc, yPos, "NATUREZA DA OCORRÊNCIA", upperCaseData.natureza, data);
    yPos = addField(doc, yPos, "TIPIFICAÇÃO LEGAL", upperCaseData.tipificacao, data);
    yPos = addField(doc, yPos, "DATA E HORA DO FATO", formatarDataHora(data.dataFato, data.horaFato), data);
    yPos = addField(doc, yPos, "DATA E HORA DO INÍCIO DO REGISTRO", formatarDataHora(data.dataInicioRegistro, data.horaInicioRegistro), data);
    yPos = addField(doc, yPos, "DATA E HORA DO TÉRMINO DO REGISTRO", formatarDataHora(data.dataTerminoRegistro, data.horaTerminoRegistro), data);
    yPos = addField(doc, yPos, "LOCAL DO FATO", upperCaseData.localFato, data);
    yPos = addField(doc, yPos, "ENDEREÇO", upperCaseData.endereco, data);
    yPos = addField(doc, yPos, "MUNICÍPIO", upperCaseData.municipio, data);
    yPos = addField(doc, yPos, "COMUNICANTE", upperCaseData.comunicante, data);

    // --- SEÇÃO 2: ENVOLVIDOS ---
    let currentSectionNumber = 2.1;

    // Autores
    const autoresValidos = data.autores ? data.autores.filter(a => a?.nome) : [];
    if (autoresValidos.length > 0) {
        autoresValidos.forEach((autor, index) => {
            const autorTitle = `AUTOR ${autor.nome.toUpperCase()}`;
            yPos = addSectionTitle(doc, yPos, autorTitle, currentSectionNumber.toFixed(1), 2, data);
            currentSectionNumber += 0.1;

            const upperAutor = {
                ...autor,
                nome: autor.nome ? autor.nome.toUpperCase() : 'Não Informado',
                sexo: autor.sexo ? autor.sexo.toUpperCase() : 'Não Informado',
                estadoCivil: autor.estadoCivil ? autor.estadoCivil.toUpperCase() : 'Não Informado',
                profissao: autor.profissao ? autor.profissao.toUpperCase() : 'Não Informado',
                endereco: autor.endereco ? autor.endereco.toUpperCase() : 'Não Informado',
                naturalidade: autor.naturalidade ? autor.naturalidade.toUpperCase() : 'Não Informado',
                filiacaoMae: autor.filiacaoMae ? autor.filiacaoMae.toUpperCase() : 'Não Informado',
                filiacaoPai: autor.filiacaoPai ? autor.filiacaoPai.toUpperCase() : 'Não Informado',
                rg: autor.rg ? autor.rg.toUpperCase() : 'Não Informado',
                cpf: autor.cpf ? autor.cpf.toUpperCase() : 'Não Informado',
                celular: autor.celular ? autor.celular.toUpperCase() : 'Não Informado',
                email: autor.email ? autor.email.toUpperCase() : 'Não Informado',
            };

            yPos = addField(doc, yPos, "NOME", upperAutor.nome, data);
            yPos = addField(doc, yPos, "SEXO", upperAutor.sexo, data);
            yPos = addField(doc, yPos, "ESTADO CIVIL", upperAutor.estadoCivil, data);
            yPos = addField(doc, yPos, "PROFISSÃO", upperAutor.profissao, data);
            yPos = addField(doc, yPos, "ENDEREÇO", upperAutor.endereco, data);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(autor.dataNascimento), data);
            yPos = addField(doc, yPos, "NATURALIDADE", upperAutor.naturalidade, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", upperAutor.filiacaoMae, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", upperAutor.filiacaoPai, data);
            yPos = addField(doc, yPos, "RG", upperAutor.rg, data);
            yPos = addField(doc, yPos, "CPF", upperAutor.cpf, data);
            yPos = addField(doc, yPos, "CELULAR", upperAutor.celular, data);
            yPos = addField(doc, yPos, "E-MAIL", upperAutor.email, data);

            if (index < autoresValidos.length - 1) {
                yPos += 5; // Espaço entre autores
            }
        });
    } else {
        yPos = addSectionTitle(doc, yPos, "AUTORES", currentSectionNumber.toFixed(1), 2, data);
        currentSectionNumber += 0.1;
        yPos = addWrappedText(doc, yPos, "Nenhum autor informado.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // Vítimas
    if (!isDrugCase) {
        const vitimasValidas = data.vitimas ? data.vitimas.filter(v => v?.nome) : [];
        if (vitimasValidas.length > 0) {
            vitimasValidas.forEach((vitima, index) => {
                const vitimaTitle = `VÍTIMA ${vitima.nome.toUpperCase()}`;
                yPos = addSectionTitle(doc, yPos, vitimaTitle, currentSectionNumber.toFixed(1), 2, data);
                currentSectionNumber += 0.1;

                const upperVitima = {
                    ...vitima,
                    nome: vitima.nome ? vitima.nome.toUpperCase() : 'Não Informado',
                    sexo: vitima.sexo ? vitima.sexo.toUpperCase() : 'Não Informado',
                    estadoCivil: vitima.estadoCivil ? vitima.estadoCivil.toUpperCase() : 'Não Informado',
                    profissao: vitima.profissao ? vitima.profissao.toUpperCase() : 'Não Informado',
                    endereco: vitima.endereco ? vitima.endereco.toUpperCase() : 'Não Informado',
                    naturalidade: vitima.naturalidade ? vitima.naturalidade.toUpperCase() : 'Não Informado',
                    filiacaoMae: vitima.filiacaoMae ? vitima.filiacaoMae.toUpperCase() : 'Não Informado',
                    filiacaoPai: vitima.filiacaoPai ? vitima.filiacaoPai.toUpperCase() : 'Não Informado',
                    rg: vitima.rg ? vitima.rg.toUpperCase() : 'Não Informado',
                    cpf: vitima.cpf ? vitima.cpf.toUpperCase() : 'Não Informado',
                    celular: vitima.celular ? vitima.celular.toUpperCase() : 'Não Informado',
                    email: vitima.email ? vitima.email.toUpperCase() : 'Não Informado',
                };

                yPos = addField(doc, yPos, "NOME", upperVitima.nome, data);
                yPos = addField(doc, yPos, "SEXO", upperVitima.sexo, data);
                yPos = addField(doc, yPos, "ESTADO CIVIL", upperVitima.estadoCivil, data);
                yPos = addField(doc, yPos, "PROFISSÃO", upperVitima.profissao, data);
                yPos = addField(doc, yPos, "ENDEREÇO", upperVitima.endereco, data);
                yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(vitima.dataNascimento), data);
                yPos = addField(doc, yPos, "NATURALIDADE", upperVitima.naturalidade, data);
                yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", upperVitima.filiacaoMae, data);
                yPos = addField(doc, yPos, "FILIAÇÃO - PAI", upperVitima.filiacaoPai, data);
                yPos = addField(doc, yPos, "RG", upperVitima.rg, data);
                yPos = addField(doc, yPos, "CPF", upperVitima.cpf, data);
                yPos = addField(doc, yPos, "CELULAR", upperVitima.celular, data);
                yPos = addField(doc, yPos, "E-MAIL", upperVitima.email, data);

                if (index < vitimasValidas.length - 1) {
                    yPos += 5; // Espaço entre vítimas
                }
            });
        } else {
            yPos = addSectionTitle(doc, yPos, "VÍTIMAS", currentSectionNumber.toFixed(1), 2, data);
            currentSectionNumber += 0.1;
            yPos = addWrappedText(doc, yPos, "Nenhuma vítima informada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
            yPos += 2;
        }
    }

    // Testemunhas
    const testemunhasValidas = data.testemunhas ? data.testemunhas.filter(t => t?.nome) : [];
    if (testemunhasValidas.length > 0) {
        testemunhasValidas.forEach((testemunha, index) => {
            const testemunhaTitle = `TESTEMUNHA ${testemunha.nome.toUpperCase()}`;
            yPos = addSectionTitle(doc, yPos, testemunhaTitle, currentSectionNumber.toFixed(1), 2, data);
            currentSectionNumber += 0.1;

            const upperTestemunha = {
                ...testemunha,
                nome: testemunha.nome ? testemunha.nome.toUpperCase() : 'Não Informado',
                sexo: testemunha.sexo ? testemunha.sexo.toUpperCase() : 'Não Informado',
                estadoCivil: testemunha.estadoCivil ? testemunha.estadoCivil.toUpperCase() : 'Não Informado',
                profissao: testemunha.profissao ? testemunha.profissao.toUpperCase() : 'Não Informado',
                endereco: testemunha.endereco ? testemunha.endereco.toUpperCase() : 'Não Informado',
                naturalidade: testemunha.naturalidade ? testemunha.naturalidade.toUpperCase() : 'Não Informado',
                filiacaoMae: testemunha.filiacaoMae ? testemunha.filiacaoMae.toUpperCase() : 'Não Informado',
                filiacaoPai: testemunha.filiacaoPai ? testemunha.filiacaoPai.toUpperCase() : 'Não Informado',
                rg: testemunha.rg ? testemunha.rg.toUpperCase() : 'Não Informado',
                cpf: testemunha.cpf ? testemunha.cpf.toUpperCase() : 'Não Informado',
                celular: testemunha.celular ? testemunha.celular.toUpperCase() : 'Não Informado',
                email: testemunha.email ? testemunha.email.toUpperCase() : 'Não Informado',
            };

            yPos = addField(doc, yPos, "NOME", upperTestemunha.nome, data);
            yPos = addField(doc, yPos, "SEXO", upperTestemunha.sexo, data);
            yPos = addField(doc, yPos, "ESTADO CIVIL", upperTestemunha.estadoCivil, data);
            yPos = addField(doc, yPos, "PROFISSÃO", upperTestemunha.profissao, data);
            yPos = addField(doc, yPos, "ENDEREÇO", upperTestemunha.endereco, data);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(testemunha.dataNascimento), data);
            yPos = addField(doc, yPos, "NATURALIDADE", upperTestemunha.naturalidade, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", upperTestemunha.filiacaoMae, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", upperTestemunha.filiacaoPai, data);
            yPos = addField(doc, yPos, "RG", upperTestemunha.rg, data);
            yPos = addField(doc, yPos, "CPF", upperTestemunha.cpf, data);
            yPos = addField(doc, yPos, "CELULAR", upperTestemunha.celular, data);
            yPos = addField(doc, yPos, "E-MAIL", upperTestemunha.email, data);

            if (index < testemunhasValidas.length - 1) {
                yPos += 5; // Espaço entre testemunhas
            }
        });
    } else {
        // Se não houver testemunhas válidas, não exibir a seção de testemunhas
        // currentSectionNumber não precisa ser incrementado se a seção não for adicionada.
        // yPos = addSectionTitle(doc, yPos, "TESTEMUNHAS", currentSectionNumber.toFixed(1), 2, data);
        // currentSectionNumber += 0.1;
        // yPos = addWrappedText(doc, yPos, "Nenhuma testemunha informada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        // yPos += 2;
    }

    // --- SEÇÃO 3: HISTÓRICO ---
    const primeiroAutor = autoresValidos.length > 0 ? autoresValidos[0] : null;
    const vitimasComRelato = !isDrugCase ? (data.vitimas ? data.vitimas.filter(v => v?.nome) : []) : [];
    const testemunhasComRelato = data.testemunhas ? data.testemunhas.filter(t => t?.nome && t.nome.trim() !== "") : [];


    let historicoSectionNumber = 3.1;

    yPos = addSectionTitle(doc, yPos, "HISTÓRICO", "3", 1, data);
    yPos = addSectionTitle(doc, yPos, "RELATO DO POLICIAL MILITAR", historicoSectionNumber.toFixed(1), 2, data);
    historicoSectionNumber += 0.1;
    yPos = addWrappedText(doc, yPos, data.relatoPolicial || "Não Informado", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    // Determinar o título e o papel do autor com base no sexo do primeiro autor válido
    let tituloRelatoAutor = "RELATO DO(A) AUTOR(A) DO FATO";
    let autorRole = "AUTOR(A) DO FATO";
    if (primeiroAutor && primeiroAutor.sexo) {
        if (primeiroAutor.sexo.toLowerCase() === 'feminino') {
            tituloRelatoAutor = "RELATO DA AUTORA DO FATO";
            autorRole = "AUTORA DO FATO";
        } else if (primeiroAutor.sexo.toLowerCase() === 'masculino') {
            tituloRelatoAutor = "RELATO DO AUTOR DO FATO";
            autorRole = "AUTOR DO FATO";
        }
    }
    
    yPos = addSectionTitle(doc, yPos, tituloRelatoAutor, historicoSectionNumber.toFixed(1), 2, data);
    historicoSectionNumber += 0.1;
    yPos = addWrappedText(doc, yPos, data.relatoAutor || "Não Informado", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    if (primeiroAutor) {
        yPos = addSignatureWithNameAndRole(doc, yPos, primeiroAutor.nome, autorRole, data);
    } else {
        yPos += 10;
    }

    if (!isDrugCase && vitimasComRelato.length > 0) {
        vitimasComRelato.forEach((vitima, index) => {
            const tituloRelatoVitima = `RELATO DA VÍTIMA ${vitima.nome.toUpperCase()}`;
            yPos = addSectionTitle(doc, yPos, tituloRelatoVitima, historicoSectionNumber.toFixed(1), 2, data);
            historicoSectionNumber += 0.1;
            const relatoVitimaText = vitima.relato || "Relato não fornecido pela vítima.";
            yPos = addWrappedText(doc, yPos, relatoVitimaText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
            yPos = addSignatureWithNameAndRole(doc, yPos, vitima.nome, "VÍTIMA", data);
        });
    }

    // Apenas adicionar a seção de relato de testemunhas se houver testemunhas com nome e relato
    if (testemunhasComRelato.length > 0) {
        testemunhasComRelato.forEach((testemunha, index) => {
            const tituloRelatoTestemunha = `RELATO DA TESTEMUNHA ${testemunha.nome.toUpperCase()}`;
            yPos = addSectionTitle(doc, yPos, tituloRelatoTestemunha, historicoSectionNumber.toFixed(1), 2, data);
            historicoSectionNumber += 0.1;
            const relatoTestemunhaText = testemunha.relato || "A TESTEMUNHA ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, COMPROMISSADA NA FORMA DA LEI, QUE AOS COSTUMES RESPONDEU NEGATIVAMENTE OU QUE É AMIGA/PARENTE DE UMA DAS PARTES, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSERAM E NEM LHE FOI PERGUNTADO.";
            yPos = addWrappedText(doc, yPos, relatoTestemunhaText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
            yPos = addSignatureWithNameAndRole(doc, yPos, testemunha.nome, "TESTEMUNHA", data);
        });
    }
    // REMOVIDO: Não exibir nada se não houver testemunhas com nome e relato
    // else {
    //     yPos = addSectionTitle(doc, yPos, "RELATO DAS TESTEMUNHAS", historicoSectionNumber.toFixed(1), 2, data);
    //     historicoSectionNumber += 0.1;
    //     let relatoTestText = "Nenhuma testemunha identificada com relato.";
    //     if (data.relatoTestemunha && data.relatoTestemunha.trim() !== "" && data.relatoTestemunha.toUpperCase() !== "NENHUMA TESTEMUNHA IDENTIFICADA.") {
    //        // relatoTestText = data.relatoTestemunha; // This might be the generic one, avoid if no named witnesses
    //     }
    //     yPos = addWrappedText(doc, yPos, relatoTestText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    //     yPos += 10;
    // }


    yPos = addSectionTitle(doc, yPos, "CONCLUSÃO DO POLICIAL", historicoSectionNumber.toFixed(1), 2, data);
    yPos = addWrappedText(doc, yPos, data.conclusaoPolicial || "Não Informado", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    // --- SEÇÃO 4: PROVIDÊNCIAS ---
    yPos = addSectionTitle(doc, yPos, "PROVIDÊNCIAS", "4", 1, data);
    yPos = addWrappedText(doc, yPos, data.providencias || "Não Informado", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "DOCUMENTOS ANEXOS", "4.1", 2, data);
    yPos = addWrappedText(doc, yPos, data.documentosAnexos || "Nenhum.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "DESCRIÇÃO DOS OBJETOS/DOCUMENTOS APREENDIDOS", "4.2", 2, data);
    yPos = addWrappedText(doc, yPos, data.apreensaoDescricao || data.apreensoes || "Nenhum.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
    yPos += 2;

    const hasPhotos = data.objetosApreendidos && data.objetosApreendidos.length > 0;
    const hasVideos = data.videoLinks && data.videoLinks.length > 0;
    const hasImages = data.imageBase64 && data.imageBase64.length > 0;

    let sectionTitleFotosVideos = "FOTOS E VÍDEOS";
    if (hasPhotos && !hasVideos && !hasImages) sectionTitleFotosVideos = "FOTOS";
    else if (!hasPhotos && hasVideos && !hasImages) sectionTitleFotosVideos = "VÍDEOS";
    else if (!hasPhotos && !hasVideos && hasImages) sectionTitleFotosVideos = "IMAGENS ADICIONAIS";
    else if (hasImages && (hasPhotos || hasVideos)) sectionTitleFotosVideos = "FOTOS, VÍDEOS E IMAGENS ADICIONAIS";

    if (hasPhotos || hasVideos || hasImages) {
        yPos = addSectionTitle(doc, yPos, sectionTitleFotosVideos, "4.3", 2, data);
        if (hasImages) {
            yPos = checkPageBreak(doc, yPos, 50, data);
            yPos = addImagesToPDF(doc, yPos, data.imageBase64, PAGE_WIDTH, PAGE_HEIGHT);
        }
        if (hasVideos) {
            yPos = addSectionTitle(doc, yPos, "LINKS PARA VÍDEOS", "4.3.1", 3, data);
            yPos = checkPageBreak(doc, yPos, 40, data);
            const qrSize = 30;
            const qrMargin = 10;
            const qrTextHeight = 10;
            const maxQRsPerRow = 3;
            let currentX = MARGIN_LEFT;
            let currentY = yPos;
            const startY = yPos;
            for (let i = 0; i < data.videoLinks.length; i++) {
                const videoLink = data.videoLinks[i];
                const url = typeof videoLink === 'string' ? videoLink : videoLink.url;
                if (i > 0 && i % maxQRsPerRow === 0) {
                    currentX = MARGIN_LEFT;
                    currentY += qrSize + qrTextHeight + qrMargin;
                    if (currentY + qrSize + qrTextHeight > PAGE_HEIGHT - 20) {
                        currentY = addNewPage(doc, data);
                    }
                }
                try {
                    const qrCodeDataURL = await QRCode.toDataURL(url, {
                        margin: 1,
                        width: 300,
                        errorCorrectionLevel: 'H'
                    });
                    doc.addImage(qrCodeDataURL, 'PNG', currentX, currentY, qrSize, qrSize);
                    doc.setFontSize(8);
                    const label = typeof videoLink === 'object' && videoLink.descricao
                        ? videoLink.descricao
                        : `Vídeo ${i + 1}`;
                    const textWidth = doc.getTextWidth(label);
                    const centerX = currentX + (qrSize / 2) - (textWidth / 2);
                    doc.text(label, centerX, currentY + qrSize + 5);
                } catch (error) {
                    console.error(`Erro ao gerar QR Code para vídeo ${i+1}:`, error);
                    doc.setFontSize(8);
                    doc.setTextColor(255, 0, 0);
                    doc.text(`Erro no QR #${i+1}`, currentX, currentY + 10);
                    doc.setTextColor(0, 0, 0);
                }
                currentX += qrSize + qrMargin;
            }
            const qrRows = Math.ceil(data.videoLinks.length / maxQRsPerRow);
            const totalQRHeight = qrRows * (qrSize + qrTextHeight + qrMargin);
            yPos = startY + totalQRHeight;
        }
    } else {
        yPos = addSectionTitle(doc, yPos, "FOTOS E VÍDEOS", "4.3", 2, data);
        yPos = addWrappedText(doc, yPos, "Nenhuma foto, vídeo ou imagem adicional anexada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // --- SEÇÃO 5: IDENTIFICAÇÃO DA GUARNIÇÃO ---
    yPos = addSectionTitle(doc, yPos, "IDENTIFICAÇÃO DA GUARNIÇÃO", "5", 1, data);
    if (data.componentesGuarnicao && data.componentesGuarnicao.length > 0) {
        const componentesPrincipais = data.componentesGuarnicao.filter((comp, index) => index === 0 || !comp.apoio);
        const componentesApoio = data.componentesGuarnicao.filter((comp, index) => index > 0 && comp.apoio === true);
        componentesPrincipais.forEach((componente, index) => {
            const isCondutor = index === 0;
            const fieldsHeight = 3 * 6;
            const signatureHeight = 7;
            let currentOfficerContentHeight = fieldsHeight + signatureHeight;
            let spaceToReserve = currentOfficerContentHeight;
            if (index > 0) {
                spaceToReserve += 20;
            }
            yPos = checkPageBreak(doc, yPos, spaceToReserve, data);
            if (index > 0) {
                yPos += 15;
                doc.setLineWidth(0.1);
                doc.setDrawColor(200, 200, 200);
                doc.line(MARGIN_LEFT, yPos - 10, PAGE_WIDTH - MARGIN_RIGHT, yPos - 10);
                doc.setDrawColor(0);
                yPos += 5;
            }
            let nomeDisplay = componente.nome ? componente.nome.toUpperCase() : "NOME Não Informado";
            yPos = addField(doc, yPos, "NOME COMPLETO", nomeDisplay, data);
            yPos = addField(doc, yPos, "POSTO/GRADUAÇÃO", componente.posto ? componente.posto.toUpperCase() : "POSTO Não Informado", data);
            yPos = addField(doc, yPos, "RG PMMT", componente.rg || "RG Não Informado", data);
            yPos = checkPageBreak(doc, yPos, 7, data);
            const sigLineY = yPos;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.text("ASSINATURA:", MARGIN_LEFT, sigLineY);
            const labelWidth = doc.getTextWidth("ASSINATURA:");
            const lineStartX = MARGIN_LEFT + labelWidth + 2;
            const lineEndX = lineStartX + 80;
            doc.setLineWidth(0.3);
            doc.line(lineStartX, sigLineY, lineEndX, sigLineY);
            yPos = sigLineY + 7;
        });
        if (componentesApoio.length > 0) {
            yPos += 10;
            yPos = checkPageBreak(doc, yPos, 20, data);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("POLICIAIS DE APOIO:", MARGIN_LEFT, yPos);
            yPos += 7;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            componentesApoio.forEach((componente, index) => {
                yPos = checkPageBreak(doc, yPos, 6, data);
                const posto = componente.posto ? componente.posto.toUpperCase() : "POSTO Não Informado";
                const nome = componente.nome ? componente.nome.toUpperCase() : "NOME Não Informado";
                const rg = componente.rg || "RG Não Informado";
                const textoApoio = `${posto} ${nome} - RG: ${rg}`;
                doc.text(textoApoio, MARGIN_LEFT + 5, yPos);
                yPos += 6;
            });
        }
    } else {
        yPos = addWrappedText(doc, yPos, "Dados da Guarnição Não Informados.", MARGIN_LEFT, 12, 'italic', MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    return yPos;
};
