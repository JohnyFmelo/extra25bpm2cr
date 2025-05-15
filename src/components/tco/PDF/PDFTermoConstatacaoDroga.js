
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addWrappedText, addSignatureWithNameAndRole, checkPageBreak, formatarDataSimples
} from './pdfUtils.js';

/** Adiciona Termo de Constatação Preliminar de Droga (em página nova) */
export const addTermoConstatacaoDroga = (doc, data) => {
    let yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    const autor = data.autores?.[0];
    
    // Flexão de gênero para autor do fato
    const generoAutor = autor?.sexo?.toLowerCase() === 'feminino' ? 'AUTORA' : 'AUTOR';
    const pronomeAutor = autor?.sexo?.toLowerCase() === 'feminino' ? 'DA' : 'DO';

    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("TERMO DE CONSTATAÇÃO PRELIMINAR DE DROGA", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    const tipificacaoDroga = data.tipificacao || "PORTE DE DROGA PARA CONSUMO PESSOAL (ART. 28 DA LEI 11.343/06)";
    const textoIntro = `EM RAZÃO DA LAVRATURA DESTE TERMO CIRCUNSTANCIADO DE OCORRÊNCIA, PELO DELITO TIPIFICADO: ${tipificacaoDroga}, FOI APREENDIDO O MATERIAL DESCRITO ABAIXO, EM PODER ${pronomeAutor} ${generoAutor} ABAIXO ASSINADO JÁ QUALIFICAD${autor?.sexo?.toLowerCase() === 'feminino' ? 'A' : 'O'} NOS AUTOS. APÓS CIÊNCIA DAS IMPLICAÇÕES LEGAIS DO ENCARGO ASSUMIDO, FIRMOU-SE O COMPROMISSO LEGAL DE PROCEDER À ANÁLISE PRELIMINAR DOS SEGUINTES MATERIAIS:`;
    yPos = addWrappedText(doc, yPos, textoIntro, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Handle quantity and singular/plural
    const qtdeNum = parseInt(data.drogaQuantidade) || 1;
    const numberWords = ["ZERO", "UMA", "DUAS", "TRÊS", "QUATRO", "CINCO", "SEIS", "SETE", "OITO", "NOVE", "DEZ"];
    const qtdeText = qtdeNum <= 10 ? numberWords[qtdeNum] : qtdeNum.toString();
    const porcaoText = qtdeNum === 1 ? "PORÇÃO" : "PORÇÕES";
    
    const tipo = data.drogaTipo || "substância";
    const cor = data.drogaCor || "característica";
    const odor = data.drogaOdor || "característico";
    const nomeComum = data.drogaNomeComum || "entorpecente";

    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    doc.text("-", MARGIN_LEFT, yPos);
    const itemText = `${qtdeText} ${porcaoText} DE MAATERIAL ${tipo.toUpperCase()}, DE COR ${cor.toUpperCase()}, COM ODOR ${odor.toUpperCase()}, E CARACTERÍSTICAS SEMELHANTES AO ENTORPECENTE CONHECIDO COMO ${nomeComum.toUpperCase()}.`;
    yPos = addWrappedText(doc, yPos, itemText, MARGIN_LEFT + 4, 12, "normal", MAX_LINE_WIDTH - 4, 'left', data);
    yPos += 5;

    const textoConclusao = "O PRESENTE TERMO TEM POR OBJETIVO APENAS A CONSTATAÇÃO PRELIMINAR DA NATUREZA DA SUBSTÂNCIA PARA FINS DE LAVRATURA DO TERMO CIRCUNSTANCIADO, NOS TERMOS DA LEGISLAÇÃO VIGENTE (NOTADAMENTE ART. 50, §1º DA LEI 11.343/2006), NÃO SUPRINDO O EXAME PERICIAL DEFINITIVO. PARA A VERIFICAÇÃO PRELIMINAR, FOI REALIZADA ANÁLISE VISUAL E OLFATIVA DO MATERIAL.";
    yPos = addWrappedText(doc, yPos, textoConclusao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 10;

    // Format date as DD de MMMM de AAAA
    const meses = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = meses[hoje.getMonth()];
    const ano = hoje.getFullYear();
    const dataAtualFormatada = `${dia} DE ${mes} DE ${ano}`;
    
    const cidadeTermo = data.municipio || "VÁRZEA GRANDE";
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    const dateText = `${cidadeTermo.toUpperCase()}-MT, ${dataAtualFormatada}.`;
    yPos = checkPageBreak(doc, yPos, 10, data);
    doc.text(dateText, PAGE_WIDTH - MARGIN_RIGHT, yPos, { align: 'right' });
    yPos += 15;

    yPos = addSignatureWithNameAndRole(doc, yPos, autor?.nome, `${generoAutor} DOS FATOS`, data);
    const nomeCondutor = `${condutor?.nome || ""} ${condutor?.posto || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutor, "CONDUTOR DA OCORRÊNCIA", data);

    return yPos;
};
