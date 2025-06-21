
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, TabStopPosition, TabStopType } from 'docx';

export const generateDOCX = async (tcoData: any): Promise<Blob> => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatPersons = (persons: any[]) => {
    if (!persons || persons.length === 0) return "Não informado";
    
    return persons
      .filter(person => person.nome?.trim())
      .map(person => {
        let info = `Nome: ${person.nome}`;
        if (person.cpf) info += `\nCPF: ${person.cpf}`;
        if (person.rg) info += `\nRG: ${person.rg}`;
        if (person.endereco) info += `\nEndereço: ${person.endereco}`;
        if (person.celular) info += `\nCelular: ${person.celular}`;
        return info;
      })
      .join("\n\n");
  };

  const formatGuarnicao = (componentes: any[]) => {
    if (!componentes || componentes.length === 0) return "Não informado";
    
    return componentes
      .filter(c => c.nome?.trim() && c.rg?.trim())
      .map(c => `${c.posto} PM ${c.nome} - RG: ${c.rg}${c.apoio ? ' (APOIO)' : ''}`)
      .join("\n");
  };

  const year = new Date().getFullYear();
  const children = [];

  // Cabeçalho idêntico ao PDF
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "ESTADO DE MATO GROSSO", bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "POLÍCIA MILITAR", bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "25º BPM / 2º CR", bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }
    })
  );

  // Linha separadora (simulada com underline)
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "________________________________________________", size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 }
    })
  );

  // Referência
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `REF.:TERMO CIRCUNSTANCIADO DE OCORRÊNCIA Nº ${tcoData.tcoNumber}/2ºCR/${year}`, size: 18 })],
      spacing: { after: 240 }
    })
  );

  // Título principal
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "TERMO CIRCUNSTANCIADO DE OCORRÊNCIA", bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 }
    })
  );

  // Campos básicos usando formatação de campos PDF
  const addField = (label: string, value: string) => {
    return new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 24 }),
        new TextRun({ text: value || "Não informado", size: 24 })
      ],
      spacing: { after: 120 }
    });
  };

  children.push(addField("Natureza", tcoData.natureza));
  children.push(addField("Tipificação", tcoData.tipificacao));
  if (tcoData.penaDescricao) {
    children.push(addField("Pena", tcoData.penaDescricao));
  }

  // Seção Data e Local
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "1. DATA E LOCAL", bold: true, size: 24 })],
      spacing: { before: 240, after: 120 }
    })
  );

  children.push(addField("Data do Fato", `${formatDate(tcoData.dataFato)} às ${tcoData.horaFato}`));
  children.push(addField("Local", tcoData.localFato));
  children.push(addField("Endereço", tcoData.endereco));
  children.push(addField("Município", tcoData.municipio));

  // Seção Registro
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "2. REGISTRO", bold: true, size: 24 })],
      spacing: { before: 240, after: 120 }
    })
  );

  children.push(addField("Início", `${formatDate(tcoData.dataInicioRegistro)} às ${tcoData.horaInicioRegistro}`));
  children.push(addField("Término", `${formatDate(tcoData.dataTerminoRegistro)} às ${tcoData.horaTerminoRegistro}`));
  children.push(addField("Comunicante", tcoData.comunicante));

  // Seção Guarnição
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "3. GUARNIÇÃO POLICIAL", bold: true, size: 24 })],
      spacing: { before: 240, after: 120 }
    })
  );

  children.push(addField("Guarnição", tcoData.guarnicao));
  if (tcoData.operacao) {
    children.push(addField("Operação", tcoData.operacao));
  }
  children.push(addField("Componentes", formatGuarnicao(tcoData.componentesGuarnicao)));

  // Pessoas Envolvidas
  let sectionNumber = 4;

  if (tcoData.autores && tcoData.autores.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. AUTOR(ES)`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: formatPersons(tcoData.autores), size: 24 })],
        spacing: { after: 120 }
      })
    );
    sectionNumber++;
  }

  if (tcoData.vitimas && tcoData.vitimas.length > 0 && tcoData.vitimas[0].nome !== 'O ESTADO') {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. VÍTIMA(S)`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: formatPersons(tcoData.vitimas), size: 24 })],
        spacing: { after: 120 }
      })
    );
    sectionNumber++;
  }

  if (tcoData.testemunhas && tcoData.testemunhas.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. TESTEMUNHA(S)`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: formatPersons(tcoData.testemunhas), size: 24 })],
        spacing: { after: 120 }
      })
    );
    sectionNumber++;
  }

  // Apreensões
  if (tcoData.apreensoes) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. APREENSÕES`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    let apreensaoText = tcoData.apreensoes;
    if (tcoData.lacreNumero) {
      apreensaoText += `\nNúmero do Lacre: ${tcoData.lacreNumero}`;
    }
    children.push(
      new Paragraph({
        children: [new TextRun({ text: apreensaoText, size: 24 })],
        spacing: { after: 120 }
      })
    );
    sectionNumber++;
  }

  // Relatos
  if (tcoData.relatoPolicial) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. RELATO POLICIAL`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: tcoData.relatoPolicial, size: 24 })],
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED
      })
    );
    sectionNumber++;
  }

  if (tcoData.relatoAutor) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. RELATO DO(S) AUTOR(ES)`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: tcoData.relatoAutor, size: 24 })],
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED
      })
    );
    sectionNumber++;
  }

  if (tcoData.relatoVitima && tcoData.vitimas && tcoData.vitimas[0]?.nome !== 'O ESTADO') {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. RELATO DA(S) VÍTIMA(S)`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: tcoData.relatoVitima, size: 24 })],
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED
      })
    );
    sectionNumber++;
  }

  if (tcoData.relatoTestemunha && tcoData.testemunhas && tcoData.testemunhas.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. RELATO DA(S) TESTEMUNHA(S)`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: tcoData.relatoTestemunha, size: 24 })],
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED
      })
    );
    sectionNumber++;
  }

  // Providências
  if (tcoData.providencias) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. PROVIDÊNCIAS ADOTADAS`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: tcoData.providencias, size: 24 })],
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED
      })
    );
    sectionNumber++;
  }

  // Documentos Anexos
  if (tcoData.documentosAnexos) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. DOCUMENTOS ANEXOS`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: tcoData.documentosAnexos, size: 24 })],
        spacing: { after: 120 }
      })
    );
    sectionNumber++;
  }

  // Conclusão
  if (tcoData.conclusaoPolicial) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. CONCLUSÃO POLICIAL`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: tcoData.conclusaoPolicial, size: 24 })],
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED
      })
    );
    sectionNumber++;
  }

  // Anexos
  if (tcoData.videoLinks && tcoData.videoLinks.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. LINKS DE VÍDEOS`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    const videoText = tcoData.videoLinks.map((link: string, index: number) => `${index + 1}. ${link}`).join('\n');
    children.push(
      new Paragraph({
        children: [new TextRun({ text: videoText, size: 24 })],
        spacing: { after: 120 }
      })
    );
    sectionNumber++;
  }

  if (tcoData.imageBase64 && tcoData.imageBase64.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. IMAGENS ANEXADAS`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Total de ${tcoData.imageBase64.length} imagem(ns) anexada(s)`, size: 24 })],
        spacing: { after: 120 }
      })
    );
    sectionNumber++;
  }

  // Compromisso de Comparecimento
  if (tcoData.juizadoEspecialData && tcoData.juizadoEspecialHora) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${sectionNumber}. TERMO DE COMPROMISSO DE COMPARECIMENTO`, bold: true, size: 24 })],
        spacing: { before: 240, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Data de Comparecimento: ${formatDate(tcoData.juizadoEspecialData)} às ${tcoData.juizadoEspecialHora}`, size: 24 })],
        spacing: { after: 120 }
      })
    );
  }

  // Rodapé igual ao PDF
  children.push(
    new Paragraph({ text: "", spacing: { after: 480 } }),
    new Paragraph({
      children: [new TextRun({ text: `Várzea Grande-MT, ${formatDate(tcoData.dataTerminoRegistro)}`, size: 24 })],
      spacing: { after: 360 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "________________________________", size: 24 })],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "Responsável pela Lavratura", size: 24 })],
      spacing: { after: 120 }
    })
  );

  if (tcoData.userRegistration) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `RG PM: ${tcoData.userRegistration}`, size: 24 })]
      })
    );
  }

  // Rodapé do batalhão (igual ao PDF)
  children.push(
    new Paragraph({ text: "", spacing: { after: 240 } }),
    new Paragraph({
      children: [new TextRun({ text: "25º Batalhão de Polícia Militar", size: 16 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "Av. Dr. Paraná, s/nº complexo da Univag, ao lado do núcleo de Pratica Jurídica. Bairro Cristo Rei", size: 16 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "CEP 78.110-100, Várzea Grande - MT", size: 16 })],
      alignment: AlignmentType.CENTER
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134,    // 2cm
            right: 850,   // 1.5cm
            bottom: 1134, // 2cm
            left: 850     // 1.5cm
          }
        }
      },
      children: children
    }]
  });

  return await Packer.toBlob(doc);
};
