import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Volunteer } from "@/types";
import { useEffect, useState } from "react";

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotId: string;
  slotDate: string;
  slotHours: string;
  onVolunteerAdded: () => void;
}

export function AddVolunteerToSlotDialog({ 
  open, 
  onOpenChange, 
  slotId, 
  slotDate, 
  slotHours, 
  onVolunteerAdded 
}: AddVolunteerToSlotDialogProps) {
  const { toast } = useToast();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const response = await fetch('/api/volunteers');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setVolunteers(data);
      } catch (error) {
        console.error("Could not fetch volunteers:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de voluntários.",
          variant: "destructive",
        });
      }
    };

    fetchVolunteers();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVolunteer) {
      toast({
        title: "Erro",
        description: "Selecione um voluntário",
        variant: "destructive",
      });
      return;
    }

    const dateField = document.getElementById('slot-date') as HTMLInputElement;
    if (!dateField || !dateField.value) {
      toast({
        title: "Erro", 
        description: "Data é obrigatória",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/addVolunteerToSlot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotId: slotId,
          volunteerId: selectedVolunteer,
          date: dateField.value,
          hours: slotHours,
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Voluntário adicionado ao slot com sucesso!",
        });
        onVolunteerAdded();
        onOpenChange(false);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao adicionar voluntário ao slot.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao adicionar voluntário ao slot:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar voluntário ao slot.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário ao Slot</DialogTitle>
          <DialogDescription>
            Selecione um voluntário para adicionar ao slot.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Data
              </Label>
              <Input type="date" id="slot-date" defaultValue={slotDate} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Voluntário
              </Label>
              <Select onValueChange={setSelectedVolunteer}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um voluntário" />
                </SelectTrigger>
                <SelectContent>
                  {volunteers.map((volunteer) => (
                    <SelectItem key={volunteer.id} value={volunteer.id}>
                      {volunteer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Adicionar ao Slot</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
