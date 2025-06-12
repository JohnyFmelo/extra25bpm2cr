import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addWrappedText, checkPageBreak
} from './pdfUtils.js';

// Helper function to format date as "DD DE MMMM DE AAAA"
const getCustomDataAtualExtenso = () => {
    const hoje = new Date();
    const dia = hoje.getDate();
    const meses = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    const mes = meses[hoje.getMonth()];
    const ano = hoje.getFullYear();
    return `${dia} DE ${mes} DE ${ano}`;
};

// Helper function to format date as "DD/MM/YYYY"
const formatarDataSimples = (dataStr) => {
    if (!dataStr) return new Date().toLocaleDateString('pt-BR');
    try {
        const [year, month, day] = dataStr.split('-');
        return `${day}/${month}/${year}`;
    } catch (e) {
        return new Date().toLocaleDateString('pt-BR');
    }
};

// << CORREÇÃO: Helper para converter número em texto por extenso. >>
const numberToText = (num) => {
    const numbers = ["ZERO", "UMA", "DUAS", "TRÊS", "QUATRO", "CINCO", "SEIS", "SETE", "OITO", "NOVE", "DEZ"];
    return (num >= 0 && num <= 10) ? numbers[num] : num.toString();
};

/** Adiciona Requisição de Exame em Drogas de Abuso (em página nova) */
export const addRequisicaoExameDrogas = (doc, data) => {
    // << CORREÇÃO: Verifica se o array 'drogas' existe. Se não, não gera a requisição. >>
    if (!data.drogas || data.drogas.length === 0) {
        console.log("Pulando Requisição de Exame em Drogas: Nenhuma droga informada.");
        return;
    }

    let yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    const autor = data.autores?.[0];

    const lacreNumero = data.lacreNumero || "NÃO INFORMADO";
    const nomeAutor = autor?.nome || "[NOME NÃO INFORMADO]";
    const dataFatoStr = formatarDataSimples(data.dataFato);

    // Flexão de gênero para autor/autora
    const generoAutor = autor?.sexo?.toLowerCase() === 'feminino' ? 'A' : 'O';
    const autorArtigo = autor?.sexo?.toLowerCase() === 'feminino' ? 'A' : 'O';
    const autorTermo = autor?.sexo?.toLowerCase() === 'feminino' ? 'AUTORA' : 'AUTOR';
    const qualificado = autor?.sexo?.toLowerCase() === 'feminino' ? 'QUALIFICADA' : 'QUALIFICADO';

    // Título
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("REQUISIÇÃO DE EXAME PERICIAL EM DROGAS".toUpperCase(), PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    // Conteúdo principal
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    
    const autorTextoFragment = `D${generoAutor} ${autorArtigo} ${autorTermo} DO FATO ${nomeAutor.toUpperCase()}, ${qualificado.toUpperCase()} NESTE TCO`;
    
    // << CORREÇÃO: O texto agora refere-se a "substância(s)" de forma genérica, pois a descrição virá no apenso. >>
    const textoRequisicao = `REQUISITO A POLITEC, NOS TERMOS DO ARTIGO 159 E SEGUINTES DO CPP COMBINADO COM O ARTIGO 69, CAPUT DA LEI Nº 9.099/95, E ARTIGO 50, §1º DA LEI Nº 11.343/2006, A REALIZAÇÃO DE EXAME PERICIAL DEFINITIVO NA(S) SUBSTÂNCIA(S) APREENDIDA(S) E ACONDICIONADA(S) SOB O LACRE Nº ${lacreNumero}, ENCONTRADA(S) EM POSSE ${autorTextoFragment}, EM RAZÃO DE FATOS DE NATUREZA "PORTE ILEGAL DE DROGAS PARA CONSUMO", OCORRIDO(S) NA DATA DE ${dataFatoStr}.`.toUpperCase();
    
    yPos = addWrappedText(doc, yPos, textoRequisicao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 8;

    // << CORREÇÃO: Seção "APENSO" agora itera sobre o array 'data.drogas' para listar todas as substâncias. >>
    yPos = addWrappedText(doc, yPos, "APENSO:", MARGIN_LEFT, 12, "bold", MAX_LINE_WIDTH, 'left', data);
    yPos += 2;

    data.drogas.forEach((droga) => {
        const quantidadeNum = parseInt(droga.quantidade.match(/\d+/)?.[0] || "1", 10);
        const quantidadeTexto = numberToText(quantidadeNum);
        const porcaoText = quantidadeNum === 1 ? "PORÇÃO" : "PORÇÕES";
        
        let nomeDroga = "ENTORPECENTE";
        if (droga.isUnknownMaterial && droga.customMaterialDesc) {
            nomeDroga = droga.customMaterialDesc;
        } else if (droga.indicios) {
            nomeDroga = droga.indicios;
        }

        const textoApenso = `- ${quantidadeTexto} ${porcaoText} DE SUBSTÂNCIA ANÁLOGA A ${nomeDroga.toUpperCase()}.`.toUpperCase();
        yPos = addWrappedText(doc, yPos, textoApenso, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 2;
    });
    const textoLacre = `TODO O MATERIAL ENCONTRA-SE DEVIDAMENTE ACONDICIONADO SOB O LACRE Nº ${lacreNumero}.`.toUpperCase();
    yPos = addWrappedText(doc, yPos, textoLacre, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 8;

    // Adiciona os quesitos
    const textoQuesitos = `PARA TANTO, SOLICITO DE VOSSA SENHORIA, QUE SEJA CONFECCIONADO O RESPECTIVO LAUDO PERICIAL DEFINITIVO, DEVENDO OS PERITOS RESPONDEREM AOS QUESITOS, CONFORME ABAIXO:`.toUpperCase();
    yPos = addWrappedText(doc, yPos, textoQuesitos, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    const quesitos = [
        "A AMOSTRA APRESENTADA É CONSTITUÍDA POR SUBSTÂNCIA(S) ENTORPECENTE(S) OU DE USO PROSCRITO NO BRASIL?",
        "EM CASO POSITIVO, QUAL(IS) SUBSTÂNCIA(S)?",
        "QUAL O PESO LÍQUIDO TOTAL DA(S) AMOSTRA(S) APRESENTADA(S)?"
    ];

    quesitos.forEach((quesito, index) => {
        const textoQuesito = `${index + 1}. ${quesito}`.toUpperCase();
        yPos = addWrappedText(doc, yPos, textoQuesito, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 3;
    });
    
    yPos += 8;

    // Adiciona a localidade e data
    const cidadeTermo = (data.municipio || "VÁRZEA GRANDE").toUpperCase();
    const dataAtualFormatada = getCustomDataAtualExtenso();
    const dataLocal = `${cidadeTermo}-MT, ${dataAtualFormatada}.`;
    
    yPos = checkPageBreak(doc, yPos, 10, data);
    doc.text(dataLocal, PAGE_WIDTH - MARGIN_RIGHT, yPos, { align: 'right' });
    yPos += 15;

    // Adiciona a assinatura
    const nomeCondutorCompleto = (`${condutor?.posto || ""} ${condutor?.nome || ""}`.trim()).toUpperCase();
    yPos = checkPageBreak(doc, yPos, 20, data);
    const linhaAssinaturaWidth = 100;
    doc.setLineWidth(0.3);
    doc.line((PAGE_WIDTH - linhaAssinaturaWidth) / 2, yPos, (PAGE_WIDTH + linhaAssinaturaWidth) / 2, yPos);
    yPos += 5;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(nomeCondutorCompleto, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 4;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("CONDUTOR DA OCORRÊNCIA".toUpperCase(), PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 10;

    // Adiciona a tabela abaixo da assinatura
    const tableRowHeight = 10; 
    const tableHeaderFontSize = 10;
    const tableNumRows = 2;
    const tableNumCols = 3;

    yPos = checkPageBreak(doc, yPos, (tableNumRows * tableRowHeight) + 15, data);

    const tableTopY = yPos;
    const tableContentWidth = MAX_LINE_WIDTH;
    const colWidth = tableContentWidth / tableNumCols;
    const tableHeaders = ["DATA", "POLITEC", "ASSINATURA"];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(tableHeaderFontSize);
    doc.setLineWidth(0.3); 

    for (let j = 0; j < tableNumCols; j++) {
        const cellX = MARGIN_LEFT + j * colWidth;
        doc.rect(cellX, tableTopY, colWidth, tableRowHeight);
        doc.text(tableHeaders[j].toUpperCase(), cellX + colWidth / 2, tableTopY + tableRowHeight / 2, { align: 'center', baseline: 'middle' });
    }

    const secondRowY = tableTopY + tableRowHeight;
    for (let j = 0; j < tableNumCols; j++) {
        const cellX = MARGIN_LEFT + j * colWidth;
        doc.rect(cellX, secondRowY, colWidth, tableRowHeight);
    }
    
    yPos = secondRowY + tableRowHeight + 10;

    doc.setFont("helvetica", "normal"); 
    doc.setFontSize(12);

    return yPos;
};
