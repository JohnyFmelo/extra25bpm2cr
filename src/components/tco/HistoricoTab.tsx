import React, { useRef, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X } from "lucide-react";

interface HistoricoTabProps {
  relatoPolicial: string;
  setRelatoPolicial: (value: string) => void;
  relatoAutor: string;
  setRelatoAutor: (value: string) => void;
  relatoVitima: string;
  setRelatoVitima: (value: string) => void;
  relatoTestemunha: string;
  setRelatoTestemunha: (value: string) => void;
  apreensoes: string;
  setApreensoes: (value: string) => void;
  conclusaoPolicial: string;
  setConclusaoPolicial: (value: string) => void;
  drugSeizure?: boolean;
  representacao?: string;
  setRepresentacao?: (value: string) => void;
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
  setVitimaRelato?: (index: number, relato: string) => void;
  setVitimaRepresentacao?: (index: number, representacao: string) => void;
  setTestemunhaRelato?: (index: number, relato: string) => void;
}

const HistoricoTab: React.FC<HistoricoTabProps> = ({
  relatoPolicial,
  setRelatoPolicial,
  relatoAutor,
  setRelatoAutor,
  relatoVitima,
  setRelatoVitima,
  relatoTestemunha,
  setRelatoTestemunha,
  apreensoes,
  setApreensoes,
  conclusaoPolicial,
  setConclusaoPolicial,
  drugSeizure = false,
  representacao = "",
  setRepresentacao,
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
  testemunhas = [],
  setVitimaRelato,
  setVitimaRepresentacao,
  setTestemunhaRelato
}) => {
  // Check if it's a drug consumption case
  const isDrugCase = natureza === "Porte de drogas para consumo";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<{
    file: File;
    id: string;
  }[]>([]);
  const [videoUrls, setVideoUrls] = useState<string>(videoLinks.join("\n"));
  
  // Set default providencias text based on the case type
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
  
  // Update documentos anexos based on conditions
  useEffect(() => {
    let anexos = ["TERMO DE COMPROMISSO"];
    
    // Add terms based on conditions
    if (!isDrugCase) {
      anexos.push("TERMO DE MANIFESTAÇÃO");
    }
    
    if (apreensoes && apreensoes.trim() !== "") {
      anexos.push("TERMO DE APREENSÃO");
    }
    
    if (isDrugCase) {
      anexos.push(`TERMO DE CONSTATAÇÃO PRELIMINAR DE DROGA${lacreNumero ? ` LACRE Nº ${lacreNumero}` : ''}`);
      anexos.push("REQUISIÇÃO DE EXAME EM DROGAS DE ABUSO");
    }
    
    if (solicitarCorpoDelito === "Sim") {
      const generoSuffix = autorSexo?.toLowerCase() === "feminino" ? "A" : "O";
      anexos.push(`REQUISIÇÃO DE EXAME DE LESÃO CORPORAL D${generoSuffix} ${autorSexo?.toLowerCase() === "feminino" ? "AUTORA" : "AUTOR"}`);
    }
    
    setDocumentosAnexos(anexos.join("\n"));
  }, [isDrugCase, apreensoes, solicitarCorpoDelito, autorSexo, setDocumentosAnexos, lacreNumero]);

  // Update the conclusion text based on solicitarCorpoDelito
  useEffect(() => {
    if (conclusaoPolicial) {
      let updatedConclusion = conclusaoPolicial;
      const generoSuffix = autorSexo?.toLowerCase() === "feminino" ? "A" : "O";
      
      // Replace the text based on conditional logic
      if (solicitarCorpoDelito === "Sim") {
        // Check if we need to replace the text about "sem lesões corporais"
        if (updatedConclusion.includes("LIBERADO SEM LESÕES CORPORAIS APARENTES") || 
            updatedConclusion.includes("liberado sem lesões corporais aparentes")) {
          updatedConclusion = updatedConclusion.replace(
            /LIBERADO SEM LESÕES CORPORAIS APARENTES|liberado sem lesões corporais aparentes/gi, 
            `LIBERAD${generoSuffix} COM LESÕES CORPORAIS APARENTES CONFORME AUTO DE RESISTENCIA`
          );
          setConclusaoPolicial(updatedConclusion);
        }
      }
    }
  }, [solicitarCorpoDelito, conclusaoPolicial, autorSexo, setConclusaoPolicial]);

  useEffect(() => {
    return () => {
      selectedFiles.forEach(({
        file
      }) => {
        URL.revokeObjectURL(URL.createObjectURL(file));
      });
    };
  }, [selectedFiles]);

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (validFiles.length === 0) {
        console.warn("Nenhum arquivo de imagem válido selecionado.");
        return;
      }
      const newFiles = validFiles.map(file => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
      const fileNames = newFiles.map(({
        file
      }) => file.name).join(', ');
      console.log(`Selected files: ${fileNames}`);
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter(fileObj => fileObj.id !== id);
      return newFiles;
    });
  };

  const handleVideoUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const urls = e.target.value;
    setVideoUrls(urls);
    if (setVideoLinks) {
      setVideoLinks(urls.split("\n").filter(url => url.trim() !== ""));
    }
  };

  const truncateFileName = (name: string, maxLength: number = 15): string => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength - 3) + "...";
  };

  // Helper function to handle victim testimony changes
  const handleVitimaRelatoChange = (index: number, value: string) => {
    if (setVitimaRelato) {
      setVitimaRelato(index, value);
    }
  };

  // Helper function to handle victim representation changes
  const handleVitimaRepresentacaoChange = (index: number, value: string) => {
    if (setVitimaRepresentacao) {
      setVitimaRepresentacao(index, value);
    }
  };

  // Helper function to handle witness testimony changes
  const handleTestemunhaRelatoChange = (index: number, value: string) => {
    if (setTestemunhaRelato) {
      setTestemunhaRelato(index, value);
    }
  };

  // Get valid victims and witnesses
  const validVitimas = vitimas.filter(vitima => vitima.nome && vitima.nome.trim() !== "" && vitima.nome !== "O ESTADO");
  const validTestemunhas = testemunhas.filter(testemunha => testemunha.nome && testemunha.nome.trim() !== "");

  return <div className="border rounded-lg shadow-sm bg-white">
      <div className="p-6">
        <h3 className="text-2xl font-semibold flex items-center">Histórico</h3>
      </div>
      <div className="p-6 space-y-6 px-[6px]">
        <div>
          <Label htmlFor="relatoPolicial">RELATÓRIO POLICIAL</Label>
          <Textarea id="relatoPolicial" placeholder="Descreva o relato policial" value={relatoPolicial} onChange={e => setRelatoPolicial(e.target.value)} className="min-h-[150px]" />
        </div>
        
        <div>
          <Label htmlFor="relatoAutor">RELATO DO AUTOR</Label>
          <Textarea id="relatoAutor" placeholder="Descreva o relato do autor" value={relatoAutor} onChange={e => setRelatoAutor(e.target.value)} className="min-h-[150px]" />
        </div>
        
        {/* Only show victim fields if it's NOT a drug case AND we have valid victims */}
        {!isDrugCase && validVitimas.length > 0 && 
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
        
        {/* Testemunhas section - now individual */}
        {validTestemunhas.length > 0 && 
          validTestemunhas.map((testemunha, index) => (
            <div key={`testemunha-relato-${index}`} className="space-y-4">
              <div>
                <Label htmlFor={`relatoTestemunha-${index}`}>RELATO DA TESTEMUNHA {testemunha.nome}</Label>
                <Textarea 
                  id={`relatoTestemunha-${index}`} 
                  placeholder={`Descreva o relato da testemunha ${testemunha.nome}`} 
                  value={testemunha.relato || "RELATOU A TESTEMUNHA, ABAIXO ASSINADA, JÁ QUALIFICADA NOS AUTOS, QUE [INSIRA DECLARAÇÃO]. LIDO E ACHADO CONFORME. NADA MAIS DISSE E NEM LHE FOI PERGUNTADO."} 
                  onChange={e => handleTestemunhaRelatoChange(index, e.target.value)} 
                  className="min-h-[150px]" 
                />
              </div>
            </div>
          ))
        }

        {/* Fallback for old single witness field if no individual witnesses */}
        {validTestemunhas.length === 0 && (
          <div>
            <Label htmlFor="relatoTestemunha">RELATO DA TESTEMUNHA</Label>
            <Textarea id="relatoTestemunha" placeholder="Descreva o relato da testemunha" value={relatoTestemunha} onChange={e => setRelatoTestemunha(e.target.value)} className="min-h-[150px]" />
          </div>
        )}
        
        <div>
          <Label htmlFor="apreensoes">OBJETOS/DOCUMENTOS APREENDIDOS</Label>
          <Textarea id="apreensoes" placeholder="Descreva os objetos ou documentos apreendidos, se houver" value={apreensoes} onChange={e => setApreensoes(e.target.value)} className="min-h-[100px]" />
          <p className="text-xs text-muted-foreground mt-1">
            {!isDrugCase ? "Se houver apreensões, o Termo de Apreensão será gerado automaticamente no PDF." : "Para casos de drogas, o Termo de Apreensão será gerado automaticamente."}
          </p>
        </div>
        
        <div>
          <Label htmlFor="providencias">PROVIDÊNCIAS</Label>
          <Textarea id="providencias" placeholder="Descreva as providências tomadas" value={providencias} onChange={e => setProvidencias(e.target.value)} className="min-h-[100px]" />
        </div>
        
        <div>
          <Label htmlFor="documentosAnexos">DOCUMENTOS ANEXOS</Label>
          <Textarea id="documentosAnexos" placeholder="Documentos anexos ao TCO" value={documentosAnexos} onChange={e => setDocumentosAnexos(e.target.value)} className="min-h-[100px]" readOnly />
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
