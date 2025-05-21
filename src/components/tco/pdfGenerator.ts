
import jsPDF from "jspdf";
import { uploadPDF, saveTCOMetadata } from "@/lib/supabaseStorage";

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

            // Processar links de vídeo para garantir compatibilidade
            let processedVideoLinks = inputData.videoLinks;
            if (processedVideoLinks && Array.isArray(processedVideoLinks)) {
                // Normaliza os links de vídeo para o formato esperado
                processedVideoLinks = processedVideoLinks.map((link, index) => {
                    if (typeof link === 'string') {
                        return { url: link, descricao: `Vídeo ${index + 1}` };
                    }
                    return link;
                });
            }

            // Clona os dados para evitar mutações inesperadas
            const data = { 
                ...inputData,
                // Garante que os dados do juizado estão disponíveis para o termo de compromisso
                juizadoEspecialData: juizadoData,
                juizadoEspecialHora: juizadoHora,
                videoLinks: processedVideoLinks
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

                    // Generate blob for the PDF
                    const pdfBlob = doc.output('blob');
                    
                    // Salva os dados no Supabase após gerar o PDF
                    saveTCODataToSupabase(data, pdfBlob)
                        .then(() => {
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
                            
                            clearTimeout(timeout);
                            resolve(pdfBlob);
                        })
                        .catch(error => {
                            console.error("Erro ao salvar dados no Supabase:", error);
                            // Continue mesmo se falhar o salvamento no Supabase
                            clearTimeout(timeout);
                            resolve(pdfBlob);
                        });
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

/**
 * Salva os dados do TCO no Supabase
 * @param data Dados do TCO
 * @param pdfBlob O blob do PDF gerado
 */
async function saveTCODataToSupabase(data: any, pdfBlob: Blob): Promise<void> {
    try {
        // Extrair informações dos policiais da guarnição
        const policiais = data.guarnicao?.map((policial: any) => ({
            nome: policial.nome || '',
            posto: policial.posto || '',
            rg: policial.rg || ''
        })) || [];

        // Formatar a data atual
        const currentDate = new Date();
        const dateStr = currentDate.toISOString().slice(0, 10);
        const timeStr = currentDate.toISOString().slice(11, 19).replace(/:/g, '-');
        
        // Definir o nome do arquivo e o caminho
        const tcoNumber = data.tcoNumber || `TCO-${dateStr}`;
        const userId = data.userId || 'anonymous';
        const filePath = `tcos/${userId}/TCO-${tcoNumber.replace(/\s/g, '_')}_${dateStr}_${timeStr}.pdf`;
        
        console.log("Salvando PDF no Supabase Storage:", filePath);

        // Upload do PDF para o storage
        const { url, error: uploadError } = await uploadPDF(filePath, pdfBlob, {
            tcoNumber: tcoNumber,
            createdAt: currentDate.toISOString()
        });

        if (uploadError) {
            throw uploadError;
        }

        if (!url) {
            throw new Error("URL do arquivo PDF não foi gerada");
        }

        console.log("PDF enviado com sucesso, URL:", url);

        // Preparar os dados para salvar no banco
        const tcoMetadata = {
            tcoNumber: tcoNumber,
            natureza: data.natureza || "Não especificada",
            policiais: policiais,
            pdfPath: filePath,
            pdfUrl: url,
            createdBy: data.userId || null, // Pode ser null se não estiver autenticado
            createdAt: currentDate
        };

        console.log("Salvando metadados do TCO no Supabase:", tcoMetadata);

        // Salvar os metadados do TCO no banco de dados
        const { data: savedData, error: dbError } = await saveTCOMetadata(tcoMetadata);

        if (dbError) {
            throw dbError;
        }

        console.log("Metadados do TCO salvos com sucesso:", savedData);
    } catch (error) {
        console.error("Erro ao salvar os dados do TCO no Supabase:", error);
        throw error;
    }
}
