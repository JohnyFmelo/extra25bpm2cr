
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, User, Users } from "lucide-react";
import PersonalInfoFields from "./PersonalInfoFields";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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
  fielDepositario?: string; // 'Sim' or 'Não' -- This will be deprecated for manual entry
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
  fielDepositario?: PersonalInfo; // Make prop optional
  handleFielDepositarioChange?: (field: keyof PersonalInfo, value: string) => void; // Make handler optional
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
  natureza,
  fielDepositario: fielDepositarioProp,
  handleFielDepositarioChange: handleFielDepositarioChangeProp,
}) => {
  // Check if it's a drug consumption case
  const isDrugCase = natureza === "Porte de drogas para consumo";

  const [fielDepositario, setFielDepositario] = React.useState<PersonalInfo>(
    fielDepositarioProp || {
      nome: "",
      sexo: "",
      estadoCivil: "",
      profissao: "",
      endereco: "",
      dataNascimento: "",
      naturalidade: "",
      filiacaoMae: "",
      filiacaoPai: "",
      rg: "",
      cpf: "",
      celular: "",
      email: "",
      laudoPericial: "",
      objetoDepositado: "",
    }
  );

  React.useEffect(() => {
    if (fielDepositarioProp) {
      setFielDepositario(fielDepositarioProp);
    }
  }, [fielDepositarioProp]);

  const handleOnChange = (field: keyof PersonalInfo, value: string) => {
    if (handleFielDepositarioChangeProp) {
      handleFielDepositarioChangeProp(field, value);
    } else {
      setFielDepositario((prev) => {
        const newState = { ...prev, [field]: value };
        // HACK: Store data on window object to be picked up by PDF generator
        (window as any).tempFielDepositario = newState;
        return newState;
      });
    }
  };

  // HACK: Ensure window object is populated on initial render
  React.useEffect(() => {
    (window as any).tempFielDepositario = fielDepositario;
  }, []);

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

        {/* Always render the manual fiel depositário container, but handle missing props gracefully */}
        <div className="mt-8 pt-6 border-t border-dashed">
            <Card className="border-blue-200 border-2 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <User className="mr-2 h-5 w-5" />
                  Fiel Depositário (Preenchimento Manual)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="fd-nome">Nome Completo</Label>
                    <Input id="fd-nome" value={fielDepositario?.nome || ''} onChange={e => handleOnChange('nome', e.target.value)} placeholder="Nome do fiel depositário" />
                  </div>
                  <div>
                    <Label htmlFor="fd-cpf">CPF</Label>
                    <Input id="fd-cpf" value={fielDepositario?.cpf || ''} onChange={e => handleOnChange('cpf', e.target.value)} placeholder="000.000.000-00" />
                  </div>
                   <div>
                    <Label htmlFor="fd-rg">RG</Label>
                    <Input id="fd-rg" value={fielDepositario?.rg || ''} onChange={e => handleOnChange('rg', e.target.value)} placeholder="RG do fiel depositário" />
                  </div>
                  <div>
                    <Label htmlFor="fd-filiacaoMae">Filiação (Mãe)</Label>
                    <Input id="fd-filiacaoMae" value={fielDepositario?.filiacaoMae || ''} onChange={e => handleOnChange('filiacaoMae', e.target.value)} placeholder="Nome da mãe" />
                  </div>
                  <div>
                    <Label htmlFor="fd-filiacaoPai">Filiação (Pai)</Label>
                    <Input id="fd-filiacaoPai" value={fielDepositario?.filiacaoPai || ''} onChange={e => handleOnChange('filiacaoPai', e.target.value)} placeholder="Nome do pai" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="fd-endereco">Endereço</Label>
                    <Input id="fd-endereco" value={fielDepositario?.endereco || ''} onChange={e => handleOnChange('endereco', e.target.value)} placeholder="Endereço completo" />
                  </div>
                  <div>
                    <Label htmlFor="fd-celular">Celular</Label>
                    <Input id="fd-celular" value={fielDepositario?.celular || ''} onChange={e => handleOnChange('celular', e.target.value)} placeholder="(65) 99999-9999" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="fd-objeto">Objeto Depositado</Label>
                    <Textarea
                        id="fd-objeto"
                        placeholder="Descreva o bem deixado sob a posse do fiel depositário"
                        value={fielDepositario?.objetoDepositado || ""}
                        onChange={e => handleOnChange('objetoDepositado', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </CardContent>
    </Card>;
};

export default PessoasEnvolvidasTab;
