
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
      <DialogContent className="max-w-sm rounded-2xl bg-white p-6 shadow-xl border-0">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icons Section */}
          <div className="flex items-center gap-4">
            <div className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm">
              PDF
            </div>
            <div className="text-gray-400 text-xl">→</div>
            <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-sm">
              DOC
            </div>
          </div>

          {/* Title */}
          <div>
            <DialogTitle className="text-xl font-semibold text-gray-800 mb-2">
              Converter para Word?
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm leading-relaxed">
              Deseja usar o IlovePDF para converter seu arquivo baixado em Word?
            </DialogDescription>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Não, Obrigado
            </Button>
            <Button 
              onClick={onConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              Sim, Converter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfToWordConversionDialog;
