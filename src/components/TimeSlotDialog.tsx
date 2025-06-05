import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Checkbox } from "./ui/checkbox";
import { Clock, Calendar, Users, RefreshCw, FileText, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeSlot as AppTimeSlotType } from "@/types/timeSlot"; // Assumindo que esta é a interface camelCase
import { Label } from "./ui/label";

// Interface para o prop editingTimeSlot que vem do TimeSlotsList.tsx
// Pode ter campos snake_case como start_time, end_time, total_slots
interface EditingTimeSlotProps {
  id?: string;
  date: string; // Ou Date, dependendo de como é passado
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  description?: string;
  allowedMilitaryTypes?: string[]; // Já deve vir como camelCase de TimeSlotsList
  volunteers?: string[]; // Adicionado para completude, se necessário
  isWeekly?: boolean; // Se relevante
}


interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onAddTimeSlot: (timeSlot: AppTimeSlotType) => void; // Espera o tipo AppTimeSlotType (camelCase)
  onEditTimeSlot: (timeSlot: AppTimeSlotType) => void; // Espera o tipo AppTimeSlotType (camelCase)
  editingTimeSlot: EditingTimeSlotProps | null; // Prop de entrada, pode ter snake_case
  isLoading?: boolean;
}

const TimeSlotDialog = ({
  open,
  onOpenChange,
  selectedDate,
  onAddTimeSlot,
  onEditTimeSlot,
  editingTimeSlot, // Este é do tipo EditingTimeSlotProps
  isLoading = false,
}: TimeSlotDialogProps) => {
  const [startTime, setStartTime] = useState("07:00"); // Estado interno usa camelCase
  const [hours, setHours] = useState("6");
  const [selectedSlots, setSelectedSlots] = useState<number>(2); // Estado interno
  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlots, setCustomSlots] = useState("");
  const [useWeeklyLogic, setUseWeeklyLogic] = useState(false);
  const [description, setDescription] = useState("");
  const [allowedMilitaryTypes, setAllowedMilitaryTypes] = useState<string[]>(["Operacional", "Administrativo", "Inteligencia"]); // Estado interno

  const slotOptions = [2, 3, 4, 5];
  const militaryTypes = [
    { id: "Operacional", label: "Operacional" },
    { id: "Administrativo", label: "Administrativo" },
    { id: "Inteligencia", label: "Inteligência" }
  ];

  const calculateEndTime = (start: string, duration: string): string => {
    if (!start || !duration || isNaN(parseFloat(duration))) return "00:00"; // Validação
    const [startHour, startMinute] = start.split(':').map(Number);
    const durationHours = parseFloat(duration);
    
    const totalMinutes = startHour * 60 + startMinute + (durationHours * 60);
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) return "0"; // Validação
    const [startHour, startMinute] = start.split(':').map(Number);
    let [endHour, endMinute] = end.split(':').map(Number);
    
    if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
      endHour += 24;
    }
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    
    if (durationMinutes < 0) return "0"; // Caso de erro
    const durationHours = durationMinutes / 60;
    
    return durationHours.toString();
  };

  useEffect(() => {
    if (editingTimeSlot) {
      // Mapeia de editingTimeSlot (que pode ter snake_case para tempo/slots) para o estado interno (camelCase)
      setStartTime(editingTimeSlot.start_time || "07:00");
      const duration = calculateDuration(editingTimeSlot.start_time, editingTimeSlot.end_time);
      setHours(duration !== "0" ? duration : "6");
      setSelectedSlots(editingTimeSlot.total_slots || 2);
      setDescription(editingTimeSlot.description || "");
      // CORREÇÃO: Usa allowedMilitaryTypes de editingTimeSlot, que já deve vir camelCase de TimeSlotsList.
      // Se for undefined ou nulo, usa um array vazio para não resetar para os três.
      setAllowedMilitaryTypes(editingTimeSlot.allowedMilitaryTypes || []); 
      
      if (!slotOptions.includes(editingTimeSlot.total_slots || 0)) {
        setShowCustomSlots(true);
        setCustomSlots((editingTimeSlot.total_slots || 0).toString());
      } else {
        setShowCustomSlots(false);
        setCustomSlots(""); // Limpar custom slots se não estiver usando
      }
      setUseWeeklyLogic(editingTimeSlot.isWeekly || false);
    } else {
      // Reset para criação de novo horário
      setStartTime("07:00");
      setHours("6");
      setSelectedSlots(2);
      setShowCustomSlots(false);
      setCustomSlots("");
      setDescription("");
      // CORREÇÃO: Para novo slot, pode começar com todos ou vazio. Se vazio, a validação abaixo pegará.
      // Mantendo o default de todos selecionados para novos slots, como no original.
      setAllowedMilitaryTypes(["Operacional", "Administrativo", "Inteligencia"]); 
      setUseWeeklyLogic(false);
    }
  }, [editingTimeSlot, open]);

  const handleMilitaryTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setAllowedMilitaryTypes(prev => [...prev, typeId]);
    } else {
      setAllowedMilitaryTypes(prev => prev.filter(type => type !== typeId));
    }
  };

  const handleRegister = () => {
    const slotsCount = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    if (isNaN(slotsCount) || slotsCount <=0) {
        // Adicionar toast ou tratamento de erro para slots inválidos
        return;
    }
    const finalEndTime = calculateEndTime(startTime, hours);
    
    // Cria o objeto usando AppTimeSlotType (camelCase) para enviar via onAddTimeSlot/onEditTimeSlot
    const newTimeSlotData: AppTimeSlotType = {
      id: editingTimeSlot?.id, // Inclui ID se estiver editando
      date: selectedDate, // selectedDate já é Date
      startTime: startTime,
      endTime: finalEndTime,
      slots: slotsCount,
      slotsUsed: editingTimeSlot ? editingTimeSlot.slots_used : 0,
      isWeekly: useWeeklyLogic,
      description: description.trim(),
      allowedMilitaryTypes: allowedMilitaryTypes // Já está no estado (camelCase)
    };
    
    if (editingTimeSlot) {
      onEditTimeSlot(newTimeSlotData);
    } else {
      onAddTimeSlot(newTimeSlotData);
    }
    onOpenChange(false);
  };

  const isButtonDisabled = () => {
    if (showCustomSlots) {
      const numSlots = parseInt(customSlots);
      if (isNaN(numSlots) || numSlots <= 0) return true;
    }
    const hoursValue = parseFloat(hours);
    if (isNaN(hoursValue) || hoursValue <= 0) return true;

    // CORREÇÃO: Botão desabilitado se nenhum tipo militar for selecionado
    if (allowedMilitaryTypes.length === 0) return true; 
    
    return isLoading;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-gradient-to-r from-green-500 to-green-600 -mx-6 -mt-6 p-6 mb-4 rounded-t-lg text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5" />
              <DialogTitle className="font-bold text-lg">
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </DialogTitle>
            </div>
            <p className="text-center text-white/80 text-sm">
              {editingTimeSlot ? "Editar horário de atendimento" : "Novo horário de Jornada Extraordinária"}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Horário de início e duração */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="h-4 w-4 text-green-500" />
              Horário
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Início</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-center"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Duração (horas)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="text-center"
                  placeholder="6"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Fim: {calculateEndTime(startTime, hours)}
            </div>
          </div>

          {/* Número de vagas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4 text-green-500" />
              Número de vagas
            </Label>
            <div className="flex flex-wrap gap-2">
              {slotOptions.map((slotsVal) => ( // Renomeado para evitar conflito com `slots` da interface
                <Button
                  key={slotsVal}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 min-w-10 h-10 border-gray-200",
                    selectedSlots === slotsVal && !showCustomSlots && "bg-green-500 text-white hover:bg-green-600 border-green-500"
                  )}
                  onClick={() => {
                    setSelectedSlots(slotsVal);
                    setShowCustomSlots(false);
                  }}
                  disabled={isLoading}
                >
                  {slotsVal}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 min-w-10 h-10 border-gray-200",
                  showCustomSlots && "bg-green-500 text-white hover:bg-green-600 border-green-500"
                )}
                onClick={() => setShowCustomSlots(true)}
                disabled={isLoading}
              >
                Outro
              </Button>
            </div>

            {showCustomSlots && (
              <div className="pt-2">
                <Input
                  type="number"
                  min="1"
                  value={customSlots}
                  onChange={(e) => setCustomSlots(e.target.value)}
                  className="text-center"
                  placeholder="Número personalizado de vagas"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Tipos de militares permitidos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4 text-green-500" />
              Tipos de militares permitidos
            </Label>
            <div className="space-y-2">
              {militaryTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={allowedMilitaryTypes.includes(type.id)}
                    onCheckedChange={(checked) => handleMilitaryTypeChange(type.id, checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={type.id}
                    className="text-sm font-normal text-gray-700 cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
            {allowedMilitaryTypes.length === 0 && (
              <p className="text-xs text-red-500">
                Selecione pelo menos um tipo de militar.
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4 text-green-500" />
              Descrição (opcional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
              placeholder="Ex: Reforço POG, Apoio Administrativo, etc."
              disabled={isLoading}
            />
          </div>

          {/* Opção para criar horários semanais - apenas para novos horários */}
          {!editingTimeSlot && (
            <div className="flex items-center justify-between gap-2 pt-2 pb-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-500" />
                <Label className="text-sm font-medium text-gray-700">
                  Aplicar para toda a semana
                </Label>
              </div>
              <Switch
                checked={useWeeklyLogic}
                onCheckedChange={setUseWeeklyLogic}
                className={cn(
                  "data-[state=checked]:bg-green-500",
                  "data-[state=checked]:hover:bg-green-600"
                )}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="text-gray-700 border-gray-300"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleRegister}
            disabled={isButtonDisabled()}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            ) : (
              editingTimeSlot ? "Salvar alterações" : "Registrar horário"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotDialog;
