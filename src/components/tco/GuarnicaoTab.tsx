import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Users, UserPlus, Info, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Removido Alert pois não estava sendo usado diretamente aqui para exibição de erro/aviso geral
import { useToast } from "@/hooks/use-toast"; // Ajuste o caminho se necessário
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client"; // Ajuste o caminho se necessário

// --- Funções Auxiliares (Helpers - MANTIDAS) ---
const somenteNumeros = (value: string | null | undefined): string => { /* ...código original... */ return value?.replace(/\D/g, '') || '';};
const formatarCPF = (value: string): string => { /* ...código original... */
    const numeros = somenteNumeros(value);
    let cpfFormatado = numeros.slice(0, 11);
    cpfFormatado = cpfFormatado.replace(/^(\d{3})(\d)/, '$1.$2');
    cpfFormatado = cpfFormatado.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    cpfFormatado = cpfFormatado.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    return cpfFormatado;
};
const formatarCelular = (value: string): string => { /* ...código original... */
  const numeros = somenteNumeros(value);
  let foneFormatado = numeros.slice(0, 11);
  if (foneFormatado.length === 11) { // Celular (XX) 9XXXX-XXXX
    foneFormatado = foneFormatado.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (foneFormatado.length === 10) { // Fixo (XX) XXXX-XXXX
    foneFormatado = foneFormatado.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (foneFormatado.length > 6) {
      foneFormatado = foneFormatado.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (foneFormatado.length > 2) {
    foneFormatado = foneFormatado.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  }
  return foneFormatado;
};

// --- Interfaces (Definir ou Importar - devem ser consistentes com TCOForm) ---
interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string; // No PDF usamos 'posto'
}

interface PoliceOfficerSearchResult { // Para busca no banco
  nome: string | null;
  graduacao: string | null; // No banco usamos 'graduacao'
}

// Interface para o formulário de cadastro interno
interface PoliceOfficerFormData {
  rgpm: string;
  nome: string;
  graduacao: string; // No cadastro usamos 'graduacao'
  pai: string;
  mae: string;
  naturalidade: string;
  cpf: string;
  telefone: string;
}

// Estado inicial do formulário de cadastro
const initialOfficerFormData: PoliceOfficerFormData = {
  rgpm: "", nome: "", graduacao: "", pai: "", mae: "",
  naturalidade: "", cpf: "", telefone: ""
};

// Graduações para o select
const graduacoes = [
    "SD PM", "CB PM", "3º SGT PM", "2º SGT PM", "1º SGT PM",
    "SUB TEN PM", "ASPIRANTE PM", "2º TEN PM", "1º TEN PM",
    "CAP PM", "MAJ PM", "TEN CEL PM", "CEL PM"
];


// --- Props Interface CORRIGIDA ---
interface GuarnicaoTabProps {
  currentGuarnicaoList: ComponenteGuarnicao[]; // Recebe a lista do PAI
  onAddPolicial: (policial: ComponenteGuarnicao) => void; // Callback para ADICIONAR ao PAI
  onRemovePolicial: (index: number) => void; // Callback para REMOVER do PAI
}

// --- Componente GuarnicaoTab CORRIGIDO ---
const GuarnicaoTab: React.FC<GuarnicaoTabProps> = ({
  currentGuarnicaoList, // Recebe a lista do Pai
  onAddPolicial,         // Recebe função para adicionar
  onRemovePolicial       // Recebe função para remover
}) => {
  const { toast } = useToast(); // Hook de toast

  // *** REMOVIDO o estado interno para a lista ***
  // const [guarnicaoList, setGuarnicaoList] = useState<ComponenteGuarnicao[]>([]);

  // Mantém estados INTERNOS para UI/operações DESTE componente
  const [searchRgpm, setSearchRgpm] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState<boolean>(false);
  const [newOfficerFormData, setNewOfficerFormData] = useState<PoliceOfficerFormData>(initialOfficerFormData);


  // useEffect para LOG (Observa a PROP que vem do pai)
  useEffect(() => {
    console.log("[GuarnicaoTab] Prop 'currentGuarnicaoList' recebida:", currentGuarnicaoList);
  }, [currentGuarnicaoList]);


  // --- Funções de Lógica Interna e Callbacks ---

  // Handler para input de busca (sem alterações)
  const handleSearchRgpmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const numeros = somenteNumeros(rawValue).slice(0, 6); // Apenas 6 dígitos numéricos
    setSearchRgpm(numeros);
  };

  // Busca e ADICIONA chamando o PAI
  const handleSearchAndAdd = useCallback(async () => {
    const rgpmToSearch = searchRgpm;
    console.log("[GuarnicaoTab] Iniciando busca por RGPM:", rgpmToSearch);

    if (rgpmToSearch.length !== 6) {
      toast({ variant: "destructive", title: "RGPM Inválido", description: "O RGPM da busca deve conter exatamente 6 dígitos." });
      return;
    }

    // Verifica duplicidade usando a LISTA DO PAI (currentGuarnicaoList)
    const alreadyExists = currentGuarnicaoList.some(comp => comp.rg === rgpmToSearch);
    if (alreadyExists) {
      console.log("[GuarnicaoTab] RGPM já existe na lista (prop):", rgpmToSearch);
      toast({ variant: "warning", title: "Duplicado", description: "Este policial já está na guarnição." });
      setSearchRgpm(""); // Limpa input local
      return;
    }

    setIsSearching(true);
    console.log("[GuarnicaoTab] Buscando no Supabase...");
    try {
      const { data, error } = await supabase
        .from("police_officers")
        .select("nome, graduacao") // Busca 'graduacao' do banco
        .eq("rgpm", rgpmToSearch)
        .single(); // Espera um único resultado ou erro

      console.log("[GuarnicaoTab] Resposta Supabase:", { data, error });

      if (error && error.code === 'PGRST116') { // Erro específico do Supabase: "No rows found"
        toast({ variant: "warning", title: "Não Encontrado", description: `Nenhum policial encontrado com o RGPM ${rgpmToSearch}. Considere cadastrá-lo.` });
      } else if (error) {
        throw error; // Outros erros do Supabase
      } else if (data) {
        const officerData = data as PoliceOfficerSearchResult;
        // Cria o objeto com a interface esperada pelo PAI e PDF ('posto')
        const newComponente: ComponenteGuarnicao = {
          rg: rgpmToSearch,
          nome: officerData.nome?.toUpperCase() || "NOME NÃO INFORMADO", // Garante Uppercase
          posto: officerData.graduacao || "POSTO NÃO INFORMADO" // Mapeia 'graduacao' para 'posto'
        };
        console.log("[GuarnicaoTab] Policial encontrado. Chamando onAddPolicial (Callback do Pai):", newComponente);

        // *** CHAMA A FUNÇÃO DO PAI para adicionar à lista principal ***
        onAddPolicial(newComponente);

        // Toast de sucesso local
        // O toast de duplicidade agora é tratado no PAI ou na checagem inicial aqui
        // toast({ title: "Sucesso!", description: `Policial ${newComponente.nome} adicionado.` });

        setSearchRgpm(""); // Limpa input local de busca
      }
    } catch (error: any) {
      console.error("[GuarnicaoTab] Erro na busca:", error);
      toast({ variant: "destructive", title: "Erro na Busca", description: `Falha ao buscar dados: ${error.message || 'Erro desconhecido'}` });
    } finally {
      setIsSearching(false);
      console.log("[GuarnicaoTab] Busca finalizada.");
    }
  }, [searchRgpm, currentGuarnicaoList, toast, onAddPolicial]); // Depende da prop onAddPolicial e currentGuarnicaoList

  // REMOVE chamando o PAI
  const handleRemove = (indexToRemove: number) => {
    const itemToRemove = currentGuarnicaoList[indexToRemove]; // Pega da prop
    console.log("[GuarnicaoTab] Chamando onRemovePolicial (Callback do Pai) para índice:", indexToRemove, itemToRemove);

    // *** CHAMA A FUNÇÃO DO PAI para remover da lista principal ***
    onRemovePolicial(indexToRemove);

    // Toast local informando a ação
    toast({ title: "Removido", description: `Componente ${itemToRemove?.nome || ''} removido da guarnição.` });
  };

  // --- Funções do Diálogo de Cadastro (Lógica de UI e BD permanece aqui) ---
  const openRegisterDialog = () => setIsRegisterDialogOpen(true);
  const closeRegisterDialog = () => {
    setIsRegisterDialogOpen(false);
    setNewOfficerFormData(initialOfficerFormData); // Reseta form do diálogo
  };

  // Handler para inputs do formulário de cadastro (sem alterações)
  const handleRegisterInputChange = (field: keyof PoliceOfficerFormData, value: string) => {
    let processedValue = value;
    if (field === 'cpf') { processedValue = formatarCPF(value); }
    else if (field === 'telefone') { processedValue = formatarCelular(value); }
    else if (field === 'rgpm') { processedValue = somenteNumeros(value).slice(0, 6); }
    else if (['nome', 'pai', 'mae', 'naturalidade'].includes(field)) { processedValue = value.toUpperCase(); }
    // 'graduacao' vem direto do select
    setNewOfficerFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  // SALVA/ATUALIZA no BANCO (não mexe na lista do PAI diretamente)
  const handleSaveNewOfficer = async () => {
    console.log("[GuarnicaoTab] Tentando salvar novo policial no BD:", newOfficerFormData);
    const { rgpm, nome, graduacao, pai, mae, naturalidade, cpf, telefone } = newOfficerFormData;

    // Validações (permanecem iguais)
    const camposObrigatorios: (keyof PoliceOfficerFormData)[] = ['rgpm', 'nome', 'graduacao', 'pai', 'mae', 'naturalidade', 'cpf', 'telefone'];
    const camposFaltando = camposObrigatorios.filter(key => !newOfficerFormData[key]?.trim());
    if (camposFaltando.length > 0) { toast({ variant: "destructive", title: "Campos Obrigatórios", description: `Preencha: ${camposFaltando.join(', ')}` }); return; }

    const rgpmNumeros = somenteNumeros(rgpm);
    if (rgpmNumeros.length !== 6) { toast({ variant: "destructive", title: "RGPM Inválido", description: "O RGPM deve ter 6 dígitos." }); return; }

    const cpfNumeros = somenteNumeros(cpf);
    // Reutiliza a validação externa se disponível, ou mantém a de tamanho
    if (cpfNumeros.length !== 11 || !validateCPF(newOfficerFormData.cpf)) { toast({ variant: "destructive", title: "CPF Inválido", description: "Verifique o CPF." }); return; }

    const telefoneNumeros = somenteNumeros(telefone);
    if (telefoneNumeros.length !== 10 && telefoneNumeros.length !== 11) { toast({ variant: "destructive", title: "Telefone Inválido", description: "Formato DDD + 8 ou 9 dígitos." }); return; }


    // Tenta salvar no Supabase (Upsert)
    try {
      // Garante que os dados salvos usem apenas números onde aplicável
      const dataToSave = {
        rgpm: rgpmNumeros,
        nome: nome.toUpperCase(),
        graduacao: graduacao, // Salva como 'graduacao' no banco
        pai: pai.toUpperCase(),
        mae: mae.toUpperCase(),
        naturalidade: naturalidade.toUpperCase(),
        cpf: cpfNumeros,
        telefone: telefoneNumeros
      };
      console.log("[GuarnicaoTab] Dados a serem salvos/atualizados no BD:", dataToSave);

      // Usa `upsert` para inserir ou atualizar se o RGPM já existir
      const { error } = await supabase
        .from("police_officers")
        .upsert(dataToSave, { onConflict: "rgpm" }); // Chave de conflito é o RGPM

      if (error) {
        throw error; // Delega tratamento de erro do Supabase
      }

      toast({ title: "Sucesso", description: "Policial cadastrado/atualizado no banco de dados." });
      closeRegisterDialog(); // Fecha o diálogo após sucesso

      // ** IMPORTANTE: NÃO adiciona à lista do pai aqui.**
      // A adição acontece via BUSCA. Se o usuário acabou de cadastrar,
      // ele precisará buscar pelo RGPM para adicionar à guarnição atual.
      // Isso evita adições automáticas que podem não ser desejadas.

    } catch (error: any) {
      console.error("[GuarnicaoTab] Erro ao salvar policial no BD:", error);
      toast({ variant: "destructive", title: "Erro ao Salvar no BD", description: `Falha: ${error.message || 'Erro desconhecido'}` });
    }
  };

  // Checa se o botão salvar do diálogo deve ser desabilitado (sem alterações)
  const isSaveDisabled = useCallback((): boolean => {
    const { rgpm, nome, graduacao, pai, mae, naturalidade, cpf, telefone } = newOfficerFormData;
    if (!rgpm || !nome || !graduacao || !pai || !mae || !naturalidade || !cpf || !telefone) return true;
    if (somenteNumeros(rgpm).length !== 6) return true;
    if (somenteNumeros(cpf).length !== 11 || !validateCPF(cpf)) return true; // Adiciona validação
    const telNums = somenteNumeros(telefone);
    if (telNums.length !== 10 && telNums.length !== 11) return true;
    return false;
  }, [newOfficerFormData]);


  // --- JSX (Atualizado para usar a prop `currentGuarnicaoList`) ---
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" /> GUARNIÇÃO
            </CardTitle>
            <CardDescription>Adicione os componentes buscando por RGPM</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={openRegisterDialog}>
            <UserPlus className="h-4 w-4 mr-2" /> Cadastrar/Atualizar Policial
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4"> {/* Reduzido espaçamento interno */}
        {/* Seção de Busca (Usa handleSearchAndAdd que chama onAddPolicial) */}
        <div className="space-y-2">
          {/* Label omitido para design mais limpo, placeholder é suficiente */}
          {/* <Label htmlFor="rgpmSearchInput">Buscar Policial por RGPM</Label> */}
          <div className="flex gap-2 items-center">
            <Input
              id="rgpmSearchInput"
              type="text" // Para controle via JS
              inputMode="numeric"
              placeholder="Buscar por RGPM (6 dígitos)"
              value={searchRgpm}
              onChange={handleSearchRgpmChange}
              disabled={isSearching}
              className="flex-grow"
              maxLength={6}
              onKeyDown={e => { if (e.key === 'Enter' && !isSearching && searchRgpm.length === 6) handleSearchAndAdd(); }}
            />
            <Button onClick={handleSearchAndAdd} disabled={isSearching || searchRgpm.length !== 6}>
              {isSearching ? "Buscando..." : <><Search className="h-4 w-4 mr-1" /> Adicionar</>}
            </Button>
          </div>
        </div>

        {/* Seção da Lista (Usa a PROP `currentGuarnicaoList`) */}
        <div className="space-y-2">
          <Label>Componentes da Guarnição Atual</Label>
          {currentGuarnicaoList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
              Nenhum componente adicionado. Use a busca acima.
            </p>
          ) : (
            <div className="border rounded-md overflow-hidden"> {/* Added overflow-hidden */}
              {currentGuarnicaoList.map((componente, index) => (
                <div
                  key={`${componente.rg}-${index}`} // Chave mais robusta para caso RG possa repetir temporariamente antes da validação final
                  className={`flex items-center justify-between p-3 ${index > 0 ? "border-t" : ""} ${index === 0 ? "bg-blue-50" : "bg-background"}`} // Primeiro item destacado
                >
                  <div className="flex flex-col flex-grow mr-2 truncate"> {/* Added flex-col and styling */}
                    <span
                        className="text-sm font-medium truncate"
                        title={`${componente.posto} ${componente.nome} (RGPM: ${componente.rg})`}
                    >
                        {index === 0 && <span className="font-bold text-blue-800">(Condutor) </span>}
                        <span>{componente.posto || "Sem Posto"}</span>{' '} {/* Added fallback */}
                        <span>{componente.nome || "Sem Nome"}</span> {/* Added fallback */}
                    </span>
                     <span className="text-xs text-muted-foreground">RGPM: {componente.rg || "Não informado"}</span> {/* RGPM abaixo */}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0" // Added flex-shrink-0
                    onClick={() => handleRemove(index)} // handleRemove chama onRemovePolicial
                    aria-label={`Remover ${componente.nome}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Diálogo de Cadastro (Sem alterações na estrutura JSX, funcionalidade interna ok) */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Cadastrar ou Atualizar Policial</DialogTitle>
            <DialogDescription>Preencha ou corrija os dados. Salvar atualizará o policial com este RGPM no banco de dados.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3 px-[5px]">
              {/* Campos do formulário do diálogo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="dlg-rgpm">RGPM (6 dígitos) * <Info className="inline h-3 w-3 text-muted-foreground ml-1" title="Usado para buscar e identificar o policial. Não pode ser alterado após cadastro inicial (a menos que haja erro)." /></Label>
                      <Input id="dlg-rgpm" value={newOfficerFormData.rgpm} onChange={e => handleRegisterInputChange("rgpm", e.target.value)} placeholder="000000" required inputMode="numeric" maxLength={6} />
                  </div>
                  <div>
                      <Label htmlFor="dlg-graduacao">Graduação *</Label>
                      <select id="dlg-graduacao" value={newOfficerFormData.graduacao} onChange={e => handleRegisterInputChange("graduacao", e.target.value)} required className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                          <option value="">Selecione...</option>
                          {graduacoes.map((grad) => (<option key={grad} value={grad}>{grad}</option>))}
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
                  <Input id="dlg-cpf" value={newOfficerFormData.cpf} onChange={e => handleRegisterInputChange("cpf", e.target.value)} placeholder="000.000.000-00" required inputMode="numeric" maxLength={14}/>
                </div>
                <div>
                  <Label htmlFor="dlg-telefone">Telefone (com DDD) *</Label>
                  <Input id="dlg-telefone" value={newOfficerFormData.telefone} onChange={e => handleRegisterInputChange("telefone", e.target.value)} placeholder="(00) 00000-0000" required inputMode="tel" maxLength={15}/>
                </div>
               </div>
              <div>
                  <Label htmlFor="dlg-naturalidade">Naturalidade (Cidade/UF) *</Label>
                  <Input id="dlg-naturalidade" value={newOfficerFormData.naturalidade} onChange={e => handleRegisterInputChange("naturalidade", e.target.value)} placeholder="Ex: Cuiabá/MT" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="dlg-pai">Nome do Pai *</Label>
                      <Input id="dlg-pai" value={newOfficerFormData.pai} onChange={e => handleRegisterInputChange("pai", e.target.value)} required placeholder="Nome completo do pai"/>
                  </div>
                  <div>
                      <Label htmlFor="dlg-mae">Nome da Mãe *</Label>
                      <Input id="dlg-mae" value={newOfficerFormData.mae} onChange={e => handleRegisterInputChange("mae", e.target.value)} required placeholder="Nome completo da mãe"/>
                  </div>
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRegisterDialog}> Cancelar </Button>
            <Button onClick={handleSaveNewOfficer} disabled={isSaveDisabled()}> Salvar no Banco </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GuarnicaoTab;
