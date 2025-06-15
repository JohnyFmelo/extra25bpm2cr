
import { MARGIN_TOP, addStandardFooterContent, addNewPage, getPageConstants } from './pdfUtils.js';

const ensureString = (value, fallback = 'Não informado') => {
    if (value === null || value === undefined || value === '') {
        return fallback;
    }
    return String(value);
};

export const addTermoDeposito = (doc, data) => {
    const { PAGE_WIDTH, MARGIN_LEFT, MARGIN_RIGHT } = getPageConstants(doc);

    const depositarios = data.autores.filter(autor => autor.fielDepositario === 'Sim');

    depositarios.forEach((depositario, index) => {
        addNewPage(doc, data, false);
        let y = MARGIN_TOP;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("TERMO DE DEPÓSITO", PAGE_WIDTH / 2, y, { align: 'center' });
        y += 15;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        const policialPrincipal = data.componentesGuarnicao?.[0] || { graduacao: 'POLICIAL', nome: 'NÃO IDENTIFICADO', rg: 'N/A' };
        
        const textoPrincipal = `Aos ${ensureString(data.dataFatoExtenso, 'data não informada')}, nesta cidade de ${ensureString(data.cidadeFato, 'cidade não informada')}, no local da ocorrência, eu, ${ensureString(policialPrincipal.graduacao)} ${ensureString(policialPrincipal.nome)}, RG nº ${ensureString(policialPrincipal.rg)}, nomeio FIEL DEPOSITÁRIO o(a) Sr(a). ${ensureString(depositario.nome, 'Nome não informado')}, portador(a) do RG nº ${ensureString(depositario.rg, 'N/A')} e CPF nº ${ensureString(depositario.cpf, 'N/A')}, residente e domiciliado(a) no endereço ${ensureString(depositario.endereco, 'Endereço não informado')}, o qual se compromete a manter sob sua guarda e conservação, sem ônus para o Estado, o(s) seguinte(s) bem(ns):`;
        const splitText = doc.splitTextToSize(textoPrincipal, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT);
        doc.text(splitText, MARGIN_LEFT, y);
        y += doc.getTextDimensions(splitText).h + 10;
        
        doc.setFont("helvetica", "bold");
        doc.text("BEM(NS) DEPOSITADO(S):", MARGIN_LEFT, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const objetoText = doc.splitTextToSize(ensureString(depositario.objetoDepositado, "Nenhum objeto descrito."), PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT);
        doc.text(objetoText, MARGIN_LEFT, y);
        y += doc.getTextDimensions(objetoText).h + 10;

        const textoCompromisso = `O(A) depositário(a) assume o compromisso de não usar, dispor ou onerar o(s) bem(ns) depositado(s), devendo apresentá-lo(s) em juízo ou a quem de direito quando solicitado, sob as penas da lei (art. 652 do Código Civil e art. 168 do Código Penal). E, para constar, lavrei o presente termo que, depois de lido e achado conforme, vai devidamente assinado.`;
        const splitCompromisso = doc.splitTextToSize(textoCompromisso, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT);
        doc.text(splitCompromisso, MARGIN_LEFT, y);
        y += doc.getTextDimensions(splitCompromisso).h + 25;

        // Assinaturas
        doc.text("________________________________________", PAGE_WIDTH / 2, y, { align: 'center' });
        y += 5;
        doc.text(ensureString(depositario.nome, '').toUpperCase(), PAGE_WIDTH / 2, y, { align: 'center' });
        y += 5;
        doc.text("Fiel Depositário(a)", PAGE_WIDTH / 2, y, { align: 'center' });
        y += 20;

        doc.text("________________________________________", PAGE_WIDTH / 2, y, { align: 'center' });
        y += 5;
        doc.text(`${ensureString(policialPrincipal.graduacao, '').toUpperCase()} ${ensureString(policialPrincipal.nome, '').toUpperCase()}`, PAGE_WIDTH / 2, y, { align: 'center' });
        y += 5;
        doc.text("Policial Militar", PAGE_WIDTH / 2, y, { align: 'center' });

        addStandardFooterContent(doc);
    });
};
