import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Eye, MoreHorizontal, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast as useShadcnToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteTCO } from "@/lib/supabaseStorage"; // Agora importa o deleteTCO corrigido
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TCOmeusProps {
  user: {
    id: string;
    registration?: string;
  };
  toast: ReturnType<typeof useShadcnToast>["toast"];
  setSelectedTco: (tco: TcoDataType | null) => void;
  selectedTco: TcoDataType | null;
}

interface TcoDataType {
  id: string; 
  tcoNumber: string;
  createdAt: Date;
  natureza: string;
  rgpms: string; 
  pdfPath: string;
  policiais?: Array<{ nome?: string; rgpm: string; posto?: string; apoio?: boolean }>;
}

const BUCKET_NAME = 'tco-pdfs';

const extractTcoDisplayNumber = (fullTcoNumber: string | undefined | null): string => {
  if (!fullTcoNumber) return "-";
  let numberPart = "";
  const tcoPrefixMatch = fullTcoNumber.match(/^TCO[-_]?([^_ -]+)/i); 
  if (tcoPrefixMatch && tcoPrefixMatch[1]) {
      numberPart = tcoPrefixMatch[1];
  } else {
      const parts = fullTcoNumber.split('_');
      if (parts.length > 1 && parts[0].toUpperCase() === "TCO" && /^\d+$/.test(parts[1])) {
          numberPart = parts[1];
      } else if (/^\d+$/.test(fullTcoNumber)) {
          numberPart = fullTcoNumber;
      } else {
          return fullTcoNumber; 
      }
  }

  if (numberPart) {
      const num = parseInt(numberPart, 10);
      if (!isNaN(num)) {
        return String(num).padStart(2, '0');
      }
      return numberPart;
  }
  return "-";
};

const formatRgpmsFromMetadata = (policiais: Array<{ rgpm: string; apoio?: boolean }> | undefined | null): string => {
  if (!policiais || policiais.length === 0) return "Não disponível";

  const principais = policiais.filter(p => p.rgpm && !p.apoio);
  const apoioTime = policiais.filter(p => p.rgpm && p.apoio);

  const outputParts: string[] = [];

  if (principais.length > 0) {
    outputParts.push(`Cond: ${principais[0].rgpm}`);
    const outrosGuarnicao = principais.slice(1).map(p => p.rgpm);
    if (outrosGuarnicao.length > 0) {
      outputParts.push(`GU: ${outrosGuarnicao.join(', ')}`);
    }
  }

  if (apoioTime.length > 0) {
    outputParts.push(`Apoio: ${apoioTime.map(p => p.rgpm).join(', ')}`);
  }

  const result = outputParts.join(' | ');
  return result || "Não disponível";
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
      setTcoList([]);
      return;
    }
    setIsLoading(true);
    try {
      console.log("Buscando TCOs (metadados do DB) para o usuário:", user.id);
      
      const { data: tcosFromDb, error: dbError } = await supabase
        .from('tco_pdfs') // NOME DA SUA TABELA DE METADADOS DO TCO
        .select('id, tconumber, natureza, policiais, pdfpath, created_at') // Use created_at se for o nome no DB
        .eq('createdby', user.id)
        .order('created_at', { ascending: false }); // Use created_at se for o nome no DB

      if (dbError) {
        console.error("Erro ao buscar TCOs do banco de dados:", dbError);
        throw dbError;
      }

      if (tcosFromDb) {
        const formattedTcos: TcoDataType[] = tcosFromDb.map(tco => {
          return {
            id: tco.id,
            tcoNumber: tco.tconumber || "N/A",
            createdAt: new Date(tco.created_at), // Ajustado para created_at
            natureza: tco.natureza || "Não especificada",
            rgpms: formatRgpmsFromMetadata(tco.policiais), 
            pdfPath: tco.pdfpath,
            policiais: tco.policiais, 
          };
        });
        
        console.log("TCOs formatados a partir do DB:", formattedTcos.length);
        setTcoList(formattedTcos);
      } else {
        setTcoList([]);
      }

    } catch (error: any) {
      console.error("Erro ao buscar TCOs:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar TCOs",
        description: error.message || "Falha ao buscar os TCOs. Verifique o console."
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
    if (!tcoToDelete || !tcoToDelete.id || !tcoToDelete.pdfPath) {
        toast({ variant: "destructive", title: "Erro", description: "Dados do TCO incompletos para exclusão." });
        return;
    }
  
    setIsDeleting(true);
    setDeletionMessage("Iniciando processo de exclusão...");
  
    try {
      const { success, error } = await deleteTCO({ // Usa a função deleteTCO corrigida
        id: tcoToDelete.id, 
        pdfPath: tcoToDelete.pdfPath
      });
  
      if (error || !success) {
        const errorMessage = error?.message || "Falha ao excluir o TCO. Tente novamente.";
        setDeletionMessage(`Erro na exclusão: ${errorMessage}`);
        console.error("Erro no processo de exclusão do TCO:", error);
        toast({
          variant: "destructive",
          title: "Erro ao Excluir",
          description: errorMessage
        });
      } else {
        setTcoList(prevList => prevList.filter(item => item.id !== tcoToDelete.id));
        if (selectedTco?.id === tcoToDelete.id) setSelectedTco(null);
        toast({
          title: "TCO Excluído",
          description: "O TCO foi removido com sucesso."
        });
        setDeletionMessage(null); 
        setTcoToDelete(null); // Limpar após sucesso
        setIsDeleteDialogOpen(false); // Fechar diálogo após sucesso
      }
    } catch (error: any) {
      const catchErrorMessage = error.message || "Falha inesperada ao excluir o TCO.";
      console.error("Erro catastrófico no processo de exclusão do TCO:", error);
      setDeletionMessage(`Erro crítico: ${catchErrorMessage}`);
      toast({
        variant: "destructive",
        title: "Erro Crítico",
        description: catchErrorMessage
      });
    } finally {
      setIsDeleting(false);
      // setIsDeleteDialogOpen é tratado no sucesso/erro
    }
  };
  
  const handleViewPdf = async (tco: TcoDataType) => {
    setPdfLoading(true); 
    setIsPdfDialogOpen(true); 
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
        } else {
          setPdfLoading(false);
          throw new Error("URL pública não encontrada para o PDF.");
        }
      } else {
        setPdfLoading(false);
        toast({ variant: "destructive", title: "PDF não encontrado", description: "Este TCO não possui um caminho de PDF." });
        setIsPdfDialogOpen(false);
      }
    } catch (error: any) {
      setPdfLoading(false); 
      console.error("Erro ao buscar PDF:", error);
      toast({ variant: "destructive", title: "Erro ao Carregar PDF", description: error.message || "Falha ao carregar PDF." });
      setIsPdfDialogOpen(false); 
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
          window.open(url + '?download=true', '_blank'); 
        } else {
          throw new Error("URL pública não encontrada para download.");
        }
      } else {
        toast({ variant: "destructive", title: "PDF não encontrado", description: "PDF não disponível para download." });
      }
    } catch (error: any) {
      console.error("Erro ao baixar PDF:", error);
      toast({ variant: "destructive", title: "Erro ao Baixar PDF", description: error.message || "Falha ao iniciar download." });
    }
  };
  
  useEffect(() => {
    if(user?.id) {
      fetchUserTcos();
    } else {
      setTcoList([]); 
    }
  }, [user?.id]); // Adicionar toast aqui se quiser notificar sobre falha em fetchUserTcos sem que fetchUserTcos trate.

  // O JSX permanece o mesmo da sua versão anterior, pois ele já estava preparado para
  // exibir tco.natureza e tco.rgpms, que agora serão preenchidos corretamente.
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
          setPdfLoading(false); 
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
          
          <div className="h-[calc(100%-57px)] overflow-hidden bg-gray-100 relative"> 
            {(pdfLoading || (!selectedPdfUrl && isPdfDialogOpen)) && ( // Mostrar loader se pdfLoading ou se o diálogo está aberto sem URL ainda
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
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) { // Se fechar o diálogo sem confirmar
            setTcoToDelete(null);
            setDeletionMessage(null);
          }
        }}>
        <AlertDialogContent className="max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tem certeza que deseja excluir o TCO número {tcoToDelete?.tcoNumber ? extractTcoDisplayNumber(tcoToDelete.tcoNumber) : ''}? Esta ação não pode ser desfeita.
              {deletionMessage && (
                <div className={`mt-2 p-2 rounded text-sm ${deletionMessage.toLowerCase().startsWith("erro") ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                  {deletionMessage}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={isDeleting} className="mt-0 w-full sm:w-auto" onClick={() => { setTcoToDelete(null); setDeletionMessage(null); setIsDeleteDialogOpen(false); }}>
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
