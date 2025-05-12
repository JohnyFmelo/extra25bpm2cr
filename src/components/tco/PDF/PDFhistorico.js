import jsPDF from "jspdf";
import QRCode from "qrcode";
import {
    MARGIN_TOP,
    MARGIN_RIGHT,
    MARGIN_BOTTOM,
    getPageConstants,
    addNewPage,
    addStandardFooterContent,
} from "./pdfUtils.js";

// Interface para tipagem das imagens
interface ImageData {
    name: string;
    data: string;
}

// Função auxiliar para gerar QR code como URL de imagem
const generateQRCode = async (text: string): Promise<string> => {
    try {
        return await QRCode.toDataURL(text, { width: 100, margin: 1 });
    } catch (error) {
        console.error("Erro ao gerar QR code:", error);
        throw error;
    }
};

// Função auxiliar para adicionar imagens ao PDF
const addImagesToPDF = (
    doc: jsPDF,
    yPosition: number,
    images: ImageData[],
    pageWidth: number,
    pageHeight: number
): number => {
    const maxImageWidth = pageWidth - MARGIN_RIGHT * 2; // Largura máxima da imagem
    const maxImageHeight = 100; // Altura máxima por imagem
    const marginBetweenImages = 10; // Espaço entre imagens
    let currentY = yPosition;

    for (const image of images) {
        try {
            // Extrai o formato da imagem (ex: "data:image/jpeg;base64,...")
            const formatMatch = image.data.match(/^data:image\/(jpeg|png);base64,/);
            const format = formatMatch ? formatMatch[1].toUpperCase() : "JPEG";

            // Remove o prefixo para obter apenas os dados base64
            const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, "");

            // Verifica se há espaço suficiente na página
            if (currentY + maxImageHeight + MARGIN_BOTTOM > pageHeight) {
                currentY = addNewPage(doc, {});
                currentY = MARGIN_TOP;
            }

            // Adiciona a imagem ao PDF
            doc.addImage(base64Data, format, MARGIN_RIGHT, currentY, maxImageWidth, 0);

            // Obtém as dimensões reais da imagem
            const imgProps = doc.getImageProperties(base64Data);
            const imgHeight = (imgProps.height * maxImageWidth) / imgProps.width;

            // Atualiza a posição Y
            currentY += imgHeight + marginBetweenImages;

            // Adiciona o nome do arquivo como legenda
            doc.setFontSize(8);
            doc.text(`Imagem: ${image.name}`, MARGIN_RIGHT, currentY);
            currentY += 5;
        } catch (error) {
            console.error(`Erro ao adicionar imagem ${image.name}:`, error);
        }
    }

    return currentY;
};

// Função principal para gerar o conteúdo do histórico
export const generateHistoricoContent = async (
    doc: jsPDF,
    yPosition: number,
    data: any
): Promise<number> => {
    const { PAGE_WIDTH, PAGE_HEIGHT, LINE_HEIGHT } = getPageConstants(doc);
    let currentY = yPosition;

    // Configurações iniciais da fonte
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // --- Seção 4.1: Relato Policial ---
    doc.setFont("helvetica", "bold");
    doc.text("4.1 - RELATO POLICIAL", MARGIN_RIGHT, currentY);
    currentY += LINE_HEIGHT;

    doc.setFont("helvetica", "normal");
    const relatoPolicial = data.relatoPolicial || "Nenhum relato policial registrado.";
    const relatoPolicialLines = doc.splitTextToSize(
        relatoPolicial,
        PAGE_WIDTH - MARGIN_RIGHT * 2
    );
    doc.text(relatoPolicialLines, MARGIN_RIGHT, currentY);
    currentY += relatoPolicialLines.length * LINE_HEIGHT + LINE_HEIGHT;

    // --- Seção 4.2: Relato das Partes ---
    doc.setFont("helvetica", "bold");
    doc.text("4.2 - RELATO DAS PARTES", MARGIN_RIGHT, currentY);
    currentY += LINE_HEIGHT;

    // Relato do Autor
    doc.setFont("helvetica", "normal");
    const relatoAutor = data.relatoAutor || "Nenhum relato do autor registrado.";
    const relatoAutorLines = doc.splitTextToSize(
        relatoAutor,
        PAGE_WIDTH - MARGIN_RIGHT * 2
    );
    doc.text(relatoAutorLines, MARGIN_RIGHT, currentY);
    currentY += relatoAutorLines.length * LINE_HEIGHT;

    // Relato da Vítima (se houver)
    if (data.relatoVitima && data.vitimas?.length > 0) {
        currentY += LINE_HEIGHT / 2;
        const relatoVitima = data.relatoVitima || "Nenhum relato da vítima registrado.";
        const relatoVitimaLines = doc.splitTextToSize(
            relatoVitima,
            PAGE_WIDTH - MARGIN_RIGHT * 2
        );
        doc.text(relatoVitimaLines, MARGIN_RIGHT, currentY);
        currentY += relatoVitimaLines.length * LINE_HEIGHT;
    }

    // Relato da Testemunha (se houver)
    if (data.relatoTestemunha && data.testemunhas?.length > 0) {
        currentY += LINE_HEIGHT / 2;
        const relatoTestemunha =
            data.relatoTestemunha || "Nenhum relato da testemunha registrado.";
        const relatoTestemunhaLines = doc.splitTextToSize(
            relatoTestemunha,
            PAGE_WIDTH - MARGIN_RIGHT * 2
        );
        doc.text(relatoTestemunhaLines, MARGIN_RIGHT, currentY);
        currentY += relatoTestemunhaLines.length * LINE_HEIGHT;
    }
    currentY += LINE_HEIGHT;

    // --- Seção 4.3: Apreensões ---
    doc.setFont("helvetica", "bold");
    doc.text("4.3 - APREENSÕES", MARGIN_RIGHT, currentY);
    currentY += LINE_HEIGHT;

    doc.setFont("helvetica", "normal");
    const apreensoesText = data.apreensoes || "Nenhuma apreensão registrada.";
    const apreensoesLines = doc.splitTextToSize(
        apreensoesText,
        PAGE_WIDTH - MARGIN_RIGHT * 2
    );
    doc.text(apreensoesLines, MARGIN_RIGHT, currentY);
    currentY += apreensoesLines.length * LINE_HEIGHT;

    // Adicionar QR code para a seção 4.3 (se houver apreensões)
    if (data.apreensoes) {
        const qrCodeData = `Apreensões: ${data.apreensoes}`;
        try {
            const qrCodeUrl = await generateQRCode(qrCodeData);
            // Verifica se há espaço para o QR code
            if (currentY + 30 > PAGE_HEIGHT - MARGIN_BOTTOM) {
                currentY = addNewPage(doc, data);
                currentY = MARGIN_TOP;
            }
            doc.addImage(
                qrCodeUrl,
                "PNG",
                PAGE_WIDTH - MARGIN_RIGHT - 30,
                currentY,
                25,
                25
            );
            currentY += 30; // Espaço após o QR code
        } catch (error) {
            console.error("Erro ao gerar QR code para apreensões:", error);
        }
    }

    // Adicionar imagens após o QR code na seção 4.3
    if (data.imageBase64 && data.imageBase64.length > 0) {
        // Verifica se há espaço para pelo menos uma imagem
        if (currentY + 100 > PAGE_HEIGHT - MARGIN_BOTTOM) {
            currentY = addNewPage(doc, data);
            currentY = MARGIN_TOP;
        }
        currentY = addImagesToPDF(doc, currentY, data.imageBase64, PAGE_WIDTH, PAGE_HEIGHT);
    }

    currentY += LINE_HEIGHT;

    // --- Seção 4.4: Conclusão Policial ---
    doc.setFont("helvetica", "bold");
    doc.text("4.4 - CONCLUSÃO POLICIAL", MARGIN_RIGHT, currentY);
    currentY += LINE_HEIGHT;

    doc.setFont("helvetica", "normal");
    const conclusaoPolicial =
        data.conclusaoPolicial || "Nenhuma conclusão policial registrada.";
    const conclusaoPolicialLines = doc.splitTextToSize(
        conclusaoPolicial,
        PAGE_WIDTH - MARGIN_RIGHT * 2
    );
    doc.text(conclusaoPolicialLines, MARGIN_RIGHT, currentY);
    currentY += conclusaoPolicialLines.length * LINE_HEIGHT + LINE_HEIGHT;

    // --- Seção 4.5: Assinaturas ---
    doc.setFont("helvetica", "bold");
    doc.text("4.5 - ASSINATURAS", MARGIN_RIGHT, currentY);
    currentY += LINE_HEIGHT;

    doc.setFont("helvetica", "normal");
    const assinaturasText = [
        ...(data.autores || []).map(
            (a: any) => `Autor: ${a.nome || "Não informado"}`
        ),
        ...(data.vitimas || []).map(
            (v: any) => `Vítima: ${v.nome || "Não informado"}`
        ),
        ...(data.testemunhas || []).map(
            (t: any) => `Testemunha: ${t.nome || "Não informado"}`
        ),
        `Responsável pela Lavratura: ${data.userRegistration || "Não informado"}`,
    ].join("\n");
    const assinaturasLines = doc.splitTextToSize(
        assinaturasText,
        PAGE_WIDTH - MARGIN_RIGHT * 2
    );
    doc.text(assinaturasLines, MARGIN_RIGHT, currentY);
    currentY += assinaturasLines.length * LINE_HEIGHT;

    // Adiciona rodapé na página atual
    addStandardFooterContent(doc);

    return currentY;
};
