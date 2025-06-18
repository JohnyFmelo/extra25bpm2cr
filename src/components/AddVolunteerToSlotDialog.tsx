
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { dataOperations } from "@/lib/firebase";
import { TimeSlot, MilitaryType, MILITARY_TYPES } from "@/types/timeSlot";

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeSlot: TimeSlot;
}

const AddVolunteerToSlotDialog = ({ open, onOpenChange, timeSlot }: AddVolunteerToSlotDialogProps) => {
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerRank, setVolunteerRank] = useState("");
  const [militaryType, setMilitaryType] = useState<MilitaryType>("Operacional");
  const [extraHours, setExtraHours] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerName.trim() || !volunteerRank.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e o posto do voluntário."
      });
      return;
    }

    setIsLoading(true);
    try {
      const fullName = `${volunteerRank} ${volunteerName}`.trim();
      
      const updatedSlot = {
        date: timeSlot.date instanceof Date ? timeSlot.date.toISOString().split('T')[0] : timeSlot.date,
        start_time: timeSlot.startTime,
        end_time: timeSlot.endTime,
        total_slots: timeSlot.slots,
        slots_used: timeSlot.slotsUsed + 1,
        volunteers: [...(timeSlot.volunteers || []), fullName],
        description: timeSlot.description || "",
        allowedMilitaryTypes: timeSlot.allowedMilitaryTypes || []
      };

      const result = await dataOperations.update(updatedSlot, {
        date: timeSlot.date instanceof Date ? timeSlot.date.toISOString().split('T')[0] : timeSlot.date,
        start_time: timeSlot.startTime,
        end_time: timeSlot.endTime
      });

      if (result.success) {
        toast({
          title: "Voluntário adicionado",
          description: `${fullName} foi adicionado ao horário com sucesso.`
        });
        
        setVolunteerName("");
        setVolunteerRank("");
        setMilitaryType("Operacional");
        setExtraHours("");
        onOpenChange(false);
      } else {
        throw new Error("Falha ao adicionar voluntário");
      }
    } catch (error) {
      console.error("Erro ao adicionar voluntário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o voluntário ao horário."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtraHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
      setExtraHours(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rank">Posto/Graduação</Label>
            <Input
              id="rank"
              value={volunteerRank}
              onChange={(e) => setVolunteerRank(e.target.value)}
              placeholder="Ex: 1° Sgt"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome de Guerra</Label>
            <Input
              id="name"
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              placeholder="Nome do voluntário"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="military-type">Tipo Militar</Label>
            <Select value={militaryType} onValueChange={(value: MilitaryType) => setMilitaryType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MILITARY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extra-hours">Horas Extras (opcional)</Label>
            <Input
              id="extra-hours"
              type="number"
              min="0"
              step="0.5"
              value={extraHours}
              onChange={handleExtraHoursChange}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
