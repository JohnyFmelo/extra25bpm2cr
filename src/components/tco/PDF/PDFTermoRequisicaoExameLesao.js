import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addWrappedText, addSignatureWithNameAndRole, checkPageBreak, formatarDataSimples
} from './pdfUtils.js';

/** Formata a data por extenso (ex.: "06 de maio de 2025") */
const formatarDataPorExtenso = (date) => {
    const meses = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            throw new Error("Data inválida");
        }
        const dia = d.getDate().toString().padStart(2, '0');
        const mes = meses[d.getMonth()];
        const ano = d.getFullYear();
        return `${dia} de ${mes} de ${ano}`;
    } catch (error) {
        console.warn("Erro ao formatar data por extenso:", error);
        return "Data inválida";
    }
};

/** Adiciona Requisição de Exame de Lesão Corporal (em página nova) */
export const addRequisicaoExameLesao = (doc, data) => {
    const periciado = data.periciadoNome;
    const sexo = data.sexo; // "MASCULINO", "FEMININO" ou undefined

    if (!periciado || !periciado.trim()) {
        console.warn("Nenhum periciadoNome válido fornecido. Pulando Requisição de Exame de Lesão.");
        return null;
    }

    // Define o pronome com base no sexo
    const pronome = sexo === "MASCULINO" ? "NO SR." : sexo === "FEMININO" ? "NA SRA." : "NO(A) SR.(A)";

    let yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    const naturezaLesao = data.lesaoNatureza || data.natureza || "A APURAR";
    const dataOcorrencia = formatarDataSimples(data.dataFato);

    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("REQUISIÇÃO DE EXAME DE LESÃO CORPORAL", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    const textoRequisicao = `REQUISITO A POLITEC - PERÍCIA OFICIAL E IDENTIFICAÇÃO TÉCNICA, NOS TERMOS DOS ARTIGOS 158 E SEGUINTES DO CÓDIGO DE PROCESSO PENAL E ARTIGO 69, CAPUT, DA LEI Nº 9.099/1995, A REALIZAÇÃO DE EXAME DE CORPO DE DELITO ${pronome} ${periciado.toUpperCase()}, QUALIFICADO(A) NO TERMO CIRCUNSTANCIADO DE OCORRÊNCIA EM REFERÊNCIA, EM RAZÃO DE FATOS DE NATUREZA "${naturezaLesao.toUpperCase()}", OCORRIDOS NA DATA ${dataOcorrencia}. PARA TANTO, SOLICITO QUE SEJA RESPONDIDO AOS QUESITOS OFICIAIS, CONFORME LEGISLAÇÃO PERTINENTE (ART. 159, § 3º CPP E PORTARIAS DA POLITEC):`;
    yPos = addWrappedText(doc, yPos, textoRequisicao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 8;

    const quesitos = [
        "1. Houve ofensa à integridade corporal ou à saúde do(a) periciando(a)?",
        "2. Em caso afirmativo, qual o instrumento ou meio que a produziu?",
        "3. A ofensa foi produzida com emprego de veneno, fogo, explosivo, asfixia, tortura ou outro meio insidioso ou cruel, ou de que podia resultar perigo comum?",
        "4. Resultou incapacidade para as ocupações habituais por mais de 30 (trinta) dias?",
        "5. Resultou perigo de vida?",
        "6. Resultou debilidade permanente de membro, sentido ou função?",
        "7. Resultou incapacidade permanente para o trabalho?",
        "8. Resultou enfermidade incurável?",
        "9. Resultou perda ou inutilização de membro, sentido ou função?",
        "10. Resultou deformidade permanente?",
        "11. Resultou aborto?"
    ];

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    quesitos.forEach(q => {
        yPos = addWrappedText(doc, yPos, q, MARGIN_LEFT, 10, "normal", MAX_LINE_WIDTH, 'left', data);
        yPos += 1.5;
    });
    yPos += 8;

    // Usa dataTerminoRegistro ou a data atual como fallback
    const dataRegistro = data.dataTerminoRegistro || new Date();
    const dataAtualFormatada = formatarDataPorExtenso(dataRegistro);
    const cidadeReq = data.municipio || "VÁRZEA GRANDE";
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    const dateText = `${cidadeReq.toUpperCase()}-MT, ${dataAtualFormatada}.`;
    yPos = checkPageBreak(doc, yPos, 10, data);
    doc.text(dateText, PAGE_WIDTH - MARGIN_RIGHT, yPos, { align: 'right' });
    yPos += 15;

    yPos = addSignatureWithNameAndRole(doc, yPos, periciado.toUpperCase(), "PERICIADO(A)", data);
    const nomeCondutor = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutor, "CONDUTOR DA OCORRÊNCIA / REQUISITANTE", data);

    return yPos;
};
