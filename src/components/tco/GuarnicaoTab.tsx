
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

type PolicialEncontrado = {
  rgpm: string;
  nome: string;
  graduacao: string;
};

const campos = [
  { placeholder: "RG PM", width: "100px", id: "rgpm", showLabel: false },
  { placeholder: "Nome", width: "auto", id: "nome", showLabel: false },
  { placeholder: "Graduação", width: "110px", id: "graduacao", showLabel: false }
];

const GuarnicaoTab: React.FC<GuarnicaoTabProps> = ({
  currentGuarnicaoList,
  onAddPolicial,
  onRemovePolicial
}) => {
  const { toast } = useToast();
  const [consultaRg, setConsultaRg] = useState("");
  const [rgPM, setRgPM] = useState("");
  const [nome, setNome] = useState("");
  const [posto, setPosto] = useState("");
  const [isConsulting, setIsConsulting] = useState(false);
  const [policialEncontrado, setPolicialEncontrado] = useState<PolicialEncontrado | null>(null);
  const [isCadastroVisible, setIsCadastroVisible] = useState(false);
  const rgInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Foca no campo de consulta RG quando o componente monta
    if (rgInputRef.current) {
      rgInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const updateFields = () => {
      if (policialEncontrado) {
        setRgPM(policialEncontrado.rgpm);
        setNome(policialEncontrado.nome);
        setPosto(policialEncontrado.graduacao);
      }
    };

    updateFields();
  }, [policialEncontrado]);

  const resetFields = () => {
    setConsultaRg("");
    setRgPM("");
    setNome("");
    setPosto("");
    setPolicialEncontrado(null);
  };

  const handleAddPolicialToGuarnicao = () => {
    if (!rgPM || !nome || !posto) {
      toast({
        variant: "destructive",
        title: "Campos Incompletos",
        description: "Preencha todos os campos necessários."
      });
      return;
    }

    // Verifica se o RG já está na lista
    const existingPolicial = currentGuarnicaoList.find(
      (comp) => comp.rg === rgPM && comp.rg !== ""
    );

    if (existingPolicial) {
      toast({
        variant: "destructive",
        title: "Policial Duplicado",
        description: "Este policial já está na guarnição."
      });
      return;
    }

    onAddPolicial({
      rg: rgPM,
      nome,
      posto
    });

    resetFields();
    
    // Foca novamente no campo de consulta RG
    if (rgInputRef.current) {
      rgInputRef.current.focus();
    }
  };

  const consultarPolicialPorRG = async (rg: string) => {
    if (!rg || rg.trim() === "") {
      toast({
        variant: "destructive",
        title: "RG não informado",
        description: "Digite um RG PM para consultar"
      });
      return;
    }

    setIsConsulting(true);

    try {
      // Consulta no Supabase
      const { data, error } = await supabase
        .from('police_officers')
        .select('*')
        .eq('rgpm', rg)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            variant: "destructive",
            title: "Policial não encontrado",
            description: "Nenhum policial encontrado com este RG."
          });
          setIsCadastroVisible(true);
        } else {
          throw error;
        }
        setPolicialEncontrado(null);
      } else if (data) {
        setPolicialEncontrado(data);
        setIsCadastroVisible(false);
        toast({
          title: "Policial Encontrado",
          description: `Dados de ${data.nome} carregados.`
        });
      }
    } catch (error) {
      console.error("Erro ao consultar policial:", error);
      toast({
        variant: "destructive",
        title: "Erro na consulta",
        description: "Ocorreu um erro ao consultar o policial."
      });
    } finally {
      setIsConsulting(false);
    }
  };

  const postoOptions = [
    "Soldado",
    "Cabo",
    "3º Sargento",
    "2º Sargento",
    "1º Sargento",
    "Subtenente",
    "Aspirante",
    "2º Tenente",
    "1º Tenente",
    "Capitão",
    "Major",
    "Tenente-Coronel",
    "Coronel"
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if ((e.target as HTMLElement).id === 'consultaRg') {
        consultarPolicialPorRG(consultaRg);
      } else if ((e.target as HTMLElement).id === 'rgpm' || (e.target as HTMLElement).id === 'nome' || (e.target as HTMLElement).id === 'posto') {
        handleAddPolicialToGuarnicao();
      }
    }
  };

  // Cores dos postos para melhor visualização
  const getPostoColor = (posto: string) => {
    if (posto.includes("Soldado") || posto.includes("Cabo")) return "bg-green-100";
    if (posto.includes("Sargento") || posto.includes("Subtenente")) return "bg-blue-100";
    if (posto.includes("Tenente") || posto.includes("Aspirante")) return "bg-yellow-100";
    if (posto.includes("Capitão")) return "bg-orange-100";
    if (posto.includes("Major") || posto.includes("Coronel")) return "bg-red-100";
    return "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guarnição</CardTitle>
        <CardDescription>
          Adicione os policiais que compõem a guarnição
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seção de Consulta de Policial */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label htmlFor="consultaRg">RG PM para Consulta</Label>
              <div className="flex">
                <Input
                  id="consultaRg"
                  ref={rgInputRef}
                  placeholder="Digite o RG PM"
                  value={consultaRg}
                  onChange={(e) => setConsultaRg(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="ml-2"
                  onClick={() => consultarPolicialPorRG(consultaRg)}
                  disabled={isConsulting}
                >
                  <Search className="h-4 w-4 mr-1" aria-label="Consultar" />
                  {isConsulting ? "Consultando..." : "Consultar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Seção de Dados do Policial */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 border rounded-md">
            <div>
              <Label htmlFor="rgpm">RG PM *</Label>
              <Input
                id="rgpm"
                placeholder="RG PM"
                value={rgPM}
                onChange={(e) => setRgPM(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div>
              <Label htmlFor="posto">Posto/Graduação *</Label>
              <Select
                value={posto}
                onValueChange={setPosto}
                onKeyDown={handleKeyDown}
              >
                <SelectTrigger id="posto">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {postoOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetFields}
              className="mr-2"
              size="sm"
            >
              <X size={16} className="mr-1" />
              Limpar
            </Button>
            <Button
              type="button"
              onClick={handleAddPolicialToGuarnicao}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Check size={16} className="mr-1" />
              Adicionar à Guarnição
            </Button>
          </div>
        </div>

        {/* Lista de Componentes da Guarnição */}
        <div className="border rounded-md p-4 mt-6">
          <h3 className="text-lg font-semibold mb-2">Componentes da Guarnição</h3>
          
          {currentGuarnicaoList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">RG PM</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[150px]">Posto/Graduação</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentGuarnicaoList.map((componente, index) => (
                  <TableRow key={index} className={getPostoColor(componente.posto)}>
                    <TableCell>{componente.rg}</TableCell>
                    <TableCell>{componente.nome}</TableCell>
                    <TableCell>{componente.posto}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemovePolicial(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" aria-label="Remover" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Nenhum policial adicionado à guarnição
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GuarnicaoTab;
