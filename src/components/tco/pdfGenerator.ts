import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import {
    MARGIN_TOP, MARGIN_BOTTOM, MARGIN_RIGHT, getPageConstants,
    addNewPage,
    addStandardFooterContent
} from './PDF/pdfUtils.js';
import { generateAutuacaoPage } from './PDF/PDFautuacao.js';
import { generateHistoricoContent } from './PDF/PDFhistorico.js';
import { addTermoCompromisso } from './PDF/PDFTermoCompromisso.js';
import { addTermoManifestacao } from './PDF/PDFTermoManifestacao.js';
import { addTermoApreensao } from './PDF/PDFTermoApreensao.js';
import { addTermoConstatacaoDroga } from './PDF/PDFTermoConstatacaoDroga.js';
import { addRequisicaoExameLesao } from './PDF/PDFTermoRequisicaoExameLesao.js';
import { addTermoEncerramentoRemessa } from './PDF/PDFTermoEncerramentoRemessa.js';

// Função para carregar imagem local
const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${url}`));
        img.src = url;
    });
};

// Função para adicionar imagens ao PDF
const addImagesToPDF = async (doc: jsPDF, imageUrls: string[], startY: number) => {
    let yPosition = startY;
    const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc);
    const MAX_IMAGE_WIDTH = PAGE_WIDTH - 2 * MARGIN_RIGHT;
    const MAX_IMAGE_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM - 20;

    for (const url of imageUrls) {
        try {
            const img = await loadImage(url);
            const imgProps = doc.getImageProperties(img);
            let width = imgProps.width;
            let height = imgProps.height;

            const aspectRatio = width / height;
            if (width > MAX_IMAGE_WIDTH) {
                width = MAX_IMAGE_WIDTH;
                height = width / aspectRatio;
            }
            if (height > MAX_IMAGE_HEIGHT) {
                height = MAX_IMAGE_HEIGHT;
                width = height * aspectRatio;
            }

            if (yPosition + height + MARGIN_BOTTOM > PAGE_HEIGHT) {
                yPosition = addNewPage(doc, {});
            }

            doc.addImage(img, 'JPEG', MARGIN_RIGHT, yPosition, width, height);
            yPosition += height + 10;
        } catch (error) {
            console.error(`Erro ao adicionar imagem ${url}:`, error);
        }
    }

    return yPosition;
};

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

    // Página 1: Autuação
    yPosition = generateAutuacaoPage(doc, MARGIN_TOP, data);

    // Páginas seguintes
    yPosition = addNewPage(doc, data);

    // Seção de histórico e envolvidos
    yPosition = await generateHistoricoContent(doc, yPosition, data);

    // Adicionar imagens locais, se existirem
    if (data.image_urls && data.image_urls.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("ANEXOS - IMAGENS", MARGIN_RIGHT, yPosition);
        yPosition += 10;

        yPosition = await addImagesToPDF(doc, data.image_urls, yPosition);
    } else {
        console.log("Nenhuma imagem fornecida para inclusão no PDF.");
    }

    // Adicionar termos
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

    if (data.apreensoes) {
        addTermoApreensao(doc, data);
    }

    if (data.droga_tipo || data.droga_nome_comum) {
        addTermoConstatacaoDroga(doc, data);
    }

    // Requisição de exame de lesão corporal
    const pessoasComLaudo = [
        ...(data.autores || []).filter(a => a.laudo_pericial === "Sim").map(a => ({ nome: a.nome, sexo: a.sexo, tipo: "Autor" })),
        ...(data.vitimas || []).filter(v => v.laudo_pericial === "Sim").map(v => ({ nome: v.nome, sexo: v.sexo, tipo: "Vítima" }))
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

    // Adicionar numeração de páginas
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

    // Salvamento
    const tcoNumParaNome = data.tco_number || 'SEM_NUMERO';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `TCO_${tcoNumParaNome}_${dateStr}.pdf`;

    try {
        // Gerar PDF
        const pdfOutput = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfOutput);

        // Download local
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = fileName;
        downloadLink.click();

        console.log(`PDF Gerado: ${fileName}`);

        // Upload do PDF para o Supabase Storage
        const filePath = `tco-pdfs/${data.created_by}/${data.id}_${dateStr}.pdf`;
        const { error: uploadError } = await supabase.storage
            .from('tco-pdfs')
            .upload(filePath, pdfOutput, { contentType: 'application/pdf', upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('tco-pdfs')
            .getPublicUrl(filePath);
        const downloadURL = urlData.publicUrl;

        console.log('URL do PDF:', downloadURL);

        // Atualizar registro no Supabase com a URL do PDF
        if (data.id) {
            const { error: updateError } = await supabase
                .from('tcos')
                .update({
                    pdf_url: downloadURL,
                    updated_at: new Date()
                })
                .eq('id', data.id);
            if (updateError) throw updateError;
            console.log(`TCO ${data.id} atualizado com URL do PDF`);
        } else {
            console.warn("ID do TCO não encontrado, não foi possível atualizar o registro.");
        }
    } catch (error) {
        console.error("Erro ao salvar o PDF:", error);
        alert("Ocorreu um erro ao tentar salvar o PDF.");
    }
};
