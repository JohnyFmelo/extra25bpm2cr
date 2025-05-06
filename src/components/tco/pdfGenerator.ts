
// src/components/tco/pdfGenerator.js
import { jsPDF } from "jspdf";

// Importa funções auxiliares e de página da subpasta PDF
import {
    MARGIN_TOP, MARGIN_BOTTOM, MARGIN_RIGHT, getPageConstants,
    addNewPage,
    addStandardFooterContent // Precisamos dela aqui para a numeração de página
} from './PDF/pdfUtils.js';

// Importa geradores de conteúdo da subpasta PDF
import { generateAutuacaoPage } from './PDF/PDFautuacao.js';
import { generateHistoricoContent } from './PDF/PDFhistorico.js';
import {
    addTermoCompromisso,
    addTermoManifestacao,
    addTermoApreensao,
    addTermoConstatacaoDroga,
    addRequisicaoExameLesao,
    addTermoEncerramentoRemessa
} from './PDF/PDFtermos.js';

// --- Função Principal de Geração ---
export const generatePDF = (inputData: any) => { // Nome mantido como no pedido original

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
    let yPosition; // Será gerenciado pelas funções chamadas

    // --- PÁGINA 1: AUTUAÇÃO ---
    // A função generateAutuacaoPage cuida da primeira página, incluindo cabeçalho/rodapé específicos dela.
    // Inicia a yPosition a partir da margem superior.
    yPosition = generateAutuacaoPage(doc, MARGIN_TOP, data); // Passa Y inicial

    // --- RESTANTE DO TCO (PÁGINAS 2+) ---
    // Inicia a segunda página e obtém a posição Y inicial após o cabeçalho padrão
    yPosition = addNewPage(doc, data); // addNewPage adiciona header/footer padrões e retorna yPos inicial

    // --- SEÇÕES 1-5: Histórico, Envolvidos, etc. ---
    // generateHistoricoContent adiciona o conteúdo e retorna a Y final *nessa seção*
    yPosition = generateHistoricoContent(doc, yPosition, data);

    // --- ADIÇÃO DOS TERMOS ---
    // Cada função de termo agora chama addNewPage internamente e gerencia sua própria página.

    // Termo de Compromisso (Sempre adicionado, se houver autor)
    if (data.autores && data.autores.length > 0) {
        addTermoCompromisso(doc, data);
    } else {
         console.warn("Nenhum autor informado, pulando Termo de Compromisso.")
    }


    // Termo de Manifestação da Vítima (Adicionado se houver vítima)
    // A função interna addTermoManifestacao já verifica se há vítima.
    addTermoManifestacao(doc, data);

    // Termo de Apreensão (Condicional)
    if (data.apreensaoDescricao || data.apreensoes) { // Verifica se há descrição ou lista de apreensões
        addTermoApreensao(doc, data);
    }

    // Termo de Constatação de Droga (Condicional)
    if (data.drogaTipo || data.drogaNomeComum) { // Verifica se há tipo ou nome comum informado
        addTermoConstatacaoDroga(doc, data);
    }

     // Requisição de Exame de Lesão Corporal (Condicional)
     // A função interna addRequisicaoExameLesao verifica o periciado
     addRequisicaoExameLesao(doc, data);


    // Termo de Encerramento e Remessa (Sempre adicionado ao final)
    addTermoEncerramentoRemessa(doc, data);


    // --- Finalização: Adiciona Números de Página e Salva ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i); // Vai para a página i
        doc.setFont("helvetica", "normal"); doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - MARGIN_BOTTOM + 5, { align: "right" });

        // Readiciona o rodapé padrão em todas as páginas > 1
        // A página 1 já teve seu rodapé adicionado por generateAutuacaoPage.
        // As páginas >= 2 já tiveram o rodapé adicionado por addNewPage.
        // Verificação adicional para garantir rodapé em todas as páginas > 1 se addNewPage falhar (pouco provável)
        // No esquema atual, tecnicamente addNewPage *deveria* adicionar, mas como precaução:
         if (i > 1) {
             // Checa se addNewPage não o fez por algum motivo (ou para forçar)
             addStandardFooterContent(doc); // Redundante se addNewPage funcionou 100%, seguro caso contrário
         }
    }

    // --- Salvamento ---
    // Garante que tcoNumber tenha um valor padrão para o nome do arquivo
    const tcoNumParaNome = data.tcoNumber || 'SEM_NUMERO';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `TCO_${tcoNumParaNome}_${dateStr}.pdf`;

    try {
        doc.save(fileName);
        console.log(`PDF Gerado: ${fileName}`);
    } catch (error) {
        console.error("Erro ao salvar o PDF:", error);
        alert("Ocorreu um erro ao tentar salvar o PDF.");
    }
};
