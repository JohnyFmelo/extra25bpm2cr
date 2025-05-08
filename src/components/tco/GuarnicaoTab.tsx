import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ban, Check, X, AlertCircle, Search, Save, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
}

interface GuarnicaoTabProps {
  currentGuarnicaoList: ComponenteGuarnicao[];
  onAddPolicial: (policial: ComponenteGuarnicao) => void;
  onRemovePolicial: (index: number) => void;
}

const GuarnicaoTab: React.FC<GuarnicaoTabProps> = ({ currentGuarnicaoList, onAddPolicial, onRemovePolicial }) => {
  const { toast } = useToast();
  const [searchRg, setSearchRg] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [rgInvalido, setRgInvalido] = useState(false);
  const [policialEncontrado, setPolicialEncontrado] = useState(false);
  const [novoPolicial, setNovoPolicial] = useState<ComponenteGuarnicao>({
    rg: "",
    nome: "",
    posto: ""
  });

  // Resetar estados de validação quando o RG for alterado
  useEffect(() => {
    setRgInvalido(false);
    setPolicialEncontrado(false);
  }, [searchRg]);

  // Busca policial pelo RG no Supabase
  const buscarPolicial = async () => {
    if (!searchRg || searchRg.length < 4) {
      toast({
        variant: "destructive",
        title: "RG Inválido",
        description: "Digite um RG válido para buscar"
      });
      setRgInvalido(true);
      return;
    }

    setIsSearching(true);
    setRgInvalido(false);
    setPolicialEncontrado(false);

    try {
      // Busca no Supabase
      const { data: policialData, error } = await supabase
        .from('police_officers')
        .select('nome, graduacao, pai, mae, naturalidade, cpf, telefone')
        .eq('rgpm', searchRg)
        .single();

      if (error) {
        console.error("Erro ao buscar policial:", error);
        toast({
          variant: "destructive",
          title: "Policial não encontrado",
          description: "Verifique o RG informado ou cadastre manualmente."
        });
        setRgInvalido(true);
        return;
      }

      if (policialData) {
        setNovoPolicial({
          rg: searchRg,
          nome: policialData.nome || "",
          posto: policialData.graduacao || ""
        });
        setPolicialEncontrado(true);
        toast({
          title: "Policial encontrado",
          description: `${policialData.graduacao} ${policialData.nome} foi encontrado.`
        });
      } else {
        toast({
          title: "Policial não encontrado",
          description: "Cadastre as informações manualmente."
        });
      }
    } catch (error) {
      console.error("Erro ao buscar policial:", error);
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: "Não foi possível buscar as informações do policial."
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddPolicialManually = () => {
    if (!novoPolicial.rg || !novoPolicial.nome || !novoPolicial.posto) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos do policial."
      });
      return;
    }

    // Verificar se o RG já existe na lista
    const rgAlreadyExists = currentGuarnicaoList.some(p => p.rg === novoPolicial.rg);
    if (rgAlreadyExists) {
      toast({
        variant: "destructive",
        title: "RG já adicionado",
        description: "Este policial já está na guarnição."
      });
      return;
    }

    onAddPolicial(novoPolicial);
    // Limpar os campos após adicionar
    setNovoPolicial({
      rg: "",
      nome: "",
      posto: ""
    });
    setSearchRg("");
    setPolicialEncontrado(false);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-slate-500 text-white rounded-t-lg">
        <h3 className="text-xl font-semibold">Guarnição Policial</h3>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <Accordion type="single" collapsible defaultValue="busca">
            <AccordionItem value="busca">
              <AccordionTrigger>Adicionar Policial</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="searchRg">RG PM</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="searchRg"
                        value={searchRg}
                        onChange={(e) => setSearchRg(e.target.value)}
                        placeholder="Digite o RG PM"
                        className={rgInvalido ? "border-red-500" : ""}
                      />
                      <Button 
                        onClick={buscarPolicial} 
                        disabled={isSearching}
                        aria-label="Buscar policial"
                      >
                        {isSearching ? (
                          <div className="animate-spin">⌛</div>
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {rgInvalido && (
                      <p className="text-red-500 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" aria-label="Alerta" />
                        Policial não encontrado com este RG
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="rgPolicial">RG PM</Label>
                      <Input
                        id="rgPolicial"
                        value={novoPolicial.rg}
                        onChange={(e) => setNovoPolicial({...novoPolicial, rg: e.target.value})}
                        placeholder="RG PM"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postoPolicial">Posto/Graduação</Label>
                      <Input
                        id="postoPolicial"
                        value={novoPolicial.posto}
                        onChange={(e) => setNovoPolicial({...novoPolicial, posto: e.target.value})}
                        placeholder="Posto/Graduação"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nomePolicial">Nome do Policial</Label>
                      <Input
                        id="nomePolicial"
                        value={novoPolicial.nome}
                        onChange={(e) => setNovoPolicial({...novoPolicial, nome: e.target.value})}
                        placeholder="Nome completo"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddPolicialManually}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Cadastrar/Atualizar Policial
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="listaAtual">
              <AccordionTrigger>Lista de Policiais na Guarnição</AccordionTrigger>
              <AccordionContent>
                {currentGuarnicaoList.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Nenhum policial adicionado à guarnição</p>
                ) : (
                  <div className="space-y-2">
                    {currentGuarnicaoList.map((policial, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
                      >
                        <div>
                          <span className="font-medium">{policial.posto} </span>
                          <span>{policial.nome}</span>
                          <span className="text-sm text-gray-500 ml-2">({policial.rg})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemovePolicial(index)}
                          aria-label="Remover policial"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuarnicaoTab;
