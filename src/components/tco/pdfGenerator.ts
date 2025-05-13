// src/components/tco/pdfGenerator.ts
// (Showing only relevant parts for brevity)

import jsPDF from "jspdf";

// Importa funções auxiliares e de página da subpasta PDF
import {
    MARGIN_TOP, MARGIN_BOTTOM, MARGIN_RIGHT, getPageConstants, // Ensure MARGIN_RIGHT is used if needed here, or passed
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

// ... (addImagesToPDF function remains the same) ...

// --- Função Principal de Geração ---
export const generatePDF = async (inputData: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        // ... (timeout logic remains the same) ...
        
        try {
            // ... (inputData validation and jsPDF instantiation remain the same) ...

            const data = { ...inputData };
            const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc); // Ensure MARGIN_RIGHT is available if used
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

                    if (data.apreensaoDescrição || data.apreensoes) { // Check if this field name matches your data
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
                    // ... (logic for addRequisicaoExameLesao remains the same) ...

                    addTermoEncerramentoRemessa(doc, data);

                    // --- Finalização: Adiciona Números de Página e Salva ---
                    // ... (page numbering and saving logic remains the same) ...

                    // Generate blob and resolve the promise
                    const pdfBlob = doc.output('blob');
                    clearTimeout(timeout);
                    resolve(pdfBlob);
                })
                .catch(histError => {
                    clearTimeout(timeout);
                    reject(new Error(`Erro ao gerar histórico do PDF: ${histError.message}`));
                });
        } catch (error: any) { // Explicitly type error
            clearTimeout(timeout);
            reject(new Error(`Erro na geração do PDF: ${error.message}`)); // Access error.message
        }
    });
};
