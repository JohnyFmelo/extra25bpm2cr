import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link2, PlusCircle, XCircle } from "lucide-react";

interface FORanexosProps {
  videoLinks: string[];
  newVideoLink: string;
  setNewVideoLink: (value: string) => void;
  onAddVideoLink: () => void;
  onRemoveVideoLink: (index: number) => void;
}

const FORanexos: React.FC<FORanexosProps> = ({
  videoLinks,
  newVideoLink,
  setNewVideoLink,
  onAddVideoLink,
  onRemoveVideoLink
}) => {

  const handleAddLinkKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Evita submissão do formulário principal
      onAddVideoLink();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Anexos Digitais</CardTitle>
        <CardDescription>Adicione links para vídeos ou outros anexos relevantes (ex: Google Drive, YouTube).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="newVideoLinkInput">Novo Link de Vídeo/Anexo</Label>
          <div className="flex space-x-2">
            <Input
              id="newVideoLinkInput"
              type="url"
              value={newVideoLink}
              onChange={(e) => setNewVideoLink(e.target.value)}
              onKeyPress={handleAddLinkKeyPress}
              placeholder="https://..."
            />
            <Button type="button" onClick={onAddVideoLink} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Link
            </Button>
          </div>
        </div>

        {videoLinks.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Links Adicionados:</h4>
            <ul className="space-y-2">
              {videoLinks.map((link, index) => (
                <li key={index} className="flex justify-between items-center p-2 border rounded-md bg-muted/50">
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate" title={link}>
                    <Link2 className="inline mr-2 h-4 w-4" />{link}
                  </a>
                  <Button variant="ghost" size="sm" onClick={() => onRemoveVideoLink(index)}>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {videoLinks.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum link de vídeo adicionado.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default FORanexos;
