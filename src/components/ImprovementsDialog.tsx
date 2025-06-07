
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";

interface ImprovementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
  improvements: string;
}

const ImprovementsDialog = ({ open, onOpenChange, version, improvements }: ImprovementsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-500" />
            Nova Versão {version}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Sistema Atualizado!
            </h3>
            <p className="text-gray-600 text-sm">
              Confira as melhorias implementadas:
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            {improvements ? (
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {improvements}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Melhorias gerais e correções de bugs.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Entendi, continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImprovementsDialog;
