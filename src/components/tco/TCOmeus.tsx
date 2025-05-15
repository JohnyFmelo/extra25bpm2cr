import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deletePDF, deleteTCOMetadata } from "@/lib/supabaseStorage";

interface TCOmeusProps {
  user: { id: string; registration?: string };
  toast: ReturnType<typeof useToast>["toast"];
  setSelectedTco: (tco: any) => void;
  selectedTco: any;
}

const BUCKET_NAME = 'tco-pdfs';

const TCOmeus: React.FC<TCOmeusProps> = ({ user, toast, setSelectedTco, selectedTco }) => {
  const [tcoList, setTcoList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tcoToDelete, setTcoToDelete] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Função para buscar os TCOs do usuário do Supabase
  const fetchUserTcos = async () => {
    if (!user.id) return;
    setIsLoading(true);
    
    try {
      console.log("Buscando TCOs para o usuário:", user.id);
      
      // Primeiro, tenta buscar diretamente do storage pela pasta do usuário
      console.log("Buscando diretamente do storage na pasta:", `tcos/${user.id}/`);
      
      // Listar arquivos no storage
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(`tcos/${user.id}/`);
      
      if (storageError) {
        console.error("Erro ao listar arquivos do storage:", storageError);
        // Não lançar erro aqui, tentar buscar do banco
      } else {
        console.log("Arquivos encontrados no storage:", storageFiles);
      }
      
      // Então tenta buscar metadados dos TCOs no banco de dados (se o usuário tiver um UUID válido)
      let dbTcos: any[] = [];
      
      if (isValidUUID(user.id)) {
        const { data: supaTcos, error } = await supabase
          .from('tco_pdfs')
          .select('*')
          .eq('createdBy', user.id);
        
        if (error) {
          console.error("Erro ao buscar do banco Supabase:", error);
          // Não lançar erro aqui, apenas log
        } else if (supaTcos && supaTcos.length > 0) {
          console.log("TCOs encontrados no banco:", supaTcos);
          dbTcos = supaTcos;
        }
      }
      
      // Consolidar resultados do storage e do banco de dados
      let consolidatedTcos: any[] = [];
      
      // Converter arquivos do storage para o formato esperado
      const filesFromStorage = storageFiles?.map(file => {
        // Extrair informações do nome do arquivo, assumindo formato "TCO-XXXX-data.pdf" ou apenas TCO.pdf
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
      
      // Converter dados do Supabase para o formato esperado
      const supabaseTcos = dbTcos.map(tco => ({
        id: tco.id,
        tcoNumber: tco.tcoNumber || `TCO-${tco.id.substring(0, 8)}`,
        createdAt: new Date(tco.createdAt || tco.created_at),
        natureza: tco.natureza || "Não especificada",
        pdfPath: tco.pdfPath,
        source: 'supabase'
      })) || [];
      
      // Juntar os dois arrays e verificar duplicatas por nome de arquivo
      consolidatedTcos = [...supabaseTcos];
      
      // Adicionar apenas arquivos do storage que não estão já no banco de dados
      for (const storageTco of filesFromStorage) {
        const isDuplicate = consolidatedTcos.some(
          tco => tco.pdfPath === storageTco.pdfPath || tco.tcoNumber === storageTco.tcoNumber
        );
        
        if (!isDuplicate) {
          consolidatedTcos.push(storageTco);
        }
      }
      
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

  // Função auxiliar para verificar se uma string é um UUID válido
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Função para confirmar exclusão de um TCO
  const confirmDelete = (tco: any) => {
    setTcoToDelete(tco);
    setIsDeleteDialogOpen(true);
  };

  // Função para excluir um TCO
  const handleDeleteTco = async () => {
    if (!tcoToDelete) return;
    
    try {
      setIsDeleting(true);
      console.log("Iniciando exclusão do TCO:", tcoToDelete);
      
      // Primeiro excluir o arquivo do storage
      if (tcoToDelete.pdfPath) {
        console.log("Excluindo arquivo do storage:", tcoToDelete.pdfPath);
        const { success: storageSuccess, error: storageError } = await deletePDF(tcoToDelete.pdfPath);
        
        if (storageError) {
          console.error("Erro ao excluir arquivo do storage:", storageError);
          // Não interromper o processo se falhar no storage
        }
      }

      // Em seguida, excluir do banco de dados se for um registro existente
      if (tcoToDelete.source === 'supabase' && isValidUUID(tcoToDelete.id)) {
        console.log("Excluindo registro do banco de dados, ID:", tcoToDelete.id);
        const { success: dbSuccess, error: dbError } = await deleteTCOMetadata(tcoToDelete.id);
        
        if (dbError) {
          console.error("Erro ao excluir TCO do banco de dados:", dbError);
          throw dbError;
        }
      } else {
        console.log("Registro não encontrado no banco ou ID inválido:", tcoToDelete.id);
        
        // Tentativa alternativa: excluir diretamente da tabela usando o caminho do PDF
        if (tcoToDelete.pdfPath) {
          console.log("Tentando excluir pelo caminho do PDF:", tcoToDelete.pdfPath);
          const { error } = await supabase
            .from('tco_pdfs')
            .delete()
            .eq('pdfPath', tcoToDelete.pdfPath);
          
          if (error) {
            console.log("Erro ao excluir pelo caminho (pode ser normal se não existir no banco):", error);
          }
        }
      }

      // Atualizar a interface após exclusão
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

  // Função para visualizar PDF
  const handleViewPdf = async (tco: any) => {
    try {
      if (tco.pdfPath) {
        console.log("Obtendo URL público para o arquivo:", tco.pdfPath);
        
        // Obter URL público do Supabase
        const { data } = await supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(tco.pdfPath);
        
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
    }
  };

  // Função para baixar PDF
  const handleDownloadPdf = async (tco: any) => {
    try {
      if (tco.pdfPath) {
        console.log("Obtendo URL para download:", tco.pdfPath);
        
        // Obter URL público do Supabase
        const { data } = await supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(tco.pdfPath);
        
        const url = data?.publicUrl;
        console.log("URL para download:", url);
        
        if (url) {
          // Abre o URL em uma nova aba para download
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

  // Buscar TCOs quando o componente é montado
  useEffect(() => {
    fetchUserTcos();
  }, [user.id]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 flex-grow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Meus TCOs</h2>
        <Button 
          onClick={fetchUserTcos} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? "Carregando..." : "Atualizar"}
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : tcoList.length === 0 ? (
        <p className="text-center py-8 text-gray-500">Nenhum TCO encontrado</p>
      ) : (
        <Table role="grid">
          <TableHeader>
            <TableRow>
              <TableHead className="bg-slate-400">Número</TableHead>
              <TableHead className="bg-slate-400">Data</TableHead>
              <TableHead className="bg-slate-400">Natureza</TableHead>
              <TableHead className="bg-slate-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tcoList.map((tco) => (
              <TableRow
                key={tco.id}
                aria-selected={selectedTco?.id === tco.id}
                className={`cursor-pointer ${selectedTco?.id === tco.id ? "bg-primary/10" : ""}`}
                onClick={() => setSelectedTco(tco)}
              >
                <TableCell className="font-medium">{tco.tcoNumber}</TableCell>
                <TableCell>
                  {tco.createdAt
                    ? format(
                        tco.createdAt instanceof Date 
                          ? tco.createdAt 
                          : new Date(tco.createdAt), 
                        "dd/MM/yyyy"
                      )
                    : "-"}
                </TableCell>
                <TableCell>{tco.natureza}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPdf(tco);
                      }}
                      aria-label={`Visualizar TCO ${tco.tcoNumber}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPdf(tco);
                      }}
                      aria-label={`Baixar TCO ${tco.tcoNumber}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(tco);
                      }}
                      disabled={isDeleting}
                      aria-label={`Excluir TCO ${tco.tcoNumber}`}
                    >
                      <Trash2 className={`h-4 w-4 text-red-500 hover:text-red-700`} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* PDF Viewer Dialog - Simplified and direct */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden">
          {selectedPdfUrl ? (
            <iframe
              src={selectedPdfUrl}
              className="w-full h-full"
              title="PDF Viewer"
              style={{ border: "none" }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-full w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este TCO? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTco}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TCOmeus;
