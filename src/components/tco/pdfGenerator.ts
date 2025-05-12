
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

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

/**
 * Upload PDF to Supabase Storage
 * @param pdfBlob PDF file blob
 * @param createdBy User ID of creator
 * @param tcoId TCO ID or number
 * @returns Object with download URL and file path
 */
const uploadPDFToSupabase = async (pdfBlob: Blob, createdBy: string, tcoId: string): Promise<{url: string, path: string}> => {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const filePath = `tcos/${createdBy}/${tcoId}_${dateStr}.pdf`;
    
    console.log(`Enviando arquivo para Supabase Storage: ${filePath}`);
    
    // Upload the file to Supabase storage
    const { data, error } = await supabase
      .storage
      .from('pdfs')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (error) throw error;
    
    console.log('Upload concluído:', data);
    
    // Get public URL for the file
    const { data: urlData } = supabase
      .storage
      .from('pdfs')
      .getPublicUrl(filePath);
    
    const downloadURL = urlData.publicUrl;
    console.log('URL do arquivo:', downloadURL);
    
    return {
      url: downloadURL,
      path: filePath
    };
  } catch (error) {
    console.error("Erro ao fazer upload do PDF no Supabase:", error);
    throw error;
  }
};

// --- Função Principal de Geração ---
export const generatePDF = async (inputData: any) => {
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

    // Clona os dados para evitar mutações inesperadas no objeto original
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

    // Adiciona Termo de Manifestação apenas se NÃO for caso de droga
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
    // Verifica se algum autor ou vítima tem laudoPericial: "Sim"
    const pessoasComLaudo = [
        ...(data.autores || []).filter(a => a.laudoPericial === "Sim").map(a => ({ nome: a.nome, sexo: a.sexo, tipo: "Autor" })),
        ...(data.vitimas || []).filter(v => v.laudoPericial === "Sim").map(v => ({ nome: v.nome, sexo: v.sexo, tipo: "Vítima" }))
    ].filter(p => p.nome && p.nome.trim()); // Filtra nomes válidos

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
        doc.setFont("helvetica", "normal"); doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - MARGIN_BOTTOM + 5, { align: "right" });

        if (i > 1) {
            addStandardFooterContent(doc);
        }
    }

    // --- Salvamento Local e Supabase ---
    const tcoNumParaNome = data.tcoNumber || 'SEM_NUMERO';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `TCO_${tcoNumParaNome}_${dateStr}.pdf`;

    try {
        // Gera o PDF e salva localmente
        const pdfOutput = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfOutput);
        
        // Cria um link para download e simula o clique
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = fileName;
        downloadLink.click();
        
        console.log(`PDF Gerado: ${fileName}`);
        
        // Salva o PDF no Supabase e registra as informações
        if (data.id && data.createdBy) {
            await savePDFAndUpdateRecord(pdfOutput, data);
        } else {
            console.warn("ID do TCO ou usuário não encontrado, não foi possível salvar no banco de dados");
        }
    } catch (error) {
        console.error("Erro ao salvar o PDF:", error);
        alert("Ocorreu um erro ao tentar salvar o PDF.");
    }
};

// Função para salvar o PDF no Supabase e atualizar registro no Supabase
async function savePDFAndUpdateRecord(pdfBlob: Blob, data: any) {
    try {
        // Upload do PDF para o Supabase Storage
        const { url: downloadURL, path: filePath } = await uploadPDFToSupabase(
            pdfBlob,
            data.createdBy,
            data.id || data.tcoNumber
        );
        
        // Extrai as informações dos policiais para salvar no Supabase
        const policiais = data.componentesGuarnicao ? data.componentesGuarnicao.map((policial: any) => ({
            nome: policial.nome,
            posto: policial.posto,
            rg: policial.rgpm || policial.rg,
        })) : [];
        
        // Atualiza o registro no Supabase com o URL do PDF e informações dos policiais
        const { error } = await supabase
            .from('tcos')
            .update({
                pdfUrl: downloadURL,
                pdfPath: filePath,
                policiais: policiais,
                natureza: data.natureza,
                tcoNumber: data.tcoNumber,
                updatedAt: new Date().toISOString()
            })
            .eq('id', data.id);
            
        if (error) {
            console.error("Erro ao atualizar registro no Supabase:", error);
            throw error;
        }
        
        console.log(`Documento TCO ${data.id} atualizado com URL do PDF e informações dos policiais`);
        return downloadURL;
    } catch (error) {
        console.error("Erro ao salvar PDF:", error);
        throw error;
    }
}
