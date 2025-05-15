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
  setVideoLinks
}) => {
  // Check if it's a drug consumption case
  const isDrugCase = natureza === "Porte de drogas para consumo";
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<{
    file: File;
    id: string;
  }[]>([]);
  const [videoUrls, setVideoUrls] = useState<string>(videoLinks.join("\n"));

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

  return (
    <div className="border rounded-lg shadow-sm bg-white">
      <div className="p-6">
        <h3 className="text-2xl font-semibold flex items-center">Histórico</h3>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <Label htmlFor="relatoPolicial">RELATÓRIO POLICIAL</Label>
          <Textarea id="relatoPolicial" placeholder="Descreva o relato policial" value={relatoPolicial} onChange={e => setRelatoPolicial(e.target.value)} className="min-h-[150px]" />
        </div>
        
        <div>
          <Label htmlFor="relatoAutor">RELATO DO AUTOR</Label>
          <Textarea id="relatoAutor" placeholder="Descreva o relato do autor" value={relatoAutor} onChange={e => setRelatoAutor(e.target.value)} className="min-h-[150px]" />
        </div>
        
        {/* Only show victim fields if it's NOT a drug case */}
        {!isDrugCase && (
          <div>
            <Label htmlFor="relatoVitima">RELATO DA VÍTIMA</Label>
            <Textarea id="relatoVitima" placeholder="Descreva o relato da vítima" value={relatoVitima} onChange={e => setRelatoVitima(e.target.value)} className="min-h-[150px]" />
            
            {setRepresentacao && (
              <div className="mt-4 p-4 border rounded-md">
                <Label className="font-bold mb-2 block">Representação da Vítima</Label>
                <RadioGroup value={representacao} onValueChange={setRepresentacao}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="representar" id="representa" />
                    <Label htmlFor="representa">Vítima deseja representar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="decidir_posteriormente" id="posteriormente" />
                    <Label htmlFor="posteriormente">Representação posterior (6 meses)</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        )}
        
        <div>
          <Label htmlFor="relatoTestemunha">RELATO DA TESTEMUNHA</Label>
          <Textarea id="relatoTestemunha" placeholder="Descreva o relato da testemunha" value={relatoTestemunha} onChange={e => setRelatoTestemunha(e.target.value)} className="min-h-[150px]" />
        </div>
        
        <div>
          <Label htmlFor="apreensoes">OBJETOS/DOCUMENTOS APREENDIDOS</Label>
          <Textarea id="apreensoes" placeholder="Descreva os objetos ou documentos apreendidos, se houver" value={apreensoes} onChange={e => setApreensoes(e.target.value)} className="min-h-[100px]" />
        </div>
        
        <div>
          <Label htmlFor="conclusaoPolicial">CONCLUSÃO POLICIAL</Label>
          <Textarea id="conclusaoPolicial" placeholder="Descreva a conclusão policial" value={conclusaoPolicial} onChange={e => setConclusaoPolicial(e.target.value)} className="min-h-[150px]" />
        </div>
      </div>
    </div>
  );
};

export default HistoricoTab;
