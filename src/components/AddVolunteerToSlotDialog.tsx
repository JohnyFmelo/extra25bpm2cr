import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarIcon, Users, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TimeSlot, Volunteer, MilitaryType, MILITARY_TYPES } from "@/types/timeSlot";
import { useToast } from "@/hooks/use-toast";

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeSlot: TimeSlot | null;
  onAddVolunteer: (volunteer: Volunteer) => void;
  existingVolunteers?: Volunteer[];
}

const AddVolunteerToSlotDialog = ({
  open,
  onOpenChange,
  timeSlot,
  onAddVolunteer,
  existingVolunteers = []
}: AddVolunteerToSlotDialogProps) => {
  const [name, setName] = useState("");
  const [warName, setWarName] = useState("");
  const [militaryType, setMilitaryType] = useState<MilitaryType>("Cb/Sd");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [extraHours, setExtraHours] = useState("");
  const [observations, setObservations] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (timeSlot) {
      setSelectedDate(timeSlot.date);
    }
  }, [timeSlot]);

  const resetForm = () => {
    setName("");
    setWarName("");
    setMilitaryType("Cb/Sd");
    setSelectedDate(undefined);
    setExtraHours("");
    setObservations("");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !warName.trim() || !selectedDate || !extraHours.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const hours = parseFloat(extraHours);
    if (isNaN(hours) || hours <= 0) {
      toast({
        title: "Erro", 
        description: "Por favor, insira um número válido de horas.",
        variant: "destructive"
      });
      return;
    }

    if (timeSlot && !timeSlot.allowedMilitaryTypes.includes(militaryType)) {
      toast({
        title: "Erro",
        description: `O tipo militar ${militaryType} não é permitido para este horário.`,
        variant: "destructive"
      });
      return;
    }

    const duplicateVolunteer = existingVolunteers.find(v => 
      v.name.toLowerCase() === name.trim().toLowerCase() && 
      v.warName.toLowerCase() === warName.trim().toLowerCase()
    );

    if (duplicateVolunteer) {
      toast({
        title: "Erro",
        description: "Este militar já está cadastrado neste horário.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const newVolunteer: Volunteer = {
        id: Date.now().toString(),
        name: name.trim(),
        warName: warName.trim(),
        militaryType,
        date: selectedDate,
        extraHours: hours,
        observations: observations.trim()
      };

      onAddVolunteer(newVolunteer);
      resetForm();
      onOpenChange(false);

      toast({
        title: "Sucesso",
        description: "Militar adicionado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao adicionar militar:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar militar. Tente novamente.",
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
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 -mx-6 -mt-6 p-6 mb-4 rounded-t-lg text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5" />
              <DialogTitle className="font-bold text-lg">
                Adicionar Militar
              </DialogTitle>
            </div>
            {timeSlot && (
              <p className="text-center text-white/80 text-sm">
                {format(timeSlot.date, "EEEE, dd 'de' MMMM", { locale: ptBR })} • {timeSlot.startTime} - {timeSlot.endTime}
              </p>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warName">Nome de Guerra *</Label>
              <Input
                id="warName" 
                value={warName}
                onChange={(e) => setWarName(e.target.value)}
                placeholder="Ex: Silva"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo Militar *</Label>
            <Select value={militaryType} onValueChange={(value: MilitaryType) => setMilitaryType(value)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MILITARY_TYPES.map((type) => (
                  <SelectItem 
                    key={type} 
                    value={type}
                    disabled={timeSlot && !timeSlot.allowedMilitaryTypes.includes(type)}
                  >
                    {type}
                    {timeSlot && !timeSlot.allowedMilitaryTypes.includes(type) && " (Não permitido)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              Data do Extra *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2" htmlFor="extraHours">
              <Clock className="h-4 w-4 text-blue-500" />
              Horas Extras *
            </Label>
            <Input
              id="extraHours"
              type="number"
              step="0.5"
              min="0"
              value={extraHours}
              onChange={(e) => {
                const dateField = document.getElementById('extraHours');
                if (dateField) {
                  setExtraHours(e.target.value);
                }
              }}
              placeholder="Ex: 6"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2" htmlFor="observations">
              <FileText className="h-4 w-4 text-blue-500" />
              Observações
            </Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações adicionais (opcional)"
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adicionando...
              </span>
            ) : (
              "Adicionar Militar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
