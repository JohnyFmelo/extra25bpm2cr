import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { TimeSlot } from "@/types/timeSlot";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeSlot: TimeSlot;
  onVolunteerAdded: () => void;
}

interface PoliceOfficer {
  rgpm: string;
  nome: string;
  graduacao: string;
  tipo_militar: string;
}

const AddVolunteerToSlotDialog: React.FC<AddVolunteerToSlotDialogProps> = ({
  open,
  onOpenChange,
  timeSlot,
  onVolunteerAdded
}) => {
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");
  const [manualName, setManualName] = useState<string>("");
  const [inputMode, setInputMode] = useState<"select" | "manual">("select");
  const [officers, setOfficers] = useState<PoliceOfficer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchOfficers();
    }
  }, [open]);

  const fetchOfficers = async () => {
    setIsLoadingOfficers(true);
    try {
      const { data, error } = await supabase
        .from('police_officers')
        .select('rgpm, nome, graduacao, tipo_militar')
        .order('nome');

      if (error) throw error;
      setOfficers(data || []);
    } catch (error) {
      console.error('Erro ao buscar oficiais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de oficiais.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingOfficers(false);
    }
  };

  const handleAddVolunteer = async () => {
    const volunteerName = inputMode === "select" 
      ? officers.find(o => o.rgpm === selectedOfficer)?.nome || ""
      : manualName.trim();

    if (!volunteerName) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um oficial ou digite um nome.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const dateField = document.querySelector('input[type="date"]') as HTMLInputElement;
      if (!dateField) {
        throw new Error('Campo de data não encontrado');
      }
      
      const formattedDate = format(timeSlot.date, 'yyyy-MM-dd');
      const startTime = `${timeSlot.startTime}:00`;
      const endTime = `${timeSlot.endTime}:00`;
      
      const { data: existingSlot, error: slotError } = await supabase
        .from('time_slots')
        .select('volunteers, slots_used')
        .eq('date', formattedDate)
        .eq('start_time', startTime)
        .eq('end_time', endTime)
        .single();

      if (slotError) throw slotError;

      const currentVolunteers = existingSlot?.volunteers || [];
      const currentSlotsUsed = existingSlot?.slots_used || 0;

      if (currentSlotsUsed >= timeSlot.slots) {
        toast({
          title: "Erro",
          description: "Não há vagas disponíveis neste horário.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('time_slots')
        .update({
          volunteers: [...(timeSlot.volunteers || []), volunteerName],
          slots_used: (timeSlot.slotsUsed || 0) + 1
        })
        .eq('date', formattedDate)
        .eq('start_time', startTime)
        .eq('end_time', endTime);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${volunteerName} foi adicionado ao horário.`
      });
      
      onVolunteerAdded();
      onOpenChange(false);
      setSelectedOfficer("");
      setManualName("");
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
          <DialogTitle>Adicionar Voluntário</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Horário: {timeSlot.startTime} - {timeSlot.endTime}
            </p>
            <p className="text-sm text-gray-600">
              Data: {format(timeSlot.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-sm text-gray-600">
              Vagas disponíveis: {(timeSlot.slots || 0) - (timeSlot.slotsUsed || 0)}
            </p>
          </div>

          <div>
            <Label>Método de Seleção</Label>
            <Select value={inputMode} onValueChange={(value: "select" | "manual") => setInputMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Selecionar da lista</SelectItem>
                <SelectItem value="manual">Digitar manualmente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {inputMode === "select" ? (
            <div>
              <Label htmlFor="officer-select">Oficial</Label>
              <Select value={selectedOfficer} onValueChange={setSelectedOfficer} disabled={isLoadingOfficers}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingOfficers ? "Carregando..." : "Selecione um oficial"} />
                </SelectTrigger>
                <SelectContent>
                  {officers.map((officer) => (
                    <SelectItem key={officer.rgpm} value={officer.rgpm}>
                      {officer.graduacao} {officer.nome} ({officer.rgpm})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="manual-name">Nome do Voluntário</Label>
              <Input
                id="manual-name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Digite o nome do voluntário"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddVolunteer} disabled={isLoading}>
              {isLoading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
