
// If this file doesn't exist or needs to be created, I'll create a minimal version
import {
    MARGIN_LEFT, MARGIN_RIGHT, getPageConstants,
    addNewPage, addWrappedText, addSignatureWithNameAndRole, checkPageBreak
} from './pdfUtils.js';

/** Adiciona Histórico (em página nova) */
export const addHistorico = (doc, data, yPos) => {
    yPos = addNewPage(doc, data);
    const { PAGE_WIDTH, MAX_LINE_WIDTH } = getPageConstants(doc);
    const condutor = data.componentesGuarnicao?.[0];
    const autor = data.autores?.[0];
    
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    yPos = checkPageBreak(doc, yPos, 15, data);
    doc.text("HISTÓRICO", PAGE_WIDTH / 2, yPos, { align: "center" });
    yPos += 10;
    
    // Adiciona relato policial
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const relatoPolicial = data.relatoPolicial || "Relato policial não fornecido.";
    yPos = addWrappedText(doc, yPos, relatoPolicial, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
    yPos += 10;
    
    // Conclusão
    const conclusao = data.conclusaoPolicial || "";
    if (conclusao) {
        yPos = addWrappedText(doc, yPos, conclusao, MARGIN_LEFT, 12, "normal", MAX_LINE_WIDTH, 'justify', data);
        yPos += 10;
    }
    
    // Assinaturas
    const nomeCondutorComp = `${condutor?.posto || ""} ${condutor?.nome || ""}`.trim();
    yPos = addSignatureWithNameAndRole(doc, yPos, nomeCondutorComp, "CONDUTOR DA OCORRÊNCIA", data);
    
    return yPos;
};
