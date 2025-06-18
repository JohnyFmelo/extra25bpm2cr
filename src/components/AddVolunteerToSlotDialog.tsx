import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface AddVolunteerToSlotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVolunteer: (volunteerName: string, date: Date, slotId: string) => void;
  selectedSlot: {
    id: string;
    startTime: string;
    endTime: string;
    dayOfWeek: string;
  } | null;
  existingVolunteers?: string[];
}

const AddVolunteerToSlotDialog: React.FC<AddVolunteerToSlotDialogProps> = ({
  isOpen,
  onClose,
  onAddVolunteer,
  selectedSlot,
  existingVolunteers = []
}) => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const volunteerName = formData.get('volunteerName') as string;
    const dateField = document.querySelector('input[name="date"]') as HTMLInputElement;
    
    if (!volunteerName.trim()) {
      toast.error("Nome do voluntário é obrigatório");
      return;
    }
    
    if (!dateField || !dateField.value) {
      toast.error("Data é obrigatória");
      return;
    }

    const selectedDate = date || new Date();

    if (existingVolunteers && existingVolunteers.includes(volunteerName)) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Este voluntário já está alocado neste horário.",
      })
      return;
    }

    onAddVolunteer(volunteerName, selectedDate, selectedSlot.id);
    onClose();
    toast({
      title: "Sucesso!",
      description: "Voluntário adicionado com sucesso.",
    })
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário</DialogTitle>
          <DialogDescription>
            Adicione um voluntário ao horário selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="volunteerName" className="text-right">
              Nome do Voluntário
            </Label>
            <Input type="text" id="volunteerName" name="volunteerName" placeholder="Nome completo" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "PPP") : (
                    <span>Escolha uma data</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date < new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Input type="hidden" id="date" name="date" value={date ? date.toISOString() : ''} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
