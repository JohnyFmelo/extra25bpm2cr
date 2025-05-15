
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";

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

  // Function to fetch user's TCOs from both Firebase and Supabase
  const fetchUserTcos = async () => {
    if (!user.id) return;
    setIsLoading(true);
    try {
      // Fetch from Firebase
      const tcoRef = collection(db, "tcos");
      const q = query(tcoRef, where("createdBy", "==", user.id));
      const querySnapshot = await getDocs(q);
      const firebaseTcos: any[] = [];
      querySnapshot.forEach(doc => {
        firebaseTcos.push({
          id: doc.id,
          source: 'firebase',
          ...doc.data()
        });
      });

      // Fetch from Supabase
      const { data: supaTcos, error } = await supabase
        .from('tco_pdfs')
        .select('*')
        .eq('userId', user.id);
      
      if (error) {
        console.error("Error fetching from Supabase:", error);
        throw error;
      }

      // Convert Supabase data to match format
      const supabaseTcos = supaTcos?.map(tco => ({
        id: tco.id,
        tcoNumber: tco.tcoNumber || `TCO-${tco.id.substring(0, 8)}`,
        createdAt: new Date(tco.created_at),
        natureza: tco.natureza || "Não especificada",
        pdfPath: tco.file_path,
        source: 'supabase'
      })) || [];
      
      // Combine both sources
      setTcoList([...firebaseTcos, ...supabaseTcos]);
    } catch (error) {
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
  const handleDeleteTco = async (tco: any) => {
    try {
      if (tco.source === 'firebase') {
        // Delete from Firebase
        await deleteDoc(doc(db, "tcos", tco.id));
      } else if (tco.source === 'supabase') {
        // Delete from Supabase storage first
        if (tco.pdfPath) {
          const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([tco.pdfPath]);
          
          if (storageError) {
            console.error("Error deleting file from storage:", storageError);
            throw storageError;
          }
        }

        // Delete from Supabase database
        const { error } = await supabase
          .from('tco_pdfs')
          .delete()
          .eq('id', tco.id);
        
        if (error) {
          console.error("Error deleting TCO from database:", error);
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
      let url = null;
      
      if (tco.source === 'firebase' && tco.pdfUrl) {
        url = tco.pdfUrl;
      } else if (tco.source === 'supabase' && tco.pdfPath) {
        // Get public URL from Supabase
        const { data } = await supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(tco.pdfPath);
        
        url = data?.publicUrl;
      }
      
      if (url) {
        setSelectedPdfUrl(url);
        setIsPdfDialogOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: "PDF não encontrado",
          description: "Este TCO não possui um PDF associado."
        });
      }
    } catch (error) {
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
      let url = null;
      
      if (tco.source === 'firebase' && tco.pdfUrl) {
        url = tco.pdfUrl;
      } else if (tco.source === 'supabase' && tco.pdfPath) {
        // Get public URL from Supabase
        const { data } = await supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(tco.pdfPath);
        
        url = data?.publicUrl;
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
    } catch (error) {
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
              <TableHead className="bg-slate-400">Origem</TableHead>
              <TableHead className="bg-slate-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tcoList.map((tco) => (
              <TableRow
                key={`${tco.source}-${tco.id}`}
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
                          : new Date(tco.createdAt.seconds * 1000), 
                        "dd/MM/yyyy"
                      )
                    : "-"}
                </TableCell>
                <TableCell>{tco.natureza}</TableCell>
                <TableCell>{tco.source === 'firebase' ? 'Firebase' : 'Supabase'}</TableCell>
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
