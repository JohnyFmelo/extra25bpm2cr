import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Edit3, ThumbsUp, ThumbsDown, Info } from "lucide-react";

interface FORhistoricoProps {
  relatoPolicial: string;
  onRelatoPolicialChange: (value: string) => void; // Renamed from setRelatoPolicial to reflect parent's handler
  relatoAutor: string;
  setRelatoAutor: (value: string) => void;
  relatoVitima: string;
  setRelatoVitima: (value: string) => void;
  relatoTestemunha: string;
  setRelatoTestemunha: (value: string) => void;
  apreensoes: string;
  setApreensoes: (value: string) => void;
  conclusaoPolicial: string;
  setConclusaoPolicial: (value: string) => void; // Assuming direct set is okay for conclusion
  drugSeizure: boolean; // To show specific info about drug apreensoes
  representacao: string;
  setRepresentacao: (value: string) => void;
  natureza: string; // To conditionally show representacao
}

const FORhistorico: React.FC<FORhistoricoProps> = ({
  relatoPolicial, onRelatoPolicialChange,
  relatoAutor, setRelatoAutor,
  relatoVitima, setRelatoVitima,
  relatoTestemunha, setRelatoTestemunha,
  apreensoes, setApreensoes,
  conclusaoPolicial, setConclusaoPolicial,
  drugSeizure,
  representacao, setRepresentacao,
  natureza
}) => {

  const isRepresentacaoRequired = [
    "Ameaça", "Dano", "Injúria", "Difamação", "Calúnia" 
    // Lesão corporal leve também, mas o TCO pode ser lavrado independente da representação imediata
  ].includes(natureza);


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico da Ocorrência e Conclusão</CardTitle>
        <CardDescription>Detalhe os relatos e a conclusão policial.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="relatoPolicial" className="flex items-center"><FileText className="mr-2 text-blue-600" />Relato Policial (Boletim)</Label>
          <Textarea id="relatoPolicial" value={relatoPolicial} onChange={(e) => onRelatoPolicialChange(e.target.value)} rows={10} placeholder="Descreva o histórico da ocorrência..." />
           <p className="text-xs text-muted-foreground mt-1">Este campo é preenchido automaticamente com base nos dados inseridos. Edite conforme necessário.</p>
        </div>

        <div>
          <Label htmlFor="relatoAutor" className="flex items-center"><Edit3 className="mr-2 text-red-600" />Versão do(s) Autor(es)</Label>
          <Textarea id="relatoAutor" value={relatoAutor} onChange={(e) => setRelatoAutor(e.target.value)} rows={5} placeholder="Relato do(s) autor(es)..." />
          <p className="text-xs text-muted-foreground mt-1">O modelo é gerado automaticamente. Complete com a declaração e revise.</p>
        </div>

        <div>
          <Label htmlFor="relatoVitima" className="flex items-center"><Edit3 className="mr-2 text-green-600" />Versão da(s) Vítima(s)</Label>
          <Textarea id="relatoVitima" value={relatoVitima} onChange={(e) => setRelatoVitima(e.target.value)} rows={5} placeholder="Relato da(s) vítima(s)..." />
           <p className="text-xs text-muted-foreground mt-1">O modelo é gerado automaticamente. Complete com a declaração e revise. Se não houver vítimas, deixe em branco ou apague.</p>
        </div>

        {isRepresentacaoRequired && (
          <div>
            <Label htmlFor="representacao" className="flex items-center">
              <ThumbsUp className="mr-1 text-green-500 h-4 w-4" />/<ThumbsDown className="mr-2 text-red-500 h-4 w-4" />
              Representação da Vítima
            </Label>
            <Select value={representacao} onValueChange={setRepresentacao}>
              <SelectTrigger id="representacao">
                <SelectValue placeholder="A vítima deseja representar?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Representa">Sim, deseja representar criminalmente</SelectItem>
                <SelectItem value="NaoRepresenta">Não, não deseja representar</SelectItem>
                <SelectItem value="Posteriormente">Deseja decidir posteriormente (prazo de 6 meses)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Necessário para crimes de ação penal pública condicionada ou privada.</p>
          </div>
        )}

        <div>
          <Label htmlFor="relatoTestemunha" className="flex items-center"><Edit3 className="mr-2 text-yellow-600" />Versão da(s) Testemunha(s)</Label>
          <Textarea id="relatoTestemunha" value={relatoTestemunha} onChange={(e) => setRelatoTestemunha(e.target.value)} rows={5} placeholder="Relato da(s) testemunha(s)..." />
          <p className="text-xs text-muted-foreground mt-1">O modelo é gerado automaticamente. Complete com a declaração e revise. Se não houver testemunhas, deixe em branco ou apague.</p>
        </div>
        
        <div>
          <Label htmlFor="apreensoes" className="flex items-center"><Info className="mr-2 text-indigo-600" />Objetos Apreendidos (se houver)</Label>
          <Textarea id="apreensoes" value={apreensoes} onChange={(e) => setApreensoes(e.target.value)} rows={3} placeholder="Liste os objetos apreendidos..." />
          {drugSeizure && (
            <p className="text-xs text-muted-foreground mt-1">
              Para entorpecentes, o texto é gerado automaticamente com base nos dados da aba "Verificação de Entorpecentes". Adicione outros objetos se necessário.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="conclusaoPolicial" className="flex items-center"><FileText className="mr-2 text-purple-600" />Conclusão Policial</Label>
          <Textarea id="conclusaoPolicial" value={conclusaoPolicial} onChange={(e) => setConclusaoPolicial(e.target.value)} rows={6} placeholder="Conclusão do responsável pela lavratura..." />
          <p className="text-xs text-muted-foreground mt-1">Este texto é gerado com base nos dados da ocorrência. Revise e ajuste se necessário.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FORhistorico;
