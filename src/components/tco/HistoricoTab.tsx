import { addNewPage } from './pdfUtils.js';

// Função fictícia para simular o conteúdo existente
// Substitua pelo conteúdo real do seu PDFhistorico.js
export const generateHistoricoContent = async (doc, yPosition, data) => {
    const { PAGE_HEIGHT, MARGIN_BOTTOM } = getPageConstants(doc);

    // Simulação do conteúdo histórico existente
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("HISTÓRICO", 20, yPosition);
    yPosition += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(data.relatoPolicial || "Sem relato policial.", 20, yPosition);
    yPosition += 20;

    // Adicionar seção de imagens, se houver
    if (data.imageBase64 && data.imageBase64.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("ANEXOS - IMAGENS", 20, yPosition);
        yPosition += 10;

        for (const image of data.imageBase64) {
            try {
                // Verificar se há espaço suficiente na página (50mm para imagem + 10mm margem)
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

                // Adicionar a imagem ao PDF (80mm de largura, 50mm de altura)
                doc.addImage(image.data, 'JPEG', 20, yPosition, 80, 50);
                yPosition += 60; // Espaço após a imagem
            } catch (error) {
                console.error(`Erro ao adicionar imagem ${image.name}:`, error);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.text(`[Erro: Não foi possível carregar a imagem ${image.name}]`, 20,scyPosition);
                yPosition += 10;
            }
        }
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
