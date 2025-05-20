
import {
  MARGIN_LEFT,
  MARGIN_RIGHT,
  MARGIN_TOP,
  MARGIN_BOTTOM,
  formatarData,
  addStandardHeaderContent,
  rightAlign,
  centerAlign
} from './pdfUtils.js';

export const generateAutuacaoPage = (doc, yPosition, data) => {
  const { PAGE_WIDTH, PAGE_HEIGHT } = {
    PAGE_WIDTH: doc.internal.pageSize.width,
    PAGE_HEIGHT: doc.internal.pageSize.height
  };

  addStandardHeaderContent(doc);

  // Adiciona título centralizado
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  centerAlign(doc, "TERMO CIRCUNSTANCIADO DE OCORRÊNCIA", PAGE_WIDTH / 2, yPosition + 20);
  doc.setFontSize(14);
  centerAlign(doc, `N° ${data.tcoNumber || '[NÚMERO DO TCO NÃO INFORMADO]'}`, PAGE_WIDTH / 2, yPosition + 30);

  // Linha divisória
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, yPosition + 35, PAGE_WIDTH - MARGIN_RIGHT, yPosition + 35);

  // Configurações para o texto principal
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  let currentY = yPosition + 50;

  // Dados da autuação
  const leftMargin = MARGIN_LEFT + 5;
  const columnWidth = (PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - 10) / 2;
  const col2X = MARGIN_LEFT + columnWidth + 10;

  // Título da seção
  doc.setFont("helvetica", "bold");
  doc.text("AUTUAÇÃO", leftMargin, currentY);
  doc.setFont("helvetica", "normal");
  currentY += 8;

  // Dados em duas colunas
  doc.text(`Natureza: ${data.natureza || '[NATUREZA NÃO INFORMADA]'}`, leftMargin, currentY);
  doc.text(`Data do Fato: ${formatarData(data.dataFato) || '[NÃO INFORMADA]'}`, col2X, currentY);
  currentY += 7;

  doc.text(`Tipificação: ${data.tipificacao || '[TIPIFICAÇÃO NÃO INFORMADA]'}`, leftMargin, currentY);
  doc.text(`Hora do Fato: ${data.horaFato || '[NÃO INFORMADA]'}`, col2X, currentY);
  currentY += 7;

  // Nome do Autor em uma linha
  const autorNome = data.autores && data.autores.length > 0 ? 
    data.autores.map(a => a.nome).filter(n => n).join(", ") : 
    '[AUTOR NÃO INFORMADO]';
  
  doc.text(`Autor(a): ${autorNome}`, leftMargin, currentY);
  currentY += 7;

  // Nome da Vítima em uma linha
  const vitimaNome = data.vitimas && data.vitimas.length > 0 ? 
    data.vitimas.map(v => v.nome).filter(n => n).join(", ") :
    '[VÍTIMA NÃO INFORMADA]';
  
  doc.text(`Vítima(a): ${vitimaNome}`, leftMargin, currentY);
  doc.text(`Local: ${data.localFato || '[NÃO INFORMADO]'}`, col2X, currentY);
  currentY += 7;

  doc.text(`Município: ${data.municipio || 'Várzea Grande'}`, col2X, currentY);
  currentY += 7;

  // Endereço em uma linha
  doc.text(`Endereço: ${data.endereco || '[NÃO INFORMADO]'}`, leftMargin, currentY);
  currentY += 12;

  // Título da segunda seção
  doc.setFont("helvetica", "bold");
  doc.text("GUARNIÇÃO RESPONSÁVEL", leftMargin, currentY);
  doc.setFont("helvetica", "normal");
  currentY += 8;

  // Lista de policiais
  if (data.componentesGuarnicao && data.componentesGuarnicao.length > 0) {
    data.componentesGuarnicao.forEach(policial => {
      doc.text(`${policial.posto} PM ${policial.nome.toUpperCase()} - RG ${policial.rg}`, leftMargin, currentY);
      currentY += 7;
    });
  } else {
    doc.text("[NENHUM POLICIAL INFORMADO]", leftMargin, currentY);
    currentY += 7;
  }

  // Adiciona a lista de apoio se houver
  if (data.componentesApoio && data.componentesApoio.length > 0) {
    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.text("COM APOIO DE:", leftMargin, currentY);
    doc.setFont("helvetica", "normal");
    currentY += 8;

    data.componentesApoio.forEach(apoio => {
      const rgInfo = apoio.rg && apoio.rg !== "-" ? ` - RG ${apoio.rg}` : "";
      doc.text(`${apoio.posto} PM ${apoio.nome.toUpperCase()}${rgInfo}`, leftMargin, currentY);
      currentY += 7;
    });
  }
  
  currentY += 15;

  // Data e local de registro
  const dataRegistro = data.dataInicioRegistro ? formatarData(data.dataInicioRegistro) : formatarData(new Date().toISOString().split('T')[0]);
  doc.text(`Várzea Grande-MT, ${dataRegistro}`, leftMargin, currentY);
  currentY += 20;

  // Assinatura
  const lineWidth = 80;
  const lineX = PAGE_WIDTH / 2 - lineWidth / 2;
  doc.line(lineX, currentY, lineX + lineWidth, currentY);
  currentY += 5;

  // Nome do condutor para assinatura
  const condutorNome = data.componentesGuarnicao && data.componentesGuarnicao.length > 0 ? 
    `${data.componentesGuarnicao[0].posto} PM ${data.componentesGuarnicao[0].nome}` : 
    "POLICIAL CONDUTOR";
  
  doc.setFontSize(10);
  centerAlign(doc, condutorNome.toUpperCase(), PAGE_WIDTH / 2, currentY);
  currentY += 5;
  centerAlign(doc, "CONDUTOR", PAGE_WIDTH / 2, currentY);

  // Adiciona rodapé na primeira página
  let footerY = PAGE_HEIGHT - MARGIN_BOTTOM;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  centerAlign(doc, "25º Batalhão de Polícia Militar", PAGE_WIDTH / 2, footerY);
  footerY += 4;
  centerAlign(doc, "Várzea Grande - MT", PAGE_WIDTH / 2, footerY);

  return currentY;
};
