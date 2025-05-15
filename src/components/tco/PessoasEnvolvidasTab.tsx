
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, User, Users } from "lucide-react";
import PersonalInfoFields from "./PersonalInfoFields";
import { motion } from "framer-motion"; 

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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

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

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
          <Users className="mr-2 h-5 w-5" />
          PESSOAS ENVOLVIDAS
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <Tabs defaultValue="autor" className="w-full">
          {/* Dynamically adjust the grid columns based on whether victims should be shown */}
          <TabsList className={`grid ${isDrugCase ? 'grid-cols-2' : 'grid-cols-3'} mb-6`}>
            <TabsTrigger value="autor" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="mr-2 h-4 w-4" />
              Autores do Fato
            </TabsTrigger>
            {!isDrugCase && (
              <TabsTrigger value="vitimas" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <User className="mr-2 h-4 w-4" />
                Vítimas
              </TabsTrigger>
            )}
            <TabsTrigger value="testemunhas" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              Testemunhas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="autor" className="space-y-6">
            {autores.map((autor, index) => (
              <motion.div
                key={`autor_${index}`}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                custom={index}
                layoutId={`autor_card_${index}`}
              >
                <Card key={`autor_${index}`} className="border-dashed mb-6 border-blue-300 hover:border-blue-500 transition-colors duration-200">
                  <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-900/20">
                    <CardTitle className="text-lg flex justify-between items-center text-blue-700 dark:text-blue-300">
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
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
              </motion.div>
            ))}
            
            <div className="flex justify-center mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddAutor}
                className="w-full md:w-auto bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:border-blue-500 transition-all duration-200"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Autor
              </Button>
            </div>
          </TabsContent>
          
          {!isDrugCase && (
            <TabsContent value="vitimas" className="space-y-6">
              {vitimas.map((vitima, index) => (
                <motion.div
                  key={`vitima_${index}`}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  custom={index}
                  layoutId={`vitima_card_${index}`}
                >
                  <Card key={`vitima_${index}`} className="border-dashed border-red-300 hover:border-red-500 transition-colors duration-200">
                    <CardHeader className="pb-2 bg-red-50 dark:bg-red-900/20">
                      <CardTitle className="text-lg flex justify-between items-center text-red-700 dark:text-red-300">
                        <span className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          {`Vítima ${vitimas.length > 1 ? index + 1 : ''}`.trim() || "Vítima"}
                        </span>
                        {vitimas.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveVitima(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                        isVictim={true}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              <div className="flex justify-center mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddVitima}
                  className="w-full md:w-auto bg-red-50 text-red-700 border-red-300 hover:bg-red-100 hover:border-red-500 transition-all duration-200"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Vítima
                </Button>
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="testemunhas" className="space-y-6">
            {testemunhas.map((testemunha, index) => (
              <motion.div
                key={`testemunha_${index}`}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                custom={index}
                layoutId={`testemunha_card_${index}`}
              >
                <Card key={`testemunha_${index}`} className="border-dashed border-amber-300 hover:border-amber-500 transition-colors duration-200">
                  <CardHeader className="pb-2 bg-amber-50 dark:bg-amber-900/20">
                    <CardTitle className="text-lg flex justify-between items-center text-amber-700 dark:text-amber-300">
                      <span className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        {`Testemunha ${testemunhas.length > 1 ? index + 1 : ''}`.trim() || "Testemunha"}
                      </span>
                      {testemunhas.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveTestemunha(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
              </motion.div>
            ))}
            
            <div className="flex justify-center mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddTestemunha}
                className="w-full md:w-auto bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-500 transition-all duration-200"
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
