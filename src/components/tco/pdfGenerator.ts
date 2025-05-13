import jsPDF from "jspdf";
import {
  MARGIN_TOP,
  MARGIN_BOTTOM,
  MARGIN_RIGHT,
  getPageConstants,
  addNewPage,
  addStandardFooterContent,
} from './PDF/pdfUtils.js';
import { generateAutuacaoPage } from './PDF/PDFautuacao.js';
import { generateHistoricoContent } from './PDF/PDFhistorico.js';
import { addTermoCompromisso } from './PDF/PDFTermoCompromisso.js';
import { addTermoManifestacao } from './PDF/PDFTermoManifestacao.js';
import { addTermoApreensao } from './PDF/PDFTermoApreensao.js';
import { addTermoConstatacaoDroga } from './PDF/PDFTermoConstatacaoDroga.js';
import { addRequisicaoExameLesao } from './PDF/PDFTermoRequisicaoExameLesao.js';
import { addTermoEncerramentoRemessa } from './PDF/PDFTermoEncerramentoRemessa.js';
import { addTermoCadeiaCustodia } from './PDF/PDFcadeiadecustodia.js'; // Import the updated function

const addImagesToPDF = (doc: jsPDF, yPosition: number, images: { name: string; data: string }[], pageWidth: number, pageHeight: number) => {
  const maxImageWidth = pageWidth - MARGIN_RIGHT * 2;
  const maxImageHeight = 100;
  const marginBetweenImages = 10;
  let currentY = yPosition;

  for (const image of images) {
    try {
      const formatMatch = image.data.match(/^data:image\/(jpeg|png);base64,/);
      const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG';
      const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '');

      if (currentY + maxImageHeight + MARGIN_BOTTOM > pageHeight) {
        currentY = addNewPage(doc, {});
        currentY = MARGIN_TOP;
      }

      doc.addImage(base64Data, format, MARGIN_RIGHT, currentY, maxImageWidth, 0);
      const imgProps = doc.getImageProperties(base64Data);
      const imgHeight = (imgProps.height * maxImageWidth) / imgProps.width;

      currentY += imgHeight + marginBetweenImages;
      doc.setFontSize(8);
      doc.text(`Imagem: ${image.name}`, MARGIN_RIGHT, currentY);
      currentY += 5;
    } catch (error) {
      console.error(`Erro ao adicionar imagem ${image.name}:`, error);
    }
  }

  return currentY;
};

export const generatePDF = async (inputData: any): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Tempo limite excedido ao gerar PDF. Por favor, tente novamente."));
    }, 60000);

    try {
      if (!inputData || typeof inputData !== 'object' || Object.keys(inputData).length === 0) {
        clearTimeout(timeout);
        reject(new Error("Dados inválidos para gerar o PDF."));
        return;
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const data = { ...inputData };
      const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc);
      let yPosition;

      yPosition = generateAutuacaoPage(doc, MARGIN_TOP, data);
      yPosition = addNewPage(doc, data);

      generateHistoricoContent(doc, yPosition, data)
        .then(() => {
          if (data.autores && data.autores.length > 0) {
            addTermoCompromisso(doc, data);
          } else {
            console.warn("Nenhum autor informado, pulando Termo de Compromisso.");
          }

          if (data.natureza !== "Porte de drogas para consumo") {
            addTermoManifestacao(doc, data);
          } else {
            console.log("Caso de droga detectado, pulando Termo de Manifestação da Vítima.");
          }

          if (data.apreensaoDescrição || data.apreensoes) {
            addTermoApreensao(doc, data);
          }

          if (data.drogaTipo || data.drogaNomeComum) {
            addTermoConstatacaoDroga(doc, data);
            addTermoCadeiaCustodia(doc, data); // Add the updated Termo de Cadeia de Custódia
          }

          const pessoasComLaudo = [
            ...(data.autores || []).filter(a => a.laudoPericial === "Sim").map(a => ({ nome: a.nome, sexo: a.sexo, tipo: "Autor" })),
            ...(data.vitimas || []).filter(v => v.laudoPericial === "Sim").map(v => ({ nome: v.nome, sexo: v.sexo, tipo: "Vítima" }))
          ].filter(p => p.nome && p.nome.trim());

          if (pessoasComLaudo.length > 0) {
            pessoasComLaudo.forEach(pessoa => {
              console.log(`Gerando Requisição de Exame de Lesão para: ${pessoa.nome} (${pessoa.tipo}, Sexo: ${pessoa.sexo || 'Não especificado'})`);
              addRequisicaoExameLesao(doc, { ...data, periciadoNome: pessoa.nome, sexo: pessoa.sexo });
            });
          } else {
            console.log("Nenhum autor ou vítima com laudoPericial: 'Sim'. Pulando Requisição de Exame de Lesão.");
          }

          addTermoEncerramentoRemessa(doc, data);

          const pageCount = doc.internal.pages.length - 1;
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - MARGIN_BOTTOM + 5, { align: "right" });

            if (i > 1) {
              addStandardFooterContent(doc);
            }
          }

          if (data.downloadLocal) {
            try {
              const tcoNumParaNome = data.tcoNumber || 'SEM_NUMERO';
              const dateStr = new Date().toISOString().slice(0, 10);
              const fileName = `TCO_${tcoNumParaNome}_${dateStr}.pdf`;
              doc.save(fileName);
              console.log(`PDF salvo localmente: ${fileName}`);
            } catch (downloadError) {
              console.error("Erro ao salvar o PDF localmente:", downloadError);
            }
          }

          const pdfBlob = doc.output('blob');
          clearTimeout(timeout);
          resolve(pdfBlob);
        })
        .catch(histError => {
          clearTimeout(timeout);
          reject(new Error(`Erro ao gerar histórico do PDF: ${histError.message}`));
        });
    } catch (error) {
      clearTimeout(timeout);
      reject(new Error(`Erro na geração do PDF: ${error.message}`));
    }
  });
};
