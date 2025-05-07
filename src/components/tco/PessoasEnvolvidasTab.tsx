
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import PersonalInfoFields from "./PersonalInfoFields";
import { useIsMobile } from '@/hooks/use-mobile';

interface Pessoa {
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
}

interface PessoasEnvolvidasTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  autorDetalhes: Pessoa;
  vitimas: Pessoa[];
  handleVitimaChange: (index: number, field: string, value: string) => void;
  handleAddVitima: () => void;
  handleRemoveVitima: (index: number) => void;
  testemunhas: Pessoa[];
  handleTestemunhaChange: (index: number, field: string, value: string) => void;
  handleAddTestemunha: () => void;
  handleRemoveTestemunha: (index: number) => void;
  autores: Pessoa[];
  handleAutorDetalhadoChange: (index: number, field: string, value: string) => void;
  handleAddAutor: () => void;
  handleRemoveAutor: (index: number) => void;
  natureza: string;
  handleAutorChange: (index: number, field: string, value: string) => void;
}

const PessoasEnvolvidasTab: React.FC<PessoasEnvolvidasTabProps> = ({
  activeTab,
  setActiveTab,
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
  handleAutorChange,
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pessoas Envolvidas</CardTitle>
        <CardDescription>Dados das pessoas envolvidas na ocorrência</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="autores" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="autores">Autores</TabsTrigger>
            {natureza !== "Porte de drogas para consumo" && (
              <TabsTrigger value="vitimas">Vítimas</TabsTrigger>
            )}
            <TabsTrigger value="testemunhas">Testemunhas</TabsTrigger>
          </TabsList>

          <TabsContent value="autores" className="space-y-6">
            {autores.map((autor, index) => (
              <div key={`autor-${index}`} className={`p-4 border rounded-lg ${isMobile ? 'w-full' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    {index === 0 ? "Autor Principal" : `Coautor ${index}`}
                  </h3>
                  {index > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveAutor(index)}
                      className="h-8 w-8 p-0 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <PersonalInfoFields
                  pessoa={autor}
                  index={index}
                  handleChange={handleAutorChange || handleAutorDetalhadoChange}
                  isMobile={isMobile}
                />
              </div>
            ))}
            
            <Button onClick={handleAddAutor} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Adicionar Coautor
            </Button>
          </TabsContent>

          {natureza !== "Porte de drogas para consumo" && (
            <TabsContent value="vitimas" className="space-y-6">
              {vitimas.map((vitima, index) => (
                <div key={`vitima-${index}`} className={`p-4 border rounded-lg ${isMobile ? 'w-full' : ''}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      {index === 0 ? "Vítima Principal" : `Vítima ${index + 1}`}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveVitima(index)}
                      className="h-8 w-8 p-0 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <PersonalInfoFields
                    pessoa={vitima}
                    index={index}
                    handleChange={handleVitimaChange}
                    isMobile={isMobile}
                  />

                  <div className="mt-4">
                    <Label htmlFor={`laudoPericial-${index}`}>Laudo Pericial</Label>
                    <Select
                      value={vitima.laudoPericial}
                      onValueChange={(value) => handleVitimaChange(index, "laudoPericial", value)}
                    >
                      <SelectTrigger id={`laudoPericial-${index}`}>
                        <SelectValue placeholder="Laudo Pericial" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              
              <Button onClick={handleAddVitima} className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Vítima
              </Button>
            </TabsContent>
          )}

          <TabsContent value="testemunhas" className="space-y-6">
            {testemunhas.map((testemunha, index) => (
              <div key={`testemunha-${index}`} className={`p-4 border rounded-lg ${isMobile ? 'w-full' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    {`Testemunha ${index + 1}`}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveTestemunha(index)}
                    className="h-8 w-8 p-0 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <PersonalInfoFields
                  pessoa={testemunha}
                  index={index}
                  handleChange={handleTestemunhaChange}
                  isMobile={isMobile}
                />
              </div>
            ))}
            
            <Button onClick={handleAddTestemunha} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Adicionar Testemunha
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PessoasEnvolvidasTab;
