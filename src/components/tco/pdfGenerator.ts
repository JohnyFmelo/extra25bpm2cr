
import { jsPDF } from "jspdf";
import { PDFautuacao } from "./PDF/PDFautuacao";
import { PDFhistorico } from "./PDF/PDFhistorico";
import { PDFTermoManifestacao } from "./PDF/PDFTermoManifestacao";
import { PDFTermoCompromisso } from "./PDF/PDFTermoCompromisso";
import { PDFTermoEncerramentoRemessa } from "./PDF/PDFTermoEncerramentoRemessa";
import { PDFTermoRequisicaoExameLesao } from "./PDF/PDFTermoRequisicaoExameLesao";
import { PDFTermoApreensao } from "./PDF/PDFTermoApreensao";
import { PDFTermoConstatacaoDroga } from "./PDF/PDFTermoConstatacaoDroga";

/**
 * Gera o PDF do Termo Circunstanciado de Ocorrência com todos os anexos
 * @param data Dados do TCO
 */
export const generatePDF = (data) => {
  console.log("Iniciando geração do PDF:", { data });

  try {
    // Cria um novo documento PDF com orientação retrato
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Definir margens padrão
    const margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    };

    // Cabeçalho e rodapé
    let pageNumber = 1;
    
    // Página de Autuação
    PDFautuacao(doc, data, margin, pageNumber++);
    doc.addPage();
    
    // Página de Histórico
    PDFhistorico(doc, data, margin, pageNumber++);
    doc.addPage();
    
    // Se não for caso de drogas e tiver vítimas, gera o Termo de Manifestação
    if (data.natureza !== "Porte de drogas para consumo" && data.vitimas && data.vitimas.length > 0) {
      PDFTermoManifestacao(doc, data, margin, pageNumber++);
      doc.addPage();
    }
    
    // Termo de Compromisso
    PDFTermoCompromisso(doc, data, margin, pageNumber++);
    doc.addPage();
    
    // Se houve apreensão de objetos/materiais (incluindo drogas)
    if (data.natureza === "Porte de drogas para consumo" || (data.apreensoes && data.apreensoes.trim().length > 0)) {
      PDFTermoApreensao(doc, data, margin, pageNumber++);
      doc.addPage();
      
      // Se for caso de drogas, gera o Termo de Constatação
      if (data.natureza === "Porte de drogas para consumo") {
        PDFTermoConstatacaoDroga(doc, data, margin, pageNumber++);
        doc.addPage();
      }
    }
    
    // Se tiver vítima com laudo pericial "Sim"
    if (data.vitimas && data.vitimas.some(v => v.laudoPericial === "Sim")) {
      PDFTermoRequisicaoExameLesao(doc, data, margin, pageNumber++);
      doc.addPage();
    }
    
    // Termo de Encerramento e Remessa
    PDFTermoEncerramentoRemessa(doc, data, margin, pageNumber);
    
    // Remove a última página em branco
    if (doc.getNumberOfPages() > pageNumber) {
      doc.deletePage(doc.getNumberOfPages());
    }
    
    // Salva o PDF com o nome contendo o número do TCO
    const fileName = `TCO-${data.tcoNumber.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    
    console.log("PDF gerado com sucesso:", fileName);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw new Error(`Erro ao gerar PDF: ${error.message}`);
  }
};
