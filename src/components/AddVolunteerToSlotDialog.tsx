
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVolunteerAdded: () => void;
  slotId?: string;
  date?: string;
}

const AddVolunteerToSlotDialog = ({ open, onOpenChange, onVolunteerAdded, slotId, date }: AddVolunteerToSlotDialogProps) => {
  const [volunteerName, setVolunteerName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerName.trim() || !slotId || !date) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "volunteers"), {
        name: volunteerName.trim(),
        slotId,
        date,
        addedAt: new Date(),
        addedBy: JSON.parse(localStorage.getItem("user") || "{}")?.email || "unknown"
      });

      toast({
        title: "Voluntário adicionado",
        description: `${volunteerName} foi adicionado ao turno com sucesso.`,
      });

      setVolunteerName("");
      onVolunteerAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao adicionar voluntário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o voluntário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const dateField = document.getElementById(`${field}Date`) as HTMLInputElement;
    if (dateField) {
      dateField.value = value;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário ao Turno</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="volunteerName">Nome do Voluntário</Label>
            <Input
              id="volunteerName"
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              placeholder="Digite o nome do voluntário"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !volunteerName.trim()}>
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
