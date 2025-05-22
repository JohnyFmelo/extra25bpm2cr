import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Eye, MoreHorizontal, RefreshCw, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteTCO } from "@/lib/supabaseStorage";
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

// Interfaces for GUPM data
interface ExtractedRgpms {
  main: string[];
  support: string[];
}

interface OfficerInfo {
  rgpm: string;
  graduacao: string;
  nome: string;
}

interface StructuredGupm {
  conductor?: OfficerInfo;
  mainTeam: OfficerInfo[]; // Other main officers (excluding conductor)
  supportTeam: OfficerInfo[];
}


// Função auxiliar para extrair e formatar o número de exibição do TCO
const extractTcoDisplayNumber = (fullTcoNumber: string | undefined | null): string => {
  if (!fullTcoNumber) return "-";

  let numberPart = "";
  const match = fullTcoNumber.match(/^TCO[-_]([^_-]+)/i);
  if (match && match[1]) {
    numberPart = match[1];
  } else if (fullTcoNumber.toUpperCase().startsWith("TCO-")) {
    numberPart = fullTcoNumber.substring(4);
  } else {
    return fullTcoNumber;
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

const extractTcoNatureFromFilename = (fileName: string | undefined | null): string => {
  if (!fileName) return "Não especificada";
  const parts = fileName.split('_');
  if (parts.length < 4) return "Não especificada";

  let naturezaParts: string[] = [];
  const lastPart = parts[parts.length - 1];
  const rgpmSegmentPotentially = lastPart.replace(/\.pdf$/i, "");
  
  if (parts.length >= 5 && /^\d/.test(rgpmSegmentPotentially)) {
    naturezaParts = parts.slice(3, parts.length - 1);
  } else {
    const lastNaturePart = parts[parts.length - 1].replace(/\.pdf$/i, "");
    naturezaParts = parts.slice(3, parts.length - 1);
    naturezaParts.push(lastNaturePart);
  }
  
  if (naturezaParts.length === 0) return "Não especificada";

  const joinedNatureza = naturezaParts.join('_');
  return joinedNatureza
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || "Não especificada";
};

const extractRGPMsFromFilename = (fileName: string | undefined | null): ExtractedRgpms => {
  const emptyResult: ExtractedRgpms = { main: [], support: [] };
  if (!fileName) return emptyResult;

  const parts = fileName.split('_');
  if (parts.length < 5) return emptyResult;

  const rgpmSegmentWithExtension = parts[parts.length - 1];
  const rgpmStringWithoutExtension = rgpmSegmentWithExtension.replace(/\.pdf$/i, "");
  if (!rgpmStringWithoutExtension.match(/^\d/)) return emptyResult;

  const [mainRgpmsStr, supportRgpmsStr] = rgpmStringWithoutExtension.split('.');

  const parseRgpmsFromString = (rgpmStr: string | undefined): string[] => {
    if (!rgpmStr) return [];
    const rgpmsList: string[] = [];
    for (let i = 0; i < rgpmStr.length; i += 6) {
      const rgpm = rgpmStr.substring(i, i + 6);
      if (rgpm.length === 6 && /^\d{6}$/.test(rgpm)) {
        rgpmsList.push(rgpm);
      }
    }
    return rgpmsList;
  };

  return {
    main: parseRgpmsFromString(mainRgpmsStr),
    support: parseRgpmsFromString(supportRgpmsStr),
  };
};

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
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  
  const [gupmDetailsCache, setGupmDetailsCache] = useState<Record<string, StructuredGupm | null>>({});
  const [isGupmDetailModalOpen, setIsGupmDetailModalOpen] = useState(false);
  const [currentGupmToDisplay, setCurrentGupmToDisplay] = useState<StructuredGupm | null>(null);


  const fetchAndStructureGupmForTco = async (rgpms: ExtractedRgpms): Promise<StructuredGupm | null> => {
    if (rgpms.main.length === 0 && rgpms.support.length === 0) return null;
  
    const allRgpms = [...new Set([...rgpms.main, ...rgpms.support])];
    if (allRgpms.length === 0) return null;
  
    try {
      const { data: officersData, error } = await supabase
        .from('police_officers')
        .select('rgpm, graduacao, nome')
        .in('rgpm', allRgpms);
  
      if (error) {
        console.error("Error fetching officer details for GUPM:", error);
        // Return RGPMs directly as a fallback if names can't be fetched
        const fallbackOfficer = (rgpm: string): OfficerInfo => ({ rgpm, graduacao: "RGPM", nome: rgpm });
        return {
          conductor: rgpms.main.length > 0 ? fallbackOfficer(rgpms.main[0]) : undefined,
          mainTeam: rgpms.main.slice(1).map(fallbackOfficer),
          supportTeam: rgpms.support.map(fallbackOfficer),
        };
      }
  
      const officersMap = new Map<string, OfficerInfo>();
      officersData?.forEach(officer => officersMap.set(officer.rgpm, officer as OfficerInfo));
  
      const getOfficer = (rgpm: string): OfficerInfo | undefined => officersMap.get(rgpm);
  
      const mainOfficersDetailed = rgpms.main.map(getOfficer).filter(Boolean) as OfficerInfo[];
      const supportOfficersDetailed = rgpms.support.map(getOfficer).filter(Boolean) as OfficerInfo[];
  
      let conductor: OfficerInfo | undefined = undefined;
      let mainTeamOther: OfficerInfo[] = [];
  
      if (mainOfficersDetailed.length > 0) {
        conductor = mainOfficersDetailed[0]; // Assumption: first main officer is conductor
        mainTeamOther = mainOfficersDetailed.slice(1);
      }
    
      return {
        conductor,
        mainTeam: mainTeamOther,
        supportTeam: supportOfficersDetailed,
      };
    } catch (e) {
      console.error("Exception fetching/structuring GUPM:", e);
      return null;
    }
  };

  const fetchUserTcos = async () => {
    if (!user.id) return;
    setIsLoading(true);
    try {
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(`tcos/${user.id}/`);
      
      if (storageError) console.error("Erro ao listar arquivos do storage:", storageError);
      
      const filesFromStorage = storageFiles?.map(file => {
        const fileName = file.name;
        const tcoMatch = fileName.match(/TCO[-_]([^_-]+)/i);
        let tcoIdentifierPart = tcoMatch ? tcoMatch[1] : fileName.replace(/\.pdf$/i, "");
        let finalTcoNumber = tcoIdentifierPart.toUpperCase().startsWith("TCO-") ? tcoIdentifierPart : `TCO-${tcoIdentifierPart}`;

        const natureza = extractTcoNatureFromFilename(fileName);
        const rgpmsExtracted = extractRGPMsFromFilename(fileName);

        return {
          id: file.id || fileName,
          tcoNumber: finalTcoNumber,
          createdAt: new Date(file.created_at || Date.now()),
          natureza: natureza,
          rgpmsExtracted: rgpmsExtracted, // Store structured RGPMs
          pdfPath: `tcos/${user.id}/${fileName}`,
          source: 'storage',
          fileName: fileName
        };
      }) || [];
      
      filesFromStorage.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTcoList(filesFromStorage);
      
      const newGupmDetailsCache: Record<string, StructuredGupm | null> = {};
      for (const tco of filesFromStorage) {
        if (tco.rgpmsExtracted) {
          const gupmInfo = await fetchAndStructureGupmForTco(tco.rgpmsExtracted);
          newGupmDetailsCache[tco.id] = gupmInfo;
        } else {
          newGupmDetailsCache[tco.id] = null;
        }
      }
      setGupmDetailsCache(newGupmDetailsCache);

    } catch (error) {
      console.error("Erro ao buscar TCOs:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar os TCOs." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const confirmDelete = (tco: any) => {
    setTcoToDelete(tco);
    setDeletionMessage(null);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteTco = async () => {
    if (!tcoToDelete) return;
    try {
      setIsDeleting(true);
      setDeletionMessage("Iniciando processo de exclusão...");
      
      const { success, error } = await deleteTCO({ id: tcoToDelete.id, pdfPath: tcoToDelete.pdfPath });
      
      if (error || !success) {
        setDeletionMessage("Erro na exclusão, tentando novamente...");
        if (tcoToDelete.pdfPath) {
          setDeletionMessage("Tentando exclusão alternativa...");
          try { await supabase.storage.from(BUCKET_NAME).remove([tcoToDelete.pdfPath]); } 
          catch (storageError) { console.warn("Explicit storage deletion attempt failed:", storageError); }
          try { await supabase.from('tco_pdfs').delete().or(`id.eq.${tcoToDelete.id},pdfPath.eq.${tcoToDelete.pdfPath}`); } 
          catch (dbError) { console.warn("Explicit database deletion attempt failed:", dbError); }
        }
      }
      
      setTcoList(prevList => prevList.filter(item => item.id !== tcoToDelete.id));
      if (selectedTco?.id === tcoToDelete.id) setSelectedTco(null);
      
      toast({ title: "TCO Excluído", description: "O TCO foi removido com sucesso." });
    } catch (error) {
      console.error("Erro no processo de exclusão do TCO:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao excluir o TCO. Tente novamente." });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setTcoToDelete(null);
      setDeletionMessage(null);
    }
  };
  
  const handleViewPdf = async (tco: any) => {
    try {
      setPdfLoading(true); 
      if (tco.pdfPath) {
        const { data } = await supabase.storage.from(BUCKET_NAME).getPublicUrl(tco.pdfPath);
        const url = data?.publicUrl;
        if (url) {
          setSelectedPdfUrl(url);
          setIsPdfDialogOpen(true);
        } else {
          setPdfLoading(false); 
          throw new Error("URL não encontrada");
        }
      } else {
        setPdfLoading(false); 
        toast({ variant: "destructive", title: "PDF não encontrado", description: "Este TCO não possui um PDF associado." });
      }
    } catch (error) {
      setPdfLoading(false); 
      console.error("Erro ao buscar PDF:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar o PDF do TCO." });
    } 
  };
  
  const handleDownloadPdf = async (tco: any) => {
    try {
      if (tco.pdfPath) {
        const { data } = await supabase.storage.from(BUCKET_NAME).getPublicUrl(tco.pdfPath);
        const url = data?.publicUrl;
        if (url) {
          window.open(url, '_blank');
        } else {
          throw new Error("URL não encontrada");
        }
      } else {
        toast({ variant: "destructive", title: "PDF não encontrado", description: "Este TCO não possui um PDF para download." });
      }
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao baixar o PDF do TCO." });
    }
  };

  const openGupmDetailsModal = (tcoId: string) => {
    const details = gupmDetailsCache[tcoId];
    if (details) {
      setCurrentGupmToDisplay(details);
      setIsGupmDetailModalOpen(true);
    } else {
        toast({ variant: "default", title: "GUPM", description: "Detalhes da guarnição não disponíveis ou ainda carregando."});
    }
  };
  
  useEffect(() => {
    if(user?.id) {
      fetchUserTcos();
    }
  }, [user?.id]);

  return <div className="bg-white rounded-xl shadow-lg p-6 flex-grow overflow-hidden flex flex-col px-[14px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Meus TCOs</h2>
        <Button onClick={fetchUserTcos} variant="outline" size="sm" disabled={isLoading} className="flex items-center gap-2 transition-all hover:bg-slate-100">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Carregando..." : "Atualizar"}</span>
        </Button>
      </div>
      
      {isLoading && tcoList.length === 0 ? <div className="space-y-3 animate-pulse">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div> : tcoList.length === 0 && !isLoading ? <div className="flex flex-col items-center justify-center py-12 text-gray-500 flex-grow">
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
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold w-[120px] px-3">Número</TableHead>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold px-3">Data</TableHead>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold px-3">Natureza</TableHead>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold px-3">Condutor GUPM</TableHead>
                  <TableHead className="bg-slate-100 text-gray-700 font-semibold text-right pr-4 px-3">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tcoList.map(tco => {
                  const gupmInfo = gupmDetailsCache[tco.id];
                  const conductorDisplay = gupmInfo?.conductor 
                    ? `${gupmInfo.conductor.graduacao} ${gupmInfo.conductor.nome}` 
                    : (isLoading ? "Carregando..." : "N/D");
                  const hasAnyOfficerForModal = gupmInfo && (gupmInfo.conductor || gupmInfo.mainTeam.length > 0 || gupmInfo.supportTeam.length > 0);

                  return (
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
                        {tco.createdAt ? format(tco.createdAt instanceof Date ? tco.createdAt : new Date(tco.createdAt), "dd/MM/yyyy - HH:mm") : "-"}
                      </TableCell>
                      <TableCell className="px-3">{tco.natureza || "Não especificada"}</TableCell>
                      <TableCell className="px-3">
                        <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-700 truncate" title={conductorDisplay}>
                             {conductorDisplay}
                           </span>
                           {hasAnyOfficerForModal && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openGupmDetailsModal(tco.id);
                              }}
                              className="p-0 h-auto text-xs text-blue-600 hover:text-blue-800 ml-2 flex items-center"
                              title="Ver guarnição completa"
                            >
                              <Users className="h-3 w-3 mr-1"/> Ver GU
                            </Button>
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-3 pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()} aria-label={`Ações para TCO ${tco.tcoNumber}`} className="h-8 w-8 rounded-full hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menu de ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1" onClick={e => e.stopPropagation()}>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleViewPdf(tco); }} className="cursor-pointer flex items-center p-2 text-sm hover:bg-slate-50 rounded">
                              <Eye className="mr-2 h-4 w-4 text-blue-600" /> <span>Visualizar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDownloadPdf(tco); }} className="cursor-pointer flex items-center p-2 text-sm hover:bg-slate-50 rounded">
                              <Download className="mr-2 h-4 w-4 text-green-600" /> <span>Download</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); confirmDelete(tco); }} className="cursor-pointer flex items-center p-2 text-sm hover:bg-red-50 text-red-600 rounded">
                              <Trash2 className="mr-2 h-4 w-4" /> <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 text-gray-500 text-sm text-right">
            Total: {tcoList.length} {tcoList.length === 1 ? 'TCO' : 'TCOs'}
          </div>
        </div>}

      {/* PDF Viewer Dialog */}
      <Dialog open={isPdfDialogOpen} onOpenChange={(open) => { setIsPdfDialogOpen(open); if (!open) { setSelectedPdfUrl(null); setPdfLoading(false); } }}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
            <DialogTitle className="text-lg font-medium text-gray-700">Visualizador de PDF</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsPdfDialogOpen(false)} className="absolute right-4 top-3 text-gray-500 hover:text-gray-700">Fechar</Button>
          </DialogHeader>
          <div className="h-[calc(100%-57px)] overflow-hidden bg-gray-100">
            {pdfLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-20">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600 text-sm">Carregando PDF...</p>
              </div>
            )}
            {selectedPdfUrl ? (
              <iframe src={selectedPdfUrl} className={`w-full h-full ${pdfLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`} title="PDF Viewer" style={{ border: "none" }} onLoad={() => setPdfLoading(false)} onError={() => { setPdfLoading(false); toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar o PDF."}); setSelectedPdfUrl(null); }} />
            ) : (!pdfLoading && <div className="flex items-center justify-center h-full"><p className="text-gray-500">Selecione um TCO para visualizar o PDF.</p></div>
            )}
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
              {deletionMessage && (<div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded">{deletionMessage}</div>)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={isDeleting} className="mt-0 w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTco} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 w-full sm:w-auto transition-colors">
              {isDeleting ? <div className="flex items-center gap-2 justify-center"><svg className="animate-spin -ml-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Excluindo...</span></div> : <div className="flex items-center gap-2 justify-center"><Trash2 className="h-4 w-4" /><span>Excluir</span></div>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* GUPM Details Modal */}
      <Dialog open={isGupmDetailModalOpen} onOpenChange={setIsGupmDetailModalOpen}>
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-gray-800">Detalhes da Guarnição</DialogTitle>
            <DialogDescription>Lista de policiais envolvidos na ocorrência.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3 text-sm">
            {currentGupmToDisplay?.conductor && (
              <div>
                <p className="font-semibold text-gray-700">Condutor:</p>
                <p className="text-gray-600">{`${currentGupmToDisplay.conductor.graduacao} ${currentGupmToDisplay.conductor.nome}`}</p>
              </div>
            )}
            {currentGupmToDisplay && currentGupmToDisplay.mainTeam.length > 0 && (
              <div>
                <p className="font-semibold text-gray-700 mt-2">Guarnição Principal:</p>
                <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
                  {currentGupmToDisplay.mainTeam.map((officer, index) => (
                    <li key={`main-${index}`}>{`${officer.graduacao} ${officer.nome}`}</li>
                  ))}
                </ul>
              </div>
            )}
            {currentGupmToDisplay && currentGupmToDisplay.supportTeam.length > 0 && (
              <div>
                <p className="font-bold text-blue-600 mt-2">Apoio:</p>
                <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
                  {currentGupmToDisplay.supportTeam.map((officer, index) => (
                    <li key={`support-${index}`}>{`${officer.graduacao} ${officer.nome}`}</li>
                  ))}
                </ul>
              </div>
            )}
            {(!currentGupmToDisplay?.conductor && (!currentGupmToDisplay || currentGupmToDisplay.mainTeam.length === 0) && (!currentGupmToDisplay || currentGupmToDisplay.supportTeam.length === 0)) && (
                <p className="text-gray-500">Nenhuma informação de guarnição disponível.</p>
            )}
          </div>
           <DialogFooter>
            <Button variant="outline" onClick={() => setIsGupmDetailModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>;
};
export default TCOmeus;
