// src/components/tco/PDF/PDFtermos.js
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addWrappedText, addSignatureWithNameAndRole, addField,
    checkPageBreak, formatarDataHora, formatarDataSimples, getDataAtualExtenso
} from './pdfUtils.js'; // <-- Caminho local correto

/** Adiciona Termo de Compromisso de Comparecimento (em página nova) */
export const addTermoCompromisso = (doc, data) => {
    let yPos = addNewPage(doc, data); // Começa nova página, retorna yPos inicial
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc); // Pega constantes
    const condutor = data.componentesGuarnicao?.[0];
    const autor = data.autores?.[0];

    // Título Centralizado
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data); // Verifica espaço para o título
    doc.text("TERMO DE COMPROMISSO DE COMPARECIMENTO", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10; // Espaço após título

    // Texto do Termo
    const termoCompText = "POR ESTE INSTRUMENTO, EU, AUTOR DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, ASSUMO, NOS TERMOS DO PARÁGRAFO ÚNICO DO ART. 69 DA LEI Nº 9.099/95, O COMPROMISSO DE COMPARECER NO JUIZADO ESPECIAL CRIMINAL QUANDO CONVOCADO, EM VIRTUDE DOS FATOS REGISTRADOS NO TERMO CIRCUNSTANCIADO DE OCORRÊNCIA ACIMA REFERENCIADO, CONFORME NOTIFICADO ABAIXO. FICO CIENTE DE QUE, A CONCORDÂNCIA EM COMPARECER AO JUIZADO ESPECIAL CRIMINAL NÃO IMPLICA CONFISSÃO DE QUALQUER NATUREZA, ADMISSÃO DE CULPA OU ANUÊNCIA ÀS DECLARAÇÕES DA PARTE CONTRÁRIA E QUE O NÃO COMPARECIMENTO NO DIA E HORA AJUSTADOS NESTE TERMO SUJEITARÁ ÀS MEDIDAS PREVISTAS NA LEI Nº 9.099/95. FICO CIENTE, TAMBÉM, QUE DEVEREI COMPARECER ACOMPANHADO DE ADVOGADO E QUE NA AUSÊNCIA DESTE SERÁ NOMEADO UM DEFENSOR PÚBLICO.";
    yPos = addWrappedText(doc, yPos, termoCompText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5; // Espaço antes das assinaturas

    // Assinaturas
    yPos = addSignatureWithNameAndRole(doc, yPos, autor?.nome, "AUTOR DO FATO", data);
    const nomeCondutorComp = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutorComp, "CONDUTOR DA OCORRENCIA", data);

    return yPos; // Retorna a posição Y final (embora geralmente não usada, pois é a última coisa na página)
};

/** Adiciona Termo de Manifestação da Vítima (em página nova) */
export const addTermoManifestacao = (doc, data) => {
    // Verifica se existe alguma vítima válida antes de criar a página
    const vitima = data.vitimas?.find(v => v?.nome); // Encontra a primeira vítima com nome
    if (!vitima) {
        console.warn("Nenhuma vítima com nome informado, pulando Termo de Manifestação.");
        // Se não há vítima, não adiciona a página nem o termo.
        // Retornar um valor aqui não faria sentido pois a página não foi adicionada.
        // O fluxo principal em pdfGenerator simplesmente não chamará nada que dependa dessa yPos.
        return null; // Indica que nada foi feito
    }

    let yPos = addNewPage(doc, data); // Começa nova página SE houver vítima
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];

    // Título Centralizado
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data); // Verifica espaço
    doc.text("TERMO DE MANIFESTAÇÃO DA VÍTIMA", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    // Texto Introdutório
    yPos = addWrappedText(doc, yPos, "EU, VÍTIMA ABAIXO ASSINADA, POR ESTE INSTRUMENTO MANIFESTO O MEU INTERESSE EM:", MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
    yPos += 5;

    // Opções de Manifestação
    // O valor de data.representacao deve ser 'representar' ou 'decidir_posteriormente'
    let manifestacaoOption1 = '(   )';
    let manifestacaoOption2 = '(   )';
    if (data.representacao === 'representar') {
        manifestacaoOption1 = '( X )';
    } else if (data.representacao === 'decidir_posteriormente') {
        manifestacaoOption2 = '( X )';
    } else {
        console.warn("Opção 'representacao' não definida ou inválida nos dados. Ambas as opções ficarão desmarcadas.");
    }

    // Opção 1
    const option1Text = `${manifestacaoOption1} EXERCER O DIREITO DE REPRESENTAÇÃO OU QUEIXA CONTRA O AUTOR DO FATO, JÁ QUALIFICADO NESTE TCO/PM (FICA CIENTIFICADA QUE EM CASO DE QUEIXA-CRIME, A VÍTIMA DEVERÁ CONSTITUIR ADVOGADO).`;
    yPos = addWrappedText(doc, yPos, option1Text, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Opção 2
    const option2Text = `${manifestacaoOption2} DECIDIR POSTERIORMENTE, ESTANDO CIENTE, PARA OS FINS PREVISTOS NO ART. 103 DO CÓDIGO PENAL E ART. 38 CÓDIGO DE PROCESSO PENAL QUE DEVO EXERCER O DIREITO DE REPRESENTAÇÃO OU DE QUEIXA, NO PRAZO DE 06 (SEIS) MESES, A CONTAR DESTA DATA, SENDO CERTO QUE MEU SILÊNCIO, ACARRETARÁ A EXTINÇÃO DE PUNIBILIDADE, NA FORMA DO ART. 107, INC. IV, DO CÓDIGO PENAL.`;
    yPos = addWrappedText(doc, yPos, option2Text, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Assinaturas
    yPos = addSignatureWithNameAndRole(doc, yPos, vitima?.nome, "VÍTIMA", data);
    const nomeCondutorManif = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutorManif, "CONDUTOR DA OCORRENCIA", data);

    return yPos; // Retorna a posição Y final
};

/** Adiciona Termo de Apreensão (em página nova) */
export const addTermoApreensao = (doc, data) => {
    // Condição para gerar já está no pdfGenerator.js, aqui só criamos o conteúdo.
    let yPos = addNewPage(doc, data); // Começa nova página
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    // Assume que a apreensão é vinculada ao primeiro autor, se existir
    const autor = data.autores?.[0];

    // Título Centralizado
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("TERMO DE APREENSÃO", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    // Dados do Policial (Condutor da Ocorrência) e Local
    const dataHoraApreensao = formatarDataHora(data.dataFato, data.horaFato); // Usa data/hora do fato
    yPos = addField(doc, yPos, "DATA/HORA:", dataHoraApreensao, data);
    yPos = addField(doc, yPos, "NOME DO POLICIAL MILITAR:", condutor?.nome, data);
    yPos = addField(doc, yPos, "FILIAÇÃO - PAI:", data.policialPai || condutor?.pai || "Não informado", data); // Permite override ou usa do condutor
    yPos = addField(doc, yPos, "FILIAÇÃO - MÃE:", data.policialMae || condutor?.mae || "Não informado", data);
    yPos = addField(doc, yPos, "NATURALIDADE:", data.policialNaturalidade || condutor?.naturalidade || "Não informado", data);
    yPos = addField(doc, yPos, "RG:", data.policialRg || condutor?.rg, data);
    yPos = addField(doc, yPos, "CPF:", data.policialCpf || condutor?.cpf || "Não informado", data);
    yPos = addField(doc, yPos, "TELEFONE:", data.policialTelefone || condutor?.celular || "Não informado", data);
    // Local e Endereço Fixo do Batalhão (ou pode ser pego dos dados se variável)
    yPos = addField(doc, yPos, "LOCAL:", "25º BPM/2° CR – VÁRZEA GRANDE/MT", data);
    yPos = addField(doc, yPos, "ENDEREÇO:", "AV. DR. PARANÁ, S/N° COMPLEXO DA UNIVAG, AO LADO DO NÚCLEO DE PRATICA JURÍDICA. BAIRRO CRISTO REI CEP 78.110-100, VÁRZEA GRANDE - MT", data);
    yPos += 2; // Espaço após dados

    // Descrição da Apreensão
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    const textoApreensao = `FICA APREENDIDO(A): ${data.apreensaoDescricao || data.apreensoes || "Nenhum objeto/documento descrito para apreensão."}`; // Usa descrição ou lista
    yPos = addWrappedText(doc, yPos, textoApreensao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Base Legal
    const textoLegal = "O PRESENTE TERMO DE APREENSÃO FOI LAVRADO COM BASE NO ART. 6º, II, DO CÓDIGO DE PROCESSO PENAL, E ART. 92 DA LEI 9.099/1995.";
    yPos = addWrappedText(doc, yPos, textoLegal, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 10; // Espaço antes das assinaturas

    // Assinaturas (Autor e Condutor)
    yPos = addSignatureWithNameAndRole(doc, yPos, autor?.nome, "AUTOR DOS FATOS", data);
    const nomeCondutor = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutor, "CONDUTOR DA OCORRÊNCIA", data);

    return yPos;
};

/** Adiciona Termo de Constatação Preliminar de Droga (em página nova) */
export const addTermoConstatacaoDroga = (doc, data) => {
    // Condição para gerar já está no pdfGenerator.js
    let yPos = addNewPage(doc, data); // Começa nova página
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    // Assume que a droga estava com o primeiro autor
    const autor = data.autores?.[0];

    // Título Centralizado
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("TERMO DE CONSTATAÇÃO PRELIMINAR DE DROGA", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    // Texto Introdutório
    const tipificacaoDroga = data.tipificacao || "PORTE DE DROGA PARA CONSUMO PESSOAL (ART. 28 DA LEI 11.343/06)"; // Default se não informado
    const textoIntro = `EM RAZÃO DA LAVRATURA DESTE TERMO CIRCUNSTANCIADO DE OCORRÊNCIA, PELO(S) DELITO(S) TIPIFICADO(S): ${tipificacaoDroga}, FOI APREENDIDO O MATERIAL DESCRITO ABAIXO, EM PODER DO AUTOR ABAIXO ASSINADO JÁ QUALIFICADO NOS AUTOS. APÓS CIÊNCIA DAS IMPLICAÇÕES LEGAIS DO ENCARGO ASSUMIDO, FIRMOU-SE O COMPROMISSO LEGAL DE PROCEDER À ANÁLISE PRELIMINAR DOS SEGUINTES MATERIAIS:`;
    yPos = addWrappedText(doc, yPos, textoIntro, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 5;

    // Descrição da Droga
    const qtde = data.drogaQuantidade || "01 (UMA)"; // Padrão
    const tipo = data.drogaTipo || "substância"; // Padrão genérico
    const cor = data.drogaCor || "característica";
    const odor = data.drogaOdor || "característico";
    const nomeComum = data.drogaNomeComum || "entorpecente"; // Padrão genérico

    yPos = checkPageBreak(doc, yPos, 15, data); // Espaço para o item da droga
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    doc.text("-", MARGIN_LEFT, yPos); // Marcador do item
    // Texto descritivo do item
    const itemText = `${qtde.toUpperCase()} PORÇÃO(ÕES) DE ${tipo.toUpperCase()}, DE COR ${cor.toUpperCase()}, COM ODOR ${odor.toUpperCase()}, COM CARACTERÍSTICAS SEMELHANTES AO ENTORPECENTE CONHECIDO COMO ${nomeComum.toUpperCase()}.`;
    // Adiciona o texto do item indentado após o marcador
    yPos = addWrappedText(doc, yPos, itemText, MARGIN_LEFT + 4, 12, "normal", MAX_LINE_WIDTH - 4, 'left', data);
    yPos += 5;

    // Texto Conclusivo (Avaliação preliminar)
    const textoConclusao = "O PRESENTE TERMO TEM POR OBJETIVO APENAS A CONSTATAÇÃO PRELIMINAR DA NATUREZA DA SUBSTÂNCIA PARA FINS DE LAVRATURA DO TERMO CIRCUNSTANCIADO, NOS TERMOS DA LEGISLAÇÃO VIGENTE (NOTADAMENTE ART. 50, §1º DA LEI 11.343/2006), NÃO SUPRINDO O EXAME PERICIAL DEFINITIVO. PARA A VERIFICAÇÃO PRELIMINAR, FOI REALIZADA ANÁLISE VISUAL E OLFATIVA DO MATERIAL.";
    yPos = addWrappedText(doc, yPos, textoConclusao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 10; // Espaço antes da data

    // Data da Lavratura do Termo (Data Atual)
    const dataAtualFormatada = formatarDataSimples(new Date());
    const cidadeTermo = data.municipio || "VÁRZEA GRANDE"; // Usa município TCO ou padrão
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    const dateText = `${cidadeTermo.toUpperCase()}-MT, ${dataAtualFormatada}.`;
    yPos = checkPageBreak(doc, yPos, 10, data); // Verifica espaço antes da data
    // Alinha data à direita
    doc.text(dateText, PAGE_WIDTH - MARGIN_RIGHT, yPos, { align: 'right' });
    yPos += 15; // Espaço antes das assinaturas

    // Assinaturas (Autor e Condutor)
    yPos = addSignatureWithNameAndRole(doc, yPos, autor?.nome, "AUTOR DOS FATOS", data);
    const nomeCondutor = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutor, "CONDUTOR DA OCORRÊNCIA", data);

    return yPos;
};

/** Adiciona Requisição de Exame de Lesão Corporal (em página nova) */
export const addRequisicaoExameLesao = (doc, data) => {
    // Verifica se há alguém para ser periciado
    const periciado = data.periciadoNome // Prioriza nome explícito
                     || data.vitimas?.find(v => v?.nome)?.nome // Senão, pega a primeira vítima com nome
                     || data.autores?.find(a => a?.nome)?.nome; // Senão, pega o primeiro autor com nome

    if (!periciado) {
        console.warn("Nenhuma pessoa identificada para perícia (periciadoNome, vítima ou autor). Pulando Requisição de Exame de Lesão.");
        return null; // Não gera a página
    }

    let yPos = addNewPage(doc, data); // Começa nova página
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    // Usa a natureza específica da lesão OU a natureza geral da ocorrência
     const naturezaLesao = data.lesaoNatureza || data.natureza || "A APURAR";
     const dataOcorrencia = formatarDataSimples(data.dataFato); // Data do fato

    // Título Centralizado
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("REQUISIÇÃO DE EXAME DE LESÃO CORPORAL", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    // Texto da Requisição (Com dados dinâmicos)
    const textoRequisicao = `REQUISITO A POLITEC - PERÍCIA OFICIAL E IDENTIFICAÇÃO TÉCNICA, NOS TERMOS DOS ARTIGOS 158 E SEGUINTES DO CÓDIGO DE PROCESSO PENAL E ARTIGO 69, CAPUT, DA LEI Nº 9.099/1995, A REALIZAÇÃO DE EXAME DE CORPO DE DELITO NO(A) SR.(A) ${periciado.toUpperCase()}, QUALIFICADO(A) NO TERMO CIRCUNSTANCIADO DE OCORRÊNCIA EM REFERÊNCIA, EM RAZÃO DE FATOS DE NATUREZA "${naturezaLesao.toUpperCase()}", OCORRIDOS NA DATA ${dataOcorrencia}. PARA TANTO, SOLICITO QUE SEJA RESPONDIDO AOS QUESITOS OFICIAIS, CONFORME LEGISLAÇÃO PERTINENTE (ART. 159, § 3º CPP E PORTARIAS DA POLITEC):`;
    yPos = addWrappedText(doc, yPos, textoRequisicao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 8; // Espaço antes dos quesitos

    // Quesitos (Exemplo padrão - pode precisar de ajuste conforme normas locais)
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

    doc.setFont("helvetica", "normal"); doc.setFontSize(10); // Fonte menor para quesitos
    quesitos.forEach(q => {
        // Usa addWrappedText para cada quesito para garantir quebra de linha se for longo
        yPos = addWrappedText(doc, yPos, q, MARGIN_LEFT, 10, "normal", MAX_LINE_WIDTH, 'left', data);
        yPos += 1.5; // Espaço menor entre quesitos
    });
    yPos += 8; // Espaço maior após os quesitos

    // Data da Requisição (Data Atual)
    const dataAtualFormatada = formatarDataSimples(new Date());
    const cidadeReq = data.municipio || "VÁRZEA GRANDE"; // Usa município TCO ou padrão
    doc.setFont("helvetica", "normal"); doc.setFontSize(12); // Volta para fonte 12
    const dateText = `${cidadeReq.toUpperCase()}-MT, ${dataAtualFormatada}.`;
    yPos = checkPageBreak(doc, yPos, 10, data); // Verifica espaço
    // Alinha data à direita
    doc.text(dateText, PAGE_WIDTH - MARGIN_RIGHT, yPos, { align: 'right' });
    yPos += 15; // Espaço antes das assinaturas

    // Assinaturas (Periciado e Condutor)
    yPos = addSignatureWithNameAndRole(doc, yPos, periciado.toUpperCase(), "PERICIADO(A)", data);
    const nomeCondutor = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutor, "CONDUTOR DA OCORRÊNCIA / REQUISITANTE", data); // Ajusta o cargo

    return yPos;
};

/** Adiciona Termo de Encerramento e Remessa (em página nova) */
export const addTermoEncerramentoRemessa = (doc, data) => {
    // Sempre adicionado ao final, começa nova página
    let yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    // Pega o primeiro autor, se existir, para mencionar no texto
    const autor = data.autores?.[0];

    // Dados para o texto
    const dataEncerramentoExtenso = getDataAtualExtenso(); // Data atual por extenso
    const cidadeEncerramento = data.municipio || "VÁRZEA GRANDE"; // Município TCO ou padrão
    // Local padrão, pode ser sobrescrito se data.localEncerramento for fornecido
    const local = data.localEncerramento || "NO QUARTEL DO 25º BATALHÃO DE POLÍCIA MILITAR 2º COMANDO REGIONAL";
    const year = new Date().getFullYear(); // Ano atual
    // Referência TCO, usa número dos dados ou padrão 'INDEFINIDO'
    const tcoRef = data.tcoRefEncerramento || `Nº ${data.tcoNumber || 'INDEFINIDO'}/25ºBPM/2ºCR/${year}`;
    // Nome do autor ou placeholder
    const nomeAutorMencao = autor?.nome ? `do(a) Sr(a). ${autor.nome.toUpperCase()}` : "do(a) envolvido(a) qualificado(a) nos autos";

    // Título Centralizado
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("TERMO DE ENCERRAMENTO E REMESSA", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;

    // Texto do Encerramento (Justificado)
    const textoEncerramento = `${dataEncerramentoExtenso}, nesta cidade de ${cidadeEncerramento.toUpperCase()}, ESTADO DE MATO GROSSO, ${local.toUpperCase()}, por determinação da Autoridade Policial Militar signatária deste TCO, dou por encerrada a lavratura do presente Termo Circunstanciado de Ocorrência ${tcoRef}, instaurado em desfavor ${nomeAutorMencao}, para as providências de remessa dos autos ao Poder Judiciário competente (Juizado Especial Criminal ou Vara competente conforme o caso), por meio eletrônico ou físico conforme normativas vigentes, a quem compete deliberar sobre o fato delituoso noticiado.`;

    yPos = addWrappedText(doc, yPos, textoEncerramento, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 15; // Espaço antes da assinatura final

    // Assinatura do Condutor da Ocorrência (que lavrou o termo)
    const nomeCondutor = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutor, "POLICIAL MILITAR RESPONSÁVEL PELA LAVRATURA", data); // Cargo mais descritivo

    return yPos;
};
