
import React, { useRef, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, Upload, Trash2 } from "lucide-react";

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
  imageBase64?: { name: string; data: string }[];
  setImageBase64?: (value: { name: string; data: string }[]) => void;
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
  imageBase64 = [],
  setImageBase64
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<{
    file: File;
    id: string;
    preview?: string;
  }[]>([]);
  const [videoUrls, setVideoUrls] = useState<string>(videoLinks.join("\n"));

  // Initialize with existing images if available
  useEffect(() => {
    if (imageBase64 && imageBase64.length > 0) {
      const existingFiles = imageBase64.map(img => ({
        id: `existing-${img.name}-${Date.now()}`,
        preview: img.data,
        file: new File([], img.name)
      }));
      setSelectedFiles(existingFiles);
    }
  }, []);

  useEffect(() => {
    // Clean up object URLs to prevent memory leaks
    return () => {
      selectedFiles.forEach(({file, preview}) => {
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
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

      const newFiles = validFiles.map(file => {
        const preview = URL.createObjectURL(file);
        return {
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          preview
        };
      });

      setSelectedFiles(prev => [...prev, ...newFiles]);

      // Convert files to base64 and update parent component
      if (setImageBase64) {
        const promises = validFiles.map(file => {
          return new Promise<{name: string, data: string}>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                name: file.name,
                data: e.target?.result as string
              });
            };
            reader.readAsDataURL(file);
          });
        });

        Promise.all(promises).then(newImages => {
          setImageBase64([...imageBase64, ...newImages]);
        });
      }
    }
  };

  const handleRemoveFile = (id: string) => {
    const fileToRemove = selectedFiles.find(file => file.id === id);
    
    setSelectedFiles(prev => {
      const newFiles = prev.filter(fileObj => fileObj.id !== id);
      return newFiles;
    });

    // Also remove from imageBase64 if it exists
    if (setImageBase64 && fileToRemove) {
      setImageBase64(imageBase64.filter(img => !img.name.includes(fileToRemove.file.name)));
    }
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

  const isDrugCase = natureza === "Porte de drogas para consumo";

  return (
    <div className="border rounded-lg shadow-sm bg-white">
      <div className="p-6">
        <h3 className="text-2xl font-semibold flex items-center">Histórico</h3>
      </div>
      <div className="p-6 space-y-6">
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
        </div>
        
        <div>
          <Label htmlFor="conclusaoPolicial">CONCLUSÃO POLICIAL</Label>
          <Textarea 
            id="conclusaoPolicial" 
            placeholder="Descreva a conclusão policial" 
            value={conclusaoPolicial} 
            onChange={e => setConclusaoPolicial(e.target.value)} 
            className="min-h-[150px]" 
          />
        </div>
        
        {/* Image upload section */}
        <div className="border rounded-md p-4">
          <Label className="font-bold mb-2 block">Imagens do Histórico</Label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
          />
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedFiles.map(({file, id, preview}) => (
              <div key={id} className="relative border rounded p-1 w-24 h-24 flex flex-col items-center justify-center">
                {preview && (
                  <img 
                    src={preview} 
                    alt={file.name} 
                    className="max-w-full max-h-16 object-contain"
                  />
                )}
                <p className="text-xs text-center mt-1 truncate w-full">
                  {truncateFileName(file.name)}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <Button 
            type="button" 
            onClick={handleFileUploadClick} 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            Adicionar Imagens
          </Button>
        </div>

        {/* Video links section */}
        <div className="border rounded-md p-4">
          <Label htmlFor="videoLinks" className="font-bold mb-2 block">
            Links de Vídeos (um por linha)
          </Label>
          <Textarea
            id="videoLinks"
            value={videoUrls}
            onChange={handleVideoUrlsChange}
            placeholder="Cole aqui os links de vídeo (um por linha)"
            className="min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );
};

export default HistoricoTab;
