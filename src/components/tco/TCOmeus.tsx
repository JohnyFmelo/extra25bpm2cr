// TCOmeus (7).tsx

import React, { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Eye, MoreHorizontal, RefreshCw, Users, FileText, Info, X } from "lucide-react"; // Adicionado X para fechar modais
import { format } from "date-fns";
import { useToast as useShadcnToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteTCO } from "@/lib/supabaseStorage";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // Removido DropdownMenuSeparator da importação se não for mais usado em outros lugares
import { Badge } from "@/components/ui/badge";
interface TCOmeusProps {
  user: {
    id: string;
    registration?: string;
  };
  toast: ReturnType<typeof useShadcnToast>["toast"];
  setSelectedTco: (tco: TcoData | null) => void;
  selectedTco: TcoData | null;
}
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
  mainTeam: OfficerInfo[];
  supportTeam: OfficerInfo[];
}
interface TcoData {
  id: string;
  tcoNumber: string;
  createdAt: Date;
  natureza: string;
  rgpmsExtracted: ExtractedRgpms;
  pdfPath: string;
  source: string;
  fileName: string;
}
const BUCKET_NAME = 'tco-pdfs';
const extractTcoDisplayNumber = (fullTcoNumber: string | undefined | null): string => {
  if (!fullTcoNumber) return "-";
  let numberPart = "";
  const match = fullTcoNumber.match(/^TCO[-_]([^_-]+)/i);
  if (match && match[1]) numberPart = match[1];else if (fullTcoNumber.toUpperCase().startsWith("TCO-")) numberPart = fullTcoNumber.substring(4);else return fullTcoNumber;
  if (numberPart) {
    const num = parseInt(numberPart, 10);
    if (!isNaN(num)) return String(num).padStart(2, '0');
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
  return naturezaParts.join('_').replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') || "Não especificada";
};
const extractRGPMsFromFilename = (fileName: string | undefined | null): ExtractedRgpms => {
  const emptyResult: ExtractedRgpms = {
    main: [],
    support: []
  };
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
      if (rgpm.length === 6 && /^\d{6}$/.test(rgpm)) rgpmsList.push(rgpm);
    }
    return rgpmsList;
  };
  return {
    main: parseRgpmsFromString(mainRgpmsStr),
    support: parseRgpmsFromString(supportRgpmsStr)
  };
};
const TCOmeus: React.FC<TCOmeusProps> = ({
  user,
  toast,
  setSelectedTco,
  selectedTco
}) => {
  const [tcoList, setTcoList] = useState<TcoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Estados para o diálogo de PDF não são mais necessários se abrirmos externamente
  // const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  // const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  // const [pdfLoading, setPdfLoading] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [tcoToDelete, setTcoToDelete] = useState<TcoData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  const [gupmDetailsCache, setGupmDetailsCache] = useState<Record<string, StructuredGupm | null>>({});
  const [isGupmDetailModalOpen, setIsGupmDetailModalOpen] = useState(false);
  const [currentGupmToDisplay, setCurrentGupmToDisplay] = useState<StructuredGupm | null>(null);
  const fetchAndStructureGupmForTco = useCallback(async (rgpms: ExtractedRgpms): Promise<StructuredGupm | null> => {
    // ... (função sem alterações)
    if (rgpms.main.length === 0 && rgpms.support.length === 0) return null;
    const allRgpms = [...new Set([...rgpms.main, ...rgpms.support])];
    if (allRgpms.length === 0) return null;
    try {
      const {
        data: officersData,
        error
      } = await supabase.from('police_officers').select('rgpm, graduacao, nome').in('rgpm', allRgpms);
      if (error) {
        console.error("Error fetching officer details for GUPM:", error);
        const fallbackOfficer = (rgpm: string): OfficerInfo => ({
          rgpm,
          graduacao: "RGPM",
          nome: rgpm
        });
        return {
          conductor: rgpms.main.length > 0 ? fallbackOfficer(rgpms.main[0]) : undefined,
          mainTeam: rgpms.main.slice(1).map(fallbackOfficer),
          supportTeam: rgpms.support.map(fallbackOfficer)
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
        conductor = mainOfficersDetailed[0];
        mainTeamOther = mainOfficersDetailed.slice(1);
      }
      return {
        conductor,
        mainTeam: mainTeamOther,
        supportTeam: supportOfficersDetailed
      };
    } catch (e) {
      console.error("Exception fetching/structuring GUPM:", e);
      return null;
    }
  }, []);
  const fetchUserTcos = useCallback(async () => {
    // ... (lógica de fetchTcos, pequena modificação para gupmDetailsCache)
    if (!user.id) return;
    setIsLoading(true);
    try {
      const {
        data: storageFiles,
        error: storageError
      } = await supabase.storage.from(BUCKET_NAME).list(`tcos/${user.id}/`);
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
          rgpmsExtracted: rgpmsExtracted,
          pdfPath: `tcos/${user.id}/${fileName}`,
          source: 'storage',
          fileName: fileName
        } as TcoData;
      }) || [];
      filesFromStorage.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTcoList(filesFromStorage);

      // Preencher o cache de detalhes da GUPM
      const newGupmDetailsCache: Record<string, StructuredGupm | null> = {
        ...gupmDetailsCache
      }; // Preserve existing cache
      for (const tco of filesFromStorage) {
        if (!newGupmDetailsCache[tco.id] && tco.rgpmsExtracted) {
          // Fetch only if not already cached
          const gupmInfo = await fetchAndStructureGupmForTco(tco.rgpmsExtracted);
          newGupmDetailsCache[tco.id] = gupmInfo;
        } else if (!tco.rgpmsExtracted) {
          newGupmDetailsCache[tco.id] = null;
        }
      }
      setGupmDetailsCache(newGupmDetailsCache);
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
  }, [user.id, toast, fetchAndStructureGupmForTco, gupmDetailsCache]);
  const confirmDelete = (tco: TcoData) => {
    setTcoToDelete(tco);
    setDeletionMessage(null);
    setIsDeleteDialogOpen(true);
  };
  const handleDeleteTco = async () => {
    // ... (função sem alterações)
    if (!tcoToDelete) return;
    try {
      setIsDeleting(true);
      setDeletionMessage("Iniciando processo de exclusão...");
      const {
        success,
        error
      } = await deleteTCO({
        id: tcoToDelete.id,
        pdfPath: tcoToDelete.pdfPath
      });
      if (error || !success) {
        setDeletionMessage("Erro na exclusão. Tentando exclusão direta...");
        if (tcoToDelete.pdfPath) {
          await supabase.storage.from(BUCKET_NAME).remove([tcoToDelete.pdfPath]);
        }
        if (tcoToDelete.source === 'database') {
          await supabase.from('tco_pdfs').delete().eq('id', tcoToDelete.id);
        }
      }
      setTcoList(prevList => prevList.filter(item => item.id !== tcoToDelete.id));
      if (selectedTco?.id === tcoToDelete.id) setSelectedTco(null);
      toast({
        title: "TCO Excluído",
        description: "O TCO foi removido com sucesso."
      });
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
      setDeletionMessage(null);
    }
  };
  const handleViewPdf = async (tco: TcoData) => {
    // MODIFICADO: Abrir PDF em nova aba/externamente
    try {
      // Poderia adicionar um estado de loading específico para esta ação se desejado
      if (tco.pdfPath) {
        const {
          data,
          error
        } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(tco.pdfPath, 60 * 5); // URL válida por 5 minutos

        if (error || !data?.signedUrl) {
          throw new Error(error?.message || "URL assinada não encontrada para visualização.");
        }
        window.open(data.signedUrl, '_blank'); // Tenta abrir em nova aba/app externo
      } else {
        toast({
          variant: "destructive",
          title: "PDF não encontrado",
          description: "Este TCO não possui um PDF associado para visualização."
        });
      }
    } catch (error) {
      console.error("Erro ao obter URL para visualizar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Visualizar",
        description: `Falha ao preparar o PDF para visualização. Detalhe: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };
  const handleDownloadPdf = async (tco: TcoData) => {
    // ... (função sem alterações)
    try {
      if (tco.pdfPath) {
        const {
          data,
          error
        } = await supabase.storage.from(BUCKET_NAME).download(tco.pdfPath);
        if (error) throw error;
        if (data) {
          const blob = new Blob([data], {
            type: 'application/pdf'
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = tco.fileName || `TCO_${extractTcoDisplayNumber(tco.tcoNumber)}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        } else {
          throw new Error("Arquivo não encontrado para download.");
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
  const openGupmDetailsModal = (tcoId: string) => {
    const details = gupmDetailsCache[tcoId];
    if (details) {
      setCurrentGupmToDisplay(details);
      setIsGupmDetailModalOpen(true);
    } else if (gupmDetailsCache.hasOwnProperty(tcoId) && gupmDetailsCache[tcoId] === null) {
      // Explicitly null, meaning no GUPM
      setCurrentGupmToDisplay(null); // Show modal with "no info"
      setIsGupmDetailModalOpen(true);
    } else {
      toast({
        variant: "default",
        title: "GUPM",
        description: "Detalhes da guarnição não disponíveis ou ainda carregando."
      });
    }
  };
  useEffect(() => {
    if (user?.id) {
      fetchUserTcos();
    }
  }, [user?.id, fetchUserTcos]);
  return <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex-grow overflow-hidden flex flex-col">
      
      
      {isLoading && tcoList.length === 0 ? <div className="space-y-4 animate-pulse p-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-lg w-full"></div>)}
        </div> : tcoList.length === 0 && !isLoading ? <div className="flex flex-col items-center justify-center py-16 text-gray-500 flex-grow bg-gray-50 rounded-lg">
          <FileText className="h-16 w-16 text-gray-400 mb-6" strokeWidth={1} />
          <p className="text-xl font-semibold text-center mb-2">Nenhum TCO encontrado</p>
          <p className="text-center text-sm text-gray-400 max-w-xs">
            Os TCOs que você registrar através do sistema aparecerão listados aqui.
          </p>
        </div> : <div className="flex-grow overflow-hidden flex flex-col">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto flex-grow rounded-lg border border-gray-200">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-100 transition-colors">
                  <TableHead className="w-[100px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</TableHead>
                  <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</TableHead>
                  <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Natureza</TableHead>
                  <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONDUTOR E GUPM</TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tcoList.map(tco => {
              const gupmInfo = gupmDetailsCache[tco.id];
              const conductorDisplay = gupmInfo?.conductor ? `${gupmInfo.conductor.graduacao} ${gupmInfo.conductor.nome}` : gupmInfo === undefined && isLoading || gupmInfo === undefined && !gupmDetailsCache.hasOwnProperty(tco.id) ? "Carregando GUPM..." : "N/D";
              const hasAnyOfficerForModal = gupmInfo && (gupmInfo.conductor || gupmInfo.mainTeam.length > 0 || gupmInfo.supportTeam.length > 0);
              return <TableRow key={tco.id} aria-selected={selectedTco?.id === tco.id} className={`cursor-pointer transition-colors duration-150 ease-in-out hover:bg-slate-50 ${selectedTco?.id === tco.id ? "bg-primary/10 hover:bg-primary/20" : ""}`} onClick={() => setSelectedTco(tco)}>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-sm font-medium bg-blue-50 text-blue-700 border-blue-300">
                          {extractTcoDisplayNumber(tco.tcoNumber)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {tco.createdAt ? format(tco.createdAt, "dd/MM/yyyy - HH:mm") : "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={tco.natureza || "Não especificada"}>
                        {tco.natureza || "Não especificada"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-700">
                         <div className="flex items-center justify-start">
                           <span className="truncate max-w-[200px]" title={conductorDisplay}>
                             {conductorDisplay}
                           </span>
                           {hasAnyOfficerForModal && <Button variant="ghost" size="icon" onClick={e => {
                      e.stopPropagation();
                      openGupmDetailsModal(tco.id);
                    }} className="p-1 h-7 w-7 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full ml-2 flex-shrink-0" title="Ver guarnição completa">
                              <Users className="h-4 w-4" />
                              <span className="sr-only">Ver guarnição</span>
                            </Button>}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()} aria-label={`Ações para TCO ${tco.tcoNumber}`} className="h-8 w-8 rounded-full data-[state=open]:bg-slate-100">
                              <MoreHorizontal className="h-5 w-5 text-gray-500" />
                              <span className="sr-only">Abrir menu de ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1" onClick={e => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleViewPdf(tco)} className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-slate-100 rounded-md">
                              <Eye className="h-4 w-4 text-blue-500" /> Visualizar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(tco)} className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-slate-100 rounded-md">
                              <Download className="h-4 w-4 text-green-500" /> Baixar PDF
                            </DropdownMenuItem>
                            {/* DropdownMenuSeparator removido daqui */}
                            <DropdownMenuItem onClick={() => confirmDelete(tco)} className="flex items-center gap-2 p-2 text-sm cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md mt-1"> {/* Adicionado mt-1 para um leve espaçamento visual */}
                              <Trash2 className="h-4 w-4" /> Excluir TCO
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>;
            })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 flex-grow overflow-y-auto p-1">
            {tcoList.map(tco => {
          const gupmInfo = gupmDetailsCache[tco.id];
          const conductorDisplay = gupmInfo?.conductor ? `${gupmInfo.conductor.graduacao} ${gupmInfo.conductor.nome}` : gupmInfo === undefined && isLoading || gupmInfo === undefined && !gupmDetailsCache.hasOwnProperty(tco.id) ? "Carregando GUPM..." : "N/D";
          const hasAnyOfficerForModal = gupmInfo && (gupmInfo.conductor || gupmInfo.mainTeam.length > 0 || gupmInfo.supportTeam.length > 0);
          return <div key={`card-${tco.id}`} onClick={() => setSelectedTco(tco)} aria-selected={selectedTco?.id === tco.id} className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer transition-all duration-150 ease-in-out ${selectedTco?.id === tco.id ? "ring-2 ring-primary ring-offset-1" : "hover:shadow-md"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-base font-semibold bg-blue-50 text-blue-700 border-blue-300 px-2.5 py-1">
                      TCO {extractTcoDisplayNumber(tco.tcoNumber)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()} className="h-8 w-8 -mr-2 -mt-1 data-[state=open]:bg-slate-100">
                          <MoreHorizontal className="h-5 w-5 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1" onClick={e => e.stopPropagation()}>
                         <DropdownMenuItem onClick={() => handleViewPdf(tco)} className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-slate-100 rounded-md">
                              <Eye className="h-4 w-4 text-blue-500" /> Visualizar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(tco)} className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-slate-100 rounded-md">
                              <Download className="h-4 w-4 text-green-500" /> Baixar PDF
                            </DropdownMenuItem>
                            {/* DropdownMenuSeparator removido daqui */}
                            <DropdownMenuItem onClick={() => confirmDelete(tco)} className="flex items-center gap-2 p-2 text-sm cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md mt-1"> {/* Adicionado mt-1 */}
                              <Trash2 className="h-4 w-4" /> Excluir TCO
                            </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-1">
                    {tco.createdAt ? format(tco.createdAt, "dd/MM/yyyy 'às' HH:mm") : "-"}
                  </p>
                  <p className="text-sm font-medium text-gray-800 mb-2 truncate" title={tco.natureza || "Não especificada"}>
                    {tco.natureza || "Não especificada"}
                  </p>
                  
                  <div className="text-xs text-gray-600 flex items-center">
                    <span className="font-medium text-gray-500 mr-1">Condutor:</span> 
                    <span className="truncate" title={conductorDisplay}>{conductorDisplay}</span>
                    {hasAnyOfficerForModal && <Button variant="ghost" size="icon" onClick={e => {
                e.stopPropagation();
                openGupmDetailsModal(tco.id);
              }} className="p-1 h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full ml-1.5 flex-shrink-0" title="Ver guarnição completa">
                        <Users className="h-3.5 w-3.5" />
                        <span className="sr-only">Ver guarnição</span>
                      </Button>}
                  </div>
                </div>;
        })}
          </div>
          <div className="mt-4 text-gray-600 text-sm text-right pr-1">
            Total: <span className="font-semibold">{tcoList.length}</span> {tcoList.length === 1 ? 'TCO' : 'TCOs'}
          </div>
        </div>}

      {/* PDF Viewer Dialog não é mais usado para 'Visualizar PDF', pode ser removido se não houver outro uso */}
      {/* 
       <Dialog open={isPdfDialogOpen} onOpenChange={open => {
        // ...
       }}>
        <DialogContent>...</DialogContent>
       </Dialog>
       */}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 pt-2">
              Tem certeza que deseja excluir este TCO? Esta ação não pode ser desfeita e o arquivo será removido permanentemente.
              {deletionMessage && <div className="mt-3 p-3 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-200">{deletionMessage}</div>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4 flex-col sm:flex-row">
            <AlertDialogCancel disabled={isDeleting} className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTco} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto transition-colors">
              {isDeleting ? <div className="flex items-center gap-2 justify-center">
                  <RefreshCw className="animate-spin h-4 w-4" />
                  <span>Excluindo...</span>
                </div> : <div className="flex items-center gap-2 justify-center">
                  <Trash2 className="h-4 w-4" />
                  <span>Confirmar Exclusão</span>
                </div>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* GUPM Details Modal */}
      <Dialog open={isGupmDetailModalOpen} onOpenChange={setIsGupmDetailModalOpen}>
        <DialogContent className="max-w-lg rounded-lg">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-xl font-semibold text-gray-800">Detalhes da Guarnição</DialogTitle>
            <DialogDescription className="text-sm">Policiais envolvidos na ocorrência do TCO.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
            {currentGupmToDisplay?.conductor && <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <p className="font-semibold text-gray-700 text-base mb-0.5">Condutor:</p>
                <p className="text-gray-600">{`${currentGupmToDisplay.conductor.graduacao} ${currentGupmToDisplay.conductor.nome} (RGPM: ${currentGupmToDisplay.conductor.rgpm})`}</p>
              </div>}
            {currentGupmToDisplay && currentGupmToDisplay.mainTeam.length > 0 && <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <p className="font-semibold text-gray-700 text-base mb-1.5">Guarnição Principal:</p>
                <ul className="space-y-1.5 text-gray-600">
                  {currentGupmToDisplay.mainTeam.map((officer, index) => <li key={`main-${index}`}>{`${officer.graduacao} ${officer.nome} (RGPM: ${officer.rgpm})`}</li>)}
                </ul>
              </div>}
            {currentGupmToDisplay && currentGupmToDisplay.supportTeam.length > 0 && <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="font-semibold text-blue-700 text-base mb-1.5">Equipe de Apoio:</p>
                <ul className="space-y-1.5 text-blue-600">
                  {currentGupmToDisplay.supportTeam.map((officer, index) => <li key={`support-${index}`}>{`${officer.graduacao} ${officer.nome} (RGPM: ${officer.rgpm})`}</li>)}
                </ul>
              </div>}
            {!currentGupmToDisplay?.conductor && (!currentGupmToDisplay || currentGupmToDisplay.mainTeam.length === 0) && (!currentGupmToDisplay || currentGupmToDisplay.supportTeam.length === 0) && <div className="text-center py-6">
                    <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhuma informação de guarnição disponível para este TCO.</p>
                </div>}
          </div>
           <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsGupmDetailModalOpen(false)} className="w-full sm:w-auto">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default TCOmeus;