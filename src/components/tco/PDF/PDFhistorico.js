// src/components/tco/PDF/PDFhistorico.js
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addSectionTitle, addField, addWrappedText, formatarDataHora, formatarDataSimples,
    checkPageBreak, addSignatureWithNameAndRole
} from './pdfUtils.js'; // <-- Caminho local correto

/**
 * Gera o conteúdo das seções 1 a 5 do TCO.
 * Assume que começa após uma chamada a `addNewPage`.
 * Retorna a posição Y final após adicionar todo o conteúdo.
 */
export const generateHistoricoContent = (doc, currentY, data) => {
    let yPos = currentY; // Inicia com a posição Y passada (geralmente após o cabeçalho)
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc); // Pega MAX_LINE_WIDTH também

    // --- SEÇÃO 1: DADOS GERAIS ---
    yPos = addSectionTitle(doc, yPos, "DADOS GERAIS E IDENTIFICADORES DA OCORRÊNCIA", "1", 1, data);
    yPos = addField(doc, yPos, "NATUREZA DA OCORRÊNCIA", data.natureza, data);
    yPos = addField(doc, yPos, "TIPIFICAÇÃO LEGAL", data.tipificacao, data);
    yPos = addField(doc, yPos, "DATA E HORA DO FATO", formatarDataHora(data.dataFato, data.horaFato), data);
    yPos = addField(doc, yPos, "DATA E HORA DO INÍCIO DO REGISTRO", formatarDataHora(data.dataInicioRegistro, data.horaInicioRegistro), data);
    yPos = addField(doc, yPos, "DATA E HORA DO TÉRMINO DO REGISTRO", formatarDataHora(data.dataTerminoRegistro, data.horaTerminoRegistro), data);
    yPos = addField(doc, yPos, "LOCAL DO FATO", data.localFato, data);
    yPos = addField(doc, yPos, "ENDEREÇO", data.endereco, data);
    yPos = addField(doc, yPos, "MUNICÍPIO", data.municipio, data);
    yPos = addField(doc, yPos, "COMUNICANTE", data.comunicante, data);

    // --- SEÇÃO 2: ENVOLVIDOS ---
    yPos = addSectionTitle(doc, yPos, "ENVOLVIDOS", "2", 1, data);
    yPos = addSectionTitle(doc, yPos, "AUTOR(ES) DO FATO", "2.1", 2, data);
    if (data.autores && data.autores.length > 0) {
        data.autores.forEach((autor, index) => {
            // Adiciona linha separadora ENTRE autores
            if (index > 0) {
                yPos += 3; yPos = checkPageBreak(doc, yPos, 5, data); // Verifica antes da linha
                doc.setLineWidth(0.1); doc.setDrawColor(150); // Linha cinza fina
                doc.line(MARGIN_LEFT, yPos - 1, PAGE_WIDTH - MARGIN_RIGHT, yPos - 1);
                doc.setDrawColor(0); yPos += 2; // Espaço após linha
            }
            yPos = addField(doc, yPos, "NOME", autor.nome, data);
            yPos = addField(doc, yPos, "SEXO", autor.sexo, data);
            yPos = addField(doc, yPos, "ESTADO CIVIL", autor.estadoCivil, data);
            yPos = addField(doc, yPos, "PROFISSÃO", autor.profissao, data);
            yPos = addField(doc, yPos, "ENDEREÇO", autor.endereco, data);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(autor.dataNascimento), data);
            yPos = addField(doc, yPos, "NATURALIDADE", autor.naturalidade, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", autor.filiacaoMae, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", autor.filiacaoPai, data);
            yPos = addField(doc, yPos, "RG", autor.rg, data);
            yPos = addField(doc, yPos, "CPF", autor.cpf, data);
            yPos = addField(doc, yPos, "CELULAR", autor.celular, data);
            yPos = addField(doc, yPos, "E-MAIL", autor.email, data);
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhum autor informado.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    yPos = addSectionTitle(doc, yPos, "VÍTIMA(S)", "2.2", 2, data);
    const vitimasValidas = data.vitimas ? data.vitimas.filter(v => v?.nome) : []; // Filtra vítimas com nome
    if (vitimasValidas.length > 0) {
        vitimasValidas.forEach((vitima, index) => {
            // Linha separadora apenas ENTRE vítimas VÁLIDAS
            if (index > 0) {
                yPos += 3; yPos = checkPageBreak(doc, yPos, 5, data);
                doc.setLineWidth(0.1); doc.setDrawColor(150);
                doc.line(MARGIN_LEFT, yPos - 1, PAGE_WIDTH - MARGIN_RIGHT, yPos - 1);
                doc.setDrawColor(0); yPos += 2;
            }
            yPos = addField(doc, yPos, "NOME", vitima.nome, data);
            yPos = addField(doc, yPos, "SEXO", vitima.sexo, data);
            yPos = addField(doc, yPos, "ESTADO CIVIL", vitima.estadoCivil, data);
            yPos = addField(doc, yPos, "PROFISSÃO", vitima.profissao, data);
            yPos = addField(doc, yPos, "ENDEREÇO", vitima.endereco, data);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(vitima.dataNascimento), data);
            yPos = addField(doc, yPos, "NATURALIDADE", vitima.naturalidade, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", vitima.filiacaoMae, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", vitima.filiacaoPai, data);
            yPos = addField(doc, yPos, "RG", vitima.rg, data);
            yPos = addField(doc, yPos, "CPF", vitima.cpf, data);
            yPos = addField(doc, yPos, "CELULAR", vitima.celular, data);
            yPos = addField(doc, yPos, "E-MAIL", vitima.email, data);
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhuma vítima informada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    yPos = addSectionTitle(doc, yPos, "TESTEMUNHA(S)", "2.3", 2, data);
    const testemunhasValidas = data.testemunhas ? data.testemunhas.filter(t => t?.nome) : []; // Filtra testemunhas com nome
    if (testemunhasValidas.length > 0) {
        testemunhasValidas.forEach((testemunha, index) => {
            // Linha separadora apenas ENTRE testemunhas VÁLIDAS
             if (index > 0) {
                 yPos += 3; yPos = checkPageBreak(doc, yPos, 5, data);
                 doc.setLineWidth(0.1); doc.setDrawColor(150);
                 doc.line(MARGIN_LEFT, yPos - 1, PAGE_WIDTH - MARGIN_RIGHT, yPos - 1);
                 doc.setDrawColor(0); yPos += 2;
             }
            yPos = addField(doc, yPos, "NOME", testemunha.nome, data);
            yPos = addField(doc, yPos, "SEXO", testemunha.sexo, data);
            yPos = addField(doc, yPos, "ESTADO CIVIL", testemunha.estadoCivil, data);
            yPos = addField(doc, yPos, "PROFISSÃO", testemunha.profissao, data);
            yPos = addField(doc, yPos, "ENDEREÇO", testemunha.endereco, data);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(testemunha.dataNascimento), data);
            yPos = addField(doc, yPos, "NATURALIDADE", testemunha.naturalidade, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", testemunha.filiacaoMae, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", testemunha.filiacaoPai, data);
            yPos = addField(doc, yPos, "RG", testemunha.rg, data);
            yPos = addField(doc, yPos, "CPF", testemunha.cpf, data);
            yPos = addField(doc, yPos, "CELULAR", testemunha.celular, data);
            yPos = addField(doc, yPos, "E-MAIL", testemunha.email, data);
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhuma testemunha informada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    // --- SEÇÃO 3: HISTÓRICO ---
    const primeiroAutor = data.autores?.[0];
    // Pega a primeira vítima *válida* (com nome)
    const primeiraVitima = vitimasValidas.length > 0 ? vitimasValidas[0] : null;
    // Pega a primeira testemunha *válida* (com nome)
    const primeiraTestemunha = testemunhasValidas.length > 0 ? testemunhasValidas[0] : null;

    yPos = addSectionTitle(doc, yPos, "HISTÓRICO", "3", 1, data);
    yPos = addSectionTitle(doc, yPos, "RELATO DO POLICIAL MILITAR", "3.1", 2, data);
    yPos = addWrappedText(doc, yPos, data.relatoPolicial, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "RELATO DO AUTOR DO FATO", "3.2", 2, data);
    yPos = addWrappedText(doc, yPos, data.relatoAutor, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    // Adiciona assinatura do autor se houver autor
    if(primeiroAutor) {
       yPos = addSignatureWithNameAndRole(doc, yPos, primeiroAutor?.nome, "AUTOR DO FATO", data);
    } else {
        yPos += 10; // Adiciona um espaço se não houver autor para assinar
    }


    yPos = addSectionTitle(doc, yPos, "RELATO DA VÍTIMA", "3.3", 2, data);
    // Só adiciona o relato se existir uma vítima válida
    const relatoVitimaText = primeiraVitima ? (data.relatoVitima || "Relato não fornecido pela vítima.") : "Nenhuma vítima identificada para fornecer relato.";
    yPos = addWrappedText(doc, yPos, relatoVitimaText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    // Adiciona assinatura da vítima se houver vítima válida
    if(primeiraVitima) {
        yPos = addSignatureWithNameAndRole(doc, yPos, primeiraVitima?.nome, "VÍTIMA", data);
    } else {
        yPos += 10; // Adiciona um espaço se não houver vítima para assinar
    }

    yPos = addSectionTitle(doc, yPos, "RELATO DA TESTEMUNHA", "3.4", 2, data);
    // Texto padrão considera se há testemunha e se há relato para ela
    let relatoTestText = "Nenhuma testemunha identificada.";
    if (primeiraTestemunha) {
        relatoTestText = data.relatoTestemunha || "Relato não fornecido pela testemunha.";
    }
    yPos = addWrappedText(doc, yPos, relatoTestText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    // Adiciona assinatura da testemunha se houver testemunha válida
    if(primeiraTestemunha) {
        yPos = addSignatureWithNameAndRole(doc, yPos, primeiraTestemunha?.nome, "TESTEMUNHA", data);
    } else {
        yPos += 10; // Adiciona um espaço se não houver testemunha para assinar
    }

    yPos = addSectionTitle(doc, yPos, "CONCLUSÃO DO POLICIAL", "3.5", 2, data);
    yPos = addWrappedText(doc, yPos, data.conclusaoPolicial, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;


    // --- SEÇÃO 4: PROVIDÊNCIAS E ANEXOS ---
    yPos = addSectionTitle(doc, yPos, "PROVIDÊNCIAS", "4", 1, data);
    yPos = addWrappedText(doc, yPos, data.providencias || "Não informado.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "DOCUMENTOS ANEXOS", "4.1", 2, data);
    yPos = addWrappedText(doc, yPos, data.documentosAnexos || "Nenhum.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
    yPos += 2;

    yPos = addSectionTitle(doc, yPos, "DESCRIÇÃO DOS OBJETOS/DOCUMENTOS APREENDIDOS", "4.2", 2, data);
    yPos = addWrappedText(doc, yPos, data.apreensaoDescricao || data.apreensoes || "Nenhum.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
    yPos += 2;


    // --- SEÇÃO 5: IDENTIFICAÇÃO DA GUARNIÇÃO ---
    yPos = addSectionTitle(doc, yPos, "IDENTIFICAÇÃO DA GUARNIÇÃO", "5", 1, data);
    if (data.componentesGuarnicao && data.componentesGuarnicao.length > 0) {
        data.componentesGuarnicao.forEach((componente, index) => {
            if (index > 0) {
                yPos += 5; // Espaço entre componentes
                yPos = checkPageBreak(doc, yPos, 5 + 50, data); // Verifica antes do espaço e bloco do componente
            }
            yPos = addField(doc, yPos, "NOME COMPLETO", componente.nome, data);
            yPos = addField(doc, yPos, "POSTO/GRADUAÇÃO", componente.posto, data);
            yPos = addField(doc, yPos, "RG PMMT", componente.rg, data);

            // Adiciona linha de assinatura para cada componente
            yPos = checkPageBreak(doc, yPos, 15, data); // Verifica espaço para linha e texto "ASSINATURA:"
            const sigLineY = yPos + 5;
            doc.setFont("helvetica", "normal"); doc.setFontSize(12);
            doc.text("ASSINATURA:", MARGIN_LEFT, sigLineY);
            const labelWidth = doc.getTextWidth("ASSINATURA:");
            const lineStartX = MARGIN_LEFT + labelWidth + 2; // Posição X inicial da linha
            const lineEndX = lineStartX + 80; // Comprimento da linha (80mm)
            doc.setLineWidth(0.3); doc.line(lineStartX, sigLineY, lineEndX, sigLineY); // Desenha linha
            yPos = sigLineY + 5; // Atualiza Y para depois da linha de assinatura
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Dados da Guarnição não informados.", MARGIN_LEFT, 12, 'italic', MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    return yPos; // Retorna a posição Y final
};
