import React, { useRef, useState, useEffect, useMemo } from "react"; // Added useMemo
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button"; // Button not used in the snippet for apreensoes/docs
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { X } from "lucide-react"; // X not used in the snippet for apreensoes/docs

interface DrugItem {
  id: string;
  quantidade: string;
  substancia: string;
  cor: string;
  odor: string;
  indicios: string;
  customMaterialDesc: string;
}

interface HistoricoTabProps {
  relatoPolicial: string;
  setRelatoPolicial: (value: string) => void;
  // relatoAutor: string; // Assuming individual author relato is handled
  // setRelatoAutor: (value: string) => void;
  // relatoVitima: string; // Assuming individual victim relato is handled
  // setRelatoVitima: (value: string) => void;
  // relatoTestemunha: string; // Assuming individual witness relato is handled
  // setRelatoTestemunha: (value: string) => void;
  apreensoes: string;
  setApreensoes: (value: string) => void;
  conclusaoPolicial: string;
  setConclusaoPolicial: (value: string) => void;
  // drugSeizure?: boolean; // Derived from natureza
  // representacao?: string; // Assuming individual victim representacao
  // setRepresentacao?: (value: string) => void;
  natureza: string;
  videoLinks?: string[];
  setVideoLinks?: (value: string[]) => void;
  solicitarCorpoDelito?: string;
  autorSexo?: string;
  providencias: string;
  setProvidencias: (value: string) => void;
  documentosAnexos: string;
  setDocumentosAnexos: (value: string) => void;
  lacreNumero?: string;
  vitimas?: {
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
    relato?: string;
    representacao?: string;
  }[];
  setVitimaRelato?: (index: number, relato: string) => void;
  setVitimaRepresentacao?: (index: number, representacao: string) => void;
  testemunhas?: {
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
    relato?: string;
  }[];
  setTestemunhaRelato?: (index: number, relato: string) => void;
  autores?: {
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
    relato?: string;
    fielDepositario?: string;
    objetoDepositado?: string;
  }[];
  setAutorRelato?: (index: number, relato: string) => void;
  allDrugsDetails?: DrugItem[];
}

const getDrugDisplayNameForApreensao = (substancia: string, cor: string): string => {
  if (substancia === "Vegetal" && cor === "Verde") return "MACONHA";
  if (substancia === "Artificial" && cor === "Branca") return "COCAÍNA";
  if (substancia === "Artificial" && cor === "Amarelada") return "PASTA BASE";
  return "NÃO IDENTIFICADA";
};


const HistoricoTab: React.FC<HistoricoTabProps> = ({
  relatoPolicial,
  setRelatoPolicial,
  apreensoes,
  setApreensoes,
  conclusaoPolicial,
  setConclusaoPolicial,
  natureza,
  videoLinks = [],
  setVideoLinks,
  solicitarCorpoDelito = "Não",
  autorSexo = "masculino",
  providencias,
  setProvidencias,
  documentosAnexos,
  setDocumentosAnexos,
  lacreNumero = "",
  vitimas = [],
  setVitimaRelato,
  setVitimaRepresentacao,
  testemunhas = [],
  setTestemunhaRelato,
  autores = [],
  setAutorRelato,
  allDrugsDetails = [],
}) => {
  const isDrugCase = natureza === "Porte de drogas para consumo";
  const [videoUrls, setVideoUrls] = useState<string>(videoLinks.join("\n"));
  
  const validVitimas = vitimas.filter(vitima => vitima.nome && vitima.nome.trim() !== "" && vitima.nome !== "O ESTADO");
  const validTestemunhas = testemunhas.filter(testemunha => 
    testemunha.nome && testemunha.nome.trim() !== "" && testemunha.nome !== "Não informado."
  );
  const validAutores = autores.filter(autor => 
    autor.nome && autor.nome.trim() !== "" && autor.nome !== "Não informado."
  );

  const handleVitimaRelatoChange = (index: number, value: string) => {
    if (setVitimaRelato) setVitimaRelato(index, value);
  };

  const handleVitimaRepresentacaoChange = (index: number, value: string) => {
    if (setVitimaRepresentacao) setVitimaRepresentacao(index, value);
  };

  const handleTestemunhaRelatoChange = (index: number, value: string) => {
    if (setTestemunhaRelato) setTestemunhaRelato(index, value);
  };

  const handleAutorRelatoChange = (index: number, value: string) => {
    if (setAutorRelato) setAutorRelato(index, value);
  };

  useEffect(() => {
    if (!providencias || providencias === "Não informado.") {
      const generoAutor = autorSexo?.toLowerCase() === "feminino" ? "AUTORA" : "AUTOR";
      if (isDrugCase) {
        setProvidencias(`${generoAutor} DO FATO CONDUZIDO ATÉ O CISC DO PARQUE DO LAGO PARA A CONFECÇÃO DESTE TCO.`);
      } else {
        setProvidencias(`${generoAutor} DO FATO E A VÍTIMA CONDUZIDOS ATÉ O CISC DO PARQUE DO LAGO PARA A CONFECÇÃO DESTE TCO.`);
      }
    }
  }, [isDrugCase, autorSexo, providencias, setProvidencias]);
  
  // Calculate apreensoes text for drug cases directly using useMemo
  const apreensoesTextForDrugCase = useMemo(() => {
    if (isDrugCase) { // Only calculate if it's a drug case
      if (allDrugsDetails && allDrugsDetails.length > 0) {
        const apreensoesItems = allDrugsDetails
          .filter(drug => drug.quantidade && drug.substancia && drug.cor)
          .map(drug => {
            let drugDescriptionPart;
            if (drug.customMaterialDesc && drug.customMaterialDesc.trim() !== "") {
              drugDescriptionPart = drug.customMaterialDesc.toUpperCase();
            } else {
              const knownName = getDrugDisplayNameForApreensao(drug.substancia, drug.cor);
              drugDescriptionPart = `SUBSTÂNCIA ANÁLOGA A ${knownName}`;
            }
            const quantidadeText = drug.quantidade ? drug.quantidade.toUpperCase() : "QUANTIDADE NÃO INFORMADA";
            return `- ${quantidadeText} DE ${drugDescriptionPart}, CONFORME FOTO EM ANEXO.`;
          });
        return apreensoesItems.join("\n");
      }
      return ""; // Return empty string if drug case but no drugs
    }
    return apreensoes; // For non-drug cases, return the prop value (managed by user input)
  }, [isDrugCase, allDrugsDetails, apreensoes]); // Dependency: apreensoes is for non-drug case fallback

  // Effect to inform the parent about the auto-generated apreensoes text for drug cases
  useEffect(() => {
    if (isDrugCase) {
      // Calculate the text based on current allDrugsDetails, similar to useMemo but for the effect
      let calculatedText = "";
      if (allDrugsDetails && allDrugsDetails.length > 0) {
         const apreensoesItems = allDrugsDetails
          .filter(drug => drug.quantidade && drug.substancia && drug.cor)
          .map(drug => {
            let drugDescriptionPart;
            if (drug.customMaterialDesc && drug.customMaterialDesc.trim() !== "") {
              drugDescriptionPart = drug.customMaterialDesc.toUpperCase();
            } else {
              const knownName = getDrugDisplayNameForApreensao(drug.substancia, drug.cor);
              drugDescriptionPart = `SUBSTÂNCIA ANÁLOGA A ${knownName}`;
            }
            const quantidadeText = drug.quantidade ? drug.quantidade.toUpperCase() : "QUANTIDADE NÃO INFORMADA";
            return `- ${quantidadeText} DE ${drugDescriptionPart}, CONFORME FOTO EM ANEXO.`;
          });
        calculatedText = apreensoesItems.join("\n");
      }

      if (calculatedText !== apreensoes) { // Compare with the current prop value from parent
        setApreensoes(calculatedText);
      }
    }
    // For non-drug cases, setApreensoes is called directly by the Textarea's onChange
  }, [isDrugCase, allDrugsDetails, apreensoes, setApreensoes]);


  // Effect to update documentosAnexos
  useEffect(() => {
    let newAnexosArray = ["TERMO DE COMPROMISSO"];
    
    if (!isDrugCase) {
      newAnexosArray.push("TERMO DE MANIFESTAÇÃO");
    }
    
    const hasFielDepositario = autores.some(a => a.fielDepositario === "Sim");
    if (hasFielDepositario) {
      newAnexosArray.push("TERMO DE DEPÓSITO");
    }

    // Use the current value of 'apreensoes' prop, which should be up-to-date
    // due to the effect above (for drug cases) or user input (for non-drug cases).
    if (apreensoes && apreensoes.trim() !== "") {
      newAnexosArray.push("TERMO DE APREENSÃO");
    }
    
    if (isDrugCase) {
      newAnexosArray.push(`TERMO DE CONSTATAÇÃO PRELIMINAR DE DROGA${lacreNumero ? ` LACRE Nº ${lacreNumero}` : ''}`);
      newAnexosArray.push("REQUISIÇÃO DE EXAME EM DROGAS DE ABUSO");
    }
    
    if (solicitarCorpoDelito === "Sim") {
      const generoSuffix = autorSexo?.toLowerCase() === "feminino" ? "A" : "O";
      newAnexosArray.push(`REQUISIÇÃO DE EXAME DE LESÃO CORPORAL D${generoSuffix} ${autorSexo?.toLowerCase() === "feminino" ? "AUTORA" : "AUTOR"}`);
    }
    
    const newAnexosText = newAnexosArray.join("\n");
    if (newAnexosText !== documentosAnexos) {
      setDocumentosAnexos(newAnexosText);
    }
  }, [
    isDrugCase, 
    apreensoes, // This is now the single source of truth for apreensoes text in this effect
    solicitarCorpoDelito, 
    autorSexo, 
    lacreNumero, 
    autores, 
    documentosAnexos, 
    setDocumentosAnexos
  ]);

  useEffect(() => {
    // This effect seems fine, no changes needed based on the video
    if (conclusaoPolicial) {
      let updatedConclusion = conclusaoPolicial;
      const generoSuffix = autorSexo?.toLowerCase() === "feminino" ? "A" : "O";
      if (solicitarCorpoDelito === "Sim") {
        if (updatedConclusion.includes("LIBERADO SEM LESÕES CORPORAIS APARENTES") || 
            updatedConclusion.includes("liberado sem lesões corporais aparentes")) {
          updatedConclusion = updatedConclusion.replace(
            /LIBERADO SEM LESÕES CORPORAIS APARENTES|liberado sem lesões corporais aparentes/gi, 
            `LIBERAD${generoSuffix} COM LESÕES CORPORAIS APARENTES CONFORME AUTO DE RESISTENCIA`
          );
           if (updatedConclusion !== conclusaoPolicial) {
             setConclusaoPolicial(updatedConclusion);
           }
        }
      }
    }
  }, [solicitarCorpoDelito, conclusaoPolicial, autorSexo, setConclusaoPolicial]);


  const handleVideoUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const urls = e.target.value;
    setVideoUrls(urls);
    if (setVideoLinks) {
      setVideoLinks(urls.split("\n").filter(url => url.trim() !== ""));
    }
  };

  return <div className="border rounded-lg shadow-sm bg-white">
      <div className="p-6">
        <h3 className="text-2xl font-semibold flex items-center">Histórico</h3>
      </div>
      <div className="p-6 space-y-6 px-[6px]">
        <div>
          <Label htmlFor="relatoPolicial">RELATÓRIO POLICIAL</Label>
          <Textarea id="relatoPolicial" placeholder="Descreva o relato policial" value={relatoPolicial} onChange={e => setRelatoPolicial(e.target.value)} className="min-h-[150px]" />
        </div>
        
        {validAutores.length > 0 && (
          <div>
            {validAutores.map((autor, index) => (
                <div key={`autor-relato-${index}`} className="mb-6">
                  <Label htmlFor={`relatoAutor-${index}`}>RELATO DO AUTOR {autor.nome}</Label>
                  <Textarea 
                    id={`relatoAutor-${index}`} 
                    placeholder={`Descreva o relato do autor ${autor.nome}`} 
                    value={autor.relato || "O AUTOR DOS FATOS ABAIXO ASSINADO, JÁ QUALIFICADO NOS AUTOS, CIENTIFICADO DE SEUS DIREITOS CONSTITUCIONAIS INCLUSIVE O DE PERMANECER EM SILÊNCIO, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO."} 
                    onChange={e => handleAutorRelatoChange(index, e.target.value)} 
                    className="min-h-[150px]" 
                  />
                </div>
              ))}
          </div>
        )}
        
        {validVitimas.length > 0 && 
          validVitimas.map((vitima, index) => (
            <div key={`vitima-relato-${index}`} className="space-y-4">
              <div>
                <Label htmlFor={`relatoVitima-${index}`}>RELATO DA VÍTIMA {vitima.nome}</Label>
                <Textarea 
                  id={`relatoVitima-${index}`} 
                  placeholder={`Descreva o relato da vítima ${vitima.nome}`} 
                  value={vitima.relato || "RELATOU A VÍTIMA, ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO."} 
                  onChange={e => handleVitimaRelatoChange(index, e.target.value)} 
                  className="min-h-[150px]" 
                />
              </div>
              
              <div className="mt-4 p-4 border rounded-md">
                <Label className="font-bold mb-2 block">REPRESENTAÇÃO DA VÍTIMA {vitima.nome}</Label>
                <RadioGroup 
                  value={vitima.representacao || ""} 
                  onValueChange={(value) => handleVitimaRepresentacaoChange(index, value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="representar" id={`representa-${index}`} />
                    <Label htmlFor={`representa-${index}`}>Vítima deseja representar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="decidir_posteriormente" id={`posteriormente-${index}`} />
                    <Label htmlFor={`posteriormente-${index}`}>Representação posterior (6 meses)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          ))
        }
        
        {validTestemunhas.length > 0 && (
          <div>
            {validTestemunhas.map((testemunha, index) => (
                <div key={`testemunha-relato-${index}`} className="mb-6">
                  <Label htmlFor={`relatoTestemunha-${index}`}>RELATO DA TESTEMUNHA {testemunha.nome}</Label>
                  <Textarea 
                    id={`relatoTestemunha-${index}`} 
                    placeholder={`Descreva o relato da testemunha ${testemunha.nome}`} 
                    value={testemunha.relato || "A TESTEMUNHA ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, COMPROMISSADA NA FORMA DA LEI, QUE AOS COSTUMES RESPONDEU NEGATIVAMENTE OU QUE É AMIGA/PARENTE DE UMA DAS PARTES, DECLAROU QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSERAM E NEM LHE FOI PERGUNTADO."} 
                    onChange={e => handleTestemunhaRelatoChange(index, e.target.value)} 
                    className="min-h-[150px]" 
                  />
                </div>
              ))}
          </div>
        )}
        
        <div>
          <Label htmlFor="apreensoes">OBJETOS/DOCUMENTOS APREENDIDOS</Label>
          <Textarea 
            id="apreensoes" 
            placeholder={isDrugCase ? "Gerado automaticamente com base nas drogas informadas" : "Descreva os objetos ou documentos apreendidos, se houver"} 
            value={isDrugCase ? apreensoesTextForDrugCase : apreensoes} // Display derived or prop value
            onChange={e => {
              if (!isDrugCase) { 
                setApreensoes(e.target.value); // Allow direct edit only if not a drug case
              }
            }}
            className="min-h-[100px]"
            readOnly={isDrugCase} 
          />
          <p className="text-xs text-muted-foreground mt-1">
            {isDrugCase 
              ? "Lista de drogas apreendidas gerada automaticamente. Use um lacre único para todas as drogas." 
              : "Se houver apreensões, o Termo de Apreensão será gerado automaticamente no PDF."
            }
          </p>
        </div>
        
        <div>
          <Label htmlFor="providencias">PROVIDÊNCIAS</Label>
          <Textarea id="providencias" placeholder="Descreva as providências tomadas" value={providencias} onChange={e => setProvidencias(e.target.value)} className="min-h-[100px]" />
        </div>
        
        <div>
          <Label htmlFor="documentosAnexos">DOCUMENTOS ANEXOS</Label>
          <Textarea 
            id="documentosAnexos" 
            placeholder="Documentos anexos ao TCO" 
            value={documentosAnexos} 
            readOnly 
            className="min-h-[100px]" 
          />
          <p className="text-xs text-muted-foreground mt-1">
            Lista de documentos gerada automaticamente com base nas informações do TCO.
          </p>
        </div>
        
        <div>
          <Label htmlFor="conclusaoPolicial">CONCLUSÃO POLICIAL</Label>
          <Textarea id="conclusaoPolicial" placeholder="Descreva a conclusão policial" value={conclusaoPolicial} onChange={e => setConclusaoPolicial(e.target.value)} className="min-h-[150px]" />
          {solicitarCorpoDelito === "Sim" && (
            <p className="text-xs text-green-600 mt-1">
              Observação: O texto será ajustado para indicar que o autor possui lesões corporais aparentes.
            </p>
          )}
        </div>
      </div>
    </div>;
};

export default HistoricoTab;
