
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface HistoricoTabProps {
  relatoPolicial: string;
  setRelatoPolicial: (value: string) => void;
  relatoAutor: string;
  setRelatoAutor: (value: string) => void;
  conclusaoPolicial: string;
  setConclusaoPolicial: (value: string) => void;
  providencias: string;
  setProvidencias: (value: string) => void;
  documentosAnexos: string;
  setDocumentosAnexos: (value: string) => void;
  apreensaoDescricao: string;
  setApreensaoDescricao: (value: string) => void;
  videoLinks: { url: string; descricao: string }[];
  setVideoLinks: (links: { url: string; descricao: string }[]) => void;
  natureza: string;
  drogaQuantidade: string;
  drogaTipo: string;
  drogaCor: string;
  drogaOdor: string;
  lacreNumero: string;
  multipleDrugs: Array<{
    quantidade: string;
    substancia: string;
    cor: string;
    odor: string;
    indicios: string;
  }>;
}

const HistoricoTab: React.FC<HistoricoTabProps> = ({
  relatoPolicial,
  setRelatoPolicial,
  relatoAutor,
  setRelatoAutor,
  conclusaoPolicial,
  setConclusaoPolicial,
  providencias,
  setProvidencias,
  documentosAnexos,
  setDocumentosAnexos,
  apreensaoDescricao,
  setApreensaoDescricao,
  videoLinks,
  setVideoLinks,
  natureza,
  drogaQuantidade,
  drogaTipo,
  drogaCor,
  drogaOdor,
  lacreNumero,
  multipleDrugs = []
}) => {
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoDescription, setNewVideoDescription] = useState("");

  // Função para gerar texto de apreensão de drogas
  const generateDrugSeizureText = () => {
    if (natureza !== "Porte de drogas para consumo") return "";

    // Se existem múltiplas drogas, usar elas
    if (multipleDrugs && multipleDrugs.length > 0) {
      const validDrugs = multipleDrugs.filter(drug => 
        drug.quantidade && drug.substancia && drug.cor && drug.odor
      );
      
      if (validDrugs.length === 0) return "";

      const drugDescriptions = validDrugs.map(drug => {
        const qtdeNum = parseInt(drug.quantidade) || 1;
        const numberWords = ["zero", "uma", "duas", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
        const qtdeText = qtdeNum <= 10 ? numberWords[qtdeNum] : qtdeNum.toString();
        const porcaoText = qtdeNum === 1 ? "porção" : "porções";
        
        const indiciosText = drug.indicios ? `, com indícios de ${drug.indicios.toLowerCase()}` : "";
        
        return `${qtdeText} (0${qtdeNum}) ${porcaoText} de material ${drug.substancia.toLowerCase()}, de cor ${drug.cor.toLowerCase()}, com odor ${drug.odor.toLowerCase()}${indiciosText}`;
      });

      if (drugDescriptions.length === 1) {
        return `${drugDescriptions[0]}, sob lacre n° ${lacreNumero || "00000000"}.`;
      } else if (drugDescriptions.length === 2) {
        return `${drugDescriptions.join(" e ")}, sob lacre n° ${lacreNumero || "00000000"}.`;
      } else {
        const lastItem = drugDescriptions.pop();
        return `${drugDescriptions.join(", ")} e ${lastItem}, sob lacre n° ${lacreNumero || "00000000"}.`;
      }
    }
    
    // Fallback para droga única (campos antigos)
    if (drogaQuantidade && drogaTipo && drogaCor && drogaOdor) {
      const qtdeNum = parseInt(drogaQuantidade) || 1;
      const numberWords = ["zero", "uma", "duas", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
      const qtdeText = qtdeNum <= 10 ? numberWords[qtdeNum] : qtdeNum.toString();
      const porcaoText = qtdeNum === 1 ? "porção" : "porções";
      
      return `${qtdeText} (0${qtdeNum}) ${porcaoText} de material ${drogaTipo.toLowerCase()}, de cor ${drogaCor.toLowerCase()}, com odor ${drogaOdor.toLowerCase()}, sob lacre n° ${lacreNumero || "00000000"}.`;
    }

    return "";
  };

  // Atualizar automaticamente a descrição de apreensão quando há mudanças nas drogas
  useEffect(() => {
    if (natureza === "Porte de drogas para consumo") {
      const drugText = generateDrugSeizureText();
      if (drugText && drugText !== apreensaoDescricao) {
        setApreensaoDescricao(drugText);
      }
    }
  }, [natureza, drogaQuantidade, drogaTipo, drogaCor, drogaOdor, lacreNumero, multipleDrugs, apreensaoDescricao, setApreensaoDescricao]);

  const addVideoLink = () => {
    if (newVideoUrl.trim()) {
      setVideoLinks([
        ...videoLinks,
        {
          url: newVideoUrl.trim(),
          descricao: newVideoDescription.trim() || `Vídeo ${videoLinks.length + 1}`
        }
      ]);
      setNewVideoUrl("");
      setNewVideoDescription("");
    }
  };

  const removeVideoLink = (index: number) => {
    setVideoLinks(videoLinks.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addVideoLink();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Histórico da Ocorrência</CardTitle>
          <CardDescription>
            Registre os relatos e conclusões sobre a ocorrência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="relatoPolicial">Relato do Policial Militar *</Label>
            <Textarea
              id="relatoPolicial"
              placeholder="Descreva detalhadamente como os fatos ocorreram..."
              value={relatoPolicial}
              onChange={(e) => setRelatoPolicial(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div>
            <Label htmlFor="relatoAutor">Relato do(a) Autor(a) do Fato *</Label>
            <Textarea
              id="relatoAutor"
              placeholder="Relato fornecido pelo autor dos fatos..."
              value={relatoAutor}
              onChange={(e) => setRelatoAutor(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div>
            <Label htmlFor="conclusaoPolicial">Conclusão do Policial *</Label>
            <Textarea
              id="conclusaoPolicial"
              placeholder="Conclusão final do policial sobre a ocorrência..."
              value={conclusaoPolicial}
              onChange={(e) => setConclusaoPolicial(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Providências e Documentação</CardTitle>
          <CardDescription>
            Registre as providências tomadas e documentos anexados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="providencias">Providências *</Label>
            <Textarea
              id="providencias"
              placeholder="Descreva as providências tomadas..."
              value={providencias}
              onChange={(e) => setProvidencias(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="documentosAnexos">Documentos Anexos</Label>
            <Textarea
              id="documentosAnexos"
              placeholder="Liste os documentos anexados à ocorrência..."
              value={documentosAnexos}
              onChange={(e) => setDocumentosAnexos(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label htmlFor="apreensaoDescricao">Descrição dos Objetos/Documentos Apreendidos</Label>
            <Textarea
              id="apreensaoDescricao"
              placeholder="Descreva os objetos ou documentos apreendidos..."
              value={apreensaoDescricao}
              onChange={(e) => setApreensaoDescricao(e.target.value)}
              className="min-h-[100px]"
              readOnly={natureza === "Porte de drogas para consumo"}
            />
            {natureza === "Porte de drogas para consumo" && (
              <p className="text-sm text-gray-500 mt-1">
                Este campo é preenchido automaticamente baseado nas informações da droga
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links de Vídeos</CardTitle>
          <CardDescription>
            Adicione links para vídeos relacionados à ocorrência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="newVideoUrl">URL do Vídeo</Label>
              <Input
                id="newVideoUrl"
                placeholder="https://exemplo.com/video"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div>
              <Label htmlFor="newVideoDescription">Descrição</Label>
              <Input
                id="newVideoDescription"
                placeholder="Descrição do vídeo"
                value={newVideoDescription}
                onChange={(e) => setNewVideoDescription(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          
          <Button 
            onClick={addVideoLink}
            disabled={!newVideoUrl.trim()}
            className="w-full md:w-auto"
          >
            Adicionar Vídeo
          </Button>

          {videoLinks.length > 0 && (
            <div className="space-y-2">
              <Label>Vídeos Adicionados:</Label>
              {videoLinks.map((video, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{video.descricao}</p>
                    <p className="text-sm text-gray-600 break-all">{video.url}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeVideoLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricoTab;
