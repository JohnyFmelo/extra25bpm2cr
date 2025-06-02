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

/**
 * Remove acentos e caracteres especiais de uma string
 */
const removeAccents = (str: string): string => {
    if (!str) return '';
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
    console.log("Gerando nome do arquivo TCO", data);
    
    const tcoNum = data.tcoNumber?.trim() || 'SEM_NUMERO';
    
    const eventDateParts = data.dataFato ? data.dataFato.split('-') : [];
    const formattedDate = eventDateParts.length === 3 && eventDateParts[0].length === 4 ? 
        `${eventDateParts[2]}-${eventDateParts[1]}-${eventDateParts[0]}` : 
        new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    
    let natureza = data.natureza === "Outros" && data.customNatureza ? 
        data.customNatureza.trim() : 
        data.natureza || 'Sem_Natureza';
        
    natureza = removeAccents(natureza);
    console.log("Natureza formatada para o nome do arquivo:", natureza);

    const componentes = Array.isArray(data.componentesGuarnicao) ? data.componentesGuarnicao : [];
    
    const principais = componentes.filter(c => c && c.rg && !c.apoio);
    const apoio = componentes.filter(c => c && c.rg && c.apoio);
    
    if (principais.length === 0 && apoio.length > 0) {
        const primeiroApoio = apoio.shift();
        if (primeiroApoio) principais.push({...primeiroApoio, apoio: false});
    }
    
    const rgsPrincipais = principais.map(p => p.rg?.replace(/\D/g, '') || '');
    const rgsApoio = apoio.map(p => p.rg?.replace(/\D/g, '') || '');
    
    console.log("RGs Principais:", rgsPrincipais);
    console.log("RGs Apoio:", rgsApoio);
    
    let rgCode = rgsPrincipais.length > 0 ? rgsPrincipais.join('') : 'RG_INDISPONIVEL';
    
    if (rgsApoio.length > 0) {
        rgCode += '-' + rgsApoio.join('');
    }
    
    const fileName = `TCO_${tcoNum}_${formattedDate}_${natureza}_${rgCode}.pdf`;
    console.log("Nome do arquivo TCO gerado:", fileName);
    return fileName;
};

// --- Função Principal de Geração ---
export const generatePDF = async (inputData: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Tempo limite excedido ao gerar PDF. Por favor, tente novamente."));
        }, 60000); 
        
        try {
            if (!inputData || typeof inputData !== 'object' || Object.keys(inputData).length === 0) {
                clearTimeout(timeout);
                reject(new Error("Dados inválidos para gerar o PDF."));
                return;
            }

            // --- VALIDAÇÃO E FORMATAÇÃO DA DATA E HORA DA AUDIÊNCIA ---
            const rawJuizadoData = inputData.juizadoEspecialData || inputData.dataAudiencia;
            const rawJuizadoHora = inputData.juizadoEspecialHora || inputData.horaAudiencia;

            if (!rawJuizadoData || typeof rawJuizadoData !== 'string' || rawJuizadoData.trim() === '' ||
                !rawJuizadoHora || typeof rawJuizadoHora !== 'string' || rawJuizadoHora.trim() === '') {
                clearTimeout(timeout);
                let missingInfo = [];
                if (!rawJuizadoData || typeof rawJuizadoData !== 'string' || rawJuizadoData.trim() === '') missingInfo.push("data");
                if (!rawJuizadoHora || typeof rawJuizadoHora !== 'string' || rawJuizadoHora.trim() === '') missingInfo.push("hora");
                reject(new Error(`É obrigatório informar a ${missingInfo.join(' e ')} de apresentação no Juizado Especial.`));
                return;
            }

            let formattedJuizadoData;
            const partesData = rawJuizadoData.trim().split('-'); // Assume formato AAAA-MM-DD do input type="date"
            if (partesData.length === 3 && partesData[0].length === 4 && 
                partesData[1].length === 2 && partesData[2].length === 2) {
                formattedJuizadoData = `${partesData[2]}/${partesData[1]}/${partesData[0]}`; // Converte para DD/MM/AAAA
            } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawJuizadoData.trim())) { // Se já estiver DD/MM/AAAA
                formattedJuizadoData = rawJuizadoData.trim();
            }
            else {
                clearTimeout(timeout);
                reject(new Error(`Formato da data de apresentação no Juizado (${rawJuizadoData}) inválido. Forneça no formato AAAA-MM-DD ou DD/MM/AAAA.`));
                return;
            }

            const trimmedJuizadoHora = rawJuizadoHora.trim(); // Input type="time" é HH:MM
            if (!/^\d{2}:\d{2}$/.test(trimmedJuizadoHora)) { // Validação simples HH:MM
                clearTimeout(timeout);
                reject(new Error(`Formato da hora de apresentação no Juizado (${trimmedJuizadoHora}) inválido. Forneça no formato HH:MM.`));
                return;
            }
            // --- FIM DA VALIDAÇÃO E FORMATAÇÃO ---


            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            let processedVideoLinks = inputData.videoLinks;
            if (processedVideoLinks && Array.isArray(processedVideoLinks)) {
                processedVideoLinks = processedVideoLinks.map((link, index) => {
                    if (typeof link === 'string') {
                        return { url: link, descricao: `Vídeo ${index + 1}` };
                    }
                    return link; // Assume que já está no formato {url, descricao}
                });
            }

            const data = { 
                ...inputData,
                juizadoEspecialData: formattedJuizadoData, // Usa a data formatada
                juizadoEspecialHora: trimmedJuizadoHora,    // Usa a hora validada
                videoLinks: processedVideoLinks,
                hidePagination: true
            };

            const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc);
            let yPosition;

            yPosition = generateAutuacaoPage(doc, MARGIN_TOP, data);
            yPosition = addNewPage(doc, data);

            const isDroga = data.natureza === "Porte de drogas para consumo";
            const documentosAnexosList = ["TERMO DE COMPROMISSO"];
            
            if (!isDroga && data.vitimas && data.vitimas.length > 0) {
                documentosAnexosList.push("TERMO DE MANIFESTAÇÃO");
            }
            
            if ((data.apreensaoDescrição || data.apreensoes) && (isDroga || data.apreensoes)) {
                const lacreTexto = data.lacreNumero ? ` LACRE Nº ${data.lacreNumero}` : '';
                documentosAnexosList.push(`TERMO DE APREENSÃO${lacreTexto}`);
            }
            
            if (data.drogaTipo || data.drogaNomeComum) {
                const lacreTexto = data.lacreNumero ? ` LACRE Nº ${data.lacreNumero}` : '';
                documentosAnexosList.push(`TERMO DE CONSTATAÇÃO PRELIMINAR DE DROGA${lacreTexto}`);
                if (isDroga) {
                    documentosAnexosList.push("REQUISIÇÃO DE EXAME EM DROGAS DE ABUSO");
                }
            }
            
            const pessoasComLaudo = [
                ...(data.autores || []).filter(a => a.laudoPericial === "Sim").map(a => ({ nome: a.nome, sexo: a.sexo, tipo: "Autor" })),
                ...(data.vitimas || []).filter(v => v.laudoPericial === "Sim").map(v => ({ nome: v.nome, sexo: v.sexo, tipo: "Vítima" }))
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
            
            const updatedData = { // `updatedData` herda `juizadoEspecialData` e `juizadoEspecialHora` de `data`
                ...data,
                documentosAnexos: documentosAnexosList.join('\n')
            };

            generateHistoricoContent(doc, yPosition, updatedData)
                .then(() => {
                    if (updatedData.autores && updatedData.autores.length > 0) {
                        console.log("Dados da audiência para Termo Compromisso:", updatedData.juizadoEspecialData, updatedData.juizadoEspecialHora);
                        addTermoCompromisso(doc, updatedData); // Passa updatedData com os dados da audiência formatados
                    } else {
                        console.warn("Nenhum autor informado, pulando Termo de Compromisso.");
                    }

                    if ((updatedData.natureza !== "Porte de drogas para consumo") && (updatedData.vitimas && updatedData.vitimas.length > 0)) {
                        console.log("Adicionando Termo de Manifestação da Vítima");
                        addTermoManifestacao(doc, updatedData);
                    } else {
                        console.log("Pulando Termo de Manifestação da Vítima: natureza incompatível ou sem vítimas.");
                    }

                    if ((updatedData.apreensaoDescrição || updatedData.apreensoes) && (isDroga || updatedData.apreensoes)) {
                        console.log("Adicionando Termo de Apreensão");
                        addTermoApreensao(doc, updatedData);
                    } else {
                        console.log("Pulando Termo de Apreensão: sem descrição de apreensão.");
                    }

                    if (updatedData.drogaTipo || updatedData.drogaNomeComum) {
                        addTermoConstatacaoDroga(doc, updatedData);
                        if (updatedData.natureza === "Porte de drogas para consumo") {
                            addRequisicaoExameDrogas(doc, updatedData);
                        }
                    }

                    if (pessoasComLaudo.length > 0) {
                        pessoasComLaudo.forEach(pessoa => {
                            console.log(`Gerando Requisição de Exame de Lesão para: ${pessoa.nome} (${pessoa.tipo}, Sexo: ${pessoa.sexo || 'Não especificado'})`);
                            addRequisicaoExameLesao(doc, { ...updatedData, periciadoNome: pessoa.nome, sexo: pessoa.sexo });
                        });
                    } else {
                        console.log("Nenhum autor ou vítima com laudoPericial: 'Sim'. Pulando Requisição de Exame de Lesão.");
                    }

                    addTermoEncerramentoRemessa(doc, updatedData);

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

                    if (updatedData.downloadLocal) {
                        try {
                            const fileName = generateTCOFilename(updatedData);
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
                    reject(new Error(`Erro ao gerar histórico do PDF: ${histError.message || histError}`));
                });
        } catch (error) {
            clearTimeout(timeout);
            reject(new Error(`Erro na geração do PDF: ${error.message || error}`));
        }
    });
};
