
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DateAnnotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  onSave: (annotation: string) => void;
  currentAnnotation?: string;
}

export const DateAnnotationDialog = ({
  open,
  onOpenChange,
  date,
  onSave,
  currentAnnotation = ""
}: DateAnnotationDialogProps) => {
  const [annotation, setAnnotation] = React.useState(currentAnnotation);

  React.useEffect(() => {
    if (open) {
      setAnnotation(currentAnnotation);
    }
  }, [open, currentAnnotation]);

  const handleSave = () => {
    onSave(annotation);
    onOpenChange(false);
  };

  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar anotação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={annotation}
            onChange={(e) => setAnnotation(e.target.value)}
            placeholder="Digite sua anotação aqui..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
