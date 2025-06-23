import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeSlot: {
    id?: string;
    date: string;
    start_time: string;
    end_time: string;
    total_slots: number;
    slots_used: number;
    volunteers?: string[];
  } | null;
  onVolunteerAdded: () => void;
}

const AddVolunteerToSlotDialog = ({ open, onOpenChange, timeSlot, onVolunteerAdded }: AddVolunteerToSlotDialogProps) => {
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerRank, setVolunteerRank] = useState("");
  const [volunteerDate, setVolunteerDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (timeSlot) {
      setVolunteerDate(timeSlot.date);
    }
  }, [timeSlot]);

  const handleAddVolunteer = async () => {
    const dateField = document.getElementById('volunteer-date') as HTMLInputElement;
    if (!dateField || !dateField.value) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data válida.",
        variant: "destructive"
      });
      return;
    }

    if (!volunteerName || !volunteerRank) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    if (!timeSlot) {
      toast({
        title: "Erro",
        description: "Nenhum horário selecionado.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newVolunteer = `${volunteerRank} ${volunteerName}`;
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used + 1,
        volunteers: [...(timeSlot.volunteers || []), newVolunteer]
      };

      const timeSlotRef = doc(db, "timeSlots", timeSlot.id || "");
      await updateDoc(timeSlotRef, updatedSlot);

      toast({
        title: "Sucesso",
        description: `${volunteerRank} ${volunteerName} adicionado(a) ao horário.`,
      });

      onVolunteerAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding volunteer:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o(a) voluntário(a).",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="volunteer-name" className="text-right">
              Nome
            </Label>
            <Input
              id="volunteer-name"
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="volunteer-rank" className="text-right">
              Patente
            </Label>
            <Input
              id="volunteer-rank"
              value={volunteerRank}
              onChange={(e) => setVolunteerRank(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="volunteer-date" className="text-right">
              Data
            </Label>
            <Input
              type="date"
              id="volunteer-date"
              value={volunteerDate}
              onChange={(e) => setVolunteerDate(e.target.value)}
              className="col-span-3"
              disabled
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleAddVolunteer}>Adicionar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
