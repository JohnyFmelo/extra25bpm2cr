
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, FileText, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface TCOmeusProps {
  user: { id: string };
  toast: ReturnType<typeof useToast>["toast"];
  setSelectedTco: (tco: any) => void;
  selectedTco: any;
}

const TCOmeus: React.FC<TCOmeusProps> = ({ user, toast, setSelectedTco, selectedTco }) => {
  const [tcoList, setTcoList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfFileName, setSelectedPdfFileName] = useState<string | null>(null);
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const storage = getStorage();

  // Function to fetch user's TCOs
  const fetchUserTcos = async () => {
    if (!user.id) return;
    setIsLoading(true);
    try {
      const tcoRef = collection(db, "tcos");
      const q = query(tcoRef, where("createdBy", "==", user.id));
      const querySnapshot = await getDocs(q);
      const tcos: any[] = [];
      querySnapshot.forEach(doc => {
        tcos.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setTcoList(tcos);
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
  const handleDeleteTco = async (tcoId: string) => {
    try {
      await deleteDoc(doc(db, "tcos", tcoId));
      setTcoList(tcoList.filter(tco => tco.id !== tcoId));
      if (selectedTco?.id === tcoId) setSelectedTco(null);
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

  // Function to view TCO PDF
  const handleViewTcoPdf = async (tcoId: string) => {
    try {
      // Get the TCO data from Firestore to get the PDF URL
      const tcoDoc = await getDoc(doc(db, "tcos", tcoId));
      if (tcoDoc.exists()) {
        const tcoData = tcoDoc.data();
        if (tcoData.pdfUrl) {
          setSelectedPdfUrl(tcoData.pdfUrl);
          setSelectedPdfFileName(tcoData.pdfFilename || `TCO_${tcoData.tcoNumber}.pdf`);
          setOpenPdfDialog(true);
        } else {
          // If no pdfUrl exists, try to generate one from Storage
          if (tcoData.pdfFilename) {
            try {
              const storageRef = ref(storage, `tcos/${tcoData.pdfFilename}`);
              const url = await getDownloadURL(storageRef);
              setSelectedPdfUrl(url);
              setSelectedPdfFileName(tcoData.pdfFilename);
              setOpenPdfDialog(true);
            } catch (error) {
              console.error("Error fetching PDF from Storage:", error);
              toast({
                variant: "destructive",
                title: "PDF não encontrado",
                description: "Não foi possível encontrar o PDF deste TCO."
              });
            }
          } else {
            toast({
              variant: "destructive",
              title: "PDF não disponível",
              description: "Este TCO não possui um PDF associado."
            });
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "TCO não encontrado",
          description: "O TCO solicitado não foi encontrado."
        });
      }
    } catch (error) {
      console.error("Error viewing TCO PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao visualizar o PDF do TCO."
      });
    }
  };

  // Function to download TCO PDF
  const handleDownloadTcoPdf = (url: string, fileName: string) => {
    // Create a link and programmatically click it to download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Fetch TCOs when component mounts
  useEffect(() => {
    fetchUserTcos();
  }, [user.id]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 flex-grow">
      <div className="flex items-center justify-between mb-4">
        {/* Espaço reservado para título ou ações adicionais, se necessário */}
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
                <TableCell className="font-medium">{tco.tcoNumber}</TableCell>
                <TableCell>
                  {tco.createdAt
                    ? format(new Date(tco.createdAt.seconds * 1000), "dd/MM/yyyy")
                    : "-"}
                </TableCell>
                <TableCell>{tco.natureza}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTcoPdf(tco.id);
                      }}
                      aria-label={`Visualizar PDF do TCO ${tco.tcoNumber}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTco(tco.id);
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
      <Dialog open={openPdfDialog} onOpenChange={setOpenPdfDialog}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Visualização do TCO</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => selectedPdfUrl && selectedPdfFileName && handleDownloadTcoPdf(selectedPdfUrl, selectedPdfFileName)}
              >
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedPdfUrl && (
            <div className="w-full h-full overflow-hidden">
              <iframe
                src={`${selectedPdfUrl}#toolbar=0`}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TCOmeus;
