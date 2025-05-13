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
  const title = "TERMO DE CADEIA DE CUSTÓDIA";
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (PAGE_WIDTH - titleWidth) / 2, yPosition);
  yPosition += 10;

  // Subtítulo com número do TCO
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const subtitle = `TCO Nº ${data.tcoNumber || "[NÚMERO NÃO INFORMADO]"}`;
  const subtitleWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, (PAGE_WIDTH - subtitleWidth) / 2, yPosition);
  yPosition += 15;

  // Informações principais
  doc.setFontSize(10);
  const maxWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  // Dados da apreensão
  const lacreNumero = data.lacreNumero || "[NÚMERO DO LACRE NÃO INFORMADO]";
  const quantidade = data.drogaQuantidade || "[QUANTIDADE NÃO INFORMADA]";
  const substancia = data.drogaTipo || "[SUBSTÂNCIA NÃO INFORMADA]";
  const cor = data.drogaCor || "[COR NÃO INFORMADA]";
  const indicioFinal = data.drogaIsUnknown && data.drogaCustomDesc ? data.drogaCustomDesc : data.drogaNomeComum || "[INDÍCIO NÃO ESPECIFICADO]";

  // Texto descritivo
  const textoCadeia = [
    `Eu, ${data.componentesGuarnicao?.[0]?.posto || "[POSTO]"} PM ${data.componentesGuarnicao?.[0]?.nome || "[NOME]"}, matrícula ${data.componentesGuarnicao?.[0]?.rg || "[RG]"}, lotado(a) na unidade responsável, declaro que no dia ${data.dataFato ? new Date(data.dataFato + 'T00:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : "[DATA]"}, às ${data.horaFato || "[HORA]"}, na localidade ${data.localFato || "[LOCAL]"}, ${data.endereco || "[ENDEREÇO]"}, município de ${data.municipio || "[MUNICÍPIO]"}, procedi com a apreensão do seguinte material:`,
    `${quantidade} porção(ões) de substância ${substancia.toLowerCase()}, de cor ${cor.toLowerCase()}, com características análogas a ${indicioFinal.toLowerCase()}, acondicionada(s) sob o lacre nº ${lacreNumero}.`,
    `O material foi apreendido na posse de ${data.autores?.[0]?.nome || "[NOME DO AUTOR]"} e devidamente lacrado na presença da guarnição composta por:`,
  ];

  // Lista de componentes da guarnição
  const guarnicaoTexto = data.componentesGuarnicao
    ?.filter((c: any) => c.nome && c.rg)
    .map((c: any) => `${c.posto} PM ${c.nome}, matrícula ${c.rg}`)
    .join("; ") || "[NENHUM COMPONENTE INFORMADO]";

  textoCadeia.push(guarnicaoTexto + ".");

  // Continuação do texto
  textoCadeia.push(
    `O material apreendido foi encaminhado à autoridade competente para os procedimentos legais cabíveis, mantendo-se a integridade do lacre até sua entrega. Declaro que a cadeia de custódia foi rigorosamente observada, garantindo a preservação das evidências.`
  );

  // Adiciona o texto com quebra automática
  textoCadeia.forEach((line) => {
    if (yPosition + 10 > PAGE_HEIGHT - 20) {
      yPosition = addNewPage(doc, data);
      yPosition = addStandardHeaderContent(doc, yPosition, data);
    }
    const wrappedText = doc.splitTextToSize(line, maxWidth);
    doc.text(wrappedText, MARGIN_LEFT, yPosition);
    yPosition += wrappedText.length * 5 + 3; // Ajusta espaçamento
  });

  // Assinaturas
  yPosition += 10;
  if (yPosition + 40 > PAGE_HEIGHT - 20) {
    yPosition = addNewPage(doc, data);
    yPosition = addStandardHeaderContent(doc, yPosition, data);
  }

  doc.setFont("helvetica", "bold");
  doc.text("________________________________________", MARGIN_LEFT, yPosition);
  yPosition += 5;
  doc.setFont("helvetica", "normal");
  doc.text(
    `${data.componentesGuarnicao?.[0]?.posto || "[POSTO]"} PM ${data.componentesGuarnicao?.[0]?.nome || "[NOME]"} - Responsável pela Apreensão`,
    MARGIN_LEFT,
    yPosition
  );
  yPosition += 15;

  doc.text("________________________________________", MARGIN_LEFT, yPosition);
  yPosition += 5;
  doc.text("Autoridade Policial", MARGIN_LEFT, yPosition);

  // Adiciona o rodapé padrão
  addStandardFooterContent(doc);
};
