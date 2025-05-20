
import jsPDF from "jspdf";

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
import { addRequisicaoExameDrogas } from './PDF/PDFpericiadrogas.js';
import { addRequisicaoExameLesao } from './PDF/PDFTermoRequisicaoExameLesao.js';
import { addTermoEncerramentoRemessa } from './PDF/PDFTermoEncerramentoRemessa.js';

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

            // Validar data e hora da audiência no juizado especial
            const juizadoData = inputData.juizadoEspecialData || inputData.dataAudiencia;
            const juizadoHora = inputData.juizadoEspecialHora || inputData.horaAudiencia;

            if (!juizadoData || !juizadoHora) {
                clearTimeout(timeout);
                reject(new Error("É necessário informar a data e hora de apresentação no Juizado Especial."));
                return;
            }

            // Cria a instância do jsPDF
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            // Clona os dados para evitar mutações inesperadas e garante que campos necessários estejam presentes
            const data = { 
                ...inputData,
                juizadoEspecialData: juizadoData,
                juizadoEspecialHora: juizadoHora,
                // Inicializa arrays vazios para evitar erros null/undefined
                autores: inputData.autores || [],
                vitimas: inputData.vitimas || [],
                testemunhas: inputData.testemunhas || [],
                componentesGuarnicao: inputData.componentesGuarnicao || [],
                imageBase64: inputData.imageBase64 || [],
                videoLinks: inputData.videoLinks || [],
                objetosApreendidos: inputData.objetosApreendidos || []
            };

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
                    try {
                        // --- ADIÇÃO DOS TERMOS ---
                        if (data.autores && data.autores.length > 0) {
                            addTermoCompromisso(doc, data);
                        } else {
                            console.warn("Nenhum autor informado, pulando Termo de Compromisso.");
                        }

                        // Corrigindo a lógica para incluir o Termo de Manifestação
                        // Verifica se NÃO é um caso de droga para consumo OU se tem vítimas informadas
                        if ((data.natureza !== "Porte de drogas para consumo") && (data.vitimas && data.vitimas.length > 0)) {
                            console.log("Adicionando Termo de Manifestação da Vítima");
                            addTermoManifestacao(doc, data);
                        } else {
                            console.log("Pulando Termo de Manifestação da Vítima: natureza incompatível ou sem vítimas.");
                        }

                        // Incluir o termo de apreensão quando houver uma descrição de apreensão
                        // e não for caso de droga para consumo
                        const isDroga = data.natureza === "Porte de drogas para consumo";
                        if ((data.apreensaoDescrição || data.apreensoes) && 
                            (isDroga || data.apreensoes)) {
                            console.log("Adicionando Termo de Apreensão");
                            addTermoApreensao(doc, data);
                        } else {
                            console.log("Pulando Termo de Apreensão: sem descrição de apreensão.");
                        }

                        if (data.drogaTipo || data.drogaNomeComum) {
                            addTermoConstatacaoDroga(doc, data);
                            
                            // Adiciona Requisição de Exame em Drogas logo após o Termo de Constatação de Droga
                            if (data.natureza === "Porte de drogas para consumo") {
                                addRequisicaoExameDrogas(doc, data);
                            }
                        }

                        // --- REQUISIÇÃO DE EXAME DE LESÃO CORPORAL ---
                        const pessoasComLaudo = [
                            ...(data.autores || []).filter(a => a?.laudoPericial === "Sim").map(a => ({ nome: a.nome, sexo: a.sexo, tipo: "Autor" })),
                            ...(data.vitimas || []).filter(v => v?.laudoPericial === "Sim").map(v => ({ nome: v.nome, sexo: v.sexo, tipo: "Vítima" }))
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
                    } catch (termoError) {
                        clearTimeout(timeout);
                        reject(new Error(`Erro ao gerar termos do PDF: ${termoError.message}`));
                    }
                })
                .catch(histError => {
                    clearTimeout(timeout);
                    reject(new Error(`Erro ao gerar histórico do PDF: ${histError.message}`));
                });
        } catch (error) {
            clearTimeout(timeout);
            reject(new Error(`Erro na geração do PDF: ${error.message}`));
        }
    });
};
