
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addSectionTitle, addField, addWrappedText, formatarDataHora, formatarDataSimples,
    checkPageBreak, addSignatureWithNameAndRole, addNewPage, LINE_HEIGHT
} from './pdfUtils.js';
import QRCode from 'qrcode';

// Função auxiliar para adicionar imagens (data.imageBase64)
const addImagesToPDF = (doc, yPosition, images, pageWidth, pageHeight, data) => {
    // Obtém constantes da página, incluindo margens e altura útil
    const {
        MARGIN_LEFT: M_LEFT,
        MARGIN_RIGHT: M_RIGHT,
        // MARGIN_TOP: M_TOP, // addNewPage deve retornar yPos já considerando MARGIN_TOP
        // PAGE_HEIGHT_USABLE // checkPageBreak deve usar isso internamente
    } = getPageConstants(doc);

    const maxImageDisplayWidth = pageWidth - M_LEFT - M_RIGHT; // Largura máxima para exibir a imagem
    const defaultMaxImageHeight = 150; // Altura padrão para estimar quebra de página, se não puder calcular antes
    const marginBetweenImages = 10;
    let currentY = yPosition;

    for (const image of images) {
        if (!image || !image.data) {
            console.warn("Item de imagem inválido ou sem dados:", image);
            continue;
        }
        try {
            const formatMatch = image.data.match(/^data:image\/(jpeg|jpg|png);base64,/i); // Adicionado jpg, case-insensitive
            const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG'; // Default para JPEG

            const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '');

            // Tenta obter propriedades da imagem para estimar altura
            let estimatedBlockHeight = defaultMaxImageHeight + 15; // Altura da imagem + legenda + margem
            try {
                const imgProps = doc.getImageProperties(base64Data);
                if (imgProps.width > 0) { // Evitar divisão por zero
                    const proportionalHeight = (imgProps.height * maxImageDisplayWidth) / imgProps.width;
                    estimatedBlockHeight = proportionalHeight + 15; // 10 para legenda, 5 para margem inferior
                }
            } catch (e) {
                console.warn("Não foi possível obter propriedades da imagem para estimativa de altura, usando default:", e);
            }
            
            currentY = checkPageBreak(doc, currentY, estimatedBlockHeight, data);

            // Adiciona a imagem ao PDF, jsPDF calcula a altura para manter proporção se altura for 0
            doc.addImage(base64Data, format, M_LEFT, currentY, maxImageDisplayWidth, 0);

            // Calcula a altura real que a imagem ocupou para atualizar currentY
            // Este é o método mais confiável após adicionar a imagem
            const addedImgProps = doc.getImageProperties(base64Data); // Re-obter pode ser necessário se jsPDF altera algo
            const renderedImgHeight = (addedImgProps.height * maxImageDisplayWidth) / addedImgProps.width;
            currentY += renderedImgHeight;
            currentY += 3; // Pequeno espaço antes da legenda

            currentY = checkPageBreak(doc, currentY, 8, data); // Espaço para legenda
            doc.setFontSize(8);
            doc.text(`Imagem: ${image.name || 'Imagem sem nome'}`, M_LEFT, currentY);
            currentY += 8; // Altura da legenda + espaço depois

            currentY += marginBetweenImages / 2; // Espaço antes da próxima

        } catch (error) {
            console.error(`Erro ao adicionar imagem ${image.name || 'desconhecida'}:`, error);
            // Adicionar texto de erro no PDF
            currentY = checkPageBreak(doc, currentY, 10, data);
            doc.setFontSize(8).setTextColor(255, 0, 0); // Vermelho
            doc.text(`[Erro ao processar imagem: ${image.name || 'desconhecida'}]`, M_LEFT, currentY);
            doc.setTextColor(0, 0, 0); // Resetar cor
            currentY += 10;
        }
    }
    if (images && images.length > 0) {
        currentY += marginBetweenImages / 2; // Espaço final se houver imagens
    }
    return currentY;
};


export const generateHistoricoContent = async (doc, currentY, data) => {
    let yPos = currentY;
    const { PAGE_WIDTH, MAX_LINE_WIDTH, PAGE_HEIGHT, MARGIN_LEFT: M_LEFT, MARGIN_RIGHT: M_RIGHT } = getPageConstants(doc);
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
    yPos = addSectionTitle(doc, yPos, "ENVOLVIDOS", "2", 1, data);

    const autoresValidos = data.autores ? data.autores.filter(a => a?.nome) : [];
    if (autoresValidos.length > 0) {
        let autorTitleText;
        if (autoresValidos.length === 1) {
            autorTitleText = autoresValidos[0]?.sexo?.toLowerCase() === 'feminino' ? "AUTORA DO FATO" : "AUTOR DO FATO";
        } else {
            autorTitleText = "AUTORES DO FATO";
        }
        yPos = addSectionTitle(doc, yPos, autorTitleText, "2.1", 2, data);
        autoresValidos.forEach((autor, index) => {
            const upperAutor = { ...autor }; // Clonar para não modificar o original
            for (const key in upperAutor) {
                if (typeof upperAutor[key] === 'string') {
                    upperAutor[key] = upperAutor[key].toUpperCase();
                }
            }
            
            if (index > 0) {
                yPos += 3; yPos = checkPageBreak(doc, yPos, 5, data);
                doc.setLineWidth(0.1); doc.setDrawColor(150);
                doc.line(M_LEFT, yPos - 1, PAGE_WIDTH - M_RIGHT, yPos - 1);
                doc.setDrawColor(0); yPos += 2;
            }
            yPos = addField(doc, yPos, "NOME", upperAutor.nome, data);
            yPos = addField(doc, yPos, "SEXO", upperAutor.sexo, data);
            yPos = addField(doc, yPos, "ESTADO CIVIL", upperAutor.estadoCivil, data);
            yPos = addField(doc, yPos, "PROFISSÃO", upperAutor.profissao, data);
            yPos = addField(doc, yPos, "ENDEREÇO", upperAutor.endereco, data);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(autor.dataNascimento), data); // Data não é uppercase
            yPos = addField(doc, yPos, "NATURALIDADE", upperAutor.naturalidade, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", upperAutor.filiacaoMae, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", upperAutor.filiacaoPai, data);
            yPos = addField(doc, yPos, "RG", upperAutor.rg, data);
            yPos = addField(doc, yPos, "CPF", upperAutor.cpf, data);
            yPos = addField(doc, yPos, "CELULAR", upperAutor.celular, data);
            yPos = addField(doc, yPos, "E-MAIL", upperAutor.email, data);
        });
    } else {
        yPos = addSectionTitle(doc, yPos, "AUTOR(ES) DO FATO", "2.1", 2, data);
        yPos = addWrappedText(doc, yPos, "Nenhum autor informado.", M_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    if (!isDrugCase) {
        const vitimasValidas = data.vitimas ? data.vitimas.filter(v => v?.nome) : [];
        if (vitimasValidas.length > 0) {
            const vitimaTitleText = vitimasValidas.length === 1 ? "VÍTIMA" : "VÍTIMAS";
            yPos = addSectionTitle(doc, yPos, vitimaTitleText, "2.2", 2, data);
            vitimasValidas.forEach((vitima, index) => {
                const upperVitima = { ...vitima };
                for (const key in upperVitima) {
                    if (typeof upperVitima[key] === 'string') {
                        upperVitima[key] = upperVitima[key].toUpperCase();
                    }
                }
                if (index > 0) {
                    yPos += 3; yPos = checkPageBreak(doc, yPos, 5, data);
                    doc.setLineWidth(0.1); doc.setDrawColor(150);
                    doc.line(M_LEFT, yPos - 1, PAGE_WIDTH - M_RIGHT, yPos - 1);
                    doc.setDrawColor(0); yPos += 2;
                }
                yPos = addField(doc, yPos, "NOME", upperVitima.nome, data);
                yPos = addField(doc, yPos, "SEXO", upperVitima.sexo, data);
                // ... (restante dos campos da vítima, similar ao autor)
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
            });
        } else {
            yPos = addSectionTitle(doc, yPos, "VÍTIMA(S)", "2.2", 2, data);
            yPos = addWrappedText(doc, yPos, "Nenhuma vítima informada.", M_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
            yPos += 2;
        }
    }

    const testemunhasValidas = data.testemunhas ? data.testemunhas.filter(t => t?.nome) : [];
    if (testemunhasValidas.length > 0) {
        const testemunhaTitleText = testemunhasValidas.length === 1 ? "TESTEMUNHA" : "TESTEMUNHAS";
        yPos = addSectionTitle(doc, yPos, testemunhaTitleText, "2.3", 2, data);
        testemunhasValidas.forEach((testemunha, index) => {
            const upperTestemunha = { ...testemunha };
             for (const key in upperTestemunha) {
                if (typeof upperTestemunha[key] === 'string') {
                    upperTestemunha[key] = upperTestemunha[key].toUpperCase();
                }
            }
            if (index > 0) {
                yPos += 3; yPos = checkPageBreak(doc, yPos, 5, data);
                doc.setLineWidth(0.1); doc.setDrawColor(150);
                doc.line(M_LEFT, yPos - 1, PAGE_WIDTH - M_RIGHT, yPos - 1);
                doc.setDrawColor(0); yPos += 2;
            }
            yPos = addField(doc, yPos, "NOME", upperTestemunha.nome, data);
            yPos = addField(doc, yPos, "SEXO", upperTestemunha.sexo, data);
            // ... (restante dos campos da testemunha, similar ao autor)
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
        });
    } else {
        yPos = addSectionTitle(doc, yPos, "TESTEMUNHA(S)", "2.3", 2, data);
        yPos = addWrappedText(doc, yPos, "Nenhuma testemunha informada.", M_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // --- SEÇÃO 3: HISTÓRICO ---
    const primeiroAutor = autoresValidos[0]; // Usar autoresValidos
    const primeiraVitima = !isDrugCase ? (data.vitimas ? data.vitimas.find(v => v?.nome) : null) : null;
    const primeiraTestemunha = testemunhasValidas[0]; // Usar testemunhasValidas

    yPos = addSectionTitle(doc, yPos, "HISTÓRICO", "3", 1, data);
    yPos = addSectionTitle(doc, yPos, "RELATO DO POLICIAL MILITAR", "3.1", 2, data);
    yPos = addWrappedText(doc, yPos, data.relatoPolicial || "Não informado.", M_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    const tituloRelatoAutor = primeiroAutor?.sexo?.toLowerCase() === 'feminino' ? "RELATO DA AUTORA DO FATO" : "RELATO DO AUTOR DO FATO";
    yPos = addSectionTitle(doc, yPos, tituloRelatoAutor, "3.2", 2, data);
    yPos = addWrappedText(doc, yPos, data.relatoAutor || "Não informado.", M_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    
    if (primeiroAutor) {
        const autorLabel = primeiroAutor?.sexo?.toLowerCase() === 'feminino' ? "AUTORA DO FATO" : "AUTOR DO FATO";
        yPos = addSignatureWithNameAndRole(doc, yPos, primeiroAutor?.nome?.toUpperCase(), autorLabel, data);
    } else {
        yPos += 10; // Espaço se não houver assinatura
        yPos = checkPageBreak(doc, yPos, 0, data); // Verificar quebra mesmo para espaço
    }

    if (!isDrugCase) {
        yPos = addSectionTitle(doc, yPos, "RELATO DA VÍTIMA", "3.3", 2, data);
        const relatoVitimaText = primeiraVitima ? (data.relatoVitima || "Relato não fornecido pela vítima.") : "Nenhuma vítima identificada para fornecer relato.";
        yPos = addWrappedText(doc, yPos, relatoVitimaText, M_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        if (primeiraVitima) {
            yPos = addSignatureWithNameAndRole(doc, yPos, primeiraVitima?.nome?.toUpperCase(), "VÍTIMA", data);
        } else {
            yPos += 10;
            yPos = checkPageBreak(doc, yPos, 0, data);
        }
    }

    const testemunhaSectionNumber = isDrugCase ? "3.3" : "3.4";
    yPos = addSectionTitle(doc, yPos, "RELATO DA TESTEMUNHA", testemunhaSectionNumber, 2, data);
    let relatoTestText = "Nenhuma testemunha identificada para fornecer relato.";
    if (primeiraTestemunha) {
        relatoTestText = data.relatoTestemunha || "Relato não fornecido pela testemunha.";
    }
    yPos = addWrappedText(doc, yPos, relatoTestText, M_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    if (primeiraTestemunha) {
        yPos = addSignatureWithNameAndRole(doc, yPos, primeiraTestemunha?.nome?.toUpperCase(), "TESTEMUNHA", data);
    } else {
        yPos += 10;
        yPos = checkPageBreak(doc, yPos, 0, data);
    }

    const conclusaoSectionNumber = isDrugCase ? "3.4" : "3.5";
    yPos = addSectionTitle(doc, yPos, "CONCLUSÃO DO POLICIAL", conclusaoSectionNumber, 2, data);
    yPos = addWrappedText(doc, yPos, data.conclusaoPolicial || "Não informado.", M_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    // --- SEÇÃO 4: PROVIDÊNCIAS E ANEXOS ---
    yPos = addSectionTitle(doc, yPos, "PROVIDÊNCIAS", "4", 1, data);
    yPos = addWrappedText(doc, yPos, data.providencias || "Não informado.", M_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "DOCUMENTOS ANEXOS", "4.1", 2, data);
    yPos = addWrappedText(doc, yPos, data.documentosAnexos || "Nenhum.", M_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "DESCRIÇÃO DOS OBJETOS/DOCUMENTOS APREENDIDOS", "4.2", 2, data);
    // Garantir que data.apreensoes seja tratado como texto se usado como fallback
    const apreensoesTexto = typeof data.apreensoes === 'string' ? data.apreensoes : "Nenhum objeto/documento descrito.";
    yPos = addWrappedText(doc, yPos, data.apreensaoDescricao || apreensoesTexto, M_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
    yPos += 2;

    // --- SEÇÃO 4.3: FOTOS E/OU VÍDEOS ---
    const hasPhotosData = data.objetosApreendidos && data.objetosApreendidos.length > 0;
    const hasVideosData = data.videoLinks && data.videoLinks.length > 0;
    const hasImagesData = data.imageBase64 && data.imageBase64.length > 0;
    let fotosVideosSectionTitle = "FOTOS, VÍDEOS E IMAGENS ADICIONAIS"; // Título mais genérico

    if (hasPhotosData || hasVideosData || hasImagesData) {
        yPos = addSectionTitle(doc, yPos, fotosVideosSectionTitle, "4.3", 2, data);

        if (hasPhotosData) {
            const photoWidth = 50;
            const photoHeight = 50;
            let xPos = M_LEFT;
            let startYOfPhotoLine = yPos; // Para avançar yPos após uma linha de fotos

            for (let i = 0; i < data.objetosApreendidos.length; i++) {
                const photo = data.objetosApreendidos[i];
                // Verifica quebra de página para cada foto individualmente ou para a linha
                yPos = checkPageBreak(doc, yPos, photoHeight + 5, data);
                if (yPos < startYOfPhotoLine) startYOfPhotoLine = yPos; // Atualiza se houve quebra

                try {
                    let imageData = photo; // Assume que photo é string base64 ou File
                    if (photo instanceof File) {
                        imageData = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(photo);
                        });
                    } else if (typeof photo === 'object' && photo.data && typeof photo.data === 'string') {
                         imageData = photo.data; // Se for objeto {name, data}
                    } else if (typeof photo !== 'string') {
                        throw new Error("Formato de foto inválido");
                    }

                    if (xPos + photoWidth > PAGE_WIDTH - M_RIGHT) { // Quebra de linha de fotos
                        xPos = M_LEFT;
                        yPos = startYOfPhotoLine + photoHeight + 5; // Avança para a próxima linha de fotos
                        startYOfPhotoLine = yPos; // Define o novo início da linha
                        yPos = checkPageBreak(doc, yPos, photoHeight + 5, data); // Verifica para a nova linha
                         if (yPos < startYOfPhotoLine) startYOfPhotoLine = yPos;
                    }
                    doc.addImage(imageData, 'JPEG', xPos, yPos, photoWidth, photoHeight);
                    xPos += photoWidth + 5;
                } catch (error) {
                    console.error(`Erro ao adicionar foto ${i + 1}:`, error);
                    if (xPos + photoWidth > PAGE_WIDTH - M_RIGHT) {
                        xPos = M_LEFT;
                        yPos = startYOfPhotoLine + photoHeight + 5;
                        startYOfPhotoLine = yPos;
                         yPos = checkPageBreak(doc, yPos, photoHeight + 5, data);
                         if (yPos < startYOfPhotoLine) startYOfPhotoLine = yPos;
                    }
                    doc.text(`[Erro foto ${i + 1}]`, xPos, yPos + photoHeight / 2);
                    xPos += photoWidth + 5;
                }
            }
            yPos = startYOfPhotoLine + photoHeight + 5; // Avança yPos após a última linha de fotos
        }

        if (hasVideosData) {
            yPos += (hasPhotosData ? 5 : 0); // Pequeno espaço se já houver fotos
            const qrSize = 30;
            let xPos = M_LEFT;
            let startYOfQrLine = yPos;

            for (let i = 0; i < data.videoLinks.length; i++) {
                const link = data.videoLinks[i];
                yPos = checkPageBreak(doc, yPos, qrSize + 10, data);
                 if (yPos < startYOfQrLine) startYOfQrLine = yPos;

                try {
                     if (xPos + qrSize > PAGE_WIDTH - M_RIGHT) {
                        xPos = M_LEFT;
                        yPos = startYOfQrLine + qrSize + 10;
                        startYOfQrLine = yPos;
                        yPos = checkPageBreak(doc, yPos, qrSize + 10, data);
                         if (yPos < startYOfQrLine) startYOfQrLine = yPos;
                    }
                    const qrCodeDataUrl = await QRCode.toDataURL(link, { width: qrSize, margin: 1 });
                    doc.addImage(qrCodeDataUrl, 'PNG', xPos, yPos, qrSize, qrSize);
                    doc.setFontSize(8);
                    doc.text(`Vídeo ${i + 1}`, xPos, yPos + qrSize + 5);
                    xPos += qrSize + 10;
                } catch (error) {
                    console.error(`Erro ao gerar QR code para o vídeo ${i + 1}:`, error);
                     if (xPos + qrSize > PAGE_WIDTH - M_RIGHT) {
                        xPos = M_LEFT;
                        yPos = startYOfQrLine + qrSize + 10;
                        startYOfQrLine = yPos;
                        yPos = checkPageBreak(doc, yPos, qrSize + 10, data);
                        if (yPos < startYOfQrLine) startYOfQrLine = yPos;
                    }
                    doc.text(`[Erro QR ${i + 1}]`, xPos, yPos + qrSize / 2);
                    xPos += qrSize + 10;
                }
            }
             yPos = startYOfQrLine + qrSize + 10;
        }

        if (hasImagesData) {
            yPos += (hasPhotosData || hasVideosData ? 5 : 0);
            yPos = addImagesToPDF(doc, yPos, data.imageBase64, PAGE_WIDTH, PAGE_HEIGHT, data);
        }
        yPos += 2; // Espaço após a seção de mídias
    } else {
        yPos = addSectionTitle(doc, yPos, "FOTOS, VÍDEOS E IMAGENS ADICIONAIS", "4.3", 2, data);
        yPos = addWrappedText(doc, yPos, "Nenhuma foto, vídeo ou imagem adicional anexada.", M_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // --- SEÇÃO 5: IDENTIFICAÇÃO DA GUARNIÇÃO ---
    yPos = addSectionTitle(doc, yPos, "IDENTIFICAÇÃO DA GUARNIÇÃO", "5", 1, data);
    
    if (data.componentesGuarnicao && data.componentesGuarnicao.length > 0) {
        data.componentesGuarnicao.forEach((componente, index) => {
            if (index > 0) { 
                yPos += 10; // Espaço entre componentes
                yPos = checkPageBreak(doc, yPos, 55, data); // Altura estimada para próximo componente
                
                doc.setLineWidth(0.1);
                doc.setDrawColor(200, 200, 200); // Cinza claro para a linha
                doc.line(M_LEFT, yPos - 5, PAGE_WIDTH - M_RIGHT, yPos - 5); // Linha um pouco acima
                doc.setDrawColor(0); // Resetar cor do traço
            }
    
            yPos = addField(doc, yPos, "NOME COMPLETO", componente.nome?.toUpperCase(), data);
            yPos = addField(doc, yPos, "POSTO/GRADUAÇÃO", componente.posto?.toUpperCase(), data);
            yPos = addField(doc, yPos, "RG PMMT", componente.rg?.toUpperCase(), data);
            yPos = checkPageBreak(doc, yPos, LINE_HEIGHT + 5, data); // Para assinatura
    
            const sigLineY = yPos;
            doc.setFont("helvetica", "normal"); 
            doc.setFontSize(12);
            doc.text("ASSINATURA:", M_LEFT, sigLineY);
            const labelWidth = doc.getTextWidth("ASSINATURA:");
            const lineStartX = M_LEFT + labelWidth + 3; // Pequeno espaço após label
            const lineEndX = Math.min(lineStartX + 80, PAGE_WIDTH - M_RIGHT); // Linha não ultrapassa margem
            doc.setLineWidth(0.3); 
            doc.line(lineStartX, sigLineY, lineEndX, sigLineY);
            yPos = sigLineY + 5; // Mais espaço após a linha de assinatura
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Dados da Guarnição não informados.", M_LEFT, 12, 'italic', MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }
    
    return yPos;
};
