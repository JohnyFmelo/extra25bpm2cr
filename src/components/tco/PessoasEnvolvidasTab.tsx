import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, User, Users } from "lucide-react";
import PersonalInfoFields from "./PersonalInfoFields"; // Certifique-se que este caminho está correto

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
}

interface PessoasEnvolvidasTabProps {
  // activeTab e setActiveTab não são mais necessários para o funcionamento interno das abas deste componente.
  // Se eles fossem para controlar a aba principal do TCOForm, eles já estavam sendo usados incorretamente aqui.
  // O componente Tabs do shadcn gerencia seu próprio estado de aba ativa.
  // Removi activeTab e setActiveTab das props, pois não são usados corretamente neste contexto.
  // Se precisar controlar a aba *principal* do TCOForm a partir daqui (o que seria incomum),
  // você precisaria de uma prop específica para isso e não a usaria nos onClick dos TabsTrigger internos.

  autorDetalhes: PersonalInfo; // Esta prop parece não estar sendo usada diretamente, pois você itera sobre `autores`. Considere remover se não for mais necessária.
  handleAutorChange: (index: number | null, field: string, value: string) => void; // Similar a autorDetalhes, esta prop pode ser redundante se handleAutorDetalhadoChange for o principal.
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
  // Removido activeTab, setActiveTab
  // autorDetalhes, // Comentado pois parece não ser usado
  // handleAutorChange, // Comentado pois parece não ser usado
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

  // Nota: Se os campos de vítima não aparecerem mesmo com esta correção,
  // o problema provavelmente está dentro do componente PersonalInfoFields.tsx
  // e como ele lida com os dados iniciais vazios de uma vítima ou a prop isVictim.

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
          <TabsList className={`grid ${isDrugCase ? "grid-cols-2" : "grid-cols-3"} mb-6`}>
            {/* Removido onClick dos TabsTrigger, o componente Tabs gerencia isso */}
            <TabsTrigger value="autor">
              <User className="mr-2 h-4 w-4" />
              Autores do Fato
            </TabsTrigger>
            {!isDrugCase && (
              <TabsTrigger value="vitimas">
                <User className="mr-2 h-4 w-4" />
                Vítimas
              </TabsTrigger>
            )}
            <TabsTrigger value="testemunhas">
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
                    {/* Botão de remover só aparece se houver mais de um autor E não for o autor principal,
                        ou se for para remover qualquer autor se houver mais de um.
                        A lógica atual permite remover qualquer autor se houver mais de um.
                        Se a intenção for não permitir remover o "Autor Principal" se for o único,
                        a condição seria: index > 0 || (index === 0 && autores.length > 1)
                        Mas a lógica atual `autores.length > 1` permite remover o principal se houver outros.
                    */}
                    {autores.length > 0 && ( // Alterado para permitir remover o último autor se necessário, mas geralmente você quer pelo menos um.
                                             // Se a regra é sempre ter pelo menos um, seria `autores.length > 1`
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
                    onChangeHandler={handleAutorDetalhadoChange} // Certifique-se que este handler está correto para todos os autores
                    prefix={`autor_${index}_`}
                    index={index}
                    isAuthor={true} // Passando que este é um autor
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
          
          {!isDrugCase && (
            <TabsContent value="vitimas" className="space-y-6">
              {vitimas.map((vitima, index) => (
                <Card key={`vitima_${index}`} className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <span className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        {/* Ajuste para Vítima 1, Vítima 2, etc., se houver mais de uma */}
                        {`Vítima ${vitimas.length > 1 ? index + 1 : ''}`.trim()}
                      </span>
                      {/* Botão de remover só aparece se houver mais de uma vítima */}
                      {vitimas.length > 0 && ( // Similar ao autor, se a regra é sempre ter pelo menos um se a aba é visível
                                              // ou se o primeiro é adicionado e depois pode ser removido.
                                              // A lógica de `handleAddVitima` inicializa com um, então `vitimas.length > 1` faz sentido
                                              // se você quer sempre manter a primeira após adicionar.
                                              // Se a primeira puder ser removida, `vitimas.length > 0` é mais flexível.
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
                      isVictim={true} // Passando que este é uma vítima
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
          )}
          
          <TabsContent value="testemunhas" className="space-y-6">
            {testemunhas.map((testemunha, index) => (
              <Card key={`testemunha_${index}`} className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {`Testemunha ${testemunhas.length > 1 ? index + 1 : ''}`.trim()}
                    </span>
                    {testemunhas.length > 0 && (
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
                    // Não passa isAuthor nem isVictim, ou passa ambos como false se PersonalInfoFields esperar
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
