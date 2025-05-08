
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ComponenteGuarnicaoFields from "./ComponenteGuarnicaoFields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

const GuarnicaoTab: React.FC<GuarnicaoTabProps> = ({
  currentGuarnicaoList,
  onAddPolicial,
  onRemovePolicial,
}) => {
  const { toast } = useToast();
  const [rgSearch, setRgSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [encontrado, setEncontrado] = useState(false);
  const [policialEncontrado, setPolicialEncontrado] = useState<{
    nome?: string;
    posto?: string;
    rg?: string;
  } | null>(null);

  const [novoPolicial, setNovoPolicial] = useState<ComponenteGuarnicao>({
    rg: "",
    nome: "",
    posto: "",
  });

  useEffect(() => {
    if (policialEncontrado) {
      setNovoPolicial({
        rg: policialEncontrado.rg || "",
        nome: policialEncontrado.nome || "",
        posto: policialEncontrado.posto || "",
      });
    }
  }, [policialEncontrado]);

  const handleRgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRgSearch(e.target.value);
    setEncontrado(false);
    setPolicialEncontrado(null);
  };

  const handleSearch = async () => {
    if (!rgSearch.trim()) {
      toast({
        variant: "destructive",
        title: "Campo Obrigatório",
        description: "Informe um RG para buscar.",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('police_officers')
        .select('*')
        .eq('rgpm', rgSearch.trim())
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setPolicialEncontrado({
          nome: data.nome,
          posto: data.graduacao,
          rg: data.rgpm,
        });
        setEncontrado(true);
        toast({
          title: "Policial Encontrado",
          description: `${data.graduacao} PM ${data.nome}`,
        });
      } else {
        setEncontrado(false);
        setPolicialEncontrado(null);
        toast({
          variant: "destructive",
          title: "Nenhum resultado",
          description: "Policial não encontrado com este RG.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar policial:", error);
      setEncontrado(false);
      setPolicialEncontrado(null);
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: error.message || "Não foi possível completar a busca.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    setNovoPolicial((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleAddPolicial = () => {
    if (!novoPolicial.nome || !novoPolicial.posto || !novoPolicial.rg) {
      toast({
        variant: "destructive",
        title: "Campos Incompletos",
        description: "Preencha todos os campos do policial.",
      });
      return;
    }

    onAddPolicial(novoPolicial);
    setNovoPolicial({ rg: "", nome: "", posto: "" });
    setRgSearch("");
    setEncontrado(false);
    setPolicialEncontrado(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Card className="bg-card flex-1">
      <CardHeader>
        <CardTitle>Integrantes da Guarnição</CardTitle>
        <CardDescription>
          Cadastre os integrantes da guarnição que atenderam a ocorrência
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Busca de Policial */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Label htmlFor="rgSearch">Buscar por RG do PM</Label>
                <div className="flex mt-1">
                  <Input
                    id="rgSearch"
                    placeholder="Digite o RG"
                    value={rgSearch}
                    onChange={handleRgChange}
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="ml-2"
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    {loading ? "..." : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {encontrado ? (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">
                  Policial encontrado
                </AlertTitle>
                <AlertDescription className="text-green-700">
                  {policialEncontrado?.posto} PM {policialEncontrado?.nome}
                </AlertDescription>
              </Alert>
            ) : null}

            {/* Formulário de Adicionar Policial */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="posto">Posto/Graduação</Label>
                <Input
                  id="posto"
                  value={novoPolicial.posto}
                  onChange={(e) => handleInputChange(e, "posto")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={novoPolicial.nome}
                  onChange={(e) => handleInputChange(e, "nome")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="rg">RG</Label>
                <div className="flex mt-1">
                  <Input
                    id="rg"
                    value={novoPolicial.rg}
                    onChange={(e) => handleInputChange(e, "rg")}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="ml-2"
                    onClick={handleAddPolicial}
                  >
                    <UserPlus className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Policiais Adicionados */}
          {currentGuarnicaoList.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-2">
                Guarnição Completa ({currentGuarnicaoList.length})
              </h4>
              <div className="space-y-2">
                {currentGuarnicaoList.map((comp, index) => (
                  <ComponenteGuarnicaoFields
                    key={index}
                    index={index}
                    componente={comp}
                    onRemove={onRemovePolicial}
                  />
                ))}
              </div>
            </div>
          )}

          {currentGuarnicaoList.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nenhum Integrante</AlertTitle>
              <AlertDescription>
                Adicione ao menos o condutor da ocorrência.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GuarnicaoTab;
