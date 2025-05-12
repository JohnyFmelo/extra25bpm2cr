import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import 'jspdf-autotable';

interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
}

interface Pessoa {
  nome: string;
  sexo: string;
  estadoCivil: string;
  profissao: string;
  endereco: string;
  dataNascimento: string;
  naturalidade: string;
  filiacaoMae: string;
  filiacaoPai: string;
  rg: string;
  cpf: string;
  celular: string;
  email: string;
  laudoPericial: string;
}

interface TCOData {
  id: string;
  tco_number: string;
  natureza: string;
  original_natureza: string;
  custom_natureza: string;
  tipificacao: string;
  pena_descricao: string;
  data_fato: string;
  hora_fato: string;
  data_inicio_registro: string;
  hora_inicio_registro: string;
  data_termino_registro: string;
  hora_termino_registro: string;
  local_fato: string;
  endereco: string;
  municipio: string;
  comunicante: string;
  guarnicao: string;
  operacao: string;
  relato_policial: string;
  relato_autor: string;
  relato_vitima: string;
  relato_testemunha: string;
  apreensoes: string;
  conclusao_policial: string;
  lacre_numero: string;
  droga_quantidade?: string;
  droga_tipo?: string;
  droga_cor?: string;
  droga_nome_comum?: string;
  droga_custom_desc?: string;
  droga_is_unknown?: boolean;
  start_time: string;
  end_time: string;
  created_at: Date;
  video_links: string[];
  image_urls: string[];
  juizado_especial_data: string;
  juizado_especial_hora: string;
  representacao?: string;
  autores: Pessoa[];
  vitimas: Pessoa[];
  testemunhas: Pessoa[];
  policiais: ComponenteGuarnicao[];
}

const formatDateTime = (dateStr: string, timeStr: string) => {
  const date = new Date(dateStr + 'T00:00:00Z');
  const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  return `${formattedDate}, ÀS ${timeStr}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatTime = (timeStr: string) => {
  return timeStr ? timeStr.slice(0, 5) : '';
};

const addHeader = (doc: jsPDF, title: string, pageNumber: number) => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('POLÍCIA MILITAR DO ESTADO DE MATO GROSSO', 105, 15, { align: 'center' });
  doc.text('COMANDO REGIONAL - CR II', 105, 22, { align: 'center' });
  doc.text('BATALHÃO/UNIDADE', 105, 29, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('TERMO CIRCUNSTANCIADO DE OCORRÊNCIA', 105, 36, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Nº ${title}`, 195, 10, { align: 'right' });
  doc.text(`Página ${pageNumber}`, 195, 15, { align: 'right' });
  doc.line(15, 40, 195, 40);
};

const addFooter = (doc: jsPDF) => {
  doc.setFontSize(8);
  doc.text('Sistema TCO - PMMT', 15, 287);
  doc.text('Página gerada em: ' + new Date().toLocaleString('pt-BR'), 165, 287);
  doc.line(15, 282, 195, 282);
};

const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 15, y);
  doc.setDrawColor(0);
  doc.line(15, y + 2, 195, y + 2);
  return y + 8;
};

const addTextBlock = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(lines, x, y);
  return y + (lines.length * 5);
};

const addImageBlock = async (doc: jsPDF, imageUrls: string[], x: number, y: number, maxWidth: number) => {
  let currentY = y;
  const imageWidth = 60;
  const imageHeight = 60;
  const padding = 5;

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const imgData = await fetchImageAsBase64(imageUrls[i]);
      if (currentY + imageHeight > 270) {
        doc.addPage();
        currentY = 50;
        addHeader(doc, doc.getProperties().title || 'TCO', doc.getNumberOfPages());
        addFooter(doc);
      }
      doc.addImage(imgData, 'JPEG', x + (i % 3) * (imageWidth + padding), currentY, imageWidth, imageHeight);
      if ((i + 1) % 3 === 0) {
        currentY += imageHeight + padding;
      }
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
    }
  }
  if (imageUrls.length % 3 !== 0) {
    currentY += imageHeight + padding;
  }
  return currentY;
};

const addQRCodeBlock = async (doc: jsPDF, videoLinks: string[], x: number, y: number, maxWidth: number) => {
  let currentY = y;
  const qrSize = 40;
  const padding = 5;

  for (let i = 0; i < videoLinks.length; i++) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(videoLinks[i], { width: qrSize, margin: 1 });
      if (currentY + qrSize > 270) {
        doc.addPage();
        currentY = 50;
        addHeader(doc, doc.getProperties().title || 'TCO', doc.getNumberOfPages());
        addFooter(doc);
      }
      doc.addImage(qrCodeDataUrl, 'PNG', x + (i % 4) * (qrSize + padding), currentY, qrSize, qrSize);
      doc.setFontSize(8);
      doc.text(`Vídeo ${i + 1}`, x + (i % 4) * (qrSize + padding) + qrSize / 2, currentY + qrSize + 5, { align: 'center' });
      if ((i + 1) % 4 === 0) {
        currentY += qrSize + padding + 10;
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  }
  if (videoLinks.length % 4 !== 0) {
    currentY += qrSize + padding + 10;
  }
  return currentY;
};

const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generatePDF = async (data: TCOData) => {
  const doc = new jsPDF();
  doc.setProperties({ title: data.tco_number });
  let y = 50;

  addHeader(doc, data.tco_number, 1);
  addFooter(doc);

  // 1. AUTUAÇÃO
  y = addSectionTitle(doc, '1. AUTUAÇÃO', y);
  const autuacaoText = `TERMO CIRCUNSTANCIADO DE OCORRÊNCIA Nº ${data.tco_number}, LAVRADO NA DATA DE ${formatDateTime(data.data_inicio_registro, data.hora_inicio_registro)}, NA CIDADE DE ${data.municipio}, CUJO FATO OCORREU EM ${formatDateTime(data.data_fato, data.hora_fato)}, NO ENDEREÇO ${data.endereco}, COMUNICADO VIA ${data.comunicante}, REFERENTE À OCORRÊNCIA DE ${data.natureza.toUpperCase()}, TIPIFICADA COMO ${data.tipificacao}, COM PENA DESCRITA COMO ${data.pena_descricao}.`;
  y = addTextBlock(doc, autuacaoText, 15, y, 180);

  // 2. AUTORES
  y = addSectionTitle(doc, '2. AUTORES', y);
  data.autores.forEach((autor, index) => {
    const autorText = `AUTOR ${index + 1}: ${autor.nome || 'NÃO INFORMADO'}, SEXO: ${autor.sexo || 'NÃO INFORMADO'}, ESTADO CIVIL: ${autor.estadoCivil || 'NÃO INFORMADO'}, PROFISSÃO: ${autor.profissao || 'NÃO INFORMADO'}, ENDEREÇO: ${autor.endereco || 'NÃO INFORMADO'}, DATA DE NASCIMENTO: ${autor.dataNascimento ? formatDate(autor.dataNascimento) : 'NÃO INFORMADO'}, NATURALIDADE: ${autor.naturalidade || 'NÃO INFORMADO'}, FILIAÇÃO MÃE: ${autor.filiacaoMae || 'NÃO INFORMADO'}, FILIAÇÃO PAI: ${autor.filiacaoPai || 'NÃO INFORMADO'}, RG: ${autor.rg || 'NÃO INFORMADO'}, CPF: ${autor.cpf || 'NÃO INFORMADO'}, CELULAR: ${autor.celular || 'NÃO INFORMADO'}, EMAIL: ${autor.email || 'NÃO INFORMADO'}, LAUDO PERICIAL: ${autor.laudoPericial || 'NÃO INFORMADO'}.`;
    y = addTextBlock(doc, autorText, 15, y, 180);
    if (y > 250) {
      doc.addPage();
      y = 50;
      addHeader(doc, data.tco_number, doc.getNumberOfPages());
      addFooter(doc);
    }
  });

  // 3. VÍTIMAS
  y = addSectionTitle(doc, '3. VÍTIMAS', y);
  if (data.vitimas.length === 0) {
    y = addTextBlock(doc, 'NENHUMA VÍTIMA REGISTRADA.', 15, y, 180);
  } else {
    data.vitimas.forEach((vitima, index) => {
      const vitimaText = `VÍTIMA ${index + 1}: ${vitima.nome || 'NÃO INFORMADO'}, SEXO: ${vitima.sexo || 'NÃO INFORMADO'}, ESTADO CIVIL: ${vitima.estadoCivil || 'NÃO INFORMADO'}, PROFISSÃO: ${vitima.profissao || 'NÃO INFORMADO'}, ENDEREÇO: ${vitima.endereco || 'NÃO INFORMADO'}, DATA DE NASCIMENTO: ${vitima.dataNascimento ? formatDate(vitima.dataNascimento) : 'NÃO INFORMADO'}, NATURALIDADE: ${vitima.naturalidade || 'NÃO INFORMADO'}, FILIAÇÃO MÃE: ${vitima.filiacaoMae || 'NÃO INFORMADO'}, FILIAÇÃO PAI: ${vitima.filiacaoPai || 'NÃO INFORMADO'}, RG: ${vitima.rg || 'NÃO INFORMADO'}, CPF: ${vitima.cpf || 'NÃO INFORMADO'}, CELULAR: ${vitima.celular || 'NÃO INFORMADO'}, EMAIL: ${vitima.email || 'NÃO INFORMADO'}, LAUDO PERICIAL: ${vitima.laudoPericial || 'NÃO INFORMADO'}.`;
      y = addTextBlock(doc, vitimaText, 15, y, 180);
      if (y > 250) {
        doc.addPage();
        y = 50;
        addHeader(doc, data.tco_number, doc.getNumberOfPages());
        addFooter(doc);
      }
    });
  }

  // 4. HISTÓRICO
  y = addSectionTitle(doc, '4. HISTÓRICO', y);

  // 4.1 RELATO POLICIAL
  y = addSectionTitle(doc, '4.1 RELATO POLICIAL', y);
  y = addTextBlock(doc, data.relato_policial, 15, y, 180);
  if (y > 250) {
    doc.addPage();
    y = 50;
    addHeader(doc, data.tco_number, doc.getNumberOfPages());
    addFooter(doc);
  }

  // 4.2 DEPOIMENTOS
  y = addSectionTitle(doc, '4.2 DEPOIMENTOS', y);

  // 4.2.1 AUTOR
  y = addTextBlock(doc, '4.2.1 AUTOR', 15, y, 180);
  y = addTextBlock(doc, data.relato_autor, 20, y, 175);
  if (y > 250) {
    doc.addPage();
    y = 50;
    addHeader(doc, data.tco_number, doc.getNumberOfPages());
    addFooter(doc);
  }

  // 4.2.2 VÍTIMA
  y = addTextBlock(doc, '4.2.2 VÍTIMA', 15, y, 180);
  y = addTextBlock(doc, data.relato_vitima || 'NENHUM RELATO DE VÍTIMA REGISTRADO.', 20, y, 175);
  if (y > 250) {
    doc.addPage();
    y = 50;
    addHeader(doc, data.tco_number, doc.getNumberOfPages());
    addFooter(doc);
  }

  // 4.2.3 TESTEMUNHA
  y = addTextBlock(doc, '4.2.3 TESTEMUNHA', 15, y, 180);
  if (data.testemunhas.length === 0) {
    y = addTextBlock(doc, 'NENHUMA TESTEMUNHA REGISTRADA.', 20, y, 175);
  } else {
    y = addTextBlock(doc, data.relato_testemunha, 20, y, 175);
  }
  if (y > 250) {
    doc.addPage();
    y = 50;
    addHeader(doc, data.tco_number, doc.getNumberOfPages());
    addFooter(doc);
  }

  // 4.3 FOTOS E VÍDEOS
  y = addSectionTitle(doc, '4.3 FOTOS E VÍDEOS', y);
  if (data.image_urls.length === 0 && data.video_links.length === 0) {
    y = addTextBlock(doc, 'NENHUMA FOTO OU VÍDEO ANEXADO.', 15, y, 180);
  } else {
    // Adicionar Fotos
    if (data.image_urls.length > 0) {
      y = addTextBlock(doc, 'FOTOS:', 15, y, 180);
      y = await addImageBlock(doc, data.image_urls, 15, y, 180);
      if (y > 250) {
        doc.addPage();
        y = 50;
        addHeader(doc, data.tco_number, doc.getNumberOfPages());
        addFooter(doc);
      }
    }

    // Adicionar QR Codes dos Vídeos
    if (data.video_links.length > 0) {
      y = addTextBlock(doc, 'VÍDEOS (ESCANEIE O QR CODE PARA ACESSAR):', 15, y, 180);
      y = await addQRCodeBlock(doc, data.video_links, 15, y, 180);
      if (y > 250) {
        doc.addPage();
        y = 50;
        addHeader(doc, data.tco_number, doc.getNumberOfPages());
        addFooter(doc);
      }
    }
  }

  // 5. IDENTIFICAÇÃO DA GUARNIÇÃO
  y = addSectionTitle(doc, '5. IDENTIFICAÇÃO DA GUARNIÇÃO', y);
  if (!data.policiais || data.policiais.length === 0) {
    y = addTextBlock(doc, 'NENHUM POLICIAL REGISTRADO NA GUARNIÇÃO.', 15, y, 180);
  } else {
    const guarnicaoText = `GUARNIÇÃO: ${data.guarnicao || 'NÃO INFORMADO'}\n` +
      data.policiais
        .map((policial, index) => `POLICIAL ${index + 1}: ${policial.posto || 'NÃO INFORMADO'} PM ${policial.nome || 'NÃO INFORMADO'}, RG: ${policial.rg || 'NÃO INFORMADO'}`)
        .join('\n');
    y = addTextBlock(doc, guarnicaoText, 15, y, 180);
  }
  if (y > 250) {
    doc.addPage();
    y = 50;
    addHeader(doc, data.tco_number, doc.getNumberOfPages());
    addFooter(doc);
  }

  // 6. APREENSÕES
  y = addSectionTitle(doc, '6. APREENSÕES', y);
  y = addTextBlock(doc, data.apreensoes || 'NENHUMA APREENSÃO REGISTRADA.', 15, y, 180);
  if (y > 250) {
    doc.addPage();
    y = 50;
    addHeader(doc, data.tco_number, doc.getNumberOfPages());
    addFooter(doc);
  }

  // 7. TESTEMUNHAS
  y = addSectionTitle(doc, '7. TESTEMUNHAS', y);
  if (data.testemunhas.length === 0) {
    y = addTextBlock(doc, 'NENHUMA TESTEMUNHA REGISTRADA.', 15, y, 180);
  } else {
    data.testemunhas.forEach((testemunha, index) => {
      const testemunhaText = `TESTEMUNHA ${index + 1}: ${testemunha.nome || 'NÃO INFORMADO'}, SEXO: ${testemunha.sexo || 'NÃO INFORMADO'}, ESTADO CIVIL: ${testemunha.estadoCivil || 'NÃO INFORMADO'}, PROFISSÃO: ${testemunha.profissao || 'NÃO INFORMADO'}, ENDEREÇO: ${testemunha.endereco || 'NÃO INFORMADO'}, DATA DE NASCIMENTO: ${testemunha.dataNascimento ? formatDate(testemunha.dataNascimento) : 'NÃO INFORMADO'}, NATURALIDADE: ${testemunha.naturalidade || 'NÃO INFORMADO'}, FILIAÇÃO MÃE: ${testemunha.filiacaoMae || 'NÃO INFORMADO'}, FILIAÇÃO PAI: ${testemunha.filiacaoPai || 'NÃO INFORMADO'}, RG: ${testemunha.rg || 'NÃO INFORMADO'}, CPF: ${testemunha.cpf || 'NÃO INFORMADO'}, CELULAR: ${testemunha.celular || 'NÃO INFORMADO'}, EMAIL: ${testemunha.email || 'NÃO INFORMADO'}.`;
      y = addTextBlock(doc, testemunhaText, 15, y, 180);
      if (y > 250) {
        doc.addPage();
        y = 50;
        addHeader(doc, data.tco_number, doc.getNumberOfPages());
        addFooter(doc);
      }
    });
  }

  // 8. CONCLUSÃO
  y = addSectionTitle(doc, '8. CONCLUSÃO', y);
  y = addTextBlock(doc, data.conclusao_policial, 15, y, 180);
  if (y > 250) {
    doc.addPage();
    y = 50;
    addHeader(doc, data.tco_number, doc.getNumberOfPages());
    addFooter(doc);
  }

  // 9. AUDIÊNCIA NO JUIZADO ESPECIAL
  y = addSectionTitle(doc, '9. AUDIÊNCIA NO JUIZADO ESPECIAL', y);
  const audienciaText = data.juizado_especial_data && data.juizado_especial_hora
    ? `DATA: ${formatDateTime(data.juizado_especial_data, data.juizado_especial_hora)}`
    : 'NENHUMA AUDIÊNCIA AGENDADA.';
  y = addTextBlock(doc, audienciaText, 15, y, 180);

  // 10. REPRESENTAÇÃO (se aplicável)
  if (data.representacao) {
    y = addSectionTitle(doc, '10. REPRESENTAÇÃO', y);
    const representacaoText = `A VÍTIMA OPTA POR ${data.representacao.toUpperCase()}.`;
    y = addTextBlock(doc, representacaoText, 15, y, 180);
  }

  const pdfOutput = doc.output('blob');
  const pdfFile = new File([pdfOutput], `${data.tco_number}.pdf`, { type: 'application/pdf' });
  const filePath = `tco-pdfs/${data.id}/${data.tco_number}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('tco-pdfs')
    .upload(filePath, pdfFile, { upsert: true });

  if (uploadError) {
    console.error('Erro ao fazer upload do PDF:', uploadError);
    throw new Error('Falha ao fazer upload do PDF');
  }

  const { data: publicUrlData } = supabase.storage
    .from('tco-pdfs')
    .getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from('tcos')
    .update({ pdf_url: publicUrlData.publicUrl })
    .eq('id', data.id);

  if (updateError) {
    console.error('Erro ao atualizar URL do PDF:', updateError);
    throw new Error('Falha ao atualizar URL do PDF');
  }
};
