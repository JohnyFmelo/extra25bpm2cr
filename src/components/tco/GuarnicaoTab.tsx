
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ComponenteGuarnicaoFields from "./ComponenteGuarnicaoFields";
import { useIsMobile } from '@/hooks/use-mobile';

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

const GuarnicaoTab: React.FC<GuarnicaoTabProps> = ({
  currentGuarnicaoList,
  onAddPolicial,
  onRemovePolicial
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [rgPM, setRgPM] = useState('');
  const [nomePM, setNomePM] = useState('');
  const [postoPM, setPostoPM] = useState('');
  const [cadastrando, setCadastrando] = useState(false);
  const [policiais, setPoliciais] = useState<{ id: string, nome: string, rg: string, posto: string }[]>([]);
  const [selectedPolicial, setSelectedPolicial] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarPoliciais = async () => {
      try {
        // Simula uma chamada de API
        // Em um cenário real, aqui você buscaria os dados do banco
        setTimeout(() => {
          const policiaisSimulados = [
            { id: '1', nome: 'JOÃO SILVA', rg: '12345', posto: 'SD' },
            { id: '2', nome: 'MARIA OLIVEIRA', rg: '23456', posto: '3º SGT' },
            { id: '3', nome: 'CARLOS SANTOS', rg: '34567', posto: 'CB' },
            { id: '4', nome: 'ANA PEREIRA', rg: '45678', posto: 'SD' },
            { id: '5', nome: 'PEDRO SOUZA', rg: '56789', posto: 'SD' },
          ];
          setPoliciais(policiaisSimulados);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Erro ao carregar policiais:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar a lista de policiais."
        });
        setLoading(false);
      }
    };

    setLoading(true);
    carregarPoliciais();
  }, [toast]);

  const handleAddClick = () => {
    if (!rgPM.trim() || !nomePM.trim() || !postoPM) {
      toast({
        variant: "destructive",
        title: "Campos Incompletos",
        description: "Preencha todos os campos para adicionar um policial."
      });
      return;
    }

    // Verifica se o RG já existe na lista
    const rgExists = currentGuarnicaoList.some(p => p.rg === rgPM);
    if (rgExists) {
      toast({ 
        title: "RG Duplicado", 
        description: "Um policial com este RG já está na guarnição."
      });
      return;
    }

    onAddPolicial({
      rg: rgPM,
      nome: nomePM.toUpperCase(),
      posto: postoPM
    });

    // Limpa os campos após adicionar
    setRgPM('');
    setNomePM('');
    setPostoPM('');
    setCadastrando(false);
  };

  const handleSelectPolicial = () => {
    if (!selectedPolicial) {
      toast({
        title: "Seleção Vazia",
        description: "Selecione um policial da lista."
      });
      return;
    }

    const policial = policiais.find(p => p.id === selectedPolicial);
    if (!policial) return;

    // Verifica se o RG já existe na lista
    const rgExists = currentGuarnicaoList.some(p => p.rg === policial.rg);
    if (rgExists) {
      toast({
        title: "RG Duplicado",
        description: "Este policial já está na guarnição."
      });
      return;
    }

    onAddPolicial({
      rg: policial.rg,
      nome: policial.nome,
      posto: policial.posto
    });

    setSelectedPolicial('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Guarnição Policial Militar (GUPM)</CardTitle>
        <CardDescription>
          Adicione os policiais que compõem a guarnição
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Lista de componentes da guarnição */}
        <div>
          <h3 className="text-lg font-medium mb-2">Componentes da Guarnição</h3>
          
          {currentGuarnicaoList.length === 0 ? (
            <div className="flex items-center p-4 border border-dashed rounded-lg text-amber-600 bg-amber-50">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>Nenhum policial adicionado à guarnição.</p>
            </div>
          ) : (
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4`}>
              {currentGuarnicaoList.map((componente, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{componente.posto} PM {componente.nome}</p>
                      <p className="text-sm text-gray-600">RG: {componente.rg}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRemovePolicial(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Adicionar Policial</h3>

          {/* Opções para adicionar policial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Selecionar da Lista</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="policialSelect">Policial</Label>
                  <Select value={selectedPolicial} onValueChange={setSelectedPolicial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um policial" />
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : (
                        policiais.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.posto} PM {p.nome} (RG: {p.rg})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleSelectPolicial} 
                  disabled={loading || !selectedPolicial}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Selecionado
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Cadastrar Novo</h4>
              
              {!cadastrando ? (
                <Button onClick={() => setCadastrando(true)} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Cadastrar Manualmente
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rgPM">RG PM</Label>
                    <Input 
                      id="rgPM" 
                      type="text" 
                      placeholder="Informe o RG do PM" 
                      value={rgPM} 
                      onChange={e => setRgPM(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nomePM">Nome</Label>
                    <Input 
                      id="nomePM" 
                      type="text" 
                      placeholder="Nome completo do PM" 
                      value={nomePM} 
                      onChange={e => setNomePM(e.target.value)}
                    />
                  </div>
                  
                  <ComponenteGuarnicaoFields 
                    posto={postoPM}
                    setPosto={setPostoPM}
                  />
                  
                  <div className="flex space-x-2">
                    <Button onClick={handleAddClick} className="flex-1">
                      <Save className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setCadastrando(false)} 
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuarnicaoTab;
