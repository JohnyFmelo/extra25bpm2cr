import jsPDF from "jspdf";

// Importa funções auxiliares e de página da subpasta PDF
import {
    MARGIN_TOP, MARGIN_BOTTOM, MARGIN_RIGHT, getPageConstants,
    addNewPage,
    addStandardFooterContent
} from './PDF/pdfUtils.js'; // Ensure MARGIN_TOP etc. are exported or correctly used locally

// Importa geradores de conteúdo da subpasta PDF
import { generateAutuacaoPage } from './PDF/PDFautuacao.js';
import { generateHistoricoContent } from './PDF/PDFhistorico.js';
import { addTermoCompromisso } from './PDF/PDFTermoCompromisso.js';
import { addTermoManifestacao } from './PDF/PDFTermoManifestacao.js';
import { addTermoApreensao } from './PDF/PDFTermoApreensao.js';
import { addTermoDeposito } from './PDF/PDFtermoDeposito.js'; // This is our target
import { addTermoConstatacaoDroga } from './PDF/PDFTermoConstatacaoDroga.js';
import { addRequisicaoExameDrogas } from './PDF/PDFpericiadrogas.js';
import { addRequisicaoExameLesao } from './PDF/PDFTermoRequisicaoExameLesao.js';
import { addTermoEncerramentoRemessa } from './PDF/PDFTermoEncerramentoRemessa.js';

/**
 * Remove acentos e caracteres especiais de uma string
 */
const removeAccents = (str: string): string => {
    if (typeof str !== 'string') return ''; // Guard clause
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
};

/**
 * Gera o nome do arquivo TCO no formato específico pedido
 */
export const generateTCOFilename = (data: any): string => {
    // console.log("Gerando nome do arquivo TCO, dados recebidos:", data ? "OK" : "NULL/UNDEFINED");

    const tcoNum = data?.tcoNumber?.trim() || 'SEM_NUMERO';

    const eventDateParts = data?.dataFato ? String(data.dataFato).split('-') : [];
    const formattedDate = eventDateParts.length === 3 ?
        `${eventDateParts[2]}-${eventDateParts[1]}-${eventDateParts[0]}` :
        new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

    let natureza = (data?.natureza === "Outros" && data?.customNatureza) ?
        data.customNatureza.trim() :
        (data?.natureza || 'Sem_Natureza');

    natureza = removeAccents(natureza);
    // console.log("Natureza formatada para o nome do arquivo:", natureza);

    const componentes = Array.isArray(data?.componentesGuarnicao) ? data.componentesGuarnicao : [];
    const principais = componentes.filter(c => c && c.rg && !c.apoio);
    const apoio = componentes.filter(c => c && c.rg && c.apoio);

    if (principais.length === 0 && apoio.length > 0) {
        const firstApoio = apoio.shift();
        if (firstApoio) principais.push({ ...firstApoio, apoio: false });
    }

    const rgsPrincipais = principais.map(p => String(p.rg || '').replace(/\D/g, ''));
    const rgsApoio = apoio.map(p => String(p.rg || '').replace(/\D/g, ''));

    let rgCode = rgsPrincipais.length > 0 ? rgsPrincipais.join('') : 'RG_INDISPONIVEL';
    if (rgsApoio.length > 0) {
        rgCode += '-' + rgsApoio.join('');
    }

    const fileName = `TCO_${tcoNum}_${formattedDate}_${natureza}_${rgCode}.pdf`;
    // console.log("Nome do arquivo TCO gerado:", fileName);
    return fileName;
};

// --- Função Principal de Geração ---
export const generatePDF = async (inputData: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => { // Store timeoutId
            console.warn("[pdfGenerator] PDF generation timeout reached.");
            reject(new Error("Tempo limite excedido ao gerar PDF. Por favor, tente novamente."));
        }, 90000); // Increased timeout to 90 seconds

        try {
            if (!inputData || typeof inputData !== 'object' || Object.keys(inputData).length === 0) {
                clearTimeout(timeoutId);
                reject(new Error("Dados inválidos para gerar o PDF."));
                return;
            }

            const juizadoData = inputData.juizadoEspecialData || inputData.dataAudiencia;
            const juizadoHora = inputData.juizadoEspecialHora || inputData.horaAudiencia;

            if (!juizadoData || !juizadoHora) {
                clearTimeout(timeoutId);
                reject(new Error("É necessário informar a data e hora de apresentação no Juizado Especial."));
                return;
            }

            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            let processedVideoLinks = inputData.videoLinks;
            if (processedVideoLinks && Array.isArray(processedVideoLinks)) {
                processedVideoLinks = processedVideoLinks.map((link, index) => {
                    return (typeof link === 'string') ? { url: link, descricao: `Vídeo ${index + 1}` } : link;
                });
            }

            const data = {
                ...inputData,
                juizadoEspecialData: juizadoData,
                juizadoEspecialHora: juizadoHora,
                videoLinks: processedVideoLinks,
                hidePagination: true // Usually you want pagination for multi-page docs unless specifically off
            };

            const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc); // Ensure these are used or remove if not.
            let yPosition;

            yPosition = generateAutuacaoPage(doc, MARGIN_TOP, data); // MARGIN_TOP must be defined/imported
            yPosition = addNewPage(doc, data); // Start a new page for main content after autuacao

            const isDroga = data.natureza === "Porte de drogas para consumo"; // Adjust if your logic is more complex
            const documentosAnexosList = [];

            if (Array.isArray(data.autores) && data.autores.length > 0) {
                data.autores.forEach((autor: any) => {
                    if (autor?.nome?.trim()) {
                        documentosAnexosList.push(`TERMO DE COMPROMISSO DE ${autor.nome.trim().toUpperCase()}`);
                    }
                });
            }

            if (!isDroga && Array.isArray(data.vitimas) && data.vitimas.length > 0) {
                data.vitimas.forEach((vitima: any) => {
                    if (vitima?.nome?.trim() && vitima.nome.trim().toUpperCase() !== "O ESTADO") {
                        documentosAnexosList.push(`TERMO DE MANIFESTAÇÃO DA VÍTIMA ${vitima.nome.trim().toUpperCase()}`);
                    }
                });
            }

            let temFielDepositario = false;
            if (Array.isArray(data.autores) && data.autores.length > 0) {
                temFielDepositario = data.autores.some(
                    (a: any) => a &&
                                 typeof a.fielDepositario === 'string' && a.fielDepositario.trim().toLowerCase() === 'sim' &&
                                 typeof a.nome === 'string' && a.nome.trim() !== '' && // Must have a name
                                 typeof a.objetoDepositado === 'string' && a.objetoDepositado.trim() !== '' // Must have an object
                );
            }
            // Key log for Termo de Depósito check
            console.log(`[pdfGenerator] Checagem para Termo de Depósito - temFielDepositario: ${temFielDepositario}`);
            if (temFielDepositario) {
                documentosAnexosList.push("TERMO DE DEPÓSITO");
            }


            if ((data.apreensaoDescrição || data.apreensoes) && (isDroga || data.apreensoes)) {
                const lacreTexto = data.lacreNumero ? ` LACRE Nº ${data.lacreNumero}` : '';
                documentosAnexosList.push(`TERMO DE APREENSÃO${lacreTexto}`);
            }

            if (data.drogaTipo || data.drogaNomeComum) { // Ensure these fields exist on data
                const lacreTextoDroga = data.lacreNumero ? ` LACRE Nº ${data.lacreNumero}` : '';
                documentosAnexosList.push(`TERMO DE CONSTATAÇÃO PRELIMINAR DE DROGA${lacreTextoDroga}`);
                if (isDroga) {
                    documentosAnexosList.push("REQUISIÇÃO DE EXAME EM DROGAS DE ABUSO");
                }
            }

            const pessoasComLaudo = [
                ...(data.autores || []).filter((a: any) => a?.laudoPericial === "Sim"),
                ...(data.vitimas || []).filter((v: any) => v?.laudoPericial === "Sim")
            ]
            .filter((p: any) => p?.nome?.trim()) // Filter out those without names before mapping
            .map((p: any) => ({
                nome: p.nome,
                sexo: p.sexo,
                tipo: (data.autores || []).includes(p) ? "Autor" : "Vítima" // Determine type more reliably
            }));


            if (pessoasComLaudo.length > 0) {
                pessoasComLaudo.forEach((pessoa: any) => {
                    const generoArtigo = pessoa.sexo?.toLowerCase() === 'feminino' ? 'DA' : 'DO';
                    const generoTipo = pessoa.tipo === 'Autor' ?
                        (pessoa.sexo?.toLowerCase() === 'feminino' ? 'AUTORA' : 'AUTOR') :
                        (pessoa.sexo?.toLowerCase() === 'feminino' ? 'VÍTIMA' : 'VÍTIMA'); // Assuming vítima is default otherwise
                    documentosAnexosList.push(`REQUISIÇÃO DE EXAME DE LESÃO CORPORAL ${generoArtigo} ${generoTipo}`);
                });
            }

            const updatedData = {
                ...data,
                documentosAnexos: documentosAnexosList.join('\n')
            };
            console.log("[pdfGenerator] Lista de Documentos Anexos:", documentosAnexosList);


            generateHistoricoContent(doc, yPosition, updatedData)
                .then(() => {
                    console.log("[pdfGenerator] Historico content gerado. Adicionando termos sequenciais...");
                    if (Array.isArray(updatedData.autores) && updatedData.autores.length > 0) {
                        addTermoCompromisso(doc, updatedData);
                    }

                    if (!isDroga && Array.isArray(updatedData.vitimas) && updatedData.vitimas.some((v:any) => v?.nome?.trim() && v.nome.trim().toUpperCase() !== "O ESTADO" )) {
                        // console.log("[pdfGenerator] Adicionando Termo de Manifestação da Vítima.");
                        addTermoManifestacao(doc, updatedData);
                    }

                    // Termo de Depósito call
                    if (temFielDepositario) {
                        console.log("[pdfGenerator] CHAMANDO addTermoDeposito.");
                        // It's crucial that addTermoDeposito internally handles finding the correct depositario(s)
                        // and gracefully does nothing if none are found meeting its stricter internal criteria.
                        addTermoDeposito(doc, updatedData); // Pass the whole data, let addTermoDeposito filter.
                        console.log("[pdfGenerator] addTermoDeposito FOI CHAMADO.");
                    } else {
                         console.log("[pdfGenerator] PULANDO addTermoDeposito porque temFielDepositario é: ", temFielDepositario);
                    }

                    if ((updatedData.apreensaoDescrição || updatedData.apreensoes) && (isDroga || updatedData.apreensoes)) {
                        // console.log("[pdfGenerator] Adicionando Termo de Apreensão.");
                        addTermoApreensao(doc, updatedData);
                    }

                    if (updatedData.drogaTipo || updatedData.drogaNomeComum) {
                        addTermoConstatacaoDroga(doc, updatedData);
                        if (isDroga) { // Re-check specific condition if needed
                            addRequisicaoExameDrogas(doc, updatedData);
                        }
                    }

                    if (pessoasComLaudo.length > 0) {
                        pessoasComLaudo.forEach((pessoa: any) => {
                            // console.log(`[pdfGenerator] Gerando Req. Exame Lesão para: ${pessoa.nome}`);
                            addRequisicaoExameLesao(doc, { ...updatedData, periciadoNome: pessoa.nome, sexo: pessoa.sexo });
                        });
                    }

                    addTermoEncerramentoRemessa(doc, updatedData);

                    // Pagination logic (only if hidePagination is false)
                    if (!updatedData.hidePagination) {
                        const pageCount = (doc.internal.getNumberOfPages ? doc.internal.getNumberOfPages() : doc.internal.pages.length -1) ; // jsPDF new vs old
                        for (let i = 1; i <= pageCount; i++) {
                            doc.setPage(i);
                            doc.setFont("helvetica", "normal");
                            doc.setFontSize(8);
                            doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - MARGIN_BOTTOM + 5, { align: "right" });
                            if (i > 1) { // Footer content on pages after the first
                                addStandardFooterContent(doc);
                            }
                        }
                    }


                    if (updatedData.downloadLocal) {
                        try {
                            const fileName = generateTCOFilename(updatedData);
                            doc.save(fileName);
                            // console.log(`PDF salvo localmente: ${fileName}`);
                        } catch (downloadError) {
                            console.error("Erro ao salvar o PDF localmente:", downloadError);
                        }
                    }

                    const pdfBlob = doc.output('blob');
                    clearTimeout(timeoutId);
                    resolve(pdfBlob);

                })
                .catch(histError => {
                    clearTimeout(timeoutId);
                    console.error("[pdfGenerator] Erro DENTRO DO .then() após generateHistoricoContent:", histError, histError.stack);
                    reject(new Error(`Erro ao gerar seções do PDF: ${histError.message || histError}`));
                });
        } catch (error) {
            clearTimeout(timeoutId);
            console.error("[pdfGenerator] Erro GERAL NA FUNÇÃO generatePDF:", error, error.stack);
            reject(new Error(`Erro crítico na geração do PDF: ${error.message || error}`));
        }
    });
};
