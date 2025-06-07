
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, X } from "lucide-react";
import { supabaseOperations } from "@/lib/supabaseOperations";
import { useToast } from "@/hooks/use-toast";
import { TimeSlot } from "@/types/timeSlot";

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeSlot: TimeSlot;
  onSuccess: () => void;
}

const AddVolunteerToSlotDialog = ({
  open,
  onOpenChange,
  timeSlot,
  onSuccess
}: AddVolunteerToSlotDialogProps) => {
  const [volunteerName, setVolunteerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddVolunteer = async () => {
    if (!volunteerName.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome do voluntário.",
        variant: "destructive"
      });
      return;
    }

    if (!timeSlot.id) {
      toast({
        title: "Erro",
        description: "ID do horário não encontrado.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se o voluntário já está na lista
    if (timeSlot.volunteers?.includes(volunteerName.trim())) {
      toast({
        title: "Erro",
        description: "Este voluntário já está adicionado a este horário.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se ainda há vagas disponíveis
    if (timeSlot.slotsUsed >= timeSlot.slots) {
      toast({
        title: "Erro",
        description: "Este horário já está lotado.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const updatedVolunteers = [...(timeSlot.volunteers || []), volunteerName.trim()];
      const updatedSlot = {
        ...timeSlot,
        volunteers: updatedVolunteers,
        slotsUsed: updatedVolunteers.length
      };

      const result = await supabaseOperations.update(updatedSlot, { id: timeSlot.id });
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Voluntário adicionado com sucesso!"
        });
        setVolunteerName("");
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Failed to add volunteer');
      }
    } catch (error) {
      console.error('Erro ao adicionar voluntário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o voluntário.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-500" />
            Adicionar Voluntário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Horário selecionado</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">
                {timeSlot.startTime} às {timeSlot.endTime}
              </p>
              <p className="text-sm text-gray-600">
                Vagas: {timeSlot.slotsUsed}/{timeSlot.slots}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="volunteerName">Nome do Voluntário</Label>
            <Input
              id="volunteerName"
              type="text"
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              placeholder="Ex: Sd PM João Silva"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddVolunteer();
                }
              }}
            />
          </div>

          {timeSlot.volunteers && timeSlot.volunteers.length > 0 && (
            <div className="space-y-2">
              <Label>Voluntários já adicionados:</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {timeSlot.volunteers.map((volunteer, index) => (
                  <div key={index} className="text-sm p-2 bg-blue-50 rounded flex items-center justify-between">
                    <span>{volunteer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddVolunteer}
            disabled={isLoading || timeSlot.slotsUsed >= timeSlot.slots}
            className="bg-green-500 hover:bg-green-600"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adicionando...
              </span>
            ) : (
              "Adicionar Voluntário"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
