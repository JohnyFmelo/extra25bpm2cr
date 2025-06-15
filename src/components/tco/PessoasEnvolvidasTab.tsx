
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, User, Users } from "lucide-react";
import PersonalInfoFields from "./PersonalInfoFields";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PersonalInfo {
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
  relato?: string; // Added for victim and witness testimony
  representacao?: string; // Added for victim representation
  fielDepositario?: string; // 'Sim' or 'Não'
  objetoDepositado?: string; 
}

interface PessoasEnvolvidasTabProps {
  vitimas: PersonalInfo[];
  handleVitimaChange: (index: number, field: string, value: string) => void;
  handleAddVitima: () => void;
  handleRemoveVitima: (index: number) => void;
  testemunhas: PersonalInfo[];
  handleTestemunhaChange: (index: number, field: string, value: string) => void;
  handleAddTestemunha: () => void;
  handleRemoveTestemunha: (index: number) => void;
  autores: PersonalInfo[];
  handleAutorDetalhadoChange: (index: number, field: string, value: string) => void;
  handleAddAutor: () => void;
  handleRemoveAutor: (index: number) => void;
  natureza: string;
}

const PessoasEnvolvidasTab: React.FC<PessoasEnvolvidasTabProps> = ({
  vitimas,
  handleVitimaChange,
  handleAddVitima,
  handleRemoveVitima,
  testemunhas,
  handleTestemunhaChange,
  handleAddTestemunha,
  handleRemoveTestemunha,
  autores,
  handleAutorDetalhadoChange,
  handleAddAutor,
  handleRemoveAutor,
  natureza
}) => {
  // Check if it's a drug consumption case
  const isDrugCase = natureza === "Porte de drogas para consumo";

  const depositarioIndex = autores.findIndex(a => a.fielDepositario === 'Sim');

  const handleFielDepositarioChange = (newIndexStr: string) => {
    const newIndex = newIndexStr === 'nenhum' ? -1 : parseInt(newIndexStr, 10);

    autores.forEach((autor, index) => {
      const isSelected = index === newIndex;
      // Only update if the state is different
      if ((autor.fielDepositario === 'Sim') !== isSelected) {
        handleAutorDetalhadoChange(index, 'fielDepositario', isSelected ? 'Sim' : 'Não');
      }
      // Initialize objetoDepositado if it's the first time being set to "Sim" for this author
      if (isSelected && autor.objetoDepositado === undefined) {
          handleAutorDetalhadoChange(index, 'objetoDepositado', "");
      }
    });
  };

  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          PESSOAS ENVOLVIDAS
        </CardTitle>
      </CardHeader>
      <CardContent className="px-[4px]">
        <Tabs defaultValue="autor" className="w-full px-0">
          {/* Dynamically adjust the grid columns based on whether victims should be shown */}
          <TabsList className={`grid ${isDrugCase ? 'grid-cols-2' : 'grid-cols-3'} mb-6`}>
            <TabsTrigger value="autor">
              <User className="mr-2 h-4 w-4" />
              Autores
            </TabsTrigger>
            {!isDrugCase && <TabsTrigger value="vitimas">
                <User className="mr-2 h-4 w-4" />
                Vítimas
              </TabsTrigger>}
            <TabsTrigger value="testemunhas">
              <Users className="mr-2 h-4 w-4" />
              Testemunhas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="autor" className="space-y-6">
            {autores.map((autor, index) => <Card key={`autor_${index}`} className="border-dashed mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {index === 0 ? "Autor Principal" : `Autor ${index + 1}`}
                    </span>
                    {autores.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveAutor(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-[5px]">
                  <PersonalInfoFields data={autor} onChangeHandler={handleAutorDetalhadoChange} prefix={`autor_${index}_`} index={index} isAuthor={true} />
                </CardContent>
              </Card>)}
            
            <div className="flex justify-center mt-4">
              <Button type="button" variant="outline" onClick={handleAddAutor} className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar mais Autores
              </Button>
            </div>
          </TabsContent>
          
          {!isDrugCase && <TabsContent value="vitimas" className="space-y-6">
              {vitimas.map((vitima, index) => <Card key={`vitima_${index}`} className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <span className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        {`Vítima ${vitimas.length > 1 ? index + 1 : ''}`.trim() || "Vítima"}
                      </span>
                      {vitimas.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveVitima(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PersonalInfoFields data={vitima} onChangeHandler={handleVitimaChange} prefix={`vitima_${index}_`} index={index} isVictim={true} />
                  </CardContent>
                </Card>)}
              
              <div className="flex justify-center mt-4">
                <Button type="button" variant="outline" onClick={handleAddVitima} className="w-full md:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar mais Vítimas
                </Button>
              </div>
            </TabsContent>}
          
          <TabsContent value="testemunhas" className="space-y-6">
            {testemunhas.map((testemunha, index) => <Card key={`testemunha_${index}`} className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {`Testemunha ${testemunhas.length > 1 ? index + 1 : ''}`.trim() || "Testemunha"}
                    </span>
                    {testemunhas.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTestemunha(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonalInfoFields data={testemunha} onChangeHandler={handleTestemunhaChange} prefix={`testemunha_${index}_`} index={index} isWitness={true} />
                </CardContent>
              </Card>)}
            
            <div className="flex justify-center mt-4">
              <Button type="button" variant="outline" onClick={handleAddTestemunha} className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar mais Testemunha
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* NEW CONTAINER FOR FIEL DEPOSITÁRIO */}
        <div className="mt-8 pt-6 border-t border-dashed">
          <Card className="border-blue-200 border-2 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <User className="mr-2 h-5 w-5" />
                Fiel Depositário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fiel-depositario-select">Selecionar Fiel Depositário (dentre os Autores)</Label>
                  <Select
                    value={depositarioIndex > -1 ? String(depositarioIndex) : "nenhum"}
                    onValueChange={handleFielDepositarioChange}
                  >
                    <SelectTrigger id="fiel-depositario-select" className="mt-2">
                      <SelectValue placeholder="Selecione um autor..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum / Não se aplica</SelectItem>
                      {autores.map((autor, index) => (
                        <SelectItem key={`autor-option-${index}`} value={String(index)}>
                          {autor.nome || `Autor ${index + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {depositarioIndex > -1 && (
                  <>
                    <Card className="mt-4 bg-gray-50 p-4">
                        <CardContent className="text-sm space-y-1 p-0">
                           <p><strong>Nome:</strong> {autores[depositarioIndex].nome || 'Não informado'}</p>
                           <p><strong>CPF:</strong> {autores[depositarioIndex].cpf || 'Não informado'}</p>
                        </CardContent>
                    </Card>
                    <div className="md:col-span-2 mt-4">
                      <Label htmlFor="objeto-depositado-standalone">Objeto Depositado</Label>
                      <Textarea 
                          id="objeto-depositado-standalone" 
                          placeholder="Descreva o bem deixado sob a posse do fiel depositário" 
                          value={autores[depositarioIndex].objetoDepositado || ""} 
                          onChange={e => handleAutorDetalhadoChange(depositarioIndex, 'objetoDepositado', e.target.value)} 
                          className="mt-2" 
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>;
};

export default PessoasEnvolvidasTab;
