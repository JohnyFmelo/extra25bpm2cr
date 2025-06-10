// pdfGenerator.ts

// ... (other imports and functions)

export const generatePDF = async (inputData: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        // ... (timeout, initial jsPDF setup)
        try {
            // ... (juizado data validation, data cloning)

            // Pega as constantes da página
            // ...

            // --- PÁGINA 1: AUTUAÇÃO ---
            // ...

            // --- RESTANTE DO TCO (PÁGINAS 2+) ---
            yPosition = addNewPage(doc, data); // This is likely for the HISTORICO section start

            const isDroga = data.natureza === "Porte de drogas para consumo"; // Or your primary drug case check
            const documentosAnexosList = [];

            // ... (adding other terms to documentosAnexosList)

            // Adicionar termo de depósito se algum autor for fiel depositário
            let temFielDepositario = false;
            if (Array.isArray(data.autores)) {
                temFielDepositario = data.autores.some(
                    (a: any) => a && typeof a.fielDepositario === 'string'
                        && a.fielDepositario.trim().toLowerCase() === 'sim'
                );
            }
            // *** CRITICAL LOGGING POINT 1 ***
            console.log("[pdfGenerator] Verificando Fiel Depositário. Encontrado:", temFielDepositario);
            if (temFielDepositario) {
                documentosAnexosList.push("TERMO DE DEPÓSITO");
                console.log("[pdfGenerator] 'TERMO DE DEPÓSITO' adicionado à lista de anexos.");
            } else {
                console.log("[pdfGenerator] Nenhum Fiel Depositário encontrado, 'TERMO DE DEPÓSITO' NÃO adicionado à lista de anexos.");
            }


            // ... (adding other terms to documentosAnexosList like apreensao, constatacao, etc.)


            // Atualizar os dados com a lista de documentos anexos
            const updatedData = {
                ...data,
                documentosAnexos: documentosAnexosList.join('\n')
            };

            // --- SEÇÕES 1-5: Histórico, Envolvidos, etc. ---
            generateHistoricoContent(doc, yPosition, updatedData) // Assuming yPosition is correctly passed here
                .then(() => {
                    // --- ADIÇÃO DOS TERMOS ---
                    // ... (addTermoCompromisso, addTermoManifestacao)

                    try {
                        // Adicionando a chamada condicional para o Termo de Depósito
                        if (temFielDepositario) {
                            // *** CRITICAL LOGGING POINT 2 ***
                            console.log("[pdfGenerator] CHAMANDO addTermoDeposito com dados:", JSON.stringify(updatedData.autores, null, 2));
                            addTermoDeposito(doc, updatedData); // PASSING THE WHOLE `updatedData`
                        } else {
                             console.log("[pdfGenerator] PULANDO addTermoDeposito pois temFielDepositario é false.");
                        }
                    } catch (error) {
                        console.error("[pdfGenerator] Erro DENTRO DO BLOCO try/catch ao chamar addTermoDeposito:", error, error.stack);
                    }

                    // ... (addTermoApreensao, etc.)

                    // ... (pagination, save, resolve)
                })
                .catch(histError => {
                    clearTimeout(timeout);
                    console.error("[pdfGenerator] Erro ao gerar histórico do PDF, não chegou a chamar termos:", histError, histError.stack);
                    reject(new Error(`Erro ao gerar histórico do PDF: ${histError.message}`));
                });
        } catch (error) {
            clearTimeout(timeout);
            console.error("[pdfGenerator] Erro GERAL na geração do PDF, antes de generateHistoricoContent ou try/catch dos termos:", error, error.stack);
            reject(new Error(`Erro na geração do PDF: ${error.message}`));
        }
    });
};
