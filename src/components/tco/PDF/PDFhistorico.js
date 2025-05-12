// PDFhistorico.js
import { MARGIN_TOP, MARGIN_RIGHT, MARGIN_BOTTOM, addNewPage } from './pdfUtils.js';
import { addImagesToPDF } from './pdfGenerator.js';

export const generateHistoricoContent = async (doc, yPosition, data, pageWidth, pageHeight) => {
    let currentY = yPosition;

    // Configurações de fonte para títulos
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    // Seção 4.1: Relato Policial
    doc.text("4.1 Relato Policial", MARGIN_RIGHT, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const relatoPolicial = data.relatoPolicial || "N/A";
    const splitRelatoPolicial = doc.splitTextToSize(relatoPolicial, pageWidth - MARGIN_RIGHT * 2);
    doc.text(splitRelatoPolicial, MARGIN_RIGHT, currentY);
    currentY += splitRelatoPolicial.length * 4 + 5;

    // Verifica se precisa de nova página
    if (currentY + 50 > pageHeight - MARGIN_BOTTOM) {
        currentY = addNewPage(doc, data);
    }

    // Seção 4.2: Relatos das Partes
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("4.2 Relatos das Partes", MARGIN_RIGHT, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    // Relato do Autor
    const relatoAutor = data.relatoAutor || "N/A";
    const splitRelatoAutor = doc.splitTextToSize(relatoAutor, pageWidth - MARGIN_RIGHT * 2);
    doc.text(splitRelatoAutor, MARGIN_RIGHT, currentY);
    currentY += splitRelatoAutor.length * 4 + 5;

    // Relato da Vítima (se existir)
    if (data.relatoVitima) {
        if (currentY + 50 > pageHeight - MARGIN_BOTTOM) {
            currentY = addNewPage(doc, data);
        }
        const relatoVitima = data.relatoVitima || "N/A";
        const splitRelatoVitima = doc.splitTextToSize(relatoVitima, pageWidth - MARGIN_RIGHT * 2);
        doc.text(splitRelatoVitima, MARGIN_RIGHT, currentY);
        currentY += splitRelatoVitima.length * 4 + 5;
    }

    // Relato da Testemunha (se existir)
    if (data.relatoTestemunha) {
        if (currentY + 50 > pageHeight - MARGIN_BOTTOM) {
            currentY = addNewPage(doc, data);
        }
        const relatoTestemunha = data.relatoTestemunha || "N/A";
        const splitRelatoTestemunha = doc.splitTextToSize(relatoTestemunha, pageWidth - MARGIN_RIGHT * 2);
        doc.text(splitRelatoTestemunha, MARGIN_RIGHT, currentY);
        currentY += splitRelatoTestemunha.length * 4 + 5;
    }

    // Verifica se precisa de nova página
    if (currentY + 50 > pageHeight - MARGIN_BOTTOM) {
        currentY = addNewPage(doc, data);
    }

    // Seção 4.3: Anexos (Imagens)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("4.3 Anexos", MARGIN_RIGHT, currentY);
    currentY += 5;

    // Adiciona imagens na seção 4.3
    if (data.imageBase64 && data.imageBase64.length > 0) {
        currentY = addImagesToPDF(doc, currentY, data.imageBase64, pageWidth, pageHeight);
    } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Nenhuma imagem anexada.", MARGIN_RIGHT, currentY);
        currentY += 5;
    }

    // Verifica se precisa de nova página
    if (currentY + 50 > pageHeight - MARGIN_BOTTOM) {
        currentY = addNewPage(doc, data);
    }

    // Seção 4.4: Conclusão Policial
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("4.4 Emboração Policial", MARGIN_RIGHT, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const conclusaoPolicial = data.conclusaoPolicial || "N/A";
    const splitConclusao = doc.splitTextToSize(conclusaoPolicial, pageWidth - MARGIN_RIGHT * 2);
    doc.text(splitConclusao, MARGIN_RIGHT, currentY);
    currentY += splitConclusao.length * 4 + 5;

    return currentY;
};
