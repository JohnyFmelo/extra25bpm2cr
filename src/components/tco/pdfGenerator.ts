
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
import { addTermoDeposito } from './PDF/PDFtermoDeposito';
import { addRequisicaoExameLesao } from './PDF/PDFTermoRequisicaoExameLesao.js';
import { addTermoEncerramentoRemessa } from './PDF/PDFTermoEncerramentoRemessa.js';

/**
 * Remove acentos e caracteres especiais de uma string
 */
const removeAccents = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
        .replace(/[^a-zA-Z0-9_-]/g, '_') // Substitui caracteres especiais por underscore
        .replace(/_+/g, '_') // Remove underscores consecutivos
        .replace(/^_|_$/g, ''); // Remove underscores no início e fim
};

/**
 * Gera o nome do arquivo TCO no formato específico pedido
 * TCO_[número]_[data]_[natureza]_[RGPM condutor][RGPMs outros].[RGPMs apoio]
 */
export const generateTCOFilename = (data: any): string => {
    console.log("Gerando nome do arquivo TCO", data);
    
    // Processar o número do TCO
    const tcoNum = data.tcoNumber?.trim() || 'SEM_NUMERO';
    
    // Formatar data do evento (DD-MM-YYYY) - usando hífen em vez de ponto
    const eventDate = data.dataFato ? data.dataFato.split('-') : [];
    const formattedDate = eventDate.length === 3 ? 
        `${eventDate[2]}-${eventDate[1]}-${eventDate[0]}` : 
        new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    
    // Obter natureza e remover acentos/caracteres especiais
    let natureza = data.natureza === "Outros" && data.customNatureza ? 
        data.customNatureza.trim() : 
        data.natureza || 'Sem_Natureza';
        
    // Limpar a natureza para o nome do arquivo
    natureza = removeAccents(natureza);
    console.log("Natureza formatada para o nome do arquivo:", natureza);

    // Processar RGPMs dos componentes da guarnição
    const componentes = Array.isArray(data.componentesGuarnicao) ? data.componentesGuarnicao : [];
    
    // Separar em principais e apoio
    const principais = componentes.filter(c => c && c.rg && !c.apoio);
    const apoio = componentes.filter(c => c && c.rg && c.apoio);
    
    // Garantir que há pelo menos um componente principal (condutor)
    if (principais.length === 0 && apoio.length > 0) {
        principais.push({...apoio.shift(), apoio: false});
    }
    
    // Extrair apenas os dígitos dos RGs
    const rgsPrincipais = principais.map(p => p.rg.replace(/\D/g, ''));
    const rgsApoio = apoio.map(p => p.rg.replace(/\D/g, ''));
    
    console.log("RGs Principais:", rgsPrincipais);
    console.log("RGs Apoio:", rgsApoio);
    
    // Construir a parte do código de barras do nome do arquivo
    let rgCode = rgsPrincipais.length > 0 ? rgsPrincipais.join('') : 'RG_INDISPONIVEL';
    
    // Adicionar RGs de apoio com hífen separador, se existirem
    if (rgsApoio.length > 0) {
        rgCode += '-' + rgsApoio.join('');
    }
    
    // Construir o nome do arquivo final
    const fileName = `TCO_${tcoNum}_${formattedDate}_${natureza}_${rgCode}.pdf`;
    console.log("Nome do arquivo TCO gerado:", fileName);
    return fileName;
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
                videoLinks: processedVideoLinks,
                // Flag para desativar a paginação - sempre definida como true para ocultar paginação
                hidePagination: true
            };

            // Concatenar descrição de objeto depositado ao campo de apreensões para o PDF
            const depositarios = (data.autores || []).filter((a:any) => a.fielDepositario === 'Sim' && a.objetoDepositado);
            if (depositarios.length > 0) {
                const descricoesDeposito = depositarios
                    .map((a:any) => `BEM DEIXADO EM DEPÓSITO COM ${a.nome.toUpperCase()}: ${a.objetoDepositado}`)
                    .join('\n');
                if (data.apreensoes && data.apreensoes.trim() !== '') {
                    data.apreensoes = `${data.apreensoes}\n${descricoesDeposito}`;
                } else { data.apreensoes = descricoesDeposito; }
            }

            // Pega as constantes da página
            const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc);
            let yPosition;

            // --- PÁGINA 1: AUTUAÇÃO ---
            yPosition = generateAutuacaoPage(doc, MARGIN_TOP, data);

            // --- RESTANTE DO TCO (PÁGINAS 2+) ---
            yPosition = addNewPage(doc, data);

            // --- Preparar a lista de documentos anexos ---
            const isDroga = data.natureza === "Porte de drogas para consumo";
            const documentosAnexosList = ["TERMO DE COMPROMISSO"];
            
            // Adicionar termo de manifestação se não for caso de droga e tiver vítimas
            if (!isDroga && data.vitimas && data.vitimas.length > 0) {
                documentosAnexosList.push("TERMO DE MANIFESTAÇÃO");
            }
            
            // Adicionar termo de apreensão se houver descrição
            if ((data.apreensaoDescrição || data.apreensoes) && (isDroga || data.apreensoes)) {
                const lacreTexto = data.lacreNumero ? ` LACRE Nº ${data.lacreNumero}` : '';
                documentosAnexosList.push(`TERMO DE APREENSÃO${lacreTexto}`);
            }
            
            // Adicionar documentos relacionados a drogas
            if (data.drogaTipo || data.drogaNomeComum) {
                const lacreTexto = data.lacreNumero ? ` LACRE Nº ${data.lacreNumero}` : '';
                documentosAnexosList.push(`TERMO DE CONSTATAÇÃO PRELIMINAR DE DROGA${lacreTexto}`);
                
                if (isDroga) {
                    documentosAnexosList.push("REQUISIÇÃO DE EXAME EM DROGAS DE ABUSO");
                }
            }
            
            // Adicionar requisição de exame de lesão corporal se necessário
            const pessoasComLaudo = [
                ...(data.autores || []).filter((a: any) => a.laudoPericial === "Sim").map((a: any) => ({ nome: a.nome, sexo: a.sexo, tipo: "Autor" })),
                ...(data.vitimas || []).filter((v: any) => v.laudoPericial === "Sim").map((v: any) => ({ nome: v.nome, sexo: v.sexo, tipo: "Vítima" }))
            ].filter(p => p.nome && p.nome.trim());
            
            if (pessoasComLaudo.length > 0) {
                pessoasComLaudo.forEach(pessoa => {
                    const generoArtigo = pessoa.sexo?.toLowerCase() === 'feminino' ? 'DA' : 'DO';
                    const generoTipo = pessoa.tipo === 'Autor' ? 
                        (pessoa.sexo?.toLowerCase() === 'feminino' ? 'AUTORA' : 'AUTOR') : 
                        (pessoa.sexo?.toLowerCase() === 'feminino' ? 'VÍTIMA' : 'VÍTIMA');
                    documentosAnexosList.push(`REQUISIÇÃO DE EXAME DE LESÃO CORPORAL ${generoArtigo} ${generoTipo}`);
                });
            }

            if (depositarios.length > 0) {
                documentosAnexosList.push("TERMO DE DEPÓSITO");
            }
            
            // Atualizar os dados com a lista de documentos anexos
            const updatedData = {
                ...data,
                documentosAnexos: documentosAnexosList.join('\n')
            };

            // --- SEÇÕES 1-5: Histórico, Envolvidos, etc. ---
            generateHistoricoContent(doc, yPosition, updatedData)
                .then(() => {
                    // --- ADIÇÃO DOS TERMOS ---
                    if (updatedData.autores && updatedData.autores.length > 0) {
                        addTermoCompromisso(doc, updatedData);
                    } else {
                        console.warn("Nenhum autor informado, pulando Termo de Compromisso.");
                    }

                    // Corrigindo a lógica para incluir o Termo de Manifestação
                    // Verifica se NÃO é um caso de droga para consumo OU se tem vítimas informadas
                    if ((updatedData.natureza !== "Porte de drogas para consumo") && (updatedData.vitimas && updatedData.vitimas.length > 0)) {
                        console.log("Adicionando Termo de Manifestação da Vítima");
                        addTermoManifestacao(doc, updatedData);
                    } else {
                        console.log("Pulando Termo de Manifestação da Vítima: natureza incompatível ou sem vítimas.");
                    }

                    // Incluir o termo de apreensão quando houver uma descrição de apreensão
                    if ((updatedData.apreensaoDescrição || updatedData.apreensoes) && 
                        (isDroga || updatedData.apreensoes)) {
                        console.log("Adicionando Termo de Apreensão");
                        addTermoApreensao(doc, updatedData);
                    } else {
                        console.log("Pulando Termo de Apreensão: sem descrição de apreensão.");
                    }
                    
                    if (depositarios.length > 0) {
                        console.log("Adicionando Termo de Depósito");
                        addTermoDeposito(doc, updatedData);
                    }

                    if (updatedData.drogaTipo || updatedData.drogaNomeComum) {
                        addTermoConstatacaoDroga(doc, updatedData);
                        
                        // Adiciona Requisição de Exame em Drogas logo após o Termo de Constatação de Droga
                        if (updatedData.natureza === "Porte de drogas para consumo") {
                            addRequisicaoExameDrogas(doc, updatedData);
                        }
                    }

                    // --- REQUISIÇÃO DE EXAME DE LESÃO CORPORAL ---
                    if (pessoasComLaudo.length > 0) {
                        pessoasComLaudo.forEach(pessoa => {
                            console.log(`Gerando Requisição de Exame de Lesão para: ${pessoa.nome} (${pessoa.tipo}, Sexo: ${pessoa.sexo || 'Não especificado'})`);
                            addRequisicaoExameLesao(doc, { ...updatedData, periciadoNome: pessoa.nome, sexo: pessoa.sexo });
                        });
                    } else {
                        console.log("Nenhum autor ou vítima com laudoPericial: 'Sim'. Pulando Requisição de Exame de Lesão.");
                    }

                    addTermoEncerramentoRemessa(doc, updatedData);

                    // --- Finalização: Adiciona Números de Página apenas se hidePagination for false (deixamos sempre oculto) ---
                    // A paginação está desativada por padrão
                    const pageCount = doc.internal.pages.length - 1;
                    if (!updatedData.hidePagination) {
                        for (let i = 1; i <= pageCount; i++) {
                            doc.setPage(i);
                            doc.setFont("helvetica", "normal");
                            doc.setFontSize(8);
                            doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - MARGIN_BOTTOM + 5, { align: "right" });

                            if (i > 1) {
                                addStandardFooterContent(doc);
                            }
                        }
                    }

                    // Opcionalmente, gera um download local
                    if (updatedData.downloadLocal) {
                        try {
                            const fileName = generateTCOFilename(updatedData);
                            
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
                    reject(new Error(`Erro ao gerar histórico do PDF: ${histError.message}`));
                });
        } catch (error: any) {
            clearTimeout(timeout);
            reject(new Error(`Erro na geração do PDF: ${error.message}`));
        }
    });
};

export const generateTCOPDF = generatePDF;
