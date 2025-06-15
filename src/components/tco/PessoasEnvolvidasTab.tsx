import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, User, Users } from "lucide-react";
import PersonalInfoFields from "./PersonalInfoFields";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
  relato?: string; 
  representacao?: string;
  fielDepositario?: string; 
  objetoDepositado?: string; 
  isManualDepositario?: boolean; // Flag for manual depositary
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
  const isDrugCase = natureza === "Porte de drogas para consumo";

  // State to toggle between selecting an author or manual entry for the depositary
  const [isManualDepositario, setIsManualDepositario] = useState(() => 
    autores.some(a => a.isManualDepositario)
  );

  const manualDepositarioIndex = autores.findIndex(a => a.isManualDepositario);
  const depositarioSelecionadoIndex = autores.findIndex(a => a.fielDepositario === 'Sim');
  
  // This effect ensures that a slot for the manual depositary is created when needed.
  useEffect(() => {
    if (isManualDepositario && manualDepositarioIndex === -1) {
      const newIndex = autores.length;
      handleAddAutor(); // This will trigger a re-render
      // We'll set the flag on the next render cycle when the new author exists.
    } else if (isManualDepositario && manualDepositarioIndex !== -1 && !autores[manualDepositarioIndex].isManualDepositario) {
       handleAutorDetalhadoChange(manualDepositarioIndex, 'isManualDepositario', true);
    }
  }, [autores.length, isManualDepositario, handleAddAutor, manualDepositarioIndex, handleAutorDetalhadoChange, autores]);

  // Effect to apply the flag after the new author has been added to the state
  useEffect(() => {
    if (isManualDepositario && autores.length > 0) {
        const lastAuthor = autores[autores.length - 1];
        if (!lastAuthor.isManualDepositario && manualDepositarioIndex === -1) {
            handleAutorDetalhadoChange(autores.length - 1, 'isManualDepositario', true);
        }
    }
  }, [autores.length, isManualDepositario, manualDepositarioIndex, handleAutorDetalhadoChange]);

  const handleManualDepositarioToggle = (checked: boolean) => {
    setIsManualDepositario(checked);
    if (checked) {
      // If an author was selected, unselect them
      if (depositarioSelecionadoIndex > -1) {
        handleAutorDetalhadoChange(depositarioSelecionadoIndex, 'fielDepositario', 'Não');
      }
    } else {
      // If switching back to selecting an author, remove the manual depositary entry
      if (manualDepositarioIndex > -1) {
        handleRemoveAutor(manualDepositarioIndex);
      }
    }
  };

  const handleFielDepositarioChange = (newIndexStr: string) => {
    const newIndex = newIndexStr === 'nenhum' ? -1 : parseInt(newIndexStr, 10);

    autores.forEach((autor, index) => {
      if (autor.isManualDepositario) return; // Ignore manual depositary
      const isSelected = index === newIndex;
      if ((autor.fielDepositario === 'Sim') !== isSelected) {
        handleAutorDetalhadoChange(index, 'fielDepositario', isSelected ? 'Sim' : 'Não');
      }
      if (isSelected && autor.objetoDepositado === undefined) {
          handleAutorDetalhadoChange(index, 'objetoDepositado', "");
      }
    });
  };

  // Filter out the manual depositary so it doesn't show up in the authors list
  const visibleAutores = autores.filter(a => !a.isManualDepositario);

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
            {visibleAutores.map((autor, index) => {
              const originalIndex = autores.findIndex(a => a === autor);
              return (
              <Card key={`autor_${originalIndex}`} className="border-dashed mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {/* Adjust title logic to be aware of the original first author */}
                      {autores.findIndex(a => !a.isManualDepositario) === originalIndex ? "Autor Principal" : `Autor ${index + 1}`}
                    </span>
                    {visibleAutores.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveAutor(originalIndex)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-[5px]">
                  <PersonalInfoFields data={autor} onChangeHandler={handleAutorDetalhadoChange} prefix={`autor_${originalIndex}_`} index={originalIndex} isAuthor={true} />
                </CardContent>
              </Card>
            )})}
            
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

        {/* CONTAINER FOR FIEL DEPOSITÁRIO - NOW WITH MANUAL OPTION */}
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
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="manual-depositario-checkbox"
                        checked={isManualDepositario}
                        onCheckedChange={handleManualDepositarioToggle}
                    />
                    <Label htmlFor="manual-depositario-checkbox" className="font-medium">
                        O Fiel Depositário não é um dos autores (Preenchimento Manual)
                    </Label>
                </div>

                {isManualDepositario ? (
                  <>
                    {manualDepositarioIndex > -1 && (
                      <div className="p-4 border border-blue-100 rounded-md bg-white">
                        <PersonalInfoFields 
                          data={autores[manualDepositarioIndex]} 
                          onChangeHandler={handleAutorDetalhadoChange} 
                          prefix={`manual_depositario_`} 
                          index={manualDepositarioIndex}
                          // Pass flags to ensure it shows all fields needed for a person
                          isAuthor={true}
                        />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="md:col-span-2">
                                <Label htmlFor={`manual_depositario_objetoDepositado`}>Objeto Depositado</Label>
                                <Textarea
                                    id={`manual_depositario_objetoDepositado`}
                                    placeholder="Descreva o bem deixado sob a posse do fiel depositário"
                                    value={autores[manualDepositarioIndex].objetoDepositado || ''}
                                    onChange={(e) => handleAutorDetalhadoChange(manualDepositarioIndex, 'objetoDepositado', e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <Label htmlFor="fiel-depositario-select">Selecionar Fiel Depositário (dentre os Autores)</Label>
                    <Select
                      value={depositarioSelecionadoIndex > -1 ? String(depositarioSelecionadoIndex) : "nenhum"}
                      onValueChange={handleFielDepositarioChange}
                    >
                      <SelectTrigger id="fiel-depositario-select" className="mt-2">
                        <SelectValue placeholder="Selecione um autor..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Nenhum / Não se aplica</SelectItem>
                        {visibleAutores.map((autor, index) => {
                            const originalIndex = autores.findIndex(a => a === autor);
                            return (
                                <SelectItem key={`autor-option-${originalIndex}`} value={String(originalIndex)}>
                                    {autor.nome || `Autor ${index + 1}`}
                                </SelectItem>
                            )
                        })}
                      </SelectContent>
                    </Select>
                    
                    {depositarioSelecionadoIndex > -1 && (
                        <>
                         <Card className="mt-4 bg-gray-50 p-4">
                             <CardContent className="text-sm space-y-1 p-0">
                                <p><strong>Nome:</strong> {autores[depositarioSelecionadoIndex].nome || 'Não informado'}</p>
                                <p><strong>CPF:</strong> {autores[depositarioSelecionadoIndex].cpf || 'Não informado'}</p>
                             </CardContent>
                         </Card>
                         <div className="md:col-span-2 mt-4">
                           <Label htmlFor="objeto-depositado-standalone">Objeto Depositado</Label>
                           <Textarea 
                               id="objeto-depositado-standalone" 
                               placeholder="Descreva o bem deixado sob a posse do fiel depositário" 
                               value={autores[depositarioSelecionadoIndex].objetoDepositado || ""} 
                               onChange={e => handleAutorDetalhadoChange(depositarioSelecionadoIndex, 'objetoDepositado', e.target.value)} 
                               className="mt-2" 
                           />
                         </div>
                       </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>;
};

export default PessoasEnvolvidasTab;
