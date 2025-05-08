// Requires fixing the supabase import and changing warning variant to destructive
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Ban, Check, X, AlertCircle, Search, Save, UserPlus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/lib/supabaseClient";

interface ComponenteGuarnicao {
  id?: string;
  nome: string;
  matricula: string;
  posto_graduacao: string;
}

interface PessoalResult {
  id: string;
  nome: string;
  matricula: string;
  posto_graduacao: string;
}

const defaultComponente: ComponenteGuarnicao = {
  nome: "",
  matricula: "",
  posto_graduacao: "",
};

const GuarnicaoTab = ({ onChange }: { onChange: (data: any) => void }) => {
  // Estado para armazenar a guarnição
  const [componentes, setComponentes] = useState<ComponenteGuarnicao[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<PessoalResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newComponente, setNewComponente] = useState<ComponenteGuarnicao>(defaultComponente);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Notifica o componente pai sobre as mudanças na guarnição
    onChange(componentes);
  }, [componentes, onChange]);

  const handleAddComponente = (componente: ComponenteGuarnicao) => {
    setComponentes([...componentes, componente]);
  };

  const handleRemoveComponente = (index: number) => {
    const updatedComponentes = [...componentes];
    updatedComponentes.splice(index, 1);
    setComponentes(updatedComponentes);
  };

  const handleUpdateComponente = (index: number, updatedComponente: ComponenteGuarnicao) => {
    const updatedComponentes = [...componentes];
    updatedComponentes[index] = updatedComponente;
    setComponentes(updatedComponentes);
  };

  async function handleSearch() {
    if (!searchTerm.trim()) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "Digite um nome ou matrícula para pesquisar",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pessoal")
        .select("*")
        .or(`nome.ilike.%${searchTerm}%,matricula.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) {
        throw error;
      }

      console.log("Resultados da pesquisa:", data);
      setSearchResults(data || []);
      if (data?.length === 0) {
        toast({
          variant: "destructive",
          title: "Sem resultados",
          description: "Nenhum policial encontrado com os termos informados",
        });
      }
    } catch (error) {
      console.error("Erro ao pesquisar:", error);
      toast({
        variant: "destructive",
        title: "Erro na pesquisa",
        description: "Não foi possível completar a pesquisa. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSelectPessoal = (pessoal: PessoalResult) => {
    setNewComponente({
      nome: pessoal.nome,
      matricula: pessoal.matricula,
      posto_graduacao: pessoal.posto_graduacao,
    });
    setIsSearchDialogOpen(false);
  };

  const handleSaveComponente = () => {
    if (!newComponente.nome || !newComponente.matricula || !newComponente.posto_graduacao) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Preencha todos os campos do componente.",
      });
      return;
    }

    if (currentEditIndex !== null) {
      // Editar componente existente
      handleUpdateComponente(currentEditIndex, newComponente);
      toast({
        title: "Componente atualizado",
        description: "O componente da guarnição foi atualizado com sucesso.",
      });
    } else {
      // Adicionar novo componente
      handleAddComponente(newComponente);
      toast({
        title: "Componente adicionado",
        description: "Novo componente adicionado à guarnição.",
      });
    }

    setIsAdding(false);
    setNewComponente(defaultComponente);
  };

  const handleCloseDialog = () => {
    setIsSearchDialogOpen(false);
    setSearchTerm("");
    setSearchResults([]);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Componentes da Guarnição</h3>
          <Button
            onClick={() => {
              setCurrentEditIndex(null);
              setNewComponente(defaultComponente);
              setIsAdding(true);
            }}
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-1" aria-label="Adicionar componente" />
            Adicionar
          </Button>
        </div>

        {componentes.length === 0 ? (
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum componente adicionado à guarnição</p>
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {componentes.map((componente, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 hover:bg-muted/30"
              >
                <div>
                  <p className="font-medium">{componente.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {componente.matricula} • {componente.posto_graduacao}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentEditIndex(index);
                      setNewComponente({ ...componentes[index] });
                      setIsAdding(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" /> 
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveComponente(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog para adicionar/editar componente */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentEditIndex !== null
                ? "Editar Componente"
                : "Adicionar Componente"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <div className="flex-grow">
                <Input
                  placeholder="Nome"
                  value={newComponente.nome}
                  onChange={(e) =>
                    setNewComponente({ ...newComponente, nome: e.target.value })
                  }
                  className="mb-2"
                />
              </div>
              <Button
                onClick={() => setIsSearchDialogOpen(true)}
                variant="outline"
                type="button"
                className="shrink-0"
              >
                <Search className="h-4 w-4 mr-1" />
                Buscar
              </Button>
            </div>

            <Input
              placeholder="Matrícula"
              value={newComponente.matricula}
              onChange={(e) =>
                setNewComponente({ ...newComponente, matricula: e.target.value })
              }
              className="mb-2"
            />
            <Input
              placeholder="Posto/Graduação"
              value={newComponente.posto_graduacao}
              onChange={(e) =>
                setNewComponente({ ...newComponente, posto_graduacao: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewComponente(defaultComponente);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveComponente} disabled={!newComponente.nome}>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para pesquisa de policiais */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buscar Policial</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Digite nome ou matrícula"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              ref={searchInputRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="flex-grow"
            />
            <Button onClick={handleSearch} disabled={isLoading} className="shrink-0">
              <Search className="h-4 w-4 mr-1" />
              Buscar
            </Button>
          </div>

          <div className="max-h-96 overflow-auto">
            {isLoading ? (
              <div className="text-center p-4">Buscando...</div>
            ) : searchResults.length > 0 ? (
              <div className="border rounded-lg divide-y">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 cursor-pointer"
                    onClick={() => handleSelectPessoal(result)}
                  >
                    <div>
                      <p className="font-medium">{result.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.matricula} • {result.posto_graduacao}
                      </p>
                    </div>
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                {searchTerm
                  ? "Nenhum resultado encontrado"
                  : "Digite um termo para buscar"}
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={handleCloseDialog}>
                Fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuarnicaoTab;
