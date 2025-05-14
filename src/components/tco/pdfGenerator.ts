// src/services/pdfGenerator.ts (ou o nome do seu arquivo)
import jsPDF from "jspdf";

// Importa funções auxiliares e de página da subpasta PDF
import {
    MARGIN_TOP, MARGIN_BOTTOM, MARGIN_RIGHT, MARGIN_LEFT, // MARGIN_LEFT assumido como disponível
    getPageConstants,
    addNewPage,
    addStandardFooterContent // Assumindo que esta função adiciona conteúdo fixo do rodapé
} from './PDF/pdfUtils.js';

// Importa geradores de conteúdo da subpasta PDF
import { generateAutuacaoPage } from './PDF/PDFautuacao.js';
import { generateHistoricoContent } from './PDF/PDFhistorico.js';
import { addTermoCompromisso } from './PDF/PDFTermoCompromisso.js';
import { addTermoManifestacao } from './PDF/PDFTermoManifestacao.js';
import { addTermoApreensao } from './PDF/PDFTermoApreensao.js';
import { addRequisicaoExameDrogas } from './PDF/PDFpericiadrogas.js'; // Adicionado .js para consistência, ajuste se for .ts
import { addTermoConstatacaoDroga } from './PDF/PDFTermoConstatacaoDroga.js';
import { addRequisicaoExameLesao } from './PDF/PDFTermoRequisicaoExameLesao.js';
import { addTermoEncerramentoRemessa } from './PDF/PDFTermoEncerramentoRemessa.js';
// import { addTermoCadeiaCustodia } from './PDFcadeiadecustodia'; // Importação com caminho diferente, não utilizada no fluxo atual.

/**
 * Função auxiliar para adicionar imagens ao PDF.
 * NOTA: Esta função não está sendo chamada no fluxo `generatePDF` fornecido.
 * Se for necessário, chame-a no local apropriado dentro de `generatePDF`.
 */
const addImagesToPDF = (
    doc: jsPDF,
    yPosition: number,
    images: { name: string; data: string }[],
    pageWidth: number,
    pageHeight: number,
    currentData: any // Para passar para addNewPage se necessário
) => {
    // Usa constantes de margem definidas globalmente ou passadas via getPageConstants
    const localMarginLeft = MARGIN_LEFT || 15; // Fallback se não definido globalmente
    const localMarginBottom = MARGIN_BOTTOM || 15; // Fallback

    const maxImageWidth = pageWidth - localMarginLeft * 2;
    const maxImageHeight = 100; // Altura máxima por imagem (ajustável)
    const marginBetweenImages = 10;
    let currentY = yPosition;

    for (const image of images) {
        try {
            const formatMatch = image.data.match(/^data:image\/(jpeg|png);base64,/);
            const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG';
            const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '');

            if (currentY + maxImageHeight + localMarginBottom > pageHeight) {
                currentY = addNewPage(doc, currentData); // Passa 'currentData'
                currentY = MARGIN_TOP; // Reseta a posição Y para a margem superior padrão
            }

            doc.addImage(base64Data, format, localMarginLeft, currentY, maxImageWidth, 0); // altura 0 para manter proporção

            const imgProps = doc.getImageProperties(base64Data);
            const imgHeight = (imgProps.height * maxImageWidth) / imgProps.width;
            currentY += imgHeight + marginBetweenImages;

            doc.setFontSize(8);
            doc.text(`Imagem: ${image.name}`, localMarginLeft, currentY);
            currentY += 5;
        } catch (error) {
            console.error(`Erro ao adicionar imagem ${image.name}:`, error);
        }
    }
    return currentY;
};

// --- Função Principal de Geração ---
export const generatePDF = async (inputData: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            console.error("Timeout na geração do PDF atingido.");
            reject(new Error("Tempo limite excedido ao gerar PDF. Por favor, tente novamente."));
        }, 60000); // 60 segundos de timeout

        try {
            if (!inputData || typeof inputData !== 'object' || Object.keys(inputData).length === 0) {
                clearTimeout(timeout);
                reject(new Error("Dados inválidos para gerar o PDF."));
                return;
            }

            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const data = { ...inputData }; // Cópia superficial dos dados

            // Obter constantes da página, incluindo margens
            const { PAGE_WIDTH, PAGE_HEIGHT, MARGIN_LEFT: marginLeftFromUtils, MARGIN_BOTTOM: marginBottomFromUtils } = getPageConstants(doc);
            let yPosition; // Posição Y inicial para o conteúdo

            // --- PÁGINA 1: AUTUAÇÃO ---
            // generateAutuacaoPage é responsável por sua própria página e rodapé, se houver.
            yPosition = generateAutuacaoPage(doc, MARGIN_TOP, data);

            // --- CONTEÚDO PRINCIPAL DO TCO (A PARTIR DA PÁGINA 2) ---
            // Inicia uma nova página para o histórico e demais seções.
            // addNewPage deve lidar com a configuração do rodapé (via addStandardFooterContent), exceto numeração.
            yPosition = addNewPage(doc, data); // yPosition é resetado para MARGIN_TOP da nova página

            // generateHistoricoContent pode ser síncrono ou assíncrono.
            // Se for síncrono, o .then não é estritamente necessário. Mantendo a estrutura.
            Promise.resolve(generateHistoricoContent(doc, yPosition, data))
                .then(() => {
                    // --- ADIÇÃO DOS TERMOS ---
                    // Cada função de termo (addTermoCompromisso, etc.) deve:
                    // 1. Chamar addNewPage(doc, data) para garantir uma nova página.
                    // 2. Chamar addStandardFooterContent(doc, data) ao final de seu conteúdo, se aplicável.

                    if (data.autores && data.autores.length > 0) {
                        addTermoCompromisso(doc, data);
                    } else {
                        console.warn("Nenhum autor informado, pulando Termo de Compromisso.");
                    }

                    if (data.natureza !== "Porte de drogas para consumo") {
                        addTermoManifestacao(doc, data);
                    } else {
                        console.log("Natureza 'Porte de drogas para consumo' detectada, pulando Termo de Manifestação da Vítima.");
                    }

                    if (data.natureza !== "Porte de drogas para consumo") {
                        addRequisicaoExameDrogas(doc, data);
                    } else {
                        console.log("Natureza 'Porte de drogas para consumo' detectada, pulando Termo de Manifestação da Vítima.");
                    }

                    // TERMO DE APREENSÃO
                    if (data.apreensaoDescrição || (data.apreensoes && data.apreensoes.length > 0)) {
                        addTermoApreensao(doc, data);
                    }

                    // **** FIM DA LÓGICA SOLICITADA ****

                    // TERMO DE CONSTATAÇÃO DE DROGA
                    // Adicionado somente se houver tipo de droga ou nome comum informado.
                    if (data.drogaTipo || data.drogaNomeComum) {
                        addTermoConstatacaoDroga(doc, data); // Esta função também deve chamar addNewPage e addStandardFooterContent
                    }

                    // REQUISIÇÃO DE EXAME DE LESÃO CORPORAL
                    const pessoasComLaudo = [
                        ...(data.autores || []).filter(a => a.laudoPericial === "Sim").map(a => ({ nome: a.nome, sexo: a.sexo, tipo: "Autor" })),
                        ...(data.vitimas || []).filter(v => v.laudoPericial === "Sim").map(v => ({ nome: v.nome, sexo: v.sexo, tipo: "Vítima" }))
                    ].filter(p => p.nome && p.nome.trim());

                    if (pessoasComLaudo.length > 0) {
                        pessoasComLaudo.forEach(pessoa => {
                            console.log(`Gerando Requisição de Exame de Lesão para: ${pessoa.nome} (${pessoa.tipo}, Sexo: ${pessoa.sexo || 'Não especificado'})`);
                            // Passa uma cópia de data com informações específicas da pessoa periciada
                            addRequisicaoExameLesao(doc, { ...data, periciadoNome: pessoa.nome, sexo: pessoa.sexo });
                        });
                    } else {
                        // console.log("Nenhum autor ou vítima com laudoPericial: 'Sim'. Pulando Requisição de Exame de Lesão.");
                    }
                    
                    // CADEIA DE CUSTÓDIA (se necessário)
                    // A importação existe mas não é chamada. Se precisar, adicione a lógica condicional:
                    // if (condicao_para_cadeia_custodia) { addTermoCadeiaCustodia(doc, data); }

                    addTermoEncerramentoRemessa(doc, data); // Esta função também deve gerenciar sua página e rodapé

                    // --- Finalização: Adiciona APENAS Números de Página ---
                    // O conteúdo do rodapé (brasão, etc.) deve ser adicionado por cada função de seção
                    // através de addStandardFooterContent chamado após addNewPage.
                    const pageCount = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(8);
                        // Ajuste o posicionamento Y do número da página conforme necessário.
                        // (marginBottomFromUtils / 2) ou um valor fixo podem funcionar.
                        doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - (MARGIN_RIGHT || 15), PAGE_HEIGHT - (marginBottomFromUtils / 2 || 7.5), { align: "right" });
                    }

                    if (data.downloadLocal) {
                        try {
                            const tcoNumParaNome = data.tcoNumber || 'SEM_NUMERO';
                            const dateStr = new Date().toISOString().slice(0, 10);
                            const fileName = `TCO_${tcoNumParaNome}_${dateStr}.pdf`;
                            doc.save(fileName);
                            console.log(`PDF salvo localmente: ${fileName}`);
                        } catch (downloadError) {
                            console.error("Erro ao salvar o PDF localmente:", downloadError);
                        }
                    }

                    const pdfBlob = doc.output('blob');
                    clearTimeout(timeout);
                    resolve(pdfBlob);
                })
                .catch(histError => {
                    clearTimeout(timeout);
                    console.error("Erro detalhado ao gerar seções do PDF (após histórico):", histError);
                    reject(new Error(`Erro ao gerar seções do PDF: ${histError.message || histError}`));
                });
        } catch (error) {
            clearTimeout(timeout);
            console.error("Erro detalhado na configuração inicial da geração do PDF:", error);
            reject(new Error(`Erro na geração do PDF: ${error.message || error}`));
        }
    });
};
