import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Eye, MoreHorizontal, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deletePDF, deleteTCOMetadata } from "@/lib/supabaseStorage";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
interface TCOmeusProps {
  user: {
    id: string;
    registration?: string;
  };
  toast: ReturnType<typeof useToast>["toast"];
  setSelectedTco: (tco: any) => void;
  selectedTco: any;
}
const BUCKET_NAME = 'tco-pdfs';
const TCOmeus: React.FC<TCOmeusProps> = ({
  user,
  toast,
  setSelectedTco,
  selectedTco
}) => {
  const [tcoList, setTcoList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tcoToDelete, setTcoToDelete] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Função para buscar os TCOs do usuário do Supabase
  const fetchUserTcos = async () => {
    if (!user.id) return;
    setIsLoading(true);
    try {
      console.log("Buscando TCOs para o usuário:", user.id);
      console.log("Buscando diretamente do storage na pasta:", `tcos/${user.id}/`);
      const {
        data: storageFiles,
        error: storageError
      } = await supabase.storage.from(BUCKET_NAME).list(`tcos/${user.id}/`);
      if (storageError) {
        console.error("Erro ao listar arquivos do storage:", storageError);
      } else {
        console.log("Arquivos encontrados no storage:", storageFiles);
      }
      let dbTcos: any[] = [];
      if (isValidUUID(user.id)) {
        const {
          data: supaTcos,
          error
        } = await supabase.from('tco_pdfs').select('*').eq('createdBy', user.id);
        if (error) {
          console.error("Erro ao buscar do banco Supabase:", error);
        } else if (supaTcos && supaTcos.length > 0) {
          console.log("TCOs encontrados no banco:", supaTcos);
          dbTcos = supaTcos;
        }
      }
      let consolidatedTcos: any[] = [];
      const filesFromStorage = storageFiles?.map(file => {
        const fileName = file.name;
        const tcoMatch = fileName.match(/TCO-(\w+)/i);
        const tcoNumber = tcoMatch ? tcoMatch[1] : fileName.replace(".pdf", "");
        return {
          id: file.id || fileName,
          tcoNumber: `TCO-${tcoNumber}`,
          createdAt: new Date(file.created_at || Date.now()),
          natureza: "Não especificada",
          pdfPath: `tcos/${user.id}/${fileName}`,
          source: 'storage'
        };
      }) || [];
      const supabaseTcos = dbTcos.map(tco => ({
        id: tco.id,
        tcoNumber: tco.tcoNumber || `TCO-${tco.id.substring(0, 8)}`,
        createdAt: new Date(tco.createdAt || tco.created_at),
        natureza: tco.natureza || "Não especificada",
        pdfPath: tco.pdfPath,
        source: 'supabase'
      })) || [];
      consolidatedTcos = [...supabaseTcos];
      for (const storageTco of filesFromStorage) {
        const isDuplicate = consolidatedTcos.some(tco => tco.pdfPath === storageTco.pdfPath || tco.tcoNumber === storageTco.tcoNumber);
        if (!isDuplicate) {
          consolidatedTcos.push(storageTco);
        }
      }

      // Ordenar por data de criação (mais recente primeiro)
      consolidatedTcos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (consolidatedTcos.length === 0) {
        console.log("Nenhum TCO encontrado para o usuário");
      }
      setTcoList(consolidatedTcos);
    } catch (error) {
      console.error("Erro ao buscar TCOs:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar os TCOs."
      });
    } finally {
      setIsLoading(false);
    }
  };
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };
  const confirmDelete = (tco: any) => {
    setTcoToDelete(tco);
    setIsDeleteDialogOpen(true);
  };
  const handleDeleteTco = async () => {
    if (!tcoToDelete) return;
    try {
      setIsDeleting(true);
      console.log("Iniciando exclusão do TCO:", tcoToDelete);
      if (tcoToDelete.pdfPath) {
        console.log("Excluindo arquivo do storage:", tcoToDelete.pdfPath);
        const {
          success: storageSuccess,
          error: storageError
        } = await deletePDF(tcoToDelete.pdfPath);
        if (storageError) {
          console.error("Erro ao excluir arquivo do storage:", storageError);
        }
      }
      if (tcoToDelete.source === 'supabase' && isValidUUID(tcoToDelete.id)) {
        console.log("Excluindo registro do banco de dados, ID:", tcoToDelete.id);
        const {
          success: dbSuccess,
          error: dbError
        } = await deleteTCOMetadata(tcoToDelete.id);
        if (dbError) {
          console.error("Erro ao excluir TCO do banco de dados:", dbError);
          throw dbError;
        }
      } else {
        console.log("Registro não encontrado no banco ou ID inválido:", tcoToDelete.id);
        if (tcoToDelete.pdfPath) {
          console.log("Tentando excluir pelo caminho do PDF:", tcoToDelete.pdfPath);
          const {
            error
          } = await supabase.from('tco_pdfs').delete().eq('pdfPath', tcoToDelete.pdfPath);
          if (error) {
            console.log("Erro ao excluir pelo caminho (pode ser normal se não existir no banco):", error);
          }
        }
      }
      setTcoList(tcoList.filter(item => item.id !== tcoToDelete.id));
      if (selectedTco?.id === tcoToDelete.id) setSelectedTco(null);
      toast({
        title: "TCO Excluído",
        description: "O TCO foi removido com sucesso."
      });
      console.log("TCO excluído com sucesso");
    } catch (error) {
      console.error("Erro no processo de exclusão do TCO:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir o TCO. Tente novamente."
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setTcoToDelete(null);
    }
  };
  const handleViewPdf = async (tco: any) => {
    try {
      setPdfLoading(true);
      if (tco.pdfPath) {
        console.log("Obtendo URL público para o arquivo:", tco.pdfPath);
        const {
          data
        } = await supabase.storage.from(BUCKET_NAME).getPublicUrl(tco.pdfPath);
        const url = data?.publicUrl;
        console.log("URL público obtido:", url);
        if (url) {
          setSelectedPdfUrl(url);
          setIsPdfDialogOpen(true);
        } else {
          throw new Error("URL não encontrada");
        }
      } else {
        toast({
          variant: "destructive",
          title: "PDF não encontrado",
          description: "Este TCO não possui um PDF associado."
        });
      }
    } catch (error) {
      console.error("Erro ao buscar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar o PDF do TCO."
      });
    } finally {
      setPdfLoading(false);
    }
  };
  const handleDownloadPdf = async (tco: any) => {
    try {
      if (tco.pdfPath) {
        console.log("Obtendo URL para download:", tco.pdfPath);
        const {
          data
        } = await supabase.storage.from(BUCKET_NAME).getPublicUrl(tco.pdfPath);
        const url = data?.publicUrl;
        console.log("URL para download:", url);
        if (url) {
          window.open(url, '_blank');
        } else {
          throw new Error("URL não encontrada");
        }
      } else {
        toast({
          variant: "destructive",
          title: "PDF não encontrado",
          description: "Este TCO não possui um PDF para download."
        });
      }
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao baixar o PDF do TCO."
      });
    }
  };
  useEffect(() => {
    fetchUserTcos();
  }, [user.id]);
  return <div className="bg-white rounded-xl shadow-lg p-6 flex-grow overflow-hidden flex flex-col px-[14px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Meus TCOs</h2>
        <Button onClick={fetchUserTcos} variant="outline" size="sm" disabled={isLoading} className="flex items-center gap-2 transition-all hover:bg-slate-100">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Carregando..." : "Atualizar"}</span>
        </Button>
      </div>
      
      {isLoading ? <div className="space-y-3 animate-pulse">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div> : tcoList.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-gray-500 flex-grow">
          <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-center mb-2">Nenhum TCO encontrado</p>
          <p className="text-center text-sm text-gray-400">Os TCOs que você criar aparecerão aqui</p>
        </div> : <div className="flex-grow overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-grow rounded-lg border border-gray-200">
            <Table role="grid" className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold">Número</TableHead>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold">Data</TableHead>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold">Natureza</TableHead>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold text-right pr-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tcoList.map(tco => <TableRow key={tco.id} aria-selected={selectedTco?.id === tco.id} className={`cursor-pointer transition-colors hover:bg-slate-50 ${selectedTco?.id === tco.id ? "bg-primary/10" : ""}`} onClick={() => setSelectedTco(tco)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5">
                          {tco.tcoNumber}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tco.createdAt ? format(tco.createdAt instanceof Date ? tco.createdAt : new Date(tco.createdAt), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>{tco.natureza || "Não especificada"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()} aria-label={`Ações para TCO ${tco.tcoNumber}`} className="h-8 w-8 rounded-full hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu de ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1" onClick={e => e.stopPropagation()}>
                          <DropdownMenuItem onClick={e => {
                      e.stopPropagation();
                      handleViewPdf(tco);
                    }} className="cursor-pointer flex items-center p-2 text-sm hover:bg-slate-50 rounded">
                            <Eye className="mr-2 h-4 w-4 text-blue-600" />
                            <span>Visualizar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={e => {
                      e.stopPropagation();
                      handleDownloadPdf(tco);
                    }} className="cursor-pointer flex items-center p-2 text-sm hover:bg-slate-50 rounded">
                            <Download className="mr-2 h-4 w-4 text-green-600" />
                            <span>Download</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={e => {
                      e.stopPropagation();
                      confirmDelete(tco);
                    }} className="cursor-pointer flex items-center p-2 text-sm hover:bg-red-50 text-red-600 rounded">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 text-gray-500 text-sm text-right">
            Total: {tcoList.length} {tcoList.length === 1 ? 'TCO' : 'TCOs'}
          </div>
        </div>}

      {/* PDF Viewer Dialog */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
            <DialogTitle className="text-center">Visualizador de PDF</DialogTitle>
            <Button variant="outline" size="sm" onClick={() => setIsPdfDialogOpen(false)} className="absolute right-4 top-4">
              Fechar
            </Button>
          </DialogHeader>
          
          <div className="h-full overflow-hidden">
            {pdfLoading ? <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50">
                <Skeleton className="h-8 w-8 rounded-full mb-4 animate-pulse" />
                <p className="text-gray-500 text-sm">Carregando PDF...</p>
              </div> : selectedPdfUrl ? <iframe src={selectedPdfUrl} className="w-full h-[calc(100%-56px)]" title="PDF Viewer" style={{
            border: "none"
          }} onLoad={() => setPdfLoading(false)} /> : <div className="flex items-center justify-center h-full bg-gray-50">
                <p className="text-gray-500">Não foi possível carregar o PDF</p>
              </div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tem certeza que deseja excluir este TCO? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={isDeleting} className="mt-0 w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTco} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 w-full sm:w-auto transition-colors">
              {isDeleting ? <div className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Excluindo...</span>
                </div> : <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir</span>
                </div>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default TCOmeus;