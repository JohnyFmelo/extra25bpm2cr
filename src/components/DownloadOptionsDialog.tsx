
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateDOCX } from "./tco/docxGenerator";

interface DownloadOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tcoData: any;
  pdfBlob?: Blob;
  tcoNumber: string;
}

const DownloadOptionsDialog: React.FC<DownloadOptionsDialogProps> = ({
  isOpen,
  onClose,
  tcoData,
  pdfBlob,
  tcoNumber
}) => {
  const { toast } = useToast();
  const [isGeneratingDOCX, setIsGeneratingDOCX] = useState(false);

  const handlePdfDownload = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TCO_${tcoNumber.replace(/\//g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Iniciado",
        description: "O arquivo PDF está sendo baixado.",
        className: "bg-green-600 text-white border-green-700",
        duration: 3000
      });
    }
    onClose();
  };

  const handleDocxDownload = async () => {
    setIsGeneratingDOCX(true);
    try {
      const docxBlob = await generateDOCX(tcoData);
      const url = URL.createObjectURL(docxBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TCO_${tcoNumber.replace(/\//g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Iniciado",
        description: "O arquivo Word está sendo baixado.",
        className: "bg-green-600 text-white border-green-700",
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao gerar DOCX:', error);
      toast({
        title: "Erro ao Gerar Word",
        description: "Não foi possível gerar o arquivo Word.",
        className: "bg-red-600 text-white border-red-700",
        duration: 5000
      });
    } finally {
      setIsGeneratingDOCX(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Escolha o Formato de Download
          </AlertDialogTitle>
          <AlertDialogDescription>
            TCO salvo com sucesso! Escolha o formato para download:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="grid gap-3 py-4">
          <Button
            onClick={handlePdfDownload}
            className="flex items-center justify-start gap-3 h-auto p-4 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            variant="outline"
          >
            <FileText className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">Baixar PDF</div>
              <div className="text-xs opacity-75">Formato final, ideal para impressão</div>
            </div>
          </Button>
          
          <Button
            onClick={handleDocxDownload}
            disabled={isGeneratingDOCX}
            className="flex items-center justify-start gap-3 h-auto p-4 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            variant="outline"
          >
            <FileText className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">
                {isGeneratingDOCX ? "Gerando Word..." : "Baixar Word"}
              </div>
              <div className="text-xs opacity-75">Formato nativo Word, totalmente editável</div>
            </div>
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            Fechar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DownloadOptionsDialog;
