import jsPDF from "jspdf";

// Importa funções auxiliares e de página da subpasta PDF
import {
    MARGIN_TOP, MARGIN_BOTTOM, MARGIN_RIGHT, getPageConstants,
    addNewPage,
    addStandardFooterContent
} from './PDF/pdfUtils.js'; // Assuming .js extension as per original

// Importa geradores de conteúdo da subpasta PDF
import { generateAutuacaoPage } from './PDF/PDFautuacao.js';
import { generateHistoricoContent } from './PDF/PDFhistorico.js';
import { addTermoCompromisso } from './PDF/PDFTermoCompromisso.js';
import { addTermoManifestacao } from './PDF/PDFTermoManifestacao.js';
import { addTermoApreensao } from './PDF/PDFTermoApreensao.js';
import { addTermoConstatacaoDroga } from './PDF/PDFTermoConstatacaoDroga.js';
// **** NEW IMPORT ****
import { addRequisicaoExameDrogas } from './PDF/PDFpericiadrogas'; // .tsx extension might be resolved automatically by bundler
// ********************
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
                currentY = addNewPage(doc, {}); // Pass an empty object or necessary data for new page headers/footers
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
export const generatePDF = async (inputData: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        // Set timeout to prevent infinite processing
        const timeout = setTimeout(() => {
            reject(new Error("Tempo limite excedido ao gerar PDF. Por favor, tente novamente."));
        }, 60000); // 60 segundos de timeout
        
        try {
            if (!inputData || typeof inputData !== 'object' || Object.keys(inputData).length === 0) {
                clearTimeout(timeout);
                reject(new Error("Dados inválidos para gerar o PDF."));
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
            generateHistoricoContent(doc, yPosition, data)
                .then(() => {
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

                    // Check if apreensaoDescrição or apreensoes exists and has content
                    // The TCOForm uses 'apreensoes'. Ensure this matches the property name.
                    if (data.apreensoes && data.apreensoes.trim() !== "") {
                        addTermoApreensao(doc, data);
                    }

                    if (data.drogaTipo || data.drogaNomeComum) {
                        addTermoConstatacaoDroga(doc, data);
                        // **** CALL THE NEW FUNCTION HERE ****
                        // This will add the drug examination request page after the drug constatation term
                        addRequisicaoExameDrogas(doc, data);
                        // ***********************************
                    }

                    // --- REQUISIÇÃO DE EXAME DE LESÃO CORPORAL ---
                    const pessoasComLaudo = [
                        ...(data.autores || []).filter((a: any) => a.laudoPericial === "Sim").map((a: any) => ({ nome: a.nome, sexo: a.sexo, tipo: "Autor" })),
                        ...(data.vitimas || []).filter((v: any) => v.laudoPericial === "Sim").map((v: any) => ({ nome: v.nome, sexo: v.sexo, tipo: "Vítima" }))
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
                    const pageCount = doc.internal.pages.length - 1; // doc.internal.pages is 1-based, so length - 1 for 0-based loop or actual count
                    for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(8);
                        doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - MARGIN_BOTTOM + 5, { align: "right" });

                        // Standard footer content might be different or not present on page 1 (Autuação)
                        // This logic adds it to pages after the first. Adjust if Autuação page also needs it.
                        if (i > 1) {
                            addStandardFooterContent(doc); // Pass data if your footer needs it
                        }
                    }

                    // Opcionalmente, gera um download local
                    if (data.downloadLocal) {
                        try {
                            const tcoNumParaNome = data.tcoNumber || 'SEM_NUMERO';
                            const dateStr = new Date().toISOString().slice(0, 10);
                            const fileName = `TCO_${tcoNumParaNome}_${dateStr}.pdf`;
                            
                            doc.save(fileName);
                            console.log(`PDF salvo localmente: ${fileName}`);
                        } catch (downloadError) {
                            console.error("Erro ao salvar o PDF localmente:", downloadError);
                            // Não falha a Promise principal se o download falhar
                        }
                    }

                    // Generate blob and resolve the promise
                    const pdfBlob = doc.output('blob');
                    clearTimeout(timeout);
                    resolve(pdfBlob);
                })
                .catch(histError => {
                    clearTimeout(timeout);
                    reject(new Error(`Erro ao gerar histórico do PDF: ${histError.message || histError}`));
                });
        } catch (error: any) { // Explicitly type error
            clearTimeout(timeout);
            reject(new Error(`Erro na geração do PDF: ${error.message || error}`)); // Access error.message
        }
    });
};
