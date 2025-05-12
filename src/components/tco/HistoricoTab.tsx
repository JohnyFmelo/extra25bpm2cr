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
  drugSeizure?: boolean; // Mantido, mas não usado diretamente neste componente (usado por isDrugCase)
  representacao?: string;
  setRepresentacao?: (value: string) => void;
  natureza: string;
  videoLinks?: string[];
  setVideoLinks?: (value: string[]) => void;
  // Props para controlar os arquivos de fotos selecionados externamente
  selectedPhotoFiles: { file: File; id: string }[];
  setSelectedPhotoFiles: (
    updater: (
      prevFiles: { file: File; id: string }[]
    ) => { file: File; id: string }[]
  ) => void;
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
  // drugSeizure, // Não diretamente usado, apenas através de 'natureza'
  representacao = "",
  setRepresentacao,
  natureza,
  videoLinks = [],
  setVideoLinks,
  selectedPhotoFiles,
  setSelectedPhotoFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoUrls, setVideoUrls] = useState<string>(videoLinks.join("\n"));
  const [photoPreviews, setPhotoPreviews] = useState<Map<string, string>>(
    new Map()
  );

  useEffect(() => {
    const newPreviews = new Map<string, string>();
    selectedPhotoFiles.forEach((fileObj) => {
      const url = URL.createObjectURL(fileObj.file);
      newPreviews.set(fileObj.id, url);
    });
    setPhotoPreviews(newPreviews);

    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedPhotoFiles]);

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (validFiles.length === 0) {
        console.warn("Nenhum arquivo de imagem válido selecionado.");
        return;
      }
      const newFiles = validFiles.map((file) => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      }));
      setSelectedPhotoFiles((prev) => [...prev, ...newFiles]);
      const fileNames = newFiles.map(({ file }) => file.name).join(", ");
      console.log(`Selected files: ${fileNames}`);
    }
    // Reset file input value to allow selecting the same file again
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedPhotoFiles((prev) =>
      prev.filter((fileObj) => fileObj.id !== id)
    );
  };

  const handleVideoUrlsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const urls = e.target.value;
    setVideoUrls(urls);
    if (setVideoLinks) {
      setVideoLinks(urls.split("\n").filter((url) => url.trim() !== ""));
    }
  };

  const truncateFileName = (name: string, maxLength: number = 20): string => {
    if (name.length <= maxLength) return name;
    const extensionMatch = name.match(/\.[0-9a-z]+$/i);
    const extension = extensionMatch ? extensionMatch[0] : '';
    const nameWithoutExtension = name.replace(extension, '');
    if (nameWithoutExtension.length <= maxLength - extension.length -3) {
        return name;
    }
    return nameWithoutExtension.slice(0, maxLength - extension.length - 3) + "..." + extension;
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
            onChange={(e) => setRelatoPolicial(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        <div>
          <Label htmlFor="relatoAutor">RELATO DO AUTOR</Label>
          <Textarea
            id="relatoAutor"
            placeholder="Descreva o relato do autor"
            value={relatoAutor}
            onChange={(e) => setRelatoAutor(e.target.value)}
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
              onChange={(e) => setRelatoVitima(e.target.value)}
              className="min-h-[150px]"
            />

            {setRepresentacao && (
              <div className="mt-4 p-4 border rounded-md">
                <Label className="font-bold mb-2 block">
                  Representação da Vítima
                </Label>
                <RadioGroup
                  value={representacao}
                  onValueChange={setRepresentacao}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Representa" id="representa" />
                    <Label htmlFor="representa">Vítima deseja representar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Posteriormente"
                      id="posteriormente"
                    />
                    <Label htmlFor="posteriormente">
                      Representação posterior (6 meses)
                    </Label>
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
            onChange={(e) => setRelatoTestemunha(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        <div>
          <Label htmlFor="apreensoes">OBJETOS/DOCUMENTOS APREENDIDOS</Label>
          <Textarea
            id="apreensoes"
            placeholder="Descreva os objetos ou documentos apreendidos, se houver"
            value={apreensoes}
            onChange={(e) => setApreensoes(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        {/* Seção para Vídeos e Fotos da Ocorrência */}
        <div className="space-y-4 p-4 border rounded-md">
            <h4 className="font-medium text-lg">Mídia da Ocorrência</h4>
            {/* Vídeos */}
            <div className="space-y-2">
                <Label htmlFor="videoUrls">LINKS DE VÍDEOS DA OCORRÊNCIA (um por linha)</Label>
                <Textarea
                    id="videoUrls"
                    placeholder="https://youtu.be/example1
https://vimeo.com/example2"
                    value={videoUrls}
                    onChange={handleVideoUrlsChange}
                    className="min-h-[100px]"
                />
            </div>

            {/* Fotos */}
            <div className="space-y-2">
                <Label htmlFor="occurrencePhotos">FOTOS DA OCORRÊNCIA</Label>
                <div>
                    <Button type="button" onClick={handleFileUploadClick} variant="outline">
                        Adicionar Fotos
                    </Button>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
                {selectedPhotoFiles.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedPhotoFiles.map((fileObj) => {
                        const previewUrl = photoPreviews.get(fileObj.id);
                        return (
                        <div key={fileObj.id} className="relative group border rounded-md p-1 shadow">
                            {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt={fileObj.file.name}
                                className="w-full h-32 object-cover rounded-md"
                            />
                            ) : (
                            <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center">
                                <p className="text-xs text-gray-500">Carregando...</p>
                            </div>
                            )}
                            <p className="text-xs mt-1 truncate" title={fileObj.file.name}>
                            {truncateFileName(fileObj.file.name)}
                            </p>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveFile(fileObj.id)}
                                title="Remover imagem"
                            >
                            <X className="h-4 w-4" />
                            </Button>
                        </div>
                        );
                    })}
                    </div>
                )}
            </div>
        </div>


        <div>
          <Label htmlFor="conclusaoPolicial">CONCLUSÃO POLICIAL</Label>
          <Textarea
            id="conclusaoPolicial"
            placeholder="Descreva a conclusão policial"
            value={conclusaoPolicial}
            onChange={(e) => setConclusaoPolicial(e.target.value)}
            className="min-h-[150px]"
          />
        </div>
      </div>
    </div>
  );
};

export default HistoricoTab;
