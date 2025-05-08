import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare, FileSignature } from "lucide-react";
// import { Switch } from "@/components/ui/switch"; // Example for later
// import { Label } from "@/components/ui/label"; // Example for later

interface FORtermosProps {
  // Props to control which terms are active, e.g.:
  // termoCompromissoEnabled: boolean;
  // setTermoCompromissoEnabled: (enabled: boolean) => void;
  // termoApreensaoEnabled: boolean;
  // setTermoApreensaoEnabled: (enabled: boolean) => void;
  // etc.
}

const FORtermos: React.FC<FORtermosProps> = (
  {
    /* termoCompromissoEnabled, setTermoCompromissoEnabled */
  }
) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Termos a Serem Gerados</CardTitle>
        <CardDescription>
          Selecione os termos que deverão ser incluídos no PDF final.
          (Funcionalidade de seleção individual pendente de implementação)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-md bg-blue-50 border-blue-200">
            <h4 className="font-semibold flex items-center"><FileSignature className="mr-2 text-blue-600" /> Termos Padrão</h4>
            <ul className="list-disc list-inside mt-2 text-sm text-blue-700">
                <li>Capa do TCO</li>
                <li>Termo Circunstanciado (Histórico da Ocorrência)</li>
                <li>Termo de Declaração do Autor</li>
                <li>Termo de Declaração da Vítima (se houver)</li>
                <li>Termo de Declaração de Testemunha(s) (se houver)</li>
                <li>Termo de Compromisso de Comparecimento (para o Autor)</li>
                <li>Termo de Apreensão (se houver apreensões)</li>
                <li>Despacho da Autoridade Policial</li>
            </ul>
            <p className="mt-3 text-xs text-blue-600">
                Estes termos são gerados por padrão com base nas informações preenchidas.
                No futuro, você poderá ativar/desativar termos específicos aqui.
            </p>
        </div>

        {/* Exemplo de como poderia ser no futuro:
        <div className="flex items-center space-x-2">
          <Switch id="termo-compromisso" checked={termoCompromissoEnabled} onCheckedChange={setTermoCompromissoEnabled} />
          <Label htmlFor="termo-compromisso">Termo de Compromisso de Comparecimento</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="termo-apreensao" />
          <Label htmlFor="termo-apreensao">Termo de Apreensão</Label>
        </div>
        */}
      </CardContent>
    </Card>
  );
};

export default FORtermos;
