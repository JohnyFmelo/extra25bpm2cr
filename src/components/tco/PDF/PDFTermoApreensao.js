import jsPDF from "jspdf";

export function addTermoApreensao(doc, data, startY) {
  const centeredX = doc.internal.pageSize.getWidth() / 2;

  console.log("[PDFTermoApreensao] Iniciando renderização do Termo de Apreensão");
  console.log("[PDFTermoApreensao] Condutor telefone:", data.componentesGuarnicao?.[0]?.telefone);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TERMO DE APREENSÃO", centeredX, 30, { align: "center" });
  console.log("[PDFTermoApreensao] Título renderizado: TERMO DE APREENSÃO");

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);

  let yPos = startY || 50;
  const lineHeight = 10;

  data.margin = 20;
  data.lineHeight = lineHeight;

  function addField(doc, yPos, label, value, data) {
    const cleanLabel = label.replace(/:+$/, '');
    const text = `${cleanLabel}: ${value || "Não informado"}`;
    console.log("[PDFTermoApreensao] Renderizando campo:", text);
    doc.text(text, data.margin, yPos);
    return yPos + data.lineHeight;
  }

  yPos = addField(doc, yPos, "LACRE", data.lacre, data);
  yPos = addField(doc, yPos, "NÚMERO DO LACRE", data.numeroLacre, data);
  yPos = addField(doc, yPos, "DATA/HORA", data.dataHora, data);
  yPos = addField(doc, yPos, "LOCAL", data.local, data);

  const condutor = data.componentesGuarnicao?.[0];
  yPos = addField(doc, yPos, "NOME DO POLICIAL MILITAR", condutor?.nome, data);
  yPos = addField(doc, yPos, "GRADUAÇÃO", condutor?.posto, data);
  yPos = addField(doc, yPos, "RGPM", condutor?.rg, data);
  yPos = addField(doc, yPos, "FILIAÇÃO - PAI", condutor?.pai, data);
  yPos = addField(doc, yPos, "FILIAÇÃO - MÃE", condutor?.mae, data);
  yPos = addField(doc, yPos, "NATURALIDADE", condutor?.naturalidade, data);
  yPos = addField(doc, yPos, "CPF", condutor?.cpf, data);
  yPos = addField(doc, yPos, "TELEFONE", condutor?.telefone, data);

  yPos += lineHeight;
  doc.setFont("Helvetica", "bold");
  doc.text("OBJETOS APREENDIDOS:", data.margin, yPos);
  yPos += lineHeight;
  doc.setFont("Helvetica", "normal");
  const objetos = data.objetosApreendidos || [];
  if (objetos.length === 0) {
    doc.text("Nenhum objeto apreendido informado.", data.margin, yPos);
    yPos += lineHeight;
  } else {
    objetos.forEach((objeto, index) => {
      doc.text(`${index + 1}. ${objeto.descricao || "Não informado"} - Quantidade: ${objeto.quantidade || "1"}`, data.margin, yPos);
      yPos += lineHeight;
    });
  }

  yPos += lineHeight;
  doc.setFont("Helvetica", "bold");
  doc.text("HISTÓRICO:", data.margin, yPos);
  yPos += lineHeight;
  doc.setFont("Helvetica", "normal");
  const historicoLines = doc.splitTextToSize(data.historico || "Não informado", doc.internal.pageSize.getWidth() - 2 * data.margin);
  historicoLines.forEach(line => {
    doc.text(line, data.margin, yPos);
    yPos += lineHeight;
  });

  console.log("[PDFTermoApreensao] Termo de Apreensão finalizado, yPos:", yPos);
  return yPos;
}
