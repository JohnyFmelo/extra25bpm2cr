import jsPDF from "jspdf";
import {
  MARGIN_TOP,
  MARGIN_RIGHT,
  MARGIN_LEFT,
  getPageConstants,
  addNewPage,
  addStandardHeaderContent,
  addStandardFooterContent,
} from "./pdfUtils";

// Função para adicionar o Termo de Cadeia de Custódia ao PDF
export const addTermoCadeiaCustodia = (doc: jsPDF, data: any): void => {
  const { PAGE_WIDTH, PAGE_HEIGHT } = getPageConstants(doc);
  let yPosition = MARGIN_TOP;

  // Adiciona uma nova página para o Termo de Cadeia de Custódia
  yPosition = addNewPage(doc, data);

  // Adiciona o cabeçalho padrão
  yPosition = addStandardHeaderContent(doc, yPosition, data);

  // Título do Termo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const title = "REQUISIÇÃO DE EXAME EM DROGAS DE ABUSO";
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (PAGE_WIDTH - titleWidth) / 2, yPosition);
  yPosition += 10;

  // Corpo do documento
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const maxWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  // Texto introdutório baseado no modelo
  const introText = [
    "Requisto à POLITEC, nos termos do Artigo 159 e seus seguintes do CPP combinado com o Artigo 69, Caput da Lei nº 9.99/95, combinado com o Artigo 48 parágrafo 2 e artigo 50 parágrafo 1º da Lei nº 11.343/2006, solicito a realização de exame químico na substância análoga a entorpecente apreendida sob Lacre nº " +
      (data.lacreNumero || "[NÚMERO DO LACRE NÃO INFORMADO]") +
      ", encontrado em posse do sr., autor do fato " +
      (data.autores?.[0]?.nome || "[NOME DO AUTOR]") +
      ", qualificado neste TCO, de natureza porte legal de drogas, ocorrido na data de " +
      (data.dataFato ? new Date(data.dataFato + "T00:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "[DATA]") +
      ".",
    "Apenso: - 02 (DUAS) PORÇÃO(ÕES) DE SUBSTÂNCIA ANÁLOGA A MACONHA.",
  ];

  introText.forEach((line) => {
    if (yPosition + 10 > PAGE_HEIGHT - 20) {
      yPosition = addNewPage(doc, data);
      yPosition = addStandardHeaderContent(doc, yPosition, data);
    }
    const wrappedText = doc.splitTextToSize(line, maxWidth);
    doc.text(wrappedText, MARGIN_LEFT, yPosition);
    yPosition += wrappedText.length * 5 + 3;
  });

  // Solicitação de laudo pericial
  yPosition += 5;
  const requestText = "Para tanto, solicito de Vossa Senhoria, que seja confeccionado o respectivo Laudo Pericial definitivo, devendo os peritos responderem aos quesitos, conforme abaixo:";
  const wrappedRequest = doc.splitTextToSize(requestText, maxWidth);
  doc.text(wrappedRequest, MARGIN_LEFT, yPosition);
  yPosition += wrappedRequest.length * 5 + 5;

  // Quesitos
  const quesitos = [
    "1. Qual a natureza e características das substâncias enviadas a exame?",
    "2. Podem as mesmas causar dependência física/psíquicas?",
    "3. Qual o peso das substâncias enviadas a exame?",
  ];

  quesitos.forEach((quesito) => {
    if (yPosition + 10 > PAGE_HEIGHT - 20) {
      yPosition = addNewPage(doc, data);
      yPosition = addStandardHeaderContent(doc, yPosition, data);
    }
    doc.text(quesito, MARGIN_LEFT + 10, yPosition); // Indentação para quesitos
    yPosition += 7;
  });

  // Local e data
  yPosition += 10;
  const locationDate = `Várzea Grande-MT, ${data.dataFato ? new Date(data.dataFato + "T00:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "[DATA]"}.`;
  const wrappedLocation = doc.splitTextToSize(locationDate, maxWidth);
  doc.text(wrappedLocation, MARGIN_LEFT, yPosition);
  yPosition += wrappedLocation.length * 5 + 10;

  // Assinatura do condutor
  doc.setFont("helvetica", "bold");
  doc.text("________________________________________", MARGIN_LEFT, yPosition);
  yPosition += 5;
  doc.setFont("helvetica", "normal");
  const condutorNome = data.componentesGuarnicao?.[0]?.nome || "[NOME]";
  const condutorPosto = data.componentesGuarnicao?.[0]?.posto || "[POSTO]";
  const condutorRG = data.componentesGuarnicao?.[0]?.rg || "[RG]";
  doc.text(`${condutorPosto} PM ${condutorNome} - RG ${condutorRG} PMMT`, MARGIN_LEFT, yPosition);
  yPosition += 5;
  doc.text("CONDUTOR DA OCORRÊNCIA", MARGIN_LEFT, yPosition);
  yPosition += 15;

  // Tabela para data, politec e assinatura
  const tableY = yPosition;
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, tableY, PAGE_WIDTH - MARGIN_RIGHT, tableY); // Linha superior
  doc.line(MARGIN_LEFT, tableY + 10, PAGE_WIDTH - MARGIN_RIGHT, tableY + 10); // Linha inferior
  doc.line(MARGIN_LEFT, tableY, MARGIN_LEFT, tableY + 10); // Linha vertical esquerda
  doc.line((PAGE_WIDTH - MARGIN_RIGHT) / 2, tableY, (PAGE_WIDTH - MARGIN_RIGHT) / 2, tableY + 10); // Linha vertical central
  doc.line(PAGE_WIDTH - MARGIN_RIGHT, tableY, PAGE_WIDTH - MARGIN_RIGHT, tableY + 10); // Linha vertical direita

  doc.text("DATA", MARGIN_LEFT + 5, tableY + 7);
  doc.text("POLITEC", (PAGE_WIDTH - MARGIN_RIGHT) / 2 + 5, tableY + 7);
  doc.text("ASSINATURA", (PAGE_WIDTH - MARGIN_RIGHT) * 0.75 + 5, tableY + 7);

  // Adiciona o rodapé padrão
  addStandardFooterContent(doc);
};
