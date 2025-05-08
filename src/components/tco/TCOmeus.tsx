import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TCOmeusProps {
  user: { id: string };
  toast: ReturnType<typeof useToast>["toast"];
  setSelectedTco: (tco: any) => void;
  selectedTco: any;
}

const TCOmeus: React.FC<TCOmeusProps> = ({ user, toast, setSelectedTco, selectedTco }) => {
  const [tcoList, setTcoList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingTco, setViewingTco] = useState<any>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

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
  const handleViewTco = (tco: any) => {
    setViewingTco(tco);
    setPdfDialogOpen(true);
  };

  // Function to edit a TCO
  const handleEditTco = (tco: any) => {
    setSelectedTco(tco);
    // Switch to form tab through parent component
  };

  // Fetch TCOs when component mounts
  useEffect(() => {
    fetchUserTcos();
  }, [user.id]);

  return (
    <>
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
                  onClick={() => handleEditTco(tco)}
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
                      {tco.pdfUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTco(tco);
                          }}
                          aria-label={`Visualizar TCO ${tco.tcoNumber}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
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
      </div>

      {/* Dialog para visualizar o PDF */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-screen">
          <DialogHeader>
            <DialogTitle>
              TCO {viewingTco?.tcoNumber} - {viewingTco?.natureza}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            {viewingTco?.pdfUrl ? (
              <>
                <div className="h-[70vh] w-full">
                  <iframe 
                    src={viewingTco.pdfUrl} 
                    className="w-full h-full" 
                    title={`TCO ${viewingTco.tcoNumber} PDF`}
                  />
                </div>
                <div className="flex justify-end">
                  <Button asChild>
                    <a href={viewingTco.pdfUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar PDF
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p>PDF não disponível para este TCO.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TCOmeus;
