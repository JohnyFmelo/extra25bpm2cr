import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  natureza: string; // Added prop
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
  natureza
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; id: string }[]>([]);

  // Clean up object URLs when files are removed or component unmounts
  useEffect(() => {
    return () => {
      selectedFiles.forEach(({ file }) => {
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
      const fileNames = newFiles.map(({ file }) => file.name).join(', ');
      console.log(`Selected files: ${fileNames}`);
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter(fileObj => fileObj.id !== id);
      return newFiles;
    });
  };

  // Função para encurtar o nome do arquivo
  const truncateFileName = (name: string, maxLength: number = 15): string => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength - 3) + "...";
  };

  const isDrugCase = natureza === "Porte de drogas para consumo";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          HISTÓRICO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="relatoPolicial">RELATÓRIO POLICIAL</Label>
          <Textarea 
            id="relatoPolicial" 
            placeholder="Descreva o relato policial" 
            value={relatoPolicial} 
            onChange={e => setRelatoPolicial(e.target.value)} 
            className="min-h-[150px]"
          />
        </div>
        
        <div>
          <Label htmlFor="relatoAutor">RELATO DO AUTOR</Label>
          <Textarea 
            id="relatoAutor" 
            placeholder="Descreva o relato do autor" 
            value={relatoAutor} 
            onChange={e => setRelatoAutor(e.target.value)} 
            className="min-h-[150px]"
          />
        </div>
        
        {!isDrugCase && (
          <div>
            <Label htmlFor="relatoVitima">RELATO DA VÍTIMA</Label>
            <Textarea 
              id="relatoVitima" 
              placeholder="Descreva o relato da vítima" 
              value={relatoVitima} 
              onChange={e => setRelatoVitima(e.target.value)} 
              className="min-h-[150px]"
            />
            
            {setRepresentacao && (
              <div className="mt-4 p-4 border rounded-md">
                <Label className="font-bold mb-2 block">Representação da Vítima</Label>
                <RadioGroup value={representacao} onValueChange={setRepresentacao}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Representa" id="representa" />
                    <Label htmlFor="representa">Vítima deseja representar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Posteriormente" id="posteriormente" />
                    <Label htmlFor="posteriormente">Representação posterior (6 meses)</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        )}
        
        <div>
          <Label htmlFor="relatoTestemunha">RELATO DA TESTEMUNHA</Label>
          <Textarea 
            id="relatoTestemunha" 
            placeholder="Descreva o relato da testemunha" 
            value={relatoTestemunha} 
            onChange={e => setRelatoTestemunha(e.target.value)} 
            className="min-h-[150px]"
          />
        </div>
        
        <div>
          <Label htmlFor="apreensoes">OBJETOS/DOCUMENTOS APREENDIDOS</Label>
          <Textarea 
            id="apreensoes" 
            placeholder="Descreva os objetos ou documentos apreendidos, se houver" 
            value={apreensoes} 
            onChange={e => setApreensoes(e.target.value)} 
            className="min-h-[100px]"
          />
          <div className="mt-2">
            <input 
              type="file" 
              id="fileUpload" 
              ref={fileInputRef}
              className="hidden" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
            />
            <Button 
              type="button" 
              variant="outline"
              className="mt-2"
              onClick={handleFileUploadClick}
            >
              Anexar Fotos
            </Button>
            <div className="mt-2">
              {selectedFiles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {selectedFiles.map(({ file, id }) => (
                    <div key={id} className="relative w-24">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-24 h-24 object-cover rounded-md border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 h-6 w-6 rounded-full z-10"
                        onClick={() => handleRemoveFile(id)}
                        aria-label={`Remover ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p 
                        className="text-xs text-gray-500 mt-1 truncate" 
                        title={file.name}
                      >
                        {truncateFileName(file.name)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Selecione os arquivos de imagem para anexar
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="conclusaoPolicial">CONCLUSÃO POLICIAL</Label>
          <Textarea 
            id="conclusaoPolicial" 
            placeholder="Descreva a conclusão policial" 
            value={conclusaoPolicial} 
            onChange={e => setConclusaoPolicial(e.target.value)} 
ATerm: 150px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricoTab;
