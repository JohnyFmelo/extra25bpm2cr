
import {
    MARGIN_LEFT, MARGIN_RIGHT, MARGIN_TOP, getPageConstants,
    addFieldBoldLabel, addWrappedText, addStandardFooterContent,
    checkPageBreak, addNewPage
} from './pdfUtils.js';

/**
 * Gera o conteúdo do histórico (seções 1-5) nas páginas seguintes à autuação.
 * Retorna uma Promise que resolve quando todo o conteúdo foi gerado.
 */
export const generateHistoricoContent = (doc, currentY, data) => {
    return new Promise((resolve) => {
        const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc);
        let yPos = currentY;

        // --- SEÇÃO 1: DADOS GERAIS ---
        yPos = checkPageBreak(doc, yPos, 50, data);
        yPos = addFieldBoldLabel(doc, yPos, "1. DADOS GERAIS", "", data);
        yPos += 5;

        // Data e hora
        const dataFatoFormatted = data.dataFato ? 
            new Date(data.dataFato + 'T00:00:00').toLocaleDateString('pt-BR') : 
            "NÃO INFORMADA";
        const horaFato = data.horaFato || "NÃO INFORMADA";
        yPos = addFieldBoldLabel(doc, yPos, "DATA/HORA DO FATO", `${dataFatoFormatted} às ${horaFato}`, data);

        // Local
        const localFato = data.localFato || "NÃO INFORMADO";
        const municipio = data.municipio || "NÃO INFORMADO";
        yPos = addFieldBoldLabel(doc, yPos, "LOCAL DO FATO", `${localFato}, ${municipio}/MT`, data);

        // Natureza - corrigindo para mostrar customNatureza quando aplicável
        let naturezaTexto = data.natureza || "NÃO INFORMADA";
        if (data.natureza === "Outros" && data.customNatureza) {
            naturezaTexto = data.customNatureza;
        }
        yPos = addFieldBoldLabel(doc, yPos, "NATUREZA", naturezaTexto.toUpperCase(), data);

        // Tipificação Legal - corrigindo para exibir corretamente
        const tipificacaoTexto = data.tipificacao || "NÃO INFORMADA";
        yPos = addFieldBoldLabel(doc, yPos, "TIPIFICAÇÃO LEGAL", tipificacaoTexto, data);

        // Flagrante
        const flagrante = data.flagranteDelito || "NÃO INFORMADO";
        yPos = addFieldBoldLabel(doc, yPos, "FLAGRANTE DELITO", flagrante, data);

        yPos += 10;

        // --- SEÇÃO 2: PESSOAS ENVOLVIDAS ---
        yPos = checkPageBreak(doc, yPos, 50, data);
        yPos = addFieldBoldLabel(doc, yPos, "2. PESSOAS ENVOLVIDAS", "", data);
        yPos += 5;

        // Autores
        if (data.autores && data.autores.length > 0) {
            data.autores.forEach((autor, index) => {
                const autorTitulo = data.autores.length > 1 ? `AUTOR ${index + 1}` : "AUTOR";
                yPos = addFieldBoldLabel(doc, yPos, autorTitulo, autor.nome || "NÃO INFORMADO", data);
            });
        } else {
            yPos = addFieldBoldLabel(doc, yPos, "AUTOR", "NÃO INFORMADO", data);
        }

        // Vítimas - corrigindo lógica para exibir quando houver vítimas cadastradas
        if (data.vitimas && data.vitimas.length > 0) {
            // Filtrar vítimas com nomes válidos
            const vitimasValidas = data.vitimas.filter(v => v.nome && v.nome.trim() !== '');
            
            if (vitimasValidas.length > 0) {
                vitimasValidas.forEach((vitima, index) => {
                    const vitimaTitulo = vitimasValidas.length > 1 ? `VÍTIMA ${index + 1}` : "VÍTIMA";
                    yPos = addFieldBoldLabel(doc, yPos, vitimaTitulo, vitima.nome || "NÃO INFORMADO", data);
                });
            }
        }

        // Testemunhas
        if (data.testemunhas && data.testemunhas.length > 0) {
            data.testemunhas.forEach((testemunha, index) => {
                const testemunhaTitulo = data.testemunhas.length > 1 ? `TESTEMUNHA ${index + 1}` : "TESTEMUNHA";
                yPos = addFieldBoldLabel(doc, yPos, testemunhaTitulo, testemunha.nome || "NÃO INFORMADO", data);
            });
        }

        yPos += 10;

        // --- SEÇÃO 3: HISTÓRICO ---
        yPos = checkPageBreak(doc, yPos, 50, data);
        yPos = addFieldBoldLabel(doc, yPos, "3. HISTÓRICO", "", data);
        yPos += 5;

        const historico = data.historico || "HISTÓRICO NÃO INFORMADO.";
        yPos = addWrappedText(doc, yPos, historico, MARGIN_LEFT, 12, "normal", null, 'justify', data);
        yPos += 10;

        // --- SEÇÃO 4: RELATOS ---
        yPos = checkPageBreak(doc, yPos, 50, data);
        yPos = addFieldBoldLabel(doc, yPos, "4. RELATOS", "", data);
        yPos += 5;

        // Relatos dos Autores
        if (data.autores && data.autores.length > 0) {
            data.autores.forEach((autor, index) => {
                if (autor.relato && autor.relato.trim() !== '') {
                    const autorTitulo = data.autores.length > 1 ? `RELATO DO AUTOR ${index + 1}` : "RELATO DO AUTOR";
                    yPos = addFieldBoldLabel(doc, yPos, autorTitulo, "", data);
                    yPos = addWrappedText(doc, yPos, autor.relato, MARGIN_LEFT, 12, "normal", null, 'justify', data);
                    yPos += 5;
                }
            });
        }

        // Relatos das Vítimas
        if (data.vitimas && data.vitimas.length > 0) {
            const vitimasComRelato = data.vitimas.filter(v => v.relato && v.relato.trim() !== '');
            vitimasComRelato.forEach((vitima, index) => {
                const vitimaTitulo = vitimasComRelato.length > 1 ? `RELATO DA VÍTIMA ${index + 1}` : "RELATO DA VÍTIMA";
                yPos = addFieldBoldLabel(doc, yPos, vitimaTitulo, "", data);
                yPos = addWrappedText(doc, yPos, vitima.relato, MARGIN_LEFT, 12, "normal", null, 'justify', data);
                yPos += 5;
            });
        }

        // Relatos das Testemunhas
        if (data.testemunhas && data.testemunhas.length > 0) {
            data.testemunhas.forEach((testemunha, index) => {
                if (testemunha.relato && testemunha.relato.trim() !== '') {
                    const testemunhaTitulo = data.testemunhas.length > 1 ? `RELATO DA TESTEMUNHA ${index + 1}` : "RELATO DA TESTEMUNHA";
                    yPos = addFieldBoldLabel(doc, yPos, testemunhaTitulo, "", data);
                    yPos = addWrappedText(doc, yPos, testemunha.relato, MARGIN_LEFT, 12, "normal", null, 'justify', data);
                    yPos += 5;
                }
            });
        }

        yPos += 10;

        // --- SEÇÃO 5: APREENSÕES ---
        yPos = checkPageBreak(doc, yPos, 50, data);
        yPos = addFieldBoldLabel(doc, yPos, "5. APREENSÕES", "", data);
        yPos += 5;

        const apreensoes = data.apreensoes || "NADA FOI APREENDIDO.";
        yPos = addWrappedText(doc, yPos, apreensoes, MARGIN_LEFT, 12, "normal", null, 'justify', data);
        yPos += 10;

        // --- DOCUMENTOS ANEXOS ---
        if (data.documentosAnexos) {
            yPos = checkPageBreak(doc, yPos, 50, data);
            yPos = addFieldBoldLabel(doc, yPos, "DOCUMENTOS ANEXOS", "", data);
            yPos += 5;
            yPos = addWrappedText(doc, yPos, data.documentosAnexos, MARGIN_LEFT, 12, "normal", null, 'justify', data);
            yPos += 15;
        }

        // --- LINKS DE VÍDEO ---
        if (data.videoLinks && data.videoLinks.length > 0) {
            yPos = checkPageBreak(doc, yPos, 50, data);
            yPos = addFieldBoldLabel(doc, yPos, "LINKS DE VÍDEO", "", data);
            yPos += 5;

            data.videoLinks.forEach((videoLink, index) => {
                const linkText = typeof videoLink === 'string' ? videoLink : videoLink.url;
                const descricao = typeof videoLink === 'object' && videoLink.descricao ? 
                    videoLink.descricao : `Vídeo ${index + 1}`;
                
                yPos = addFieldBoldLabel(doc, yPos, descricao.toUpperCase(), linkText, data);
            });
            yPos += 10;
        }

        resolve();
    });
};
