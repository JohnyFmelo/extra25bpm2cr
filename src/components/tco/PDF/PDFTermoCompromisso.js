
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addWrappedText, addSignatureWithNameAndRole, checkPageBreak,
    formatarDataSimples
} from './pdfUtils.js';

/** Adiciona Termo de Compromisso (em página nova) */
export const addTermoCompromisso = (doc, data) => {
    // Skip term for drug consumption cases or if no authors are present
    if (data.natureza === "Porte de drogas para consumo") {
        console.log("Caso de porte de drogas para consumo, pulando Termo de Compromisso.");
        return null;
    }
    
    const autores = data.autores?.filter(a => a?.nome && a.nome.trim() !== "");
    if (!autores || autores.length === 0) {
        console.warn("Nenhum autor com nome informado, pulando Termo de Compromisso.");
        return null;
    }

    let yPos;
    const condutor = data.componentesGuarnicao?.[0];
    
    // Gerar um termo para cada autor
    autores.forEach((autor, index) => {
        // Adicionar uma nova página para cada termo
        yPos = addNewPage(doc, data);
        const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
        
        doc.setFont("helvetica", "bold"); doc.setFontSize(12);
        yPos = checkPageBreak(doc, yPos, 15, data);
        doc.text(`TERMO DE COMPROMISSO DO(A) AUTOR(A) ${autor.nome.toUpperCase()}`, PAGE_WIDTH / 2, yPos, { align: "center" });
        yPos += 10;

        // Flexão de gênero para autor do fato
        const generoAutor = autor?.sexo?.toLowerCase() === 'feminino' ? 'a autora' : 'o autor';
        const generoAutorMaiusculo = autor?.sexo?.toLowerCase() === 'feminino' ? 'A AUTORA' : 'O AUTOR';

        yPos = addWrappedText(doc, yPos, `EU, ${generoAutorMaiusculo} ABAIXO ASSINADO(A), POR ESTE INSTRUMENTO ME COMPROMETO A:`, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'left', data);
        yPos += 5;

        const option1Text = `(X) COMPARECER PERANTE O JUIZADO ESPECIAL CRIMINAL, ESTANDO CIENTE DE QUE O NÃO COMPARECIMENTO IMPORTARÁ EM REVOGAÇÃO DOS BENEFÍCIOS CONCEDIDOS NESTE ATO E CONSEQUENTE EXPEDIÇÃO DE MANDADO DE PRISÃO.`;
        yPos = addWrappedText(doc, yPos, option1Text, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 5;

        // Aplicar a mesma lógica de data e hora da audiência
        const dataAudiencia = data.juizadoEspecialData ? formatarDataSimples(data.juizadoEspecialData) : "___/___/______";
        const horaAudiencia = data.juizadoEspecialHora || "__:__";
        
        const audienciaText = `ESTOU CIENTE DE QUE A AUDIENCIA OCORRERÁ NO DIA ${dataAudiencia}, ÀS ${horaAudiencia} HORAS, DAS DEPENDÊNCIAS DO JUIZADO ESPECIAL CRIMINAL DE VÁRZEA GRANDE NO BAIRRO CHAPÉU DO SOL, AVENIDA CHAPÉU DO SOL, S/N.`;
        yPos = addWrappedText(doc, yPos, audienciaText, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 5;

        const option2Text = `(X) NÃO AUSENTAR-ME DA COMARCA SEM AUTORIZAÇÃO JUDICIAL, SOB PENA DE REVOGAÇÃO DOS BENEFÍCIOS CONCEDIDOS NESTE ATO.`;
        yPos = addWrappedText(doc, yPos, option2Text, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 5;

        const option3Text = `(X) COMPARECER EM JUÍZO SEMPRE QUE FOR INTIMADO(A), SOB PENA DE REVOGAÇÃO DOS BENEFÍCIOS CONCEDIDOS NESTE ATO.`;
        yPos = addWrappedText(doc, yPos, option3Text, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 5;

        yPos = addSignatureWithNameAndRole(doc, yPos, autor.nome, generoAutorMaiusculo, data);
        const nomeCondutorCompr = `${condutor?.nome || ""} ${condutor?.posto || ""}`.trim();
        yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutorCompr, "CONDUTOR DA OCORRENCIA", data);
    });

    return yPos;
};
