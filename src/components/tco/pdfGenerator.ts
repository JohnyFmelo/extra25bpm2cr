import jsPDF from "jspdf";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabaseClient";

// Importa funções auxiliares e de página da subpasta PDF
import {
    MARGIN_TOP, MARGIN_BOTTOM, MARGIN_RIGHT, getPageConstants,
    addNewPage,
    addStandardFooterContent
} from './PDF/pdfUtils.js';

// Importa geradores de conteúdo da subpasta PDF
import { generateAutuacaoPage } from './PDF/PDFautuacao.js';
import { generateHistoricoContent } from './PDF/PDFhistorico.js';
import { addTermoCompromisso } from './PDF/PDFTermoCompromisso.js';
import { addTermoManifestacao } from './PDF/PDFTermoManifestacao.js';
import { addTermoApreensao } from './PDF/PDFTermoApreensao.js';
import { addTermoConstatacaoDroga } from './PDF/PDFTermoConstatacaoDroga.js';
import { addRequisicaoExameLesao } from './PDF/PDFTermoRequisicaoExameLesao.js';
import { addTermoEncerramentoRemessa } from './PDF/PDFTermoEncerramentoRemessa.js';

// Função auxiliar para adicionar imagens ao PDF
const addImagesToPDF = (doc: jsPDF, yPosition: number, images: { name: string; data: string }[], pageWidth: number, pageHeight: number) => {
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
            if (currentY + maxImageHeight + MARGIN_BOTTOM > pageHeight) {
                currentY = addNewPage(doc, {});
                currentY = MARGIN_TOP; // Reseta a posição Y
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

// --- Função Principal de Geração ---
export const generatePDF = async (inputData: any) => {
    console.log("Iniciando generatePDF com dados:", JSON.stringify(inputData, null, 2));
    if (!inputData || typeof inputData !== 'object' || Object.keys(inputData).length === 0) {
        console.error("Input data missing or invalid. Cannot generate PDF.");
        alert("Erro: Dados inválidos para gerar o PDF.");
        return;
    }

    // Cria a instância do jsPDF
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    // Clona os dados para evitar mutações inesperadas
    const data = { ...inputData };

    // Pega as constantes da página
    const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc);
    let yPosition;

    // --- PÁGINA 1: AUTUAÇÃO ---
    yPosition = generateAutuacaoPage(doc, MARGIN_TOP, data);

    // --- RESTANTE DO TCO (PÁGINAS 2+) ---
    yPosition = addNewPage(doc, data);

    // --- SEÇÕES 1-5: Histórico, Envolvidos, etc. ---
    yPosition = await generateHistoricoContent(doc, yPosition, data);

    // --- ADIÇÃO DOS TERMOS ---
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

    if (data.apreensaoDescrição || data.apreensoes) {
        addTermoApreensao(doc, data);
    }

    if (data.drogaTipo || data.drogaNomeComum) {
        addTermoConstatacaoDroga(doc, data);
    }

    // --- REQUISIÇÃO DE EXAME DE LESÃO CORPORAL ---
    const pessoasComLaudo = [
        ...(data.autores || []).filter(a => a.laudoPericial === "Sim").map(a => ({ nome: a.nome, sexo: a.sexo, tipo: "Autor" })),
        ...(data.vitimas || []).filter(v => v.laudoPericial === "Sim").map(v => ({ nome: v.nome, sexo: v.sexo, tipo: "Vítima" }))
    ].filter(p => p.nome && p.nome.trim());

    if (pessoasComLaudo.length > 0) {
        pessoasComLaudo.forEach(pessoa => {
            console.log(`Gerando Requisição de Exame de Lesão para: ${pessoa.nome} (${pessoa.tipo}, Sexo: ${pessoa.sexo || 'Não especificado'})`);
            addRequisicaoExameLesao(doc, { ...data, periciadoNome: pessoa.nome, sexo: pessoa.sexo });
        });
    } else {
        console.log("Nenhum autor ou vítima com laudoPericial: 'Sim'. Pulando Requisição de Exame de Lesão.");
    }

    addTermoEncerramentoRemessa(doc, data);

    // --- Finalização: Adiciona Números de Página e Salva ---
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - MARGIN_BOTTOM + 5, { align: "right" });

        if (i > 1) {
            addStandardFooterContent(doc);
        }
    }

    // --- Retorna o Blob do PDF ---
    const pdfOutput = doc.output('blob');
    console.log("PDF gerado, tamanho do blob:", pdfOutput.size);
    if (!pdfOutput || pdfOutput.size === 0) {
        throw new Error("Generated PDF is empty or invalid.");
    }
    
    // Se temos um ID de TCO, salvar o PDF no Supabase
    if (data.id) {
        try {
            const pdfUrl = await savePDFToSupabase(pdfOutput, data.tcoNumber || data.id);
            console.log("PDF salvo no Supabase, URL:", pdfUrl);
        } catch (error) {
            console.error("Erro ao salvar PDF no Supabase:", error);
            throw error;
        }
    }
    
    return pdfOutput;
};

// Função para salvar o PDF no Supabase Storage
async function savePDFToSupabase(pdfBlob: Blob, tcoNumber: string) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user?.id || 'unknown';
        
        const sanitizedTcoNumber = String(tcoNumber).trim().replace(/[^a-zA-Z0-9-_]/g, '');
        const filePath = `tcos/${sanitizedTcoNumber}/${sanitizedTcoNumber}.pdf`;
        
        console.log(`Enviando PDF para Supabase Storage: ${filePath}, userId: ${userId}`);
        
        const { error: uploadError } = await supabase.storage
            .from('tco_pdfs')
            .upload(filePath, pdfBlob, { 
                contentType: 'application/pdf',
                upsert: true
            });
            
        if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage
            .from('tco_pdfs')
            .getPublicUrl(filePath);
            
        // Atualizar a tabela com as informações do PDF
        const { error: updateError } = await supabase
            .from('tco_pdfs')
            .upsert({
                tco_id: tcoNumber,
                pdf_url: publicUrl,
                pdf_path: filePath,
                createdBy: userId,
                updated_at: new Date().toISOString()
            });
            
        if (updateError) throw new Error(`Erro ao atualizar informações do TCO: ${updateError.message}`);
        
        console.log("PDF salvo com sucesso no Supabase");
        return publicUrl;
    } catch (error) {
        console.error("Erro ao salvar PDF no Supabase:", error);
        throw error;
    }
}

// Comentando a função original do Firebase para evitar conflitos
/*
async function savePDFToFirebase(doc: jsPDF, data: any, tcoNumParaNome: string, dateStr: string) {
    try {
        const pdfBlob = doc.output('blob');
        const storage = getStorage();
        const filePath = `tcos/${data.createdBy}/${data.id || data.tcoNumber}_${dateStr}.pdf`;
        const fileRef = ref(storage, filePath);

        console.log(`Enviando arquivo para Firebase Storage: ${filePath}`);
        const uploadResult = await uploadBytes(fileRef, pdfBlob);
        console.log('Upload concluído:', uploadResult);

        const downloadURL = await getDownloadURL(uploadResult.ref);
        console.log('URL do arquivo:', downloadURL);

        if (data.id) {
            const tcoRef = doc(db, "tcos", data.id);
            await updateDoc(tcoRef, {
                pdfUrl: downloadURL,
                pdfPath: filePath,
                updatedAt: new Date()
            });
            console.log(`Documento TCO ${data.id} atualizado com URL do PDF.`);
        }
    } catch (error) {
        console.error("Erro ao salvar PDF no Firebase:", error);
        throw error;
    }
}
*/
