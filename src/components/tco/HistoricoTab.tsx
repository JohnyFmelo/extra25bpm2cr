import { addNewPage } from './pdfUtils.js';

export const generateHistoricoContent = async (doc, yPosition, data) => {
    const { PAGE_HEIGHT, MARGIN_BOTTOM } = getPageConstants(doc);

    // Seção de histórico
    doc.setFont(" plantes", "bold");
    doc.setFontSize(12);
    doc.text("HISTÓRICO", 20, yPosition);
    yPosition += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(data.relatoPolicial || "Sem relato policial.", 20, yPosition);
    yPosition += 20;

    // Seção de vídeos (como links ou QR codes, mantendo comportamento existente)
    if (data.videoLinks && data.videoLinks.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("ANEXOS - VÍDEOS", 20, yPosition);
        yPosition += 10;

        data.videoLinks.forEach((link, index) => {
            if (yPosition + 20 > PAGE_HEIGHT - MARGIN_BOTTOM) {
                yPosition = addNewPage(doc, data);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.text("ANEXOS - VÍDEOS (CONTINUAÇÃO)", 20, yPosition);
                yPosition += 10;
            }

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Vídeo ${index + 1}: ${link}`, 20, yPosition);
            yPosition += 10;
        });
    }

    // Seção de imagens
    if (data.imageBase64 && data.imageBase64.length > 0) {
        console.log("Processando imagens para inclusão no PDF:", data.imageBase64);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("ANEXOS - IMAGENS", 20, yPosition);
        yPosition += 10;

        for (const image of data.imageBase64) {
            try {
                // Verificar se há espaço suficiente na página (60mm para imagem + margem)
                if (yPosition + 60 > PAGE_HEIGHT - MARGIN_BOTTOM) {
                    yPosition = addNewPage(doc, data);
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(12);
                    doc.text("ANEXOS - IMAGENS (CONTINUAÇÃO)", 20, yPosition);
                    yPosition += 10;
                }

                // Adicionar nome da imagem
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.text(`Imagem: ${image.name}`, 20, yPosition);
                yPosition += 5;

                // Determinar formato da imagem com base na extensão do arquivo
                const extension = image.name.split('.').pop()?.toLowerCase();
                const format = extension === 'png' ? 'PNG' : 'JPEG';

                // Adicionar a imagem ao PDF
                doc.addImage(image.data, format, 20, yPosition, 80, 50);
                console.log(`Imagem ${image.name} adicionada ao PDF.`);
                yPosition += 60; // Espaço após a imagem
            } catch (error) {
                console.error(`Erro ao adicionar imagem ${image.name}:`, error);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.text(`[Erro: Não foi possível carregar a imagem ${image.name}]`, 20, yPosition);
                yPosition += 10;
            }
        }
    } else {
        console.log("Nenhuma imagem fornecida para inclusão no PDF.");
    }

    return yPosition;
};

// Função fictícia para simular getPageConstants
function getPageConstants(doc) {
    return {
        PAGE_WIDTH: 210,
        PAGE_HEIGHT: 297,
        MARGIN_TOP: 20,
        MARGIN_BOTTOM: 20,
        MARGIN_RIGHT: 20
    };
}
