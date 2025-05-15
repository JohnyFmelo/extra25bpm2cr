
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
import { addRequisicaoExameDrogas } from './PDF/PDFpericiadrogas.js';
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

            // Clona os dados para evitar mutações inesperadas
            const data = { 
                ...inputData,
                // Garantir que os dados do juizado estão disponíveis para o termo de compromisso
                juizadoEspecialData: juizadoData,
                juizadoEspecialHora: juizadoHora
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

                    if (data.apreensaoDescrição || data.apreensoes) {
                        addTermoApreensao(doc, data);
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

                    // Generate blob and resolve the promise
                    const pdfBlob = doc.output('blob');
                    
                    const tcoNumParaNome = data.tcoNumber || 'SEM_NUMERO';
                    const dateStr = new Date().toISOString().slice(0, 10);
                    
                    // Upload to Supabase Storage
                    if (!data.skipSupabaseUpload) {
                        // Get user info for folder path
                        const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
                        const userId = userInfo.id || 'anonimo';
                        
                        const filePath = `tcos/${userId}/${tcoNumParaNome}_${dateStr}.pdf`;
                        const BUCKET_NAME = 'tco-pdfs';
                        
                        console.log(`Enviando PDF para Supabase Storage: ${filePath}`);
                        
                        // Upload to Supabase Storage
                        supabase.storage.from(BUCKET_NAME).upload(filePath, pdfBlob, {
                            contentType: 'application/pdf',
                            upsert: true
                        })
                        .then(response => {
                            const { error } = response;
                            if (error) {
                                console.error('Erro ao fazer upload para Supabase:', error);
                            } else {
                                console.log('PDF enviado com sucesso para Supabase Storage:', filePath);
                                
                                // Get public URL
                                supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
                                    .then(urlData => {
                                        const publicUrl = urlData.data?.publicUrl;
                                        console.log('URL pública do PDF:', publicUrl);
                                        
                                        // Save metadata to database
                                        if (publicUrl) {
                                            const TABLE_NAME = 'tco_pdfs';
                                            const tcoMetadata = {
                                                tcoNumber: data.tcoNumber,
                                                natureza: data.natureza === 'Outros' ? data.customNatureza : data.natureza,
                                                policiais: data.componentesGuarnicao || [],
                                                pdfPath: filePath,
                                                pdfUrl: publicUrl,
                                                createdBy: userId,
                                                createdAt: new Date().toISOString()
                                            };
                                            
                                            supabase.from(TABLE_NAME).insert([tcoMetadata])
                                                .then(insertResponse => {
                                                    if (insertResponse.error) {
                                                        console.error('Erro ao salvar metadados no Supabase:', insertResponse.error);
                                                    } else {
                                                        console.log('Metadados do TCO salvos no Supabase');
                                                    }
                                                });
                                        }
                                    });
                            }
                        });
                    }
                    
                    // Opcionalmente, gera um download local se solicitado
                    if (data.downloadLocal) {
                        try {
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
