import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Eye, MoreHorizontal, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast as useShadcnToast } from "@/components/ui/use-toast"; // Renomeado para evitar conflito
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteTCO as deleteTCOFromStorageAndDB } from "@/lib/supabaseStorage"; // Assumindo que deleteTCO lida com DB e Storage
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TCOmeusProps {
  user: {
    id: string;
    registration?: string;
  };
  // Se você tem um hook useToast customizado, mantenha-o. Se estiver usando o de shadcn/ui:
  toast: ReturnType<typeof useShadcnToast>["toast"];
  setSelectedTco: (tco: TcoDataType | null) => void; // Tipo mais específico
  selectedTco: TcoDataType | null; // Tipo mais específico
}

// Defina um tipo para os dados do TCO para melhor type safety
interface TcoDataType {
  id: string; // UUID do banco de dados
  tcoNumber: string;
  createdAt: Date;
  natureza: string;
  rgpms: string; // String formatada para exibição
  pdfPath: string;
  policiais?: Array<{ nome?: string; rgpm: string; posto?: string; apoio?: boolean }>; // Opcional, se precisar dos dados brutos na UI
  // Adicione outros campos que você possa ter
}

const BUCKET_NAME = 'tco-pdfs';

// Função auxiliar para extrair e formatar o número de exibição do TCO
const extractTcoDisplayNumber = (fullTcoNumber: string | undefined | null): string => {
  if (!fullTcoNumber) return "-";
  let numberPart = "";
  const match = fullTcoNumber.match(/^TCO-([^_ -]+)/i);
  if (match && match[1]) {
    numberPart = match[1];
  } else if (fullTcoNumber.toUpperCase().startsWith("TCO-")) {
    numberPart = fullTcoNumber.substring(4);
  } else {
    // Se não começa com TCO-, tenta pegar a parte numérica se houver um TCO_ ou TCO- implícito
    const plainNumberMatch = fullTcoNumber.match(/(\d+)/);
    if (plainNumberMatch && plainNumberMatch[1]) {
        numberPart = plainNumberMatch[1];
    } else {
        return fullTcoNumber; // Retorna o número como está se não houver padrão claro
    }
  }

  if (numberPart) {
    const num = parseInt(numberPart, 10);
    if (!isNaN(num)) {
      return String(num).padStart(2, '0');
    }
    return numberPart; // Retorna a parte extraída se não for um número (improvável mas seguro)
  }
  return "-";
};

// Nova função para formatar RGPMs a partir do array de policiais dos metadados
const formatRgpmsFromMetadata = (policiais: Array<{ rgpm: string; apoio?: boolean }> | undefined | null): string => {
  if (!policiais || policiais.length === 0) return "Não disponível";

  const principais = policiais.filter(p => p.rgpm && !p.apoio);
  const apoioTime = policiais.filter(p => p.rgpm && p.apoio);

  const outputParts: string[] = [];

  if (principais.length > 0) {
    outputParts.push(`Cond: ${principais[0].rgpm}`); // O primeiro principal é o condutor
    const outrosGuarnicao = principais.slice(1).map(p => p.rgpm);
    if (outrosGuarnicao.length > 0) {
      outputParts.push(`GU: ${outrosGuarnicao.join(', ')}`);
    }
  }

  if (apoioTime.length > 0) {
    outputParts.push(`Apoio: ${apoioTime.map(p => p.rgpm).join(', ')}`);
  }

  const result = outputParts.join(' | ');
  return result || "Não disponível"; // Retorna "Não disponível" se outputParts estiver vazio
};


const TCOmeus: React.FC<TCOmeusProps> = ({
  user,
  toast,
  setSelectedTco,
  selectedTco
}) => {
  const [tcoList, setTcoList] = useState<TcoDataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tcoToDelete, setTcoToDelete] = useState<TcoDataType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);

  const fetchUserTcos = async () => {
    if (!user || !user.id) {
      console.warn("Usuário não autenticado. Abortando busca de TCOs.");
      setTcoList([]); // Limpa a lista se o usuário não estiver disponível
      return;
    }
    setIsLoading(true);
    try {
      console.log("Buscando TCOs (metadados do DB) para o usuário:", user.id);
      
      const { data: tcosFromDb, error: dbError } = await supabase
        .from('tco_pdfs') // NOME DA SUA TABELA DE METADADOS DO TCO
        .select('id, tconumber, natureza, policiais, pdfpath, createdat') // Selecione as colunas necessárias
        .eq('createdby', user.id)
        .order('createdat', { ascending: false });

      if (dbError) {
        console.error("Erro ao buscar TCOs do banco de dados:", dbError);
        throw dbError;
      }

      if (tcosFromDb) {
        const formattedTcos: TcoDataType[] = tcosFromDb.map(tco => {
          return {
            id: tco.id,
            tcoNumber: tco.tconumber || "N/A",
            createdAt: new Date(tco.createdat),
            natureza: tco.natureza || "Não especificada",
            // A coluna 'policiais' deve ser um JSONB no Supabase
            // contendo um array de objetos { rgpm: string, apoio: boolean, nome?: string, posto?: string }
            rgpms: formatRgpmsFromMetadata(tco.policiais), 
            pdfPath: tco.pdfpath,
            policiais: tco.policiais, // Opcional: manter os dados brutos se precisar em outro lugar
          };
        });
        
        console.log("TCOs formatados a partir do DB:", formattedTcos.length, formattedTcos);
        setTcoList(formattedTcos);
      } else {
        setTcoList([]);
      }

    } catch (error) {
      console.error("Erro ao buscar TCOs:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar TCOs",
        description: "Falha ao buscar os TCOs do banco dedados. Verifique o console para mais detalhes."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const confirmDelete = (tco: TcoDataType) => {
    setTcoToDelete(tco);
    setDeletionMessage(null);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteTco = async () => {
    if (!tcoToDelete || !tcoToDelete.id || !tcoToDelete.pdfPath) return;
  
    setIsDeleting(true);
    setDeletionMessage("Iniciando processo de exclusão...");
  
    try {
      // A função deleteTCOFromStorageAndDB deve lidar com a exclusão no DB (usando tcoToDelete.id)
      // e no Storage (usando tcoToDelete.pdfPath).
      const { success, error } = await deleteTCOFromStorageAndDB({
        id: tcoToDelete.id, // ID do registro no banco de dados
        pdfPath: tcoToDelete.pdfPath // Caminho do arquivo no storage
      });
  
      if (error || !success) {
        setDeletionMessage("Erro na exclusão. Verifique o console para detalhes.");
        console.error("Erro no processo de exclusão do TCO:", error);
        toast({
          variant: "destructive",
          title: "Erro ao Excluir",
          description: error?.message || "Falha ao excluir o TCO. Tente novamente."
        });
      } else {
        setTcoList(prevList => prevList.filter(item => item.id !== tcoToDelete.id));
        if (selectedTco?.id === tcoToDelete.id) setSelectedTco(null);
        toast({
          title: "TCO Excluído",
          description: "O TCO foi removido com sucesso."
        });
        setDeletionMessage(null); // Limpa a mensagem em caso de sucesso
      }
    } catch (error: any) {
      console.error("Erro catastrófico no processo de exclusão do TCO:", error);
      setDeletionMessage("Erro crítico durante a exclusão.");
      toast({
        variant: "destructive",
        title: "Erro Crítico",
        description: "Falha inesperada ao excluir o TCO. Verifique o console."
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      // Não resetar tcoToDelete aqui, pois pode ser útil para depuração se a exclusão falhar
      // setTcoToDelete(null); 
      // setDeletionMessage(null); // Já tratado no sucesso/erro
    }
  };
  
  const handleViewPdf = async (tco: TcoDataType) => {
    setPdfLoading(true); 
    setIsPdfDialogOpen(true); // Abrir o diálogo imediatamente para mostrar o loader
    try {
      if (tco.pdfPath) {
        const { data, error } = await supabase.storage.from(BUCKET_NAME).getPublicUrl(tco.pdfPath);
        
        if (error) {
            console.error("Erro ao obter URL pública:", error);
            throw new Error("Falha ao obter URL do PDF.");
        }
        const url = data?.publicUrl;
        if (url) {
          setSelectedPdfUrl(url);
          // setPdfLoading(false) será chamado no onLoad do iframe
        } else {
          setPdfLoading(false);
          throw new Error("URL pública não encontrada para o PDF.");
        }
      } else {
        setPdfLoading(false);
        toast({
          variant: "destructive",
          title: "PDF não encontrado",
          description: "Este TCO não possui um caminho de PDF associado."
        });
        setIsPdfDialogOpen(false); // Fechar se não houver caminho
      }
    } catch (error: any) {
      setPdfLoading(false); 
      console.error("Erro ao buscar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar PDF",
        description: error.message || "Falha ao carregar o PDF do TCO."
      });
      setIsPdfDialogOpen(false); // Fechar em caso de erro
      setSelectedPdfUrl(null);
    } 
  };
  
  const handleDownloadPdf = async (tco: TcoDataType) => {
    try {
      if (tco.pdfPath) {
        const { data, error } = await supabase.storage.from(BUCKET_NAME).getPublicUrl(tco.pdfPath);
        if (error) throw error;

        const url = data?.publicUrl;
        if (url) {
          // Forçar o download em vez de abrir no navegador (se possível)
          // Isso pode ser feito criando um link temporário e clicando nele.
          // No entanto, a maneira mais simples e comum é window.open.
          // Para forçar download, seria preciso mais do que getPublicUrl, talvez download() do supabase-js
          // Mas para este caso, window.open é suficiente.
          window.open(url + '?download=true', '_blank'); // Adicionar ?download=true pode ajudar alguns CDNs/servidores
        } else {
          throw new Error("URL pública não encontrada para download.");
        }
      } else {
        toast({
          variant: "destructive",
          title: "PDF não encontrado",
          description: "Este TCO não possui um PDF para download."
        });
      }
    } catch (error: any) {
      console.error("Erro ao baixar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Baixar PDF",
        description: error.message || "Falha ao iniciar o download do PDF do TCO."
      });
    }
  };
  
  useEffect(() => {
    if(user?.id) {
      fetchUserTcos();
    } else {
      setTcoList([]); // Limpa a lista se o usuário for deslogado ou não estiver definido
    }
  }, [user?.id]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex-grow overflow-hidden flex flex-col px-[14px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Meus TCOs</h2>
        <Button onClick={fetchUserTcos} variant="outline" size="sm" disabled={isLoading} className="flex items-center gap-2 transition-all hover:bg-slate-100">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Carregando..." : "Atualizar"}</span>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : tcoList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 flex-grow">
          <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-center mb-2">Nenhum TCO encontrado</p>
          <p className="text-center text-sm text-gray-400">Os TCOs que você criar aparecerão aqui</p>
        </div>
      ) : (
        <div className="flex-grow overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-grow rounded-lg border border-gray-200">
            <Table role="grid" className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold w-[120px] px-3">Número</TableHead>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold px-3">Data</TableHead>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold px-3">Natureza</TableHead>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold px-3">GUPM</TableHead>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold text-right pr-4 px-3">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tcoList.map(tco => (
                  <TableRow 
                    key={tco.id} 
                    aria-selected={selectedTco?.id === tco.id} 
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${selectedTco?.id === tco.id ? "bg-primary/10" : ""}`} 
                    onClick={() => setSelectedTco(tco)}
                  >
                    <TableCell className="font-medium px-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 text-sm">
                          {extractTcoDisplayNumber(tco.tcoNumber)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-3">
                      {tco.createdAt ? format(tco.createdAt, "dd/MM/yyyy - HH:mm") : "-"}
                    </TableCell>
                    <TableCell className="px-3">{tco.natureza || "Não especificada"}</TableCell>
                    <TableCell className="px-3">
                      <span className="text-sm font-medium text-gray-600">{tco.rgpms || "Não disponível"}</span>
                    </TableCell>
                    <TableCell className="text-right px-3 pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={e => e.stopPropagation()} 
                            aria-label={`Ações para TCO ${tco.tcoNumber}`} 
                            className="h-8 w-8 rounded-full hover:bg-gray-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu de ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1" onClick={e => e.stopPropagation()}>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); handleViewPdf(tco); }} className="cursor-pointer flex items-center p-2 text-sm hover:bg-slate-50 rounded">
                            <Eye className="mr-2 h-4 w-4 text-blue-600" />
                            <span>Visualizar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDownloadPdf(tco); }} className="cursor-pointer flex items-center p-2 text-sm hover:bg-slate-50 rounded">
                            <Download className="mr-2 h-4 w-4 text-green-600" />
                            <span>Download</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); confirmDelete(tco); }} className="cursor-pointer flex items-center p-2 text-sm hover:bg-red-50 text-red-600 rounded">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 text-gray-500 text-sm text-right">
            Total: {tcoList.length} {tcoList.length === 1 ? 'TCO' : 'TCOs'}
          </div>
        </div>
      )}

      <Dialog open={isPdfDialogOpen} onOpenChange={(open) => {
        setIsPdfDialogOpen(open);
        if (!open) {
          setSelectedPdfUrl(null); 
          setPdfLoading(false); // Garante que o loading é resetado ao fechar
        }
      }}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
            <DialogTitle className="text-lg font-medium text-gray-700">Visualizador de PDF</DialogTitle>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                    setIsPdfDialogOpen(false);
                    setSelectedPdfUrl(null);
                    setPdfLoading(false);
                }} 
                className="absolute right-4 top-3 text-gray-500 hover:text-gray-700"
            >
              Fechar
            </Button>
          </DialogHeader>
          
          <div className="h-[calc(100%-57px)] overflow-hidden bg-gray-100 relative"> {/* Adicionado relative para posicionar o loader */}
            {(pdfLoading || !selectedPdfUrl) && ( // Mostrar loader se pdfLoading ou se não há URL ainda (exceto se erro)
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-20">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600 text-sm">Carregando PDF...</p>
              </div>
            )}
            {selectedPdfUrl && (
              <iframe 
                src={selectedPdfUrl} 
                className={`w-full h-full ${pdfLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
                title="PDF Viewer" 
                style={{ border: "none" }} 
                onLoad={() => setPdfLoading(false)} 
                onError={() => { 
                  setPdfLoading(false);
                  toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar o PDF no visualizador."});
                  // Não fechar o diálogo automaticamente, deixar o usuário fechar.
                  // setSelectedPdfUrl(null); // Poderia limpar para tentar de novo
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tem certeza que deseja excluir o TCO número {tcoToDelete?.tcoNumber ? extractTcoDisplayNumber(tcoToDelete.tcoNumber) : ''}? Esta ação não pode ser desfeita.
              {deletionMessage && (
                <div className={`mt-2 p-2 rounded text-sm ${deletionMessage.startsWith("Erro") ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                  {deletionMessage}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={isDeleting} className="mt-0 w-full sm:w-auto" onClick={() => { setTcoToDelete(null); setDeletionMessage(null); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTco} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 w-full sm:w-auto transition-colors">
              {isDeleting ? (
                <div className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin -ml-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Excluindo...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir</span>
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default TCOmeus;
