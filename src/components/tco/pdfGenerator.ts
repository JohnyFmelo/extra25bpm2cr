import jsPDF from "jspdf";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateDoc, doc as firestoreDoc } from "firebase/firestore"; // Renomeado 'doc' para 'firestoreDoc' para evitar conflito com jsPDF.doc
import { db } from "@/lib/firebase";
import QRCode from 'qrcode'; // Importa a biblioteca QRCode

// Importa funções auxiliares e de página da subpasta PDF
import {
    MARGIN_TOP, MARGIN_BOTTOM, MARGIN_RIGHT, getPageConstants,
    addNewPage,
    addStandardFooterContent
} from './PDF/pdfUtils.js'; // Assumindo MARGIN_LEFT é igual a MARGIN_RIGHT ou definido aqui.

// Supondo que MARGIN_LEFT não está em pdfUtils, definimos um aqui.
const MARGIN_LEFT = MARGIN_RIGHT; // Ou defina um valor explícito, ex: 15

// Importa geradores de conteúdo da subpasta PDF
import { generateAutuacaoPage } from './PDF/PDFautuacao.js';
import { generateHistoricoContent } from './PDF/PDFhistorico.js';
import { addTermoCompromisso } from './PDF/PDFTermoCompromisso.js';
import { addTermoManifestacao } from './PDF/PDFTermoManifestacao.js';
import { addTermoApreensao } from './PDF/PDFTermoApreensao.js';
import { addTermoConstatacaoDroga } from './PDF/PDFTermoConstatacaoDroga.js';
import { addRequisicaoExameLesao } from './PDF/PDFTermoRequisicaoExameLesao.js';
import { addTermoEncerramentoRemessa } from './PDF/PDFTermoEncerramentoRemessa.js';


// Função auxiliar para adicionar imagens ao PDF - Modificada para aceitar marginLeft
const addImagesToPDF = (
    doc: jsPDF, 
    yPosition: number, 
    images: { name: string; data: string }[], // data é base64 string
    pageWidth: number, 
    pageHeight: number,
    marginLeft: number, // Novo parâmetro
    marginRight: number // Para cálculo da largura máxima
 ): number => {
    const maxImageWidth = pageWidth - marginLeft - marginRight; 
    const maxImageHeight = 100; 
    const marginBetweenImages = 10; 
    let currentY = yPosition;

    for (const image of images) {
        try {
            const formatMatch = image.data.match(/^data:image\/(jpeg|png|gif|webp);base64,/);
            const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG'; 
            const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '');

            // Provisoriamente, forçar JPEG se não for PNG, pois jsPDF tem melhor suporte para JPEG/PNG
            const finalFormat = (format === 'PNG' || format === 'JPEG') ? format : 'JPEG';

            const img = new Image();
            img.src = image.data;
            
            // Adicionar imagem somente após o carregamento para obter dimensões corretas e evitar erros
            // Esta é uma operação assíncrona, o que complica o fluxo síncrono do jsPDF.
            // A abordagem atual do jsPDF.addImage com base64 deve calcular as dimensões.
            // Vamos manter a abordagem original, mas com a correção de `finalFormat`.

            const imgProps = doc.getImageProperties(base64Data); // Obtém propriedades da imagem base64
            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;

            // Redimensiona se exceder a largura máxima, mantendo a proporção
            if (imgWidth > maxImageWidth) {
                const ratio = maxImageWidth / imgWidth;
                imgWidth = maxImageWidth;
                imgHeight = imgHeight * ratio;
            }
            // Redimensiona se exceder a altura máxima, mantendo a proporção (opcional, dependendo do design)
            if (imgHeight > maxImageHeight) {
                 const ratio = maxImageHeight / imgHeight;
                 imgHeight = maxImageHeight;
                 imgWidth = imgWidth * ratio;
            }
            
            if (currentY + imgHeight + MARGIN_BOTTOM > pageHeight) {
                addNewPage(doc, {}); // Passar 'data' se necessário para cabeçalho/rodapé da nova página
                currentY = MARGIN_TOP; 
            }
            
            doc.addImage(base64Data, finalFormat, marginLeft, currentY, imgWidth, imgHeight); 
            currentY += imgHeight + marginBetweenImages / 2;

            doc.setFontSize(8);
            doc.text(`Foto: ${image.name}`, marginLeft, currentY);
            currentY += 5 + marginBetweenImages / 2; 
        } catch (error) {
            console.error(`Erro ao adicionar imagem ${image.name}:`, error);
            // Se uma imagem falhar, adiciona uma mensagem de erro no PDF para depuração
            if (currentY + 10 > pageHeight - MARGIN_BOTTOM) {
                addNewPage(doc, {});
                currentY = MARGIN_TOP;
            }
            doc.setTextColor(255,0,0);
            doc.text(`Erro ao processar imagem: ${image.name}`, marginLeft, currentY);
            doc.setTextColor(0,0,0);
            currentY += 10;
        }
    }
    return currentY; 
};


// Função para adicionar a seção de Mídia da Ocorrência (Vídeos e Fotos)
async function addOcorrenciaMidiaSection(
    doc: jsPDF,
    yPos: number,
    data: any,
    pageWidth: number,
    pageHeight: number
): Promise<number> {
    let currentY = yPos;
    const videos = data.videoLinks || [];
    // inputData.occurrencePhotos deve ser: { name: string, data: string (base64) }[]
    const photos = data.occurrencePhotos || []; 

    const hasVideos = videos.length > 0;
    const hasPhotos = photos.length > 0;

    if (!hasVideos && !hasPhotos) {
        return currentY; // Nada a adicionar
    }

    // Verifica espaço para título da seção
    if (currentY + 20 > pageHeight - MARGIN_BOTTOM) { 
        addNewPage(doc, data);
        currentY = MARGIN_TOP;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");

    let sectionTitle = "4.3 ";
    if (hasVideos && hasPhotos) {
        sectionTitle += "VÍDEOS E FOTOS DA OCORRÊNCIA";
    } else if (hasVideos) {
        // Conforme pedido: "Quando for Juntado apenas Vídeos, o nome do Subtitulo será 4.3 VÍDEOS FOTOS DA OCORRÊNCIA"
        sectionTitle += "VÍDEOS FOTOS DA OCORRÊNCIA"; 
    } else if (hasPhotos) {
        sectionTitle += "FOTOS DA OCORRÊNCIA";
    }
    doc.text(sectionTitle, MARGIN_LEFT, currentY);
    currentY += 7; // Espaço após o título
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);


    if (hasVideos) {
        const qrCodeSize = 40; // Tamanho do QR code em mm
        const text lineHeight = 5;
        if (currentY + qrCodeSize + text lineHeight > pageHeight - MARGIN_BOTTOM) { 
             addNewPage(doc, data);
             currentY = MARGIN_TOP;
        }
        
        doc.setFont("helvetica", "bold");
        doc.text("QR CODE DOS VÍDEOS:", MARGIN_LEFT, currentY);
        currentY += text lineHeight;
        doc.setFont("helvetica", "normal");


        const videoLinksString = videos.join('\n');
        try {
            const qrCodeImageBase64 = await QRCode.toDataURL(videoLinksString, { 
                errorCorrectionLevel: 'M', 
                width: 200, // pixels, jsPDF vai escalar para mm
                margin: 1 
            });
            
            doc.addImage(qrCodeImageBase64, 'PNG', MARGIN_LEFT, currentY, qrCodeSize, qrCodeSize);
            currentY += qrCodeSize + 5; 

        } catch (err) {
            console.error('Falha ao gerar QR Code para vídeos:', err);
            if (currentY + 10 > pageHeight - MARGIN_BOTTOM) { 
                addNewPage(doc, data);
                currentY = MARGIN_TOP;
            }
            doc.setTextColor(255, 0, 0); 
            doc.text("Erro ao gerar QR Code para os links de vídeo.", MARGIN_LEFT, currentY);
            doc.setTextColor(0, 0, 0); 
            currentY += 10;
        }
    }
    
    currentY += 5; // Espaço extra antes das fotos, se houver vídeos.

    if (hasPhotos) {
         if (currentY + 20 > pageHeight - MARGIN_BOTTOM && photos.length > 0) { // Espaço mínimo para uma foto
            addNewPage(doc, data);
            currentY = MARGIN_TOP;
        }
        doc.setFont("helvetica", "bold");
        doc.text("FOTOS DA OCORRÊNCIA:", MARGIN_LEFT, currentY);
        currentY += 7;
        doc.setFont("helvetica", "normal");

        currentY = addImagesToPDF(doc, currentY, photos, pageWidth, pageHeight, MARGIN_LEFT, MARGIN_RIGHT);
    }

    return currentY + 5; // Espaço após a seção de mídia
}


// --- Função Principal de Geração ---
export const generatePDF = async (inputData: any) => {
    if (!inputData || typeof inputData !== 'object' || Object.keys(inputData).length === 0) {
        console.error("Input data missing or invalid. Cannot generate PDF.");
        alert("Erro: Dados inválidos para gerar o PDF.");
        return;
    }

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const data = { ...inputData };
    const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc);
    let yPosition;

    // --- PÁGINA 1: AUTUAÇÃO ---
    yPosition = generateAutuacaoPage(doc, MARGIN_TOP, data);

    // Se 'data.imageBase64' for um QR Code principal do TCO ou algo similar, ele é adicionado aqui.
    // Este NÃO é o QR Code dos vídeos da ocorrência nem as fotos da ocorrência.
    if (data.imageBase64 && Array.isArray(data.imageBase64) && data.imageBase64.length > 0) {
        // Assume que data.imageBase64 é [{name: string, data: string}]
        yPosition = addImagesToPDF(doc, yPosition + 10, data.imageBase64, PAGE_WIDTH, PAGE_HEIGHT, MARGIN_LEFT, MARGIN_RIGHT);
    }

    // --- RESTANTE DO TCO (PÁGINAS 2+) ---
    addNewPage(doc, data); // Inicia sempre em uma nova página após a Autuação
    yPosition = MARGIN_TOP;


    // --- SEÇÕES DO HISTÓRICO (relatos, etc.) ---
    yPosition = await generateHistoricoContent(doc, yPosition, data, PAGE_WIDTH, PAGE_HEIGHT); // Assumindo que esta função também pode precisar de page constants.


    // --- SEÇÃO 4.3: VÍDEOS E FOTOS DA OCORRÊNCIA ---
    // Esta seção será adicionada após o conteúdo principal do histórico gerado por generateHistoricoContent.
    yPosition = await addOcorrenciaMidiaSection(doc, yPosition, data, PAGE_WIDTH, PAGE_HEIGHT);


    // --- ADIÇÃO DOS TERMOS ---
    // O 'yPosition' dos termos deve ser resetado para MARGIN_TOP em suas respectivas novas páginas.
    // As funções de termo (addTermoCompromisso, etc.) devem lidar com a criação de novas páginas internamente.

    if (data.autores && data.autores.length > 0) {
        addTermoCompromisso(doc, data);
    } else {
        console.warn("Nenhum autor informado, pulando Termo de Compromisso.");
    }

    if (data.natureza !== "Porte de drogas para consumo") {
        addTermoManifestacao(doc, data);
    } else {
        console.log("Caso de droga detectado, pulando Termo de Manifestação da Vítima.");
    }

    if (data.apreensaoDescrição || data.apreensoes) { // 'apreensoes' é o texto da textarea
        addTermoApreensao(doc, data);
    }

    if (data.drogaTipo || data.drogaNomeComum) {
        addTermoConstatacaoDroga(doc, data);
    }

    const pessoasComLaudo = [
        ...(data.autores || []).filter((a: any) => a.laudoPericial === "Sim").map((a: any) => ({ nome: a.nome, sexo: a.sexo, tipo: "Autor" })),
        ...(data.vitimas || []).filter((v: any) => v.laudoPericial === "Sim").map((v: any) => ({ nome: v.nome, sexo: v.sexo, tipo: "Vítima" }))
    ].filter((p: any) => p.nome && p.nome.trim());

    if (pessoasComLaudo.length > 0) {
        pessoasComLaudo.forEach((pessoa: any) => {
            console.log(`Gerando Requisição de Exame de Lesão para: ${pessoa.nome} (${pessoa.tipo}, Sexo: ${pessoa.sexo || 'Não especificado'})`);
            addRequisicaoExameLesao(doc, { ...data, periciadoNome: pessoa.nome, sexo: pessoa.sexo });
        });
    } else {
        console.log("Nenhum autor ou vítima com laudoPericial: 'Sim'. Pulando Requisição de Exame de Lesão.");
    }

    addTermoEncerramentoRemessa(doc, data);

    // --- Finalização: Adiciona Números de Página e Salva ---
    const pageCount = (doc.internal as any).pages.length -1; // ou doc.getNumberOfPages(); jsPDF typings vary
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - MARGIN_BOTTOM + 10, { align: "right" }); // Ajuste para estar abaixo da linha do rodapé padrão

        // Rodapé padrão para páginas após a primeira (que é a de Autuação)
        // if (i > 1) { // O rodapé da primeira página (autuação) é diferente
        //    addStandardFooterContent(doc); // A lógica de quando adicionar footer pode ser mais complexa.
        // }
        // A lógica original já adicionava footer para i > 1
         if (i > 1 && typeof addStandardFooterContent === 'function') { // Adicionar verificação se a função existe
            addStandardFooterContent(doc);
        }
    }

    const tcoNumParaNome = data.tcoNumber || 'SEM_NUMERO';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `TCO_${tcoNumParaNome}_${dateStr}.pdf`;

    try {
        const pdfOutput = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfOutput);

        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink); // Necessário para Firefox
        downloadLink.click();
        document.body.removeChild(downloadLink); // Limpar
        URL.revokeObjectURL(pdfUrl); // Limpar object URL

        console.log(`PDF Gerado: ${fileName}`);

        await savePDFToFirebase(doc, data, tcoNumParaNome, dateStr);
    } catch (error) {
        console.error("Erro ao salvar o PDF:", error);
        alert("Ocorreu um erro ao tentar salvar o PDF.");
    }
};


async function savePDFToFirebase(doc: jsPDF, data: any, tcoNumParaNome: string, dateStr: string) {
    try {
        const pdfBlob = doc.output('blob');
        const storage = getStorage();
        
        // Usa data.id (UUID gerado no frontend) se disponível, senão tcoNumber
        const documentIdForPath = data.id || tcoNumParaNome;
        if (!documentIdForPath || documentIdForPath === 'SEM_NUMERO') {
            console.warn("ID do TCO ou Número do TCO não disponível para o caminho do Firebase Storage. Usando um placeholder.");
            // Considerar gerar um ID temporário ou tratar este caso mais robustamente
        }
        const filePath = `tcos/${data.createdBy || 'unknown_user'}/${documentIdForPath}_${dateStr}.pdf`;
        const fileRef = ref(storage, filePath);

        console.log(`Enviando arquivo para Firebase Storage: ${filePath}`);
        const uploadResult = await uploadBytes(fileRef, pdfBlob);
        console.log('Upload concluído:', uploadResult);

        const downloadURL = await getDownloadURL(uploadResult.ref);
        console.log('URL do arquivo:', downloadURL);

        if (data.id) { // Atualiza Firestore apenas se data.id (ID do documento Firestore) existir
            const tcoDocRef = firestoreDoc(db, "tcos", data.id);
            await updateDoc(tcoDocRef, {
                pdfUrl: downloadURL,
                pdfPath: filePath, // Caminho no Storage
                updatedAt: new Date()
            });
            console.log(`Documento TCO ${data.id} atualizado com URL do PDF.`);
        } else {
            console.warn("data.id não fornecido, não foi possível atualizar o documento no Firestore com a URL do PDF.");
        }
    } catch (error) {
        console.error("Erro ao salvar PDF no Firebase:", error);
        // Não re-lançar o erro aqui permite que o download local ainda funcione se o Firebase falhar
        alert("PDF gerado localmente, mas falha ao salvar no Firebase Storage. Verifique o console para detalhes.");
    }
}
