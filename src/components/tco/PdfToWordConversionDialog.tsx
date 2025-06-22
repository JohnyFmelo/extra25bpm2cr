
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, FileEdit } from "lucide-react";

interface PdfToWordConversionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PdfToWordConversionDialog: React.FC<PdfToWordConversionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-lg">
        <DialogHeader className="pb-3">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-red-600" />
                <span className="text-xs font-bold text-red-600 absolute -mt-1 ml-6">PDF</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileEdit className="h-6 w-6 text-blue-600" />
                <span className="text-xs font-bold text-blue-600 absolute -mt-1 ml-6">DOC</span>
              </div>
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center">Converter para Word?</DialogTitle>
          <DialogDescription className="text-center text-gray-600 pt-2">
            Deseja usar o iLovePDF para converter seu arquivo baixado em Word?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-4 flex-col sm:flex-row">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Não, Obrigado
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
          >
            Sim, Converter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PdfToWordConversionDialog;
