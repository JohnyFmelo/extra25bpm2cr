import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { deleteTCO } from '@/lib/supabaseStorage';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Trash2,
  Download,
  Eye,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Constants
const BUCKET_NAME = 'tco-pdfs';

// Interfaces
interface TCO {
  id: string;
  tcoNumber: string;
  createdAt: Date | string;
  natureza: string;
  rgpmsList: string[];
  pdfPath: string;
  source: string;
  fileName: string;
}

interface TCOmeusProps {
  user: {
    id: string;
    registration?: string;
  };
  toast: ReturnType<typeof useToast>['toast'];
  setSelectedTco: (tco: TCO | null) => void;
  selectedTco: TCO | null;
}

// Utility Functions
const extractTcoDisplayNumber = (fullTcoNumber: string | undefined | null): string => {
  if (!fullTcoNumber) return '-';

  const match = fullTcoNumber.match(/^TCO[-_]([^_-]+)/i);
  let numberPart = match ? match[1] : fullTcoNumber.substring(4);
  
  if (!fullTcoNumber.toUpperCase().startsWith('TCO-')) {
    numberPart = fullTcoNumber;
  }

  const num = parseInt(numberPart, 10);
  return !isNaN(num) ? String(num).padStart(2, '0') : numberPart;
};

const extractTcoNatureFromFilename = (fileName: string | undefined | null): string => {
  if (!fileName) return 'Não especificada';

  const parts = fileName.split('_');
  if (parts.length < 4) return 'Não especificada';

  const lastPart = parts[parts.length - 1].replace(/\.pdf$/i, '');
  const naturezaParts = parts.length >= 5 && /^\d/.test(lastPart)
    ? parts.slice(3, parts.length - 1)
    : [...parts.slice(3, parts.length - 1), lastPart];

  return naturezaParts.length === 0
    ? 'Não especificada'
    : naturezaParts
        .join('_')
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const extractRGPMsFromFilename = (fileName: string | undefined | null): string[] => {
  if (!fileName) return [];

  const parts = fileName.split('_');
  if (parts.length < 5) return [];

  const rgpmSegment = parts[parts.length - 1].replace(/\.pdf$/i, '');
  if (!rgpmSegment.match(/^\d/)) return [];

  const [mainRgpmsStr, supportRgpmsStr] = rgpmSegment.split('.');

  const parseRgpms = (rgpmStr: string | undefined): string[] => {
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

  return [...parseRgpms(mainRgpmsStr), ...parseRgpms(supportRgpmsStr)];
};

const formatRGPMsDisplay = async (rgpms: string[]): Promise<string> => {
  if (rgpms.length === 0) return 'Não disponível';

  try {
    const officerPromises = rgpms.map(async (rgpm) => {
      const { data, error } = await supabase
        .from('police_officers')
        .select('graduacao, nome')
        .eq('rgpm', rgpm)
        .single();

      return error || !data ? `RGPM ${rgpm}` : `${data.graduacao} ${data.nome}`;
    });

    const officerDetails = await Promise.all(officerPromises);
    return officerDetails.length === 1 ? officerDetails[0] : officerDetails.join(' | ');
  } catch (error) {
    console.error('Erro ao buscar policiais:', error);
    return rgpms.map(rgpm => `RGPM ${rgpm}`).join(' | ');
  }
};

const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Main Component
const TCOmeus: React.FC<TCOmeusProps> = ({ user, toast, setSelectedTco, selectedTco }) => {
  // State
  const [tcoList, setTcoList] = useState<TCO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tcoToDelete, setTcoToDelete] = useState<TCO | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  const [policiaisInfo, setPoliciaisInfo] = useState<Record<string, string>>({});

  // Handlers
  const fetchUserTcos = async () => {
    if (!user.id) return;
    setIsLoading(true);

    try {
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(`tcos/${user.id}/`);

      if (storageError) throw new Error('Erro ao listar arquivos do storage');

      const filesFromStorage = (storageFiles || []).map(file => {
        const fileName = file.name;
        const tcoMatch = fileName.match(/TCO[-_]([^_-]+)/i);
        const tcoIdentifierPart = tcoMatch ? tcoMatch[1] : fileName.replace(/\.pdf$/i, '');
        const finalTcoNumber = tcoIdentifierPart.toUpperCase().startsWith('TCO-')
          ? tcoIdentifierPart
          : `TCO-${tcoIdentifierPart}`;

        return {
          id: file.id || fileName,
          tcoNumber: finalTcoNumber,
          createdAt: new Date(file.created_at || Date.now()),
          natureza: extractTcoNatureFromFilename(fileName),
          rgpmsList: extractRGPMsFromFilename(fileName),
          pdfPath: `tcos/${user.id}/${fileName}`,
          source: 'storage',
          fileName,
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setTcoList(filesFromStorage);

      const policiaisMap: Record<string, string> = {};
      for (const tco of filesFromStorage) {
        if (tco.rgpmsList?.length) {
          policiaisMap[tco.id] = await formatRGPMsDisplay(tco.rgpmsList);
        }
      }
      setPoliciaisInfo(policiaisMap);
    } catch (error) {
      console.error('Erro ao buscar TCOs:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar os TCOs.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPdf = async (tco: TCO) => {
    try {
      setPdfLoading(true);
      if (!tco.pdfPath) throw new Error('PDF não encontrado');

      const { data } = await supabase.storage.from(BUCKET_NAME).getPublicUrl(tco.pdfPath);
      if (!data?.publicUrl) throw new Error('URL não encontrada');

      setSelectedPdfUrl(data.publicUrl);
      setIsPdfDialogOpen(true);
    } catch (error) {
      console.error('Erro ao buscar PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar o PDF do TCO.',
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPdf = async (tco: TCO) => {
    try {
      if (!tco.pdfPath) throw new Error('PDF não encontrado');

      const { data } = await supabase.storage.from(BUCKET_NAME).getPublicUrl(tco.pdfPath);
      if (!data?.publicUrl) throw new Error('URL não encontrada');

      window.open(data.publicUrl, '_blank');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao baixar o PDF do TCO.',
      });
    }
  };

  const confirmDelete = (tco: TCO) => {
    setTcoToDelete(tco);
    setDeletionMessage(null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTco = async () => {
    if (!tcoToDelete) return;

    try {
      setIsDeleting(true);
      setDeletionMessage('Iniciando processo de exclusão...');

      const { success, error } = await deleteTCO({
        id: tcoToDelete.id,
        pdfPath: tcoToDelete.pdfPath,
      });

      if (!success || error) {
        setDeletionMessage('Erro na exclusão, tentando novamente...');
        await supabase.storage.from(BUCKET_NAME).remove([tcoToDelete.pdfPath]);
        await supabase.from('tco_pdfs').delete().eq('id', tcoToDelete.id);
      }

      setTcoList(prev => prev.filter(item => item.id !== tcoToDelete.id));
      if (selectedTco?.id === tcoToDelete.id) setSelectedTco(null);

      toast({
        title: 'TCO Excluído',
        description: 'O TCO foi removido com sucesso.',
      });
    } catch (error) {
      console.error('Erro no processo de exclusão do TCO:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir o TCO. Tente novamente.',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setTcoToDelete(null);
      setDeletionMessage(null);
    }
  };

  // Effects
  useEffect(() => {
    if (user?.id) fetchUserTcos();
  }, [user?.id]);

  // Render
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Meus TCOs</h2>
        <Button
          onClick={fetchUserTcos}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-2 transition-all hover:bg-slate-100"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Carregando...' : 'Atualizar'}</span>
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : tcoList.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow py-12 text-gray-500">
          <svg
            className="h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-center font-medium mb-2">Nenhum TCO encontrado</p>
          <p className="text-center text-sm text-gray-400">Os TCOs que você criar aparecerão aqui</p>
        </div>
      ) : (
        <div className="flex flex-col flex-grow overflow-hidden">
          {/* Table */}
          <div className="flex-grow overflow-x-auto rounded-lg border border-gray-200">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] px-4 py-3 bg-gray-50 text-gray-700 font-semibold">Número</TableHead>
                  <TableHead className="px-4 py-3 bg-gray-50 text-gray-700 font-semibold">Data</TableHead>
                  <TableHead className="px-4 py-3 bg-gray-50 text-gray-700 font-semibold">Natureza</TableHead>
                  <TableHead className="px-4 py-3 bg-gray-50 text-gray-700 font-semibold">GUPM</TableHead>
                  <TableHead className="px-4 py-3 bg-gray-50 text-gray-700 font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tcoList.map(tco => (
                  <TableRow
                    key={tco.id}
                    onClick={() => setSelectedTco(tco)}
                    className={`transition-colors hover:bg-gray-50 ${
                      selectedTco?.id === tco.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 px-2.5 py-0.5"
                      >
                        {extractTcoDisplayNumber(tco.tcoNumber)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {tco.createdAt
                        ? format(
                            tco.createdAt instanceof Date ? tco.createdAt : new Date(tco.createdAt),
                            'dd/MM/yyyy - HH:mm'
                          )
                        : '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3">{tco.natureza || 'Não especificada'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-600">
                        {policiaisInfo[tco.id] || 'Carregando...'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => e.stopPropagation()}
                            className="h-8 w-8 rounded-full hover:bg-gray-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu de ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1">
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              handleViewPdf(tco);
                            }}
                            className="flex items-center p-2 text-sm hover:bg-gray-50 rounded-md"
                          >
                            <Eye className="mr-2 h-4 w-4 text-blue-600" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              handleDownloadPdf(tco);
                            }}
                            className="flex items-center p-2 text-sm hover:bg-gray-50 rounded-md"
                          >
                            <Download className="mr-2 h-4 w-4 text-green-600" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              confirmDelete(tco);
                            }}
                            className="flex items-center p-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-gray-500 text-sm text-right">
            Total: {tcoList.length} {tcoList.length === 1 ? 'TCO' : 'TCOs'}
          </div>
        </div>
      )}

      {/* PDF Dialog */}
      <Dialog
        open={isPdfDialogOpen}
        onOpenChange={open => {
          setIsPdfDialogOpen(open);
          if (!open) {
            setSelectedPdfUrl(null);
            setPdfLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="p-4 bg-white border-b border-gray-200">
            <DialogTitle className="text-lg font-medium text-gray-700">Visualizador de PDF</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPdfDialogOpen(false)}
              className="absolute right-4 top-3 text-gray-500 hover:text-gray-700"
            >
              Fechar
            </Button>
          </DialogHeader>
          <div className="relative h-[calc(100%-56px)] bg-gray-100">
            {pdfLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-gray-600 text-sm">Carregando PDF...</p>
              </div>
            )}
            {selectedPdfUrl ? (
              <iframe
                src={selectedPdfUrl}
                className={`w-full h-full ${pdfLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                title="PDF Viewer"
                style={{ border: 'none' }}
                onLoad={() => setPdfLoading(false)}
                onError={() => {
                  setPdfLoading(false);
                  toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar o PDF.' });
                  setSelectedPdfUrl(null);
                }}
              />
            ) : (
              !pdfLoading && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Selecione um TCO para visualizar o PDF.</p>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tem certeza que deseja excluir este TCO? Esta ação não pode ser desfeita.
              {deletionMessage && (
                <div className="mt-3 p-3 bg-blue-50 text-blue-700 rounded-md">
                  {deletionMessage}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel
              disabled={isDeleting}
              className="w-full sm:w-auto hover:bg-gray-100"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTco}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-red-500 hover:bg-red-600 transition-colors"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Excluindo...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir
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
