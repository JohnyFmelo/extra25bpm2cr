
import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TimeSlot } from "@/types/timeSlot";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeSlot: TimeSlot;
  onVolunteerAdded: () => void;
}

const AddVolunteerToSlotDialog: React.FC<AddVolunteerToSlotDialogProps> = ({
  open,
  onOpenChange,
  timeSlot,
  onVolunteerAdded,
}) => {
  const [name, setName] = useState("");
  const [registration, setRegistration] = useState("");

  const handleSubmit = () => {
    if (name && registration) {
      // For now, we'll just add the volunteer to the timeSlot's volunteers array
      // In a real implementation, this would update the database
      console.log("Adding volunteer:", { name, registration, timeSlot });
      
      // Call the callback to refresh data
      onVolunteerAdded();
      
      // Close dialog and reset form
      onOpenChange(false);
      setName("");
      setRegistration("");
    } else {
      alert("Por favor, preencha todos os campos.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário ao Plantão</DialogTitle>
          <DialogDescription>
            Adicionar voluntário para {format(timeSlot.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} das {timeSlot.startTime} às {timeSlot.endTime}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Nome completo"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="registration" className="text-right">
              Matrícula
            </Label>
            <Input
              id="registration"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              className="col-span-3"
              placeholder="Número da matrícula"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Data/Horário</Label>
            <div className="col-span-3 text-sm text-gray-600 py-2">
              {format(timeSlot.date, "dd/MM/yyyy", { locale: ptBR })} - {timeSlot.startTime} às {timeSlot.endTime}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Vagas</Label>
            <div className="col-span-3 text-sm text-gray-600 py-2">
              {timeSlot.slotsUsed}/{timeSlot.slots} ocupadas
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Adicionar ao Plantão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
