import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, User, Users } from "lucide-react";
import PersonalInfoFields from "./PersonalInfoFields";

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
  laudoPericial: string; // Novo campo: "Sim" ou "Não"
}

interface PessoasEnvolvidasTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  autorDetalhes: PersonalInfo;
  handleAutorChange: (index: number | null, field: string, value: string) => void;
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
}

const PessoasEnvolvidasTab: React.FC<PessoasEnvolvidasTabProps> = ({
  activeTab,
  setActiveTab,
  autorDetalhes,
  handleAutorChange,
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
  handleRemoveAutor
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          PESSOAS ENVOLVIDAS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="autor" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="autor" onClick={() => setActiveTab("autor")}>
              <User className="mr-2 h-4 w-4" />
              Autores do Fato
            </TabsTrigger>
            <TabsTrigger value="vitimas" onClick={() => setActiveTab("vitimas")}>
              <User className="mr-2 h-4 w-4" />
              Vítimas
            </TabsTrigger>
            <TabsTrigger value="testemunhas" onClick={() => setActiveTab("testemunhas")}>
              <Users className="mr-2 h-4 w-4" />
              Testemunhas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="autor" className="space-y-6">
            {autores.map((autor, index) => (
              <Card key={`autor_${index}`} className="border-dashed mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {index === 0 ? "Autor Principal" : `Autor ${index + 1}`}
                    </span>
                    {autores.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveAutor(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonalInfoFields 
                    data={autor} 
                    onChangeHandler={handleAutorDetalhadoChange}
                    prefix={`autor_${index}_`}
                    index={index}
                    isAuthor={true}
                  />
                </CardContent>
              </Card>
            ))}
            
            <div className="flex justify-center mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddAutor}
                className="w-full md:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Autor
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="vitimas" className="space-y-6">
            {vitimas.map((vitima, index) => (
              <Card key={`vitima_${index}`} className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Vítima
                    </span>
                    {vitimas.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveVitima(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonalInfoFields 
                    data={vitima} 
                    onChangeHandler={handleVitimaChange}
                    prefix={`vitima_${index}_`}
                    index={index}
                    isVictim={true} // Novo prop para indicar Vítima
                  />
                </CardContent>
              </Card>
            ))}
            
            <div className="flex justify-center mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddVitima}
                className="w-full md:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Vítima
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="testemunhas" className="space-y-6">
            {testemunhas.map((testemunha, index) => (
              <Card key={`testemunha_${index}`} className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Testemunha
                    </span>
                    {testemunhas.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveTestemunha(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonalInfoFields 
                    data={testemunha} 
                    onChangeHandler={handleTestemunhaChange}
                    prefix={`testemunha_${index}_`}
                    index={index}
                  />
                </CardContent>
              </Card>
            ))}
            
            <div className="flex justify-center mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddTestemunha}
                className="w-full md:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Testemunha
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PessoasEnvolvidasTab;
