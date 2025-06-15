import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MARGIN_LEFT = 15;
const PAGE_WIDTH = 210;

function addWrappedText(doc, text, x, y, maxWidth = 180, lineHeight = 7) {
    let textLines = doc.splitTextToSize(text, maxWidth);
    textLines.forEach(line => {
        doc.text(line, x, y);
        y += lineHeight;
    });
    return y;
}

const generatePdf = (data, isDrugCase) => {
    const doc = new jsPDF();

    doc.setFontSize(12);
    let y = 20;

    // --- SEÇÃO 1: INFORMAÇÕES GERAIS ---
    doc.text("TERMO CIRCUNSTANCIADO DE OCORRÊNCIA (TCO)", MARGIN_LEFT, y);
    y += 10;

    doc.setFontSize(10);
    y = addWrappedText(doc, `Natureza da Ocorrência: ${data.natureza}`, MARGIN_LEFT, y);
    y = addWrappedText(doc, `Tipificação Legal: ${data.tipificacao}`, MARGIN_LEFT, y);
    y = addWrappedText(doc, `Data e Hora do Fato: ${data.dataFato} ${data.horaFato}`, MARGIN_LEFT, y);
    y = addWrappedText(doc, `Local do Fato: ${data.localFato}, ${data.endereco}, ${data.municipio}`, MARGIN_LEFT, y);
    y = addWrappedText(doc, `Comunicante: ${data.comunicante}`, MARGIN_LEFT, y);
    y = addWrappedText(doc, `Guarnição: ${data.guarnicao}`, MARGIN_LEFT, y);
    if (data.operacao) {
        y = addWrappedText(doc, `Operação: ${data.operacao}`, MARGIN_LEFT, y);
    }
    y += 10;

    // --- SEÇÃO 2: AUTORES ---
    doc.text("Autores:", MARGIN_LEFT, y);
    y += 7;

    const autoresValidos = data.autores ? data.autores.filter(a => a?.nome && a.nome.trim() !== '') : [];

    if (autoresValidos.length > 0) {
        autoresValidos.forEach(autor => {
            let autorInfo = `Nome: ${autor.nome}, RG: ${autor.rg}, Endereço: ${autor.endereco}, Telefone: ${autor.telefone}`;
            if (autor.dataNascimento) {
                autorInfo += `, Data de Nascimento: ${autor.dataNascimento}`;
            }
            y = addWrappedText(doc, autorInfo, MARGIN_LEFT, y);
        });
    } else {
        y = addWrappedText(doc, "Nenhum autor identificado.", MARGIN_LEFT, y);
    }
    y += 10;

    // --- SEÇÃO 2.1: DROGAS (Se for o caso) ---
    if (isDrugCase && data.drogas && data.drogas.length > 0) {
        doc.text("Drogas Apreendidas:", MARGIN_LEFT, y);
        y += 7;
        data.drogas.forEach((droga, index) => {
            const drogaText = `${index + 1}. ${droga.quantidade} de ${droga.substancia} (Cor: ${droga.cor}, Odor: ${droga.odor}, Indícios: ${droga.indicios})`;
            y = addWrappedText(doc, drogaText, MARGIN_LEFT, y);
        });
        y = addWrappedText(doc, `Número do Lacre: ${data.lacreNumero}`, MARGIN_LEFT, y);
        y += 10;
    }

    // --- SEÇÃO 2.2: VEÍCULOS (Se houver) ---
    if (data.veiculos && data.veiculos.length > 0) {
        doc.text("Veículos Apreendidos:", MARGIN_LEFT, y);
        y += 7;
        data.veiculos.forEach((veiculo, index) => {
            const veiculoText = `${index + 1}. Tipo: ${veiculo.tipo}, Marca/Modelo: ${veiculo.marcaModelo}, Placa: ${veiculo.placa}, Chassi: ${veiculo.chassi}, Cor: ${veiculo.cor}`;
            y = addWrappedText(doc, veiculoText, MARGIN_LEFT, y);
        });
        y += 10;
    }

    // --- SEÇÃO 2.3: OBJETOS APREENDIDOS (Se houver) ---
    if (data.objetosApreendidos && data.objetosApreendidos.length > 0) {
        doc.text("Objetos Apreendidos:", MARGIN_LEFT, y);
        y += 7;
        data.objetosApreendidos.forEach((objeto, index) => {
            const objetoText = `${index + 1}. Descrição: ${objeto.descricao}`;
            y = addWrappedText(doc, objetoText, MARGIN_LEFT, y);
        });
        y += 10;
    }

    // --- SEÇÃO 2.4: VÍTIMAS (Se houver) ---
    if (!isDrugCase && data.vitimas && data.vitimas.length > 0) {
        doc.text("Vítimas:", MARGIN_LEFT, y);
        y += 7;
        data.vitimas.forEach((vitima, index) => {
            const vitimaText = `${index + 1}. Nome: ${vitima.nome}, RG: ${vitima.rg}, Endereço: ${vitima.endereco}, Telefone: ${vitima.telefone}`;
            y = addWrappedText(doc, vitimaText, MARGIN_LEFT, y);
        });
        y += 10;
    }

    // --- SEÇÃO 2.5: VERSÕES DAS PARTES (Se houver) ---
    doc.text("Versões das Partes:", MARGIN_LEFT, y);
    y += 7;

    // Versão dos autores
    const autoresComRelatoVersao = data.autores ? data.autores.filter(a => a?.relato && a.relato.trim() !== '') : [];
    if (autoresComRelatoVersao.length > 0) {
        autoresComRelatoVersao.forEach(autor => {
            const relatoText = `Autor ${autor.nome}: ${autor.relato}`;
            y = addWrappedText(doc, relatoText, MARGIN_LEFT, y);
        });
    } else {
        y = addWrappedText(doc, "Autor(es) não apresentaram versão.", MARGIN_LEFT, y);
    }
    y += 10;

    // Versão das vítimas
    const vitimasComRelatoVersao = !isDrugCase ? (data.vitimas ? data.vitimas.filter(v => v?.relato && v.relato.trim() !== '') : []) : [];
    if (vitimasComRelatoVersao.length > 0) {
        vitimasComRelatoVersao.forEach(vitima => {
            const relatoText = `Vítima ${vitima.nome}: ${vitima.relato}`;
            y = addWrappedText(doc, relatoText, MARGIN_LEFT, y);
        });
    } else {
        y = addWrappedText(doc, "Vítima(s) não apresentou versão.", MARGIN_LEFT, y);
    }
    y += 10;

    // Versão das testemunhas
    const testemunhasComRelatoVersao = data.testemunhas ? data.testemunhas.filter(t => t?.relato && t.relato.trim() !== '') : [];
    if (testemunhasComRelatoVersao.length > 0) {
        testemunhasComRelatoVersao.forEach(testemunha => {
            const relatoText = `Testemunha ${testemunha.nome}: ${testemunha.relato}`;
            y = addWrappedText(doc, relatoText, MARGIN_LEFT, y);
        });
    } else {
        y = addWrappedText(doc, "Testemunha(s) não apresentaram versão.", MARGIN_LEFT, y);
    }
    y += 10;

    // --- SEÇÃO 3: HISTÓRICO ---
    const vitimasComRelato = !isDrugCase ? (data.vitimas ? data.vitimas.filter(v => v?.nome && v.nome.trim() !== '' && v.relato && v.relato.trim() !== '') : []) : [];
    const testemunhasComRelato = data.testemunhas ? data.testemunhas.filter(t => t?.nome && t.nome.trim() !== "" && t.relato && t.relato.trim() !== "") : [];

    let historicoText = data.relatoPolicial || '';
    
    doc.text("Histórico:", MARGIN_LEFT, y);
    y += 7;

    if (historicoText.trim() !== "") {
        y = addWrappedText(doc, historicoText, MARGIN_LEFT, y);
    } else {
        y = addWrappedText(doc, "Nenhum histórico adicionado.", MARGIN_LEFT, y);
    }
    y += 10;

    // --- SEÇÃO 4: COMPONENTES DA GUARNIÇÃO ---
    doc.text("Componentes da Guarnição:", MARGIN_LEFT, y);
    y += 7;

    if (data.componentesGuarnicao && data.componentesGuarnicao.length > 0) {
        data.componentesGuarnicao.forEach((componente, index) => {
            const componenteText = `${index + 1}. Nome: ${componente.nome}, Posto/Graduação: ${componente.posto}, RG: ${componente.rg}`;
            y = addWrappedText(doc, componenteText, MARGIN_LEFT, y);
        });
    } else {
        y = addWrappedText(doc, "Nenhum componente da guarnição adicionado.", MARGIN_LEFT, y);
    }
    y += 10;

    // --- SEÇÃO 5: ASSINATURAS (Opcional) ---
    doc.text("Assinaturas:", MARGIN_LEFT, y);
    y += 7;

    y += 20; // Espaço para as assinaturas

    // Adicionar data de geração
    const dataGeracao = new Date().toLocaleDateString();
    doc.text(`Gerado em: ${dataGeracao}`, MARGIN_LEFT, doc.internal.pageSize.height - 10);

    doc.save("tco.pdf");
};

export default generatePdf;
