
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Função para buscar os TCOs do usuário do Supabase
  const fetchUserTcos = async () => {
    if (!user.id) return;
    setIsLoading(true);
    
    try {
      console.log("Buscando TCOs para o usuário:", user.id);
      
      // Buscar metadados dos TCOs no banco de dados
      const { data: supaTcos, error } = await supabase
        .from('tco_pdfs')
        .select('*')
        .eq('createdBy', user.id);
      
      if (error) {
        console.error("Erro ao buscar do banco Supabase:", error);
        throw error;
      }
      
      console.log("TCOs encontrados no banco:", supaTcos);
      
      // Se não houver metadados, verifique diretamente no storage
      if (!supaTcos || supaTcos.length === 0) {
        console.log("Buscando diretamente do storage na pasta:", `tcos/${user.id}/`);
        
        // Listar arquivos no storage
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .list(`tcos/${user.id}/`);
        
        if (storageError) {
          console.error("Erro ao listar arquivos do storage:", storageError);
          throw storageError;
        }
        
        console.log("Arquivos encontrados no storage:", storageFiles);
        
        // Converter arquivos do storage para o formato esperado
        const filesFromStorage = storageFiles?.map(file => {
          // Extrair informações do nome do arquivo, assumindo formato "TCO-XXXX-data.pdf"
          const fileName = file.name;
          const tcoNumber = fileName.split('-')[1] || "Sem número";
          
          return {
            id: file.id || fileName,
            tcoNumber: `TCO-${tcoNumber}`,
            createdAt: new Date(file.created_at || Date.now()),
            natureza: "Não especificada",
            pdfPath: `tcos/${user.id}/${fileName}`,
            source: 'storage'
          };
        }) || [];
        
        setTcoList(filesFromStorage);
      } else {
        // Converter dados do Supabase para o formato esperado
        const supabaseTcos = supaTcos?.map(tco => ({
          id: tco.id,
          tcoNumber: tco.tcoNumber || `TCO-${tco.id.substring(0, 8)}`,
          createdAt: new Date(tco.createdAt || tco.created_at),
          natureza: tco.natureza || "Não especificada",
          pdfPath: tco.pdfPath,
          source: 'supabase'
        })) || [];
        
        setTcoList(supabaseTcos);
      }
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

  // Função para excluir um TCO
  const handleDeleteTco = async (tco: any) => {
    try {
      // Excluir do Supabase storage primeiro
      if (tco.pdfPath) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([tco.pdfPath]);
        
        if (storageError) {
          console.error("Erro ao excluir arquivo do storage:", storageError);
          throw storageError;
        }
      }

      // Excluir do banco de dados Supabase se for um registro de banco
      if (tco.source === 'supabase') {
        const { error } = await supabase
          .from('tco_pdfs')
          .delete()
          .eq('id', tco.id);
        
        if (error) {
          console.error("Erro ao excluir TCO do banco de dados:", error);
          throw error;
        }
      }

      setTcoList(tcoList.filter(item => item.id !== tco.id));
      if (selectedTco?.id === tco.id) setSelectedTco(null);
      
      toast({
        title: "TCO Excluído",
        description: "O TCO foi removido com sucesso."
      });
    } catch (error) {
      console.error("Erro ao excluir TCO:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir o TCO."
      });
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
                        handleDeleteTco(tco);
                      }}
                      aria-label={`Excluir TCO ${tco.tcoNumber}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* PDF Viewer Dialog */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Visualização do TCO</DialogTitle>
          </DialogHeader>
          {selectedPdfUrl && (
            <div className="w-full h-full min-h-[500px] overflow-hidden">
              <iframe
                src={`${selectedPdfUrl}#toolbar=0`}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsPdfDialogOpen(false)}
            >
              Fechar
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (selectedPdfUrl) window.open(selectedPdfUrl, '_blank');
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TCOmeus;
