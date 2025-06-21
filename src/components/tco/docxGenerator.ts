
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx';

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

  const createSection = (title: string, content: string) => [
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 24 })],
      spacing: { before: 240, after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: content, size: 20 })],
      spacing: { after: 120 }
    })
  ];

  const createInfoTable = (data: Array<{ label: string; value: string }>) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: data.map(item => new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: item.label, bold: true, size: 20 })]
            })],
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 }
            }
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: item.value, size: 20 })]
            })],
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 }
            }
          })
        ]
      }))
    });
  };

  const children = [];

  // Título principal
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "TERMO CIRCUNSTANCIADO DE OCORRÊNCIA", bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `TCO Nº: ${tcoData.tcoNumber}`, bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 }
    })
  );

  // Informações Básicas
  children.push(createInfoTable([
    { label: "Natureza:", value: tcoData.natureza || "" },
    { label: "Tipificação:", value: tcoData.tipificacao || "" },
    ...(tcoData.penaDescricao ? [{ label: "Pena:", value: tcoData.penaDescricao }] : [])
  ]));

  children.push(new Paragraph({ text: "", spacing: { after: 240 } }));

  // Data e Local
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "DATA E LOCAL", bold: true, size: 24 })],
      spacing: { after: 120 }
    })
  );

  children.push(createInfoTable([
    { label: "Data do Fato:", value: `${formatDate(tcoData.dataFato)} às ${tcoData.horaFato}` },
    { label: "Local:", value: tcoData.localFato || "" },
    { label: "Endereço:", value: tcoData.endereco || "" },
    { label: "Município:", value: tcoData.municipio || "" }
  ]));

  children.push(new Paragraph({ text: "", spacing: { after: 240 } }));

  // Registro
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "REGISTRO", bold: true, size: 24 })],
      spacing: { after: 120 }
    })
  );

  children.push(createInfoTable([
    { label: "Início:", value: `${formatDate(tcoData.dataInicioRegistro)} às ${tcoData.horaInicioRegistro}` },
    { label: "Término:", value: `${formatDate(tcoData.dataTerminoRegistro)} às ${tcoData.horaTerminoRegistro}` },
    { label: "Comunicante:", value: tcoData.comunicante || "" }
  ]));

  children.push(new Paragraph({ text: "", spacing: { after: 240 } }));

  // Guarnição
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "GUARNIÇÃO POLICIAL", bold: true, size: 24 })],
      spacing: { after: 120 }
    })
  );

  const guarnicaoData = [
    { label: "Guarnição:", value: tcoData.guarnicao || "" },
    ...(tcoData.operacao ? [{ label: "Operação:", value: tcoData.operacao }] : []),
    { label: "Componentes:", value: formatGuarnicao(tcoData.componentesGuarnicao) }
  ];

  children.push(createInfoTable(guarnicaoData));

  // Pessoas Envolvidas
  if (tcoData.autores && tcoData.autores.length > 0) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("AUTOR(ES)", formatPersons(tcoData.autores)));
  }

  if (tcoData.vitimas && tcoData.vitimas.length > 0 && tcoData.vitimas[0].nome !== 'O ESTADO') {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("VÍTIMA(S)", formatPersons(tcoData.vitimas)));
  }

  if (tcoData.testemunhas && tcoData.testemunhas.length > 0) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("TESTEMUNHA(S)", formatPersons(tcoData.testemunhas)));
  }

  // Apreensões
  if (tcoData.apreensoes) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    let apreensaoText = tcoData.apreensoes;
    if (tcoData.lacreNumero) {
      apreensaoText += `\nNúmero do Lacre: ${tcoData.lacreNumero}`;
    }
    children.push(...createSection("APREENSÕES", apreensaoText));
  }

  // Relatos
  if (tcoData.relatoPolicial) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("RELATO POLICIAL", tcoData.relatoPolicial));
  }

  if (tcoData.relatoAutor) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("RELATO DO(S) AUTOR(ES)", tcoData.relatoAutor));
  }

  if (tcoData.relatoVitima && tcoData.vitimas && tcoData.vitimas[0]?.nome !== 'O ESTADO') {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("RELATO DA(S) VÍTIMA(S)", tcoData.relatoVitima));
  }

  if (tcoData.relatoTestemunha && tcoData.testemunhas && tcoData.testemunhas.length > 0) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("RELATO DA(S) TESTEMUNHA(S)", tcoData.relatoTestemunha));
  }

  // Providências
  if (tcoData.providencias) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("PROVIDÊNCIAS ADOTADAS", tcoData.providencias));
  }

  // Documentos Anexos
  if (tcoData.documentosAnexos) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("DOCUMENTOS ANEXOS", tcoData.documentosAnexos));
  }

  // Conclusão
  if (tcoData.conclusaoPolicial) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("CONCLUSÃO POLICIAL", tcoData.conclusaoPolicial));
  }

  // Anexos
  if (tcoData.videoLinks && tcoData.videoLinks.length > 0) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    const videoText = tcoData.videoLinks.map((link: string, index: number) => `${index + 1}. ${link}`).join('\n');
    children.push(...createSection("LINKS DE VÍDEOS", videoText));
  }

  if (tcoData.imageBase64 && tcoData.imageBase64.length > 0) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("IMAGENS ANEXADAS", `Total de ${tcoData.imageBase64.length} imagem(ns) anexada(s)`));
  }

  // Compromisso de Comparecimento
  if (tcoData.juizadoEspecialData && tcoData.juizadoEspecialHora) {
    children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    children.push(...createSection("TERMO DE COMPROMISSO DE COMPARECIMENTO", 
      `Data de Comparecimento: ${formatDate(tcoData.juizadoEspecialData)} às ${tcoData.juizadoEspecialHora}`));
  }

  // Rodapé
  children.push(
    new Paragraph({ text: "", spacing: { after: 480 } }),
    new Paragraph({
      children: [new TextRun({ text: `Várzea Grande-MT, ${formatDate(tcoData.dataTerminoRegistro)}`, size: 20 })],
      spacing: { after: 360 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "________________________________", size: 20 })],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "Responsável pela Lavratura", size: 20 })],
      spacing: { after: 120 }
    })
  );

  if (tcoData.userRegistration) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `RG PM: ${tcoData.userRegistration}`, size: 20 })]
      })
    );
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  return await Packer.toBlob(doc);
};
