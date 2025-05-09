
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TCOmeusProps {
  user: { id: string; registration?: string };
  toast: ReturnType<typeof useToast>["toast"];
  setSelectedTco: (tco: any) => void;
  selectedTco: any;
}

const TCOmeus: React.FC<TCOmeusProps> = ({ user, toast, setSelectedTco, selectedTco }) => {
  const [tcoList, setTcoList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);

  // Function to fetch user's TCOs
  const fetchUserTcos = async () => {
    if (!user.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tcos')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTcoList(data || []);
    } catch (error: any) {
      console.error("Error fetching TCOs:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar os TCOs."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a TCO
  const handleDeleteTco = async (tcoId: string) => {
    try {
      const { error } = await supabase
        .from('tcos')
        .delete()
        .eq('id', tcoId);

      if (error) {
        throw error;
      }

      setTcoList(tcoList.filter(tco => tco.id !== tcoId));
      if (selectedTco?.id === tcoId) setSelectedTco(null);
      
      toast({
        title: "TCO Excluído",
        description: "O TCO foi removido com sucesso."
      });
    } catch (error: any) {
      console.error("Error deleting TCO:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir o TCO."
      });
    }
  };

  // Function to view PDF
  const handleViewPdf = async (tco: any) => {
    try {
      if (tco.pdf_url) {
        setSelectedPdfUrl(tco.pdf_url);
        setIsPdfDialogOpen(true);
      } else if (tco.pdf_path) {
        // Se tiver apenas o caminho do PDF no Storage
        const { data } = supabase.storage
            .from('tco_images')
            .getPublicUrl(tco.pdf_path);
            
        if (data) {
          setSelectedPdfUrl(data.publicUrl);
          setIsPdfDialogOpen(true);
        } else {
          toast({
            variant: "destructive",
            title: "PDF não encontrado",
            description: "O arquivo PDF não foi encontrado."
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "PDF não encontrado",
          description: "Este TCO não possui um PDF associado."
        });
      }
    } catch (error: any) {
      console.error("Error fetching PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar o PDF do TCO."
      });
    }
  };

  // Function to download PDF
  const handleDownloadPdf = async (tco: any) => {
    try {
      let url = tco.pdf_url;
      
      if (!url && tco.pdf_path) {
        // Se tiver apenas o caminho do PDF no Storage
        const { data } = supabase.storage
            .from('tco_images')
            .getPublicUrl(tco.pdf_path);
            
        if (data) {
          url = data.publicUrl;
        } else {
          toast({
            variant: "destructive",
            title: "PDF não encontrado",
            description: "O arquivo PDF não foi encontrado."
          });
          return;
        }
      }
      
      if (url) {
        // Abre o URL em uma nova aba para download
        window.open(url, '_blank');
      } else {
        toast({
          variant: "destructive",
          title: "PDF não encontrado",
          description: "Este TCO não possui um PDF para download."
        });
      }
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao baixar o PDF do TCO."
      });
    }
  };

  // Fetch TCOs when component mounts
  useEffect(() => {
    fetchUserTcos();
  }, [user.id]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 flex-grow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Meus TCOs</h2>
      </div>
      {isLoading ? (
        <p className="text-center py-8">Carregando TCOs...</p>
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
                <TableCell className="font-medium">{tco.tco_number}</TableCell>
                <TableCell>
                  {tco.created_at
                    ? format(new Date(tco.created_at), "dd/MM/yyyy")
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
                      aria-label={`Visualizar TCO ${tco.tco_number}`}
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
                      aria-label={`Baixar TCO ${tco.tco_number}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTco(tco.id);
                      }}
                      aria-label={`Excluir TCO ${tco.tco_number}`}
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
