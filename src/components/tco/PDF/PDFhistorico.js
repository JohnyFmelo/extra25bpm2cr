// (Make sure all imports at the top of PDFhistorico.js are present)
// import {
//     MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
//     addSectionTitle, addField, addWrappedText, formatarDataHora, formatarDataSimples,
//     checkPageBreak, addSignatureWithNameAndRole, addNewPage
// } from './pdfUtils.js';
// import QRCode from 'qrcode';


// (addImagesToPDF function should be present here as it was before)
// ...

export const generateHistoricoContent = async (doc, currentY, data) => {
    let yPos = currentY;
    const { PAGE_WIDTH, MAX_LINE_WIDTH, PAGE_HEIGHT, MARGIN_TOP } = getPageConstants(doc);
    const isDrugCase = data.natureza === "Porte de drogas para consumo";

    // ... (SEÇÃO 1, 2, 3, 4 - DADOS GERAIS, ENVOLVIDOS, HISTÓRICO, PROVIDÊNCIAS - all unchanged) ...
    // (Ensure all previous sections are correctly rendered before section 5)
    // Convert general information data to uppercase
    const upperCaseData = {
        ...data,
        natureza: data.natureza ? data.natureza.toUpperCase() : '',
        tipificacao: data.tipificacao ? data.tipificacao.toUpperCase() : '',
        localFato: data.localFato ? data.localFato.toUpperCase() : '',
        endereco: data.endereco ? data.endereco.toUpperCase() : '',
        municipio: data.municipio ? data.municipio.toUpperCase() : '',
        comunicante: data.comunicante ? data.comunicante.toUpperCase() : '',
    };

    // --- SEÇÃO 1: DADOS GERAIS ---
    yPos = addSectionTitle(doc, yPos, "DADOS GERAIS E IDENTIFICADORES DA OCORRÊNCIA", "1", 1, data);
    yPos = addField(doc, yPos, "NATUREZA DA OCORRÊNCIA", upperCaseData.natureza, data);
    yPos = addField(doc, yPos, "TIPIFICAÇÃO LEGAL", upperCaseData.tipificacao, data);
    yPos = addField(doc, yPos, "DATA E HORA DO FATO", formatarDataHora(data.dataFato, data.horaFato), data);
    yPos = addField(doc, yPos, "DATA E HORA DO INÍCIO DO REGISTRO", formatarDataHora(data.dataInicioRegistro, data.horaInicioRegistro), data);
    yPos = addField(doc, yPos, "DATA E HORA DO TÉRMINO DO REGISTRO", formatarDataHora(data.dataTerminoRegistro, data.horaTerminoRegistro), data);
    yPos = addField(doc, yPos, "LOCAL DO FATO", upperCaseData.localFato, data);
    yPos = addField(doc, yPos, "ENDEREÇO", upperCaseData.endereco, data);
    yPos = addField(doc, yPos, "MUNICÍPIO", upperCaseData.municipio, data);
    yPos = addField(doc, yPos, "COMUNICANTE", upperCaseData.comunicante, data);

    // --- SEÇÃO 2: ENVOLVIDOS ---
    yPos = addSectionTitle(doc, yPos, "ENVOLVIDOS", "2", 1, data);

    const autoresValidos = data.autores ? data.autores.filter(a => a?.nome) : [];
    let autorTitlePDF; // Renamed to avoid conflict with GuarnicaoTab's variable if in same scope
    if (autoresValidos.length === 1) {
        autorTitlePDF = autoresValidos[0]?.sexo?.toLowerCase() === 'feminino' ? "AUTORA DO FATO" : "AUTOR DO FATO";
    } else {
        autorTitlePDF = "AUTORES DO FATO";
    }
    yPos = addSectionTitle(doc, yPos, autorTitlePDF, "2.1", 2, data);
    if (autoresValidos.length > 0) {
        autoresValidos.forEach((autor, index) => {
            const upperAutor = {
                ...autor,
                nome: autor.nome ? autor.nome.toUpperCase() : 'NÃO INFORMADO',
                sexo: autor.sexo ? autor.sexo.toUpperCase() : 'NÃO INFORMADO',
                estadoCivil: autor.estadoCivil ? autor.estadoCivil.toUpperCase() : 'NÃO INFORMADO',
                profissao: autor.profissao ? autor.profissao.toUpperCase() : 'NÃO INFORMADO',
                endereco: autor.endereco ? autor.endereco.toUpperCase() : 'NÃO INFORMADO',
                naturalidade: autor.naturalidade ? autor.naturalidade.toUpperCase() : 'NÃO INFORMADO',
                filiacaoMae: autor.filiacaoMae ? autor.filiacaoMae.toUpperCase() : 'NÃO INFORMADO',
                filiacaoPai: autor.filiacaoPai ? autor.filiacaoPai.toUpperCase() : 'NÃO INFORMADO',
                rg: autor.rg ? autor.rg.toUpperCase() : 'NÃO INFORMADO',
                cpf: autor.cpf ? autor.cpf.toUpperCase() : 'NÃO INFORMADO',
                celular: autor.celular ? autor.celular.toUpperCase() : 'NÃO INFORMADO',
                email: autor.email ? autor.email.toUpperCase() : 'NÃO INFORMADO',
            };
            if (index > 0) {
                yPos += 3; yPos = checkPageBreak(doc, yPos, 5, data);
                doc.setLineWidth(0.1); doc.setDrawColor(150);
                doc.line(MARGIN_LEFT, yPos - 1, PAGE_WIDTH - MARGIN_RIGHT, yPos - 1);
                doc.setDrawColor(0); yPos += 2;
            }
            yPos = addField(doc, yPos, "NOME", upperAutor.nome, data);
            yPos = addField(doc, yPos, "SEXO", upperAutor.sexo, data);
            yPos = addField(doc, yPos, "ESTADO CIVIL", upperAutor.estadoCivil, data);
            yPos = addField(doc, yPos, "PROFISSÃO", upperAutor.profissao, data);
            yPos = addField(doc, yPos, "ENDEREÇO", upperAutor.endereco, data);
            yPos = addField(doc, yPos, "DATA DE NASCIMENTO", formatarDataSimples(autor.dataNascimento), data);
            yPos = addField(doc, yPos, "NATURALIDADE", upperAutor.naturalidade, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", upperAutor.filiacaoMae, data);
            yPos = addField(doc, yPos, "FILIAÇÃO - PAI", upperAutor.filiacaoPai, data);
            yPos = addField(doc, yPos, "RG", upperAutor.rg, data);
            yPos = addField(doc, yPos, "CPF", upperAutor.cpf, data);
            yPos = addField(doc, yPos, "CELULAR", upperAutor.celular, data);
            yPos = addField(doc, yPos, "E-MAIL", upperAutor.email, data);
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhum autor informado.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }

    if (!isDrugCase) {
        const vitimasValidas = data.vitimas ? data.vitimas.filter(v => v?.nome) : [];
        const vitimaTitle = vitimasValidas.length === 1 ? "VÍTIMA" : "VÍTIMAS";
        yPos = addSectionTitle(doc, yPos, vitimaTitle, "2.2", 2, data);
        if (vitimasValidas.length > 0) {
            vitimasValidas.forEach((vitima, index) => {
                 const upperVitima = {
                    ...vitima,
                    nome: vitima.nome ? vitima.nome.toUpperCase() : 'NÃO INFORMADO',
                    sexo: vitima.sexo ? vitima.sexo.toUpperCase() : 'NÃO INFORMADO',
                    estadoCivil: vitima.estadoCivil ? vitima.estadoCivil.toUpperCase() : 'NÃO INFORMADO',
                    profissao: vitima.profissao ? vitima.profissao.toUpperCase() : 'NÃO INFORMADO',
                    endereco: vitima.endereco ? vitima.endereco.toUpperCase() : 'NÃO INFORMADO',
                    naturalidade: vitima.naturalidade ? vitima.naturalidade.toUpperCase() : 'NÃO INFORMADO',
                    filiacaoMae: vitima.filiacaoMae ? vitima.filiacaoMae.toUpperCase() : 'NÃO INFORMADO',
                    filiacaoPai: vitima.filiacaoPai ? vitima.filiacaoPai.toUpperCase() : 'NÃO INFORMADO',
                    rg: vitima.rg ? vitima.rg.toUpperCase() : 'NÃO INFORMADO',
                    cpf: vitima.cpf ? vitima.cpf.toUpperCase() : 'NÃO INFORMADO',
                    celular: vitima.celular ? vitima.celular.toUpperCase() : 'NÃO INFORMADO',
                    email: vitima.email ? vitima.email.toUpperCase() : 'NÃO INFORMADO',
                };
                if (index > 0) { /* ... separator ... */ }
                // ... fields ...
            });
        } else {
            yPos = addWrappedText(doc, yPos, "Nenhuma vítima informada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
            yPos += 2;
        }
    }

    const testemunhasValidas = data.testemunhas ? data.testemunhas.filter(t => t?.nome) : [];
    const testemunhaTitle = testemunhasValidas.length === 1 ? "TESTEMUNHA" : "TESTEMUNHAS";
    yPos = addSectionTitle(doc, yPos, testemunhaTitle, "2.3", 2, data);
    if (testemunhasValidas.length > 0) {
        testemunhasValidas.forEach((testemunha, index) => {
             const upperTestemunha = {
                ...testemunha,
                nome: testemunha.nome ? testemunha.nome.toUpperCase() : 'NÃO INFORMADO',
                 // ... other fields
            };
            if (index > 0) { /* ... separator ... */ }
            // ... fields ...
        });
    } else {
        yPos = addWrappedText(doc, yPos, "Nenhuma testemunha informada.", MARGIN_LEFT, 12, "italic", MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }
    // --- HISTÓRICO --- (Sections 3.1 to 3.x)
    const primeiroAutor = autoresValidos[0];
    const primeiraVitima = !isDrugCase ? (data.vitimas ? data.vitimas.find(v => v?.nome) : null) : null;
    const primeiraTestemunha = testemunhasValidas[0];

    yPos = addSectionTitle(doc, yPos, "HISTÓRICO", "3", 1, data);
    yPos = addSectionTitle(doc, yPos, "RELATO DO POLICIAL MILITAR", "3.1", 2, data);
    yPos = addWrappedText(doc, yPos, data.relatoPolicial || "NÃO INFORMADO.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 2;

    const tituloRelatoAutor = primeiroAutor?.sexo?.toLowerCase() === 'feminino' ? "RELATO DA AUTORA DO FATO" : "RELATO DO AUTOR DO FATO";
    yPos = addSectionTitle(doc, yPos, tituloRelatoAutor, "3.2", 2, data);
    yPos = addWrappedText(doc, yPos, data.relatoAutor || "NÃO INFORMADO.", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    if (primeiroAutor) {
        yPos = addSignatureWithNameAndRole(doc, yPos, primeiroAutor?.nome, autorTitlePDF.replace("AUTORES", "AUTOR(A)"), data);
    } else { yPos += 10; }

    if (!isDrugCase) { /* Relato Vítima + Signature */ }
    /* Relato Testemunha + Signature */
    /* Conclusão Policial */

    // --- SEÇÃO 4: PROVIDÊNCIAS E ANEXOS ---
    /* ... (unchanged section 4 content) ... */


    // --- SEÇÃO 5: IDENTIFICAÇÃO DA GUARNIÇÃO ---
    yPos = addSectionTitle(doc, yPos, "IDENTIFICAÇÃO DA GUARNIÇÃO", "5", 1, data);
    
    const guarnicao = data.componentesGuarnicao || [];
    const condutor = guarnicao.length > 0 ? guarnicao[0] : null;
    // Main garrison members (excluding condutor, excluding apoio)
    const outrosMembrosPrincipais = guarnicao.slice(1).filter(c => !c.apoio);
    // Support members (excluding condutor, only those marked as apoio)
    const membrosApoio = guarnicao.slice(1).filter(c => c.apoio === true);

    let mainGarrisonPrintedCount = 0;

    if (condutor) {
        mainGarrisonPrintedCount++;
        yPos = checkPageBreak(doc, yPos, 40, data); // Approx height for condutor block

        let condutorNomeDisplay = condutor.nome ? condutor.nome.toUpperCase() : "NOME NÃO INFORMADO";
        condutorNomeDisplay += " (CONDUTOR)";
        
        yPos = addField(doc, yPos, "NOME COMPLETO", condutorNomeDisplay, data);
        yPos = addField(doc, yPos, "POSTO/GRADUAÇÃO", condutor.posto ? condutor.posto.toUpperCase() : "POSTO NÃO INFORMADO", data);
        yPos = addField(doc, yPos, "RG PMMT", condutor.rg || "RG NÃO INFORMADO", data);
        
        // Signature for Condutor
        const sigLineYCondutor = yPos; // Current yPos is where the signature line should start
        doc.setFont("helvetica", "normal"); 
        doc.setFontSize(12);
        doc.text("ASSINATURA:", MARGIN_LEFT, sigLineYCondutor);
        const labelWidthCondutor = doc.getTextWidth("ASSINATURA:");
        const lineStartXCondutor = MARGIN_LEFT + labelWidthCondutor + 2;
        const lineEndXCondutor = lineStartXCondutor + 80;
        doc.setLineWidth(0.3); 
        doc.line(lineStartXCondutor, sigLineYCondutor, lineEndXCondutor, sigLineYCondutor);
        yPos = sigLineYCondutor + 7; // Move yPos down (approx height of text line + small padding)
    }

    outrosMembrosPrincipais.forEach((componente) => {
        mainGarrisonPrintedCount++;
        // Approx height: 15 (sep space) + 5 (sep line space) + 3*6 (fields) + 7 (sig) = ~45
        yPos = checkPageBreak(doc, yPos, 45, data); 
        
        // Add separator line IF a condutor was already printed OR if this isn't the first 'outroMembroPrincipal'
        // Simplified: always add separator if condutor was printed, or if it's any 'outroMembroPrincipal'
         if (condutor || mainGarrisonPrintedCount > (condutor ? 1:0) ) { // Check if it's not the very first item of the main garrison
            yPos += 15; 
            doc.setLineWidth(0.1);
            doc.setDrawColor(200, 200, 200);
            doc.line(MARGIN_LEFT, yPos - 10, PAGE_WIDTH - MARGIN_RIGHT, yPos - 10);
            doc.setDrawColor(0);
            yPos += 5; 
        }
        
        yPos = addField(doc, yPos, "NOME COMPLETO", componente.nome ? componente.nome.toUpperCase() : "NOME NÃO INFORMADO", data);
        yPos = addField(doc, yPos, "POSTO/GRADUAÇÃO", componente.posto ? componente.posto.toUpperCase() : "POSTO NÃO INFORMADO", data);
        yPos = addField(doc, yPos, "RG PMMT", componente.rg || "RG NÃO INFORMADO", data);
    
        // Signature for outrosMembrosPrincipais
        const sigLineYOutro = yPos;
        doc.setFont("helvetica", "normal"); 
        doc.setFontSize(12);
        doc.text("ASSINATURA:", MARGIN_LEFT, sigLineYOutro);
        const labelWidthOutro = doc.getTextWidth("ASSINATURA:");
        const lineStartXOutro = MARGIN_LEFT + labelWidthOutro + 2;
        const lineEndXOutro = lineStartXOutro + 80;
        doc.setLineWidth(0.3); 
        doc.line(lineStartXOutro, sigLineYOutro, lineEndXOutro, sigLineYOutro);
        yPos = sigLineYOutro + 7; 
    });

    if (mainGarrisonPrintedCount === 0 && membrosApoio.length === 0) {
        yPos = addWrappedText(doc, yPos, "Dados da Guarnição não informados.", MARGIN_LEFT, 12, 'italic', MAX_LINE_WIDTH, 'left', data);
        yPos += 2;
    }
    
    // --- SEÇÃO 5.1: APOIO ---
    if (membrosApoio.length > 0) {
        // Use level 2 for sub-section, consistent with 2.1, 3.1 etc.
        yPos = addSectionTitle(doc, yPos, "APOIO", "5.1", 2, data); 

        membrosApoio.forEach((componente, index) => {
            // Approx height for one line of text (addWrappedText handles its own height) + small top margin
            yPos = checkPageBreak(doc, yPos, 12, data); // Generous check for a line of text
            
            if (index > 0) {
                // yPos += 1; // Minimal vertical space between apoio members, addWrappedText might provide enough
            }

            const textoApoio = `${(componente.posto ? componente.posto.toUpperCase() : "POSTO NÃO INFORMADO")} ${(componente.nome ? componente.nome.toUpperCase() : "NOME NÃO INFORMADO")} - RG: ${(componente.rg || "RG NÃO INFORMADO")}`;
            
            // Using addWrappedText to handle potential line breaks for long names/posts
            // and to maintain consistent font/size from pdfUtils
            yPos = addWrappedText(doc, yPos, textoApoio, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
            // addWrappedText usually adds a bit of space (like yPos += line_height + 2).
            // If more space is desired between apoio members, add it here:
            // yPos += 1; // e.g. for a small additional gap
        });
    }
    
    return yPos;
};
