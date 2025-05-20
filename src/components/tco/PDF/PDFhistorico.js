import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addSectionTitle, addField, addWrappedText, formatarDataHora, formatarDataSimples,
    checkPageBreak, addSignatureWithNameAndRole, addNewPage
} from './pdfUtils.js';
import QRCode from 'qrcode';

// Função auxiliar para adicionar imagens (copiada ou importada)
const addImagesToPDF = (doc, yPosition, images, pageWidth, pageHeight) => {
    const maxImageWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT; // Adjusted width
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

export const generateHistoricoContent = async (doc, currentY, data) => {
    let yPos = currentY;
    const { PAGE_WIDTH, MAX_LINE_WIDTH, PAGE_HEIGHT, MARGIN_TOP } = getPageConstants(doc);
    const isDrugCase = data.natureza === "Porte de drogas para consumo";

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
    // (Lógica para autores, vítimas, testemunhas - permanece a mesma, apenas verificando nulidades e usando uppercase)
    // ... (código da Seção 2 inalterado, mas garantindo que `addField` e `addWrappedText` lidem com dados em uppercase e possíveis nulos)

    // --- SEÇÃO 3: HISTÓRICO ---
    // (Lógica para relatos - permanece a mesma, mas garantindo que `addWrappedText` e `addSignatureWithNameAndRole` lidem com dados em uppercase e possíveis nulos)
    // ... (código da Seção 3 inalterado)

    // --- SEÇÃO 4: PROVIDÊNCIAS E ANEXOS ---
    // (Lógica para providências, documentos, apreensões, fotos e vídeos - permanece a mesma)
    // ... (código da Seção 4 inalterado)


    // --- SEÇÃO 5: IDENTIFICAÇÃO DA GUARNIÇÃO ---
    const guarnicaoPrincipal = [];
    const guarnicaoApoio = [];

    if (data.componentesGuarnicao && data.componentesGuarnicao.length > 0) {
        data.componentesGuarnicao.forEach((componente, index) => {
            if (index === 0 || !componente.apoio) { // Condutor ou não-apoio
                guarnicaoPrincipal.push(componente);
            } else { // Apoio (e não é o condutor, pois o condutor não pode ser apoio)
                guarnicaoApoio.push(componente);
            }
        });
    }

    yPos = addSectionTitle(doc, yPos, "IDENTIFICAÇÃO DA GUARNIÇÃO", "5", 1, data);
    
    if (guarnicaoPrincipal.length > 0) {
        guarnicaoPrincipal.forEach((componente, index) => {
            const fieldsHeight = 3 * 6; // Nome, Posto, RG
            const signatureHeight = 7;  // Assinatura
            let spaceToReserve = fieldsHeight + signatureHeight;
            if (index > 0) spaceToReserve += 20; // Espaço entre militares

            yPos = checkPageBreak(doc, yPos, spaceToReserve, data);

            if (index > 0) { 
                yPos += 15;
                doc.setLineWidth(0.1);
                doc.setDrawColor(200, 200, 200);
                doc.line(MARGIN_LEFT, yPos - 10, PAGE_WIDTH - MARGIN_RIGHT, yPos - 10);
                doc.setDrawColor(0);
                yPos += 5;
            }
    
            yPos = addField(doc, yPos, "NOME COMPLETO", componente.nome ? componente.nome.toUpperCase() : "NÃO INFORMADO", data);
            yPos = addField(doc, yPos, "POSTO/GRADUAÇÃO", componente.posto ? componente.posto.toUpperCase() : "NÃO INFORMADO", data);
            yPos = addField(doc, yPos, "RG PMMT", componente.rg || "NÃO INFORMADO", data);
            
            yPos = checkPageBreak(doc, yPos, 7, data); // Espaço para linha de assinatura
            const sigLineY = yPos;
            doc.setFont("helvetica", "normal"); 
            doc.setFontSize(12);
            doc.text("ASSINATURA:", MARGIN_LEFT, sigLineY);
            const labelWidth = doc.getTextWidth("ASSINATURA:");
            const lineStartX = MARGIN_LEFT + labelWidth + 2;
            const lineEndX = lineStartX + 80;
            doc.setLineWidth(0.3); 
            doc.line(lineStartX, sigLineY, lineEndX, sigLineY);
            yPos = sigLineY + 5; // Aumentar espaço após assinatura
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Dados da Guarnição Principal não informados.", MARGIN_LEFT, 12, 'italic', MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // --- SEÇÃO 5.1: GUARNIÇÃO DE APOIO ---
    if (guarnicaoApoio.length > 0) {
        yPos = addSectionTitle(doc, yPos, "GUARNIÇÃO DE APOIO", "5.1", 1, data); // Nível 1 para distinção clara
        
        guarnicaoApoio.forEach((componente, index) => {
            const lineHeight = 6; // Altura aproximada de uma linha de texto
            let spaceToReserve = lineHeight;
             if (index > 0) spaceToReserve += 3; // Pequeno espaço entre nomes do apoio

            yPos = checkPageBreak(doc, yPos, spaceToReserve, data);

            if (index > 0) {
                 yPos += 3; // Adiciona um pequeno espaço entre os nomes da guarnição de apoio
            }

            const nomeApoio = componente.nome ? componente.nome.toUpperCase() : "NOME NÃO INFORMADO";
            const postoApoio = componente.posto ? componente.posto.toUpperCase() : "POSTO NÃO INFORMADO";
            const rgApoio = componente.rg || "RG NÃO INFORMADO";
            
            const textoApoio = `${postoApoio} ${nomeApoio} - RGPM: ${rgApoio}`;
            
            // Usando addWrappedText para consistência de margem e quebra de linha se necessário,
            // embora aqui seja esperado que caiba em uma linha.
            yPos = addWrappedText(doc, yPos, textoApoio, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
            // Não adiciona linha de assinatura para apoio
        });
        yPos += 2; // Espaço após a lista de apoio
    }
    
    return yPos;
};
