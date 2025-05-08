
import jsPDF from "jspdf";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

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
    yPosition = generateHistoricoContent(doc, yPosition, data);

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

    // --- Salvamento ---
    const tcoNumParaNome = data.tcoNumber || 'SEM_NUMERO';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `TCO_${tcoNumParaNome}_${dateStr}.pdf`;

    try {
        // Salvar localmente para download
        doc.save(fileName);
        console.log(`PDF baixado: ${fileName}`);
        
        // Salvar no Firebase Storage também
        const fileBlob = doc.output('blob');
        const fileRef = ref(storage, `tcos/${data.id}/${fileName}`);
        
        // Upload para o Firebase Storage
        await uploadBytes(fileRef, fileBlob);
        const downloadURL = await getDownloadURL(fileRef);
        
        // Retornar a URL do arquivo para atualização no banco de dados
        return downloadURL;
    } catch (error) {
        console.error("Erro ao salvar ou fazer upload do PDF:", error);
        alert("Ocorreu um erro ao tentar salvar ou fazer upload do PDF.");
        return null;
    }
};
