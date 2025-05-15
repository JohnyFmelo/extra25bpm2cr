import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Users, UserPlus, Info, Search, UserMinus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";

// --- Funções Auxiliares ---
const somenteNumeros = (value: string | null | undefined): string => {
  return value?.replace(/\D/g, '') || '';
};
const formatarCPF = (value: string): string => {
  const numeros = somenteNumeros(value);
  let cpfFormatado = numeros.slice(0, 11);
  cpfFormatado = cpfFormatado.replace(/^(\d{3})(\d)/, '$1.$2');
  cpfFormatado = cpfFormatado.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
  cpfFormatado = cpfFormatado.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  return cpfFormatado;
};
const formatarCelular = (value: string): string => {
  const numeros = somenteNumeros(value);
  let foneFormatado = numeros.slice(0, 11);
  if (foneFormatado.length === 11) {
    foneFormatado = foneFormatado.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (foneFormatado.length === 10) {
    foneFormatado = foneFormatado.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (foneFormatado.length > 6) {
    foneFormatado = foneFormatado.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (foneFormatado.length > 2) {
    foneFormatado = foneFormatado.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  }
  return foneFormatado;
};
const validateCPF = (cpf: string) => {
  cpf = somenteNumeros(cpf);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digit2 === parseInt(cpf.charAt(10));
};

// --- Interfaces ---
interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
  pai?: string;
  mae?: string;
  naturalidade?: string;
  cpf?: string;
  telefone?: string;
}
interface PoliceOfficerSearchResult {
  nome: string | null;
  graduacao: string | null;
  pai: string | null;
  mae: string | null;
  naturalidade: string | null;
  cpf: string | null;
  telefone: string | null;
}
interface PoliceOfficerFormData {
  rgpm: string;
  nome: string;
  graduacao: string;
  pai: string;
  mae: string;
  naturalidade: string;
  cpf: string;
  telefone: string;
}
const initialOfficerFormData: PoliceOfficerFormData = {
  rgpm: "",
  nome: "",
  graduacao: "",
  pai: "",
  mae: "",
  naturalidade: "",
  cpf: "",
  telefone: ""
};
const graduacoes = ["SD PM", "CB PM", "3º SGT PM", "2º SGT PM", "1º SGT PM", "SUB TEN PM", "ASPIRANTE PM", "2º TEN PM", "1º TEN PM", "CAP PM", "MAJ PM", "TEN CEL PM", "CEL PM"];
interface GuarnicaoTabProps {
  currentGuarnicaoList: ComponenteGuarnicao[];
  onAddPolicial: (policial: ComponenteGuarnicao) => void;
  onRemovePolicial: (index: number) => void;
  currentApoioList: ComponenteGuarnicao[];
  onAddApoio: (policial: ComponenteGuarnicao) => void;
  onRemoveApoio: (index: number) => void;
}

// --- Componente GuarnicaoTab ---
const GuarnicaoTab: React.FC<GuarnicaoTabProps> = ({
  currentGuarnicaoList,
  onAddPolicial,
  onRemovePolicial,
  currentApoioList,
  onAddApoio,
  onRemoveApoio
}) => {
  const {
    toast
  } = useToast();
  const [searchRgpm, setSearchRgpm] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState<boolean>(false);
  const [newOfficerFormData, setNewOfficerFormData] = useState<PoliceOfficerFormData>(initialOfficerFormData);
  const [activeTab, setActiveTab] = useState<"guarnicao" | "apoio">("guarnicao");
  
  useEffect(() => {
    console.log("[GuarnicaoTab] Prop 'currentGuarnicaoList' recebida:", currentGuarnicaoList);
    console.log("[GuarnicaoTab] Prop 'currentApoioList' recebida:", currentApoioList);
  }, [currentGuarnicaoList, currentApoioList]);
  
  const handleSearchRgpmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const numeros = somenteNumeros(rawValue).slice(0, 6);
    setSearchRgpm(numeros);
  };
  
  const handleSearchAndAdd = useCallback(async () => {
    const rgpmToSearch = searchRgpm;
    console.log("[GuarnicaoTab] Iniciando busca por RGPM:", rgpmToSearch);
    if (rgpmToSearch.length !== 6) {
      toast({
        variant: "destructive",
        title: "RGPM Inválido",
        description: "O RGPM da busca deve conter exatamente 6 dígitos."
      });
      return;
    }
    
    // Verificar duplicidade na lista atual (guarnição ou apoio)
    const targetList = activeTab === "guarnicao" ? currentGuarnicaoList : currentApoioList;
    const alreadyExists = targetList.some(comp => comp.rg === rgpmToSearch);
    
    // Verificar duplicidade na outra lista
    const otherList = activeTab === "guarnicao" ? currentApoioList : currentGuarnicaoList;
    const existsInOtherList = otherList.some(comp => comp.rg === rgpmToSearch);
    
    if (alreadyExists) {
      console.log(`[GuarnicaoTab] RGPM já existe na lista de ${activeTab}:`, rgpmToSearch);
      toast({
        variant: "default",
        title: "Duplicado",
        description: `Este policial já está na ${activeTab === "guarnicao" ? "guarnição" : "equipe de apoio"}.`
      });
      setSearchRgpm("");
      return;
    }
    
    if (existsInOtherList) {
      const confirmMessage = activeTab === "guarnicao" 
        ? "Este policial já está na equipe de apoio. Deseja adicioná-lo também à guarnição principal?"
        : "Este policial já está na guarnição principal. Deseja adicioná-lo também à equipe de apoio?";
        
      if (!window.confirm(confirmMessage)) {
        setSearchRgpm("");
        return;
      }
    }
    
    setIsSearching(true);
    console.log("[GuarnicaoTab] Buscando no Supabase...");
    try {
      const {
        data,
        error
      } = await supabase.from("police_officers").select("nome, graduacao, pai, mae, naturalidade, cpf, telefone").eq("rgpm", rgpmToSearch).single();
      console.log("[GuarnicaoTab] Resposta Supabase:", {
        data,
        error
      });
      console.log("[GuarnicaoTab] Telefone retornado do Supabase:", data?.telefone);
      if (error && error.code === 'PGRST116') {
        toast({
          variant: "default",
          title: "Não Encontrado",
          description: `Nenhum policial encontrado com o RGPM ${rgpmToSearch}. Considere cadastrá-lo.`
        });
      } else if (error) {
        throw error;
      } else if (data) {
        const officerData = data as PoliceOfficerSearchResult;
        const newComponente: ComponenteGuarnicao = {
          rg: rgpmToSearch,
          nome: officerData.nome?.toUpperCase() || "NOME NÃO INFORMADO",
          posto: officerData.graduacao || "POSTO NÃO INFORMADO",
          pai: officerData.pai?.toUpperCase() || "NÃO INFORMADO",
          mae: officerData.mae?.toUpperCase() || "NÃO INFORMADO",
          naturalidade: officerData.naturalidade?.toUpperCase() || "NÃO INFORMADO",
          cpf: officerData.cpf ? formatarCPF(officerData.cpf) : "NÃO INFORMADO",
          telefone: officerData.telefone ? formatarCelular(officerData.telefone) : "NÃO INFORMADO"
        };
        console.log("[GuarnicaoTab] Componente criado com telefone:", newComponente.telefone);
        console.log("[GuarnicaoTab] Policial encontrado. Chamando onAddPolicial:", newComponente);
        if (activeTab === "guarnicao") {
          onAddPolicial(newComponente);
          toast({
            title: "Adicionado à Guarnição",
            description: `Policial ${newComponente.nome} adicionado à guarnição principal.`,
            className: "bg-green-600 text-white border-green-700",
            duration: 5000
          });
        } else {
          onAddApoio(newComponente);
          toast({
            title: "Adicionado ao Apoio",
            description: `Policial ${newComponente.nome} adicionado à equipe de apoio.`,
            className: "bg-green-600 text-white border-green-700",
            duration: 5000
          });
        }
        setSearchRgpm("");
      }
    } catch (error: any) {
      console.error("[GuarnicaoTab] Erro na busca:", error);
      toast({
        variant: "destructive",
        title: "Erro na Busca",
        description: `Falha ao buscar dados: ${error.message || 'Erro desconhecido'}`
      });
    } finally {
      setIsSearching(false);
      console.log("[GuarnicaoTab] Busca finalizada.");
    }
  }, [searchRgpm, currentGuarnicaoList, currentApoioList, toast, onAddPolicial, onAddApoio, activeTab]);
  
  const handleRemove = (index: number) => {
    if (activeTab === "guarnicao") {
      const itemToRemove = currentGuarnicaoList[index];
      console.log("[GuarnicaoTab] Chamando onRemovePolicial para índice:", index, itemToRemove);
      onRemovePolicial(index);
      toast({
        title: "Removido da Guarnição",
        description: `Componente ${itemToRemove?.nome || ''} removido da guarnição principal.`
      });
    } else {
      const itemToRemove = currentApoioList[index];
      console.log("[GuarnicaoTab] Chamando onRemoveApoio para índice:", index, itemToRemove);
      onRemoveApoio(index);
      toast({
        title: "Removido do Apoio",
        description: `Componente ${itemToRemove?.nome || ''} removido da equipe de apoio.`
      });
    }
  };
  
  const openRegisterDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRegisterDialogOpen(true);
  };
  
  const closeRegisterDialog = () => {
    setIsRegisterDialogOpen(false);
    setNewOfficerFormData(initialOfficerFormData);
  };
  
  const handleRegisterInputChange = (field: keyof PoliceOfficerFormData, value: string) => {
    let processedValue = value;
    if (field === 'cpf') {
      processedValue = formatarCPF(value);
    } else if (field === 'telefone') {
      processedValue = formatarCelular(value);
    } else if (field === 'rgpm') {
      processedValue = somenteNumeros(value).slice(0, 6);
    } else if (['nome', 'pai', 'mae', 'naturalidade'].includes(field)) {
      processedValue = value.toUpperCase();
    }
    setNewOfficerFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };
  
  const handleSaveNewOfficer = async () => {
    console.log("[GuarnicaoTab] Tentando salvar novo policial no BD:", newOfficerFormData);
    const {
      rgpm,
      nome,
      graduacao,
      pai,
      mae,
      naturalidade,
      cpf,
      telefone
    } = newOfficerFormData;
    const camposObrigatorios: (keyof PoliceOfficerFormData)[] = ['rgpm', 'nome', 'graduacao', 'pai', 'mae', 'naturalidade', 'cpf', 'telefone'];
    const camposFaltando = camposObrigatorios.filter(key => !newOfficerFormData[key]?.trim());
    if (camposFaltando.length > 0) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: `Preencha: ${camposFaltando.join(', ')}`
      });
      return;
    }
    const rgpmNumeros = somenteNumeros(rgpm);
    if (rgpmNumeros.length !== 6) {
      toast({
        variant: "destructive",
        title: "RGPM Inválido",
        description: "O RGPM deve ter 6 dígitos."
      });
      return;
    }
    const cpfNumeros = somenteNumeros(cpf);
    if (cpfNumeros.length !== 11 || !validateCPF(cpf)) {
      toast({
        variant: "destructive",
        title: "CPF Inválido",
        description: "Verifique o CPF."
      });
      return;
    }
    const telefoneNumeros = somenteNumeros(telefone);
    if (telefoneNumeros.length !== 10 && telefoneNumeros.length !== 11) {
      toast({
        variant: "destructive",
        title: "Telefone Inválido",
        description: "Formato DDD + 8 ou 9 dígitos."
      });
      return;
    }
    try {
      const dataToSave = {
        rgpm: rgpmNumeros,
        nome: nome.toUpperCase(),
        graduacao: graduacao,
        pai: pai.toUpperCase(),
        mae: mae.toUpperCase(),
        naturalidade: naturalidade.toUpperCase(),
        cpf: cpfNumeros,
        telefone: telefoneNumeros
      };
      console.log("[GuarnicaoTab] Dados a serem salvos/atualizados no BD com telefone:", dataToSave.telefone);
      const {
        error
      } = await supabase.from("police_officers").upsert(dataToSave, {
        onConflict: "rgpm"
      });
      if (error) {
        throw error;
      }
      toast({
        title: "Sucesso",
        description: "Policial cadastrado/atualizado no banco de dados."
      });
      closeRegisterDialog();
    } catch (error: any) {
      console.error("[GuarnicaoTab] Erro ao salvar policial no BD:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar no BD",
        description: `Falha: ${error.message || 'Erro desconhecido'}`
      });
    }
  };
  
  const isSaveDisabled = useCallback((): boolean => {
    const {
      rgpm,
      nome,
      graduacao,
      pai,
      mae,
      naturalidade,
      cpf,
      telefone
    } = newOfficerFormData;
    if (!rgpm || !nome || !graduacao || !pai || !mae || !naturalidade || !cpf || !telefone) return true;
    if (somenteNumeros(rgpm).length !== 6) return true;
    if (somenteNumeros(cpf).length !== 11 || !validateCPF(cpf)) return true;
    const telNums = somenteNumeros(telefone);
    if (telNums.length !== 10 && telNums.length !== 11) return true;
    return false;
  }, [newOfficerFormData]);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" /> GUARNIÇÃO E APOIO
            </CardTitle>
            <CardDescription>Adicione policiais da guarnição principal e equipes de apoio</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openRegisterDialog} 
            type="button"
          >
            <UserPlus className="h-4 w-4 mr-2" /> Cadastrar/Atualizar Policial
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "guarnicao" | "apoio")}>
            <TabsList className="w-full">
              <TabsTrigger className="w-1/2" value="guarnicao">Guarnição Principal</TabsTrigger>
              <TabsTrigger className="w-1/2" value="apoio">Apoio</TabsTrigger>
            </TabsList>
            
            <TabsContent value="guarnicao" className="mt-4">
              <div>
                <div className="flex gap-2 items-center mb-4">
                  <Input
                    id="rgpmSearchInputGuarnicao"
                    type="text"
                    inputMode="numeric"
                    placeholder="Buscar por RGPM (6 dígitos)" 
                    value={searchRgpm}
                    onChange={handleSearchRgpmChange}
                    disabled={isSearching}
                    className="flex-grow"
                    maxLength={6}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !isSearching && searchRgpm.length === 6) handleSearchAndAdd();
                    }}
                  />
                  <Button 
                    onClick={handleSearchAndAdd} 
                    disabled={isSearching || searchRgpm.length !== 6}
                  >
                    {isSearching ? "Buscando..." : <><Search className="h-4 w-4 mr-1" /> Adicionar</>}
                  </Button>
                </div>
                
                <Label>Componentes da Guarnição Principal</Label>
                {currentGuarnicaoList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
                    Nenhum componente adicionado à guarnição principal. Use a busca acima.
                  </p>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    {currentGuarnicaoList.map((componente, index) => (
                      <div 
                        key={`${componente.rg}-${index}`} 
                        className={`flex items-center justify-between p-3 ${index > 0 ? "border-t" : ""} ${index === 0 ? "bg-blue-50" : "bg-background"}`}
                      >
                        <div className="flex flex-col flex-grow mr-2 truncate">
                          <span className="text-sm font-medium truncate" title={`${componente.posto} ${componente.nome} (RGPM: ${componente.rg})`}>
                            {index === 0 && <span className="font-bold text-blue-800">(Condutor) </span>}
                            <span>{componente.posto || "Sem Posto"}</span>{' '}
                            <span>{componente.nome || "Sem Nome"}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">RGPM: {componente.rg || "Não informado"}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0"
                          onClick={() => handleRemove(index)}
                          aria-label={`Remover ${componente.nome}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="apoio" className="mt-4">
              <div>
                <div className="flex gap-2 items-center mb-4">
                  <Input
                    id="rgpmSearchInputApoio"
                    type="text"
                    inputMode="numeric"
                    placeholder="Buscar por RGPM (6 dígitos)" 
                    value={searchRgpm}
                    onChange={handleSearchRgpmChange}
                    disabled={isSearching}
                    className="flex-grow"
                    maxLength={6}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !isSearching && searchRgpm.length === 6) handleSearchAndAdd();
                    }}
                  />
                  <Button 
                    onClick={handleSearchAndAdd} 
                    disabled={isSearching || searchRgpm.length !== 6}
                  >
                    {isSearching ? "Buscando..." : <><Search className="h-4 w-4 mr-1" /> Adicionar</>}
                  </Button>
                </div>
                
                <Label>Componentes da Equipe de Apoio</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Policiais de apoio serão listados no item 5.1 do PDF, mas não precisarão assinar o documento.
                </p>
                
                {currentApoioList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
                    Nenhum componente adicionado ao apoio. Use a busca acima.
                  </p>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    {currentApoioList.map((componente, index) => (
                      <div 
                        key={`apoio-${componente.rg}-${index}`} 
                        className="flex items-center justify-between p-3 border-t first:border-t-0 bg-emerald-50"
                      >
                        <div className="flex flex-col flex-grow mr-2 truncate">
                          <span className="text-sm font-medium truncate" title={`${componente.posto} ${componente.nome} (RGPM: ${componente.rg})`}>
                            <span>{componente.posto || "Sem Posto"}</span>{' '}
                            <span>{componente.nome || "Sem Nome"}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">RGPM: {componente.rg || "Não informado"}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0"
                          onClick={() => handleRemove(index)}
                          aria-label={`Remover ${componente.nome}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Cadastrar ou Atualizar Policial</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-3 px-[5px] py-0 my-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dlg-rgpm">RGPM (6 dígitos) * <Info className="inline h-3 w-3 text-muted-foreground ml-1" aria-label="Usado para buscar e identificar o policial" /></Label>
                <Input id="dlg-rgpm" value={newOfficerFormData.rgpm} onChange={e => handleRegisterInputChange("rgpm", e.target.value)} placeholder="000000" required inputMode="numeric" maxLength={6} />
              </div>
              <div>
                <Label htmlFor="dlg-graduacao">Graduação *</Label>
                <select id="dlg-graduacao" value={newOfficerFormData.graduacao} onChange={e => handleRegisterInputChange("graduacao", e.target.value)} required className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">Selecione...</option>
                  {graduacoes.map(grad => <option key={grad} value={grad}>{grad}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="dlg-nome">Nome Completo *</Label>
              <Input id="dlg-nome" value={newOfficerFormData.nome} onChange={e => handleRegisterInputChange("nome", e.target.value)} placeholder="Nome completo" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dlg-cpf">CPF *</Label>
                <Input id="dlg-cpf" value={newOfficerFormData.cpf} onChange={e => handleRegisterInputChange("cpf", e.target.value)} placeholder="000.000.000-00" required inputMode="numeric" maxLength={14} />
              </div>
              <div>
                <Label htmlFor="dlg-telefone">Telefone (com DDD) *</Label>
                <Input id="dlg-telefone" value={newOfficerFormData.telefone} onChange={e => handleRegisterInputChange("telefone", e.target.value)} placeholder="(00) 00000-0000" required inputMode="tel" maxLength={15} />
              </div>
            </div>
            <div>
              <Label htmlFor="dlg-naturalidade">Naturalidade (Cidade/UF) *</Label>
              <Input id="dlg-naturalidade" value={newOfficerFormData.naturalidade} onChange={e => handleRegisterInputChange("naturalidade", e.target.value)} placeholder="Ex: Cuiabá/MT" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dlg-pai">Nome do Pai *</Label>
                <Input id="dlg-pai" value={newOfficerFormData.pai} onChange={e => handleRegisterInputChange("pai", e.target.value)} required placeholder="Nome completo do pai" />
              </div>
              <div>
                <Label htmlFor="dlg-mae">Nome da Mãe *</Label>
                <Input id="dlg-mae" value={newOfficerFormData.mae} onChange={e => handleRegisterInputChange("mae", e.target.value)} required placeholder="Nome completo da mãe" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRegisterDialog} type="button"> Cancelar </Button>
            <Button onClick={handleSaveNewOfficer} disabled={isSaveDisabled()} type="button"> Salvar no Banco </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GuarnicaoTab;
