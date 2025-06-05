// --- START OF FILE TimeSlotDialog (3).tsx ---

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
import { Label } from "./ui/label";
// Importar a interface TimeSlot de TimeSlotsList para consistência
import { TimeSlot as FirebaseTimeSlot } from "./TimeSlotsList"; // Renomeado para evitar conflito

// Tipos para as props onAddTimeSlot e onEditTimeSlot
// Estes objetos devem ter a estrutura que será enviada para o Firebase (snake_case)
type NewTimeSlotData = Omit<FirebaseTimeSlot, 'id' | 'volunteers' | 'slots_used'> & { slots_used?: number };
// EditTimeSlotData agora espera todos os campos de FirebaseTimeSlot, pois vamos reconstruí-lo.
// Ou, se preferir, pode ser Partial, mas dataOperations.update precisará lidar com isso.
// Para simplificar, vamos enviar o objeto quase completo.
type EditTimeSlotData = FirebaseTimeSlot;


interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onAddTimeSlot: (timeSlot: NewTimeSlotData) => void;
  onEditTimeSlot: (timeSlot: EditTimeSlotData) => void; // Mudança aqui
  editingTimeSlot: FirebaseTimeSlot | null; // Usa a interface de TimeSlotsList
  isLoading?: boolean;
}

const TimeSlotDialog = ({
  open,
  onOpenChange,
  selectedDate,
  onAddTimeSlot,
  onEditTimeSlot,
  editingTimeSlot,
  isLoading = false,
}: TimeSlotDialogProps) => {
  const [startTime, setStartTime] = useState("07:00"); 
  const [hours, setHours] = useState("6");             
  const [selectedSlots, setSelectedSlots] = useState<number>(2); 
  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlots, setCustomSlots] = useState("");
  const [useWeeklyLogic, setUseWeeklyLogic] = useState(false); // Para novos slots
  const [description, setDescription] = useState("");
  const [allowedMilitaryTypesInternal, setAllowedMilitaryTypesInternal] = useState<string[]>(["Operacional", "Administrativo", "Inteligencia"]);
  // Para edição, precisamos saber se a lógica semanal original deve ser mantida ou se o switch a altera
  const [isWeeklyOriginal, setIsWeeklyOriginal] = useState(false);


  const slotOptions = [2, 3, 4, 5];
  const militaryTypes = [
    { id: "Operacional", label: "Operacional" },
    { id: "Administrativo", label: "Administrativo" },
    { id: "Inteligencia", label: "Inteligência" } // Ajustado para exemplo
  ];

  const calculateEndTime = (start: string, duration: string): string => {
    if (!start || !duration || isNaN(parseFloat(duration))) return "00:00";
    const [startHour, startMinute] = start.split(':').map(Number);
    const durationHours = parseFloat(duration);
    const totalMinutes = startHour * 60 + startMinute + (durationHours * 60);
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) return "0";
    const [startHour, startMinute] = start.split(':').map(Number);
    let [endHour, endMinute] = end.split(':').map(Number);
    if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
      endHour += 24;
    }
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const durationHours = durationMinutes / 60;
    return durationHours.toString();
  };

  useEffect(() => {
    if (editingTimeSlot) {
      setStartTime(editingTimeSlot.start_time); 
      const duration = calculateDuration(editingTimeSlot.start_time, editingTimeSlot.end_time);
      setHours(duration);
      setSelectedSlots(editingTimeSlot.total_slots); 
      setDescription(editingTimeSlot.description || "");
      
      if (editingTimeSlot.allowed_military_types && editingTimeSlot.allowed_military_types.length > 0) {
        setAllowedMilitaryTypesInternal(editingTimeSlot.allowed_military_types);
      } else {
        setAllowedMilitaryTypesInternal(["Operacional", "Administrativo", "Inteligencia"]);
      }

      if (!slotOptions.includes(editingTimeSlot.total_slots)) {
        setShowCustomSlots(true);
        setCustomSlots(editingTimeSlot.total_slots.toString());
      } else {
        setShowCustomSlots(false);
      }
      // O switch de "Aplicar para toda a semana" não é mostrado na edição,
      // então isWeekly deve ser pego do original e não alterado pelo switch.
      setIsWeeklyOriginal(editingTimeSlot.isWeekly || false);
      setUseWeeklyLogic(false); // Switch de lógica semanal é para novos, resetar na edição

    } else {
      // Reset para novo slot
      setStartTime("07:00");
      setHours("6");
      setSelectedSlots(2);
      setShowCustomSlots(false);
      setCustomSlots("");
      setDescription("");
      setAllowedMilitaryTypesInternal(["Operacional", "Administrativo", "Inteligencia"]); 
      setUseWeeklyLogic(false);
      setIsWeeklyOriginal(false);
    }
  }, [editingTimeSlot, open]); 

  const handleMilitaryTypeChange = (typeId: string, checked: boolean) => {
    setAllowedMilitaryTypesInternal(prev =>
      checked ? [...prev, typeId] : prev.filter(type => type !== typeId)
    );
  };

  const handleRegister = () => {
    const slotsValue = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    if (isNaN(slotsValue) || slotsValue <= 0) {
        // Idealmente, use toast para feedback
        console.error("Número de vagas inválido");
        return;
    }
    const hoursValue = parseFloat(hours);
     if (isNaN(hoursValue) || hoursValue <= 0) {
        console.error("Duração inválida");
        return;
    }
    if (allowedMilitaryTypesInternal.length === 0) {
        console.error("Selecione ao menos um tipo de militar");
        return;
    }

    const endTimeValue = calculateEndTime(startTime, hours);
    
    if (editingTimeSlot) {
      // Para edição, começamos com o objeto original e atualizamos os campos do formulário
      const editedData: EditTimeSlotData = {
        ...editingTimeSlot, // Mantém id, slots_used, volunteers, e isWeekly original
        date: format(selectedDate, "yyyy-MM-dd"), // Pode ser que a data seja editável ou não
        start_time: startTime,
        end_time: endTimeValue,
        total_slots: slotsValue,
        description: description.trim(),
        allowed_military_types: allowedMilitaryTypesInternal,
        // isWeekly não é editável neste formulário, então usamos o valor original
        isWeekly: isWeeklyOriginal, 
      };
      onEditTimeSlot(editedData);
    } else {
      // Para novo slot
      const baseTimeSlotData: NewTimeSlotData = {
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTimeValue,
        total_slots: slotsValue,
        description: description.trim(),
        allowed_military_types: allowedMilitaryTypesInternal,
        isWeekly: useWeeklyLogic, // 'useWeeklyLogic' é o switch para novos
        slots_used: 0, 
        // 'volunteers' será inicializado como [] no firebase.ts ou aqui se preferir
      };
      onAddTimeSlot(baseTimeSlotData);
    }
    onOpenChange(false);
  };

  const isButtonDisabled = () => {
    if (isLoading) return true;
    // As validações foram movidas para dentro de handleRegister para feedback mais direto,
    // mas podem ser duplicadas aqui se quiser desabilitar o botão visualmente antes do clique.
    if (showCustomSlots) {
      const numSlots = parseInt(customSlots);
      if (isNaN(numSlots) || numSlots <= 0) return true;
    }
    const hoursValue = parseFloat(hours);
    if (isNaN(hoursValue) || hoursValue <= 0) return true;
    if (allowedMilitaryTypesInternal.length === 0) return true; 
    return false;
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
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700"><Clock className="h-4 w-4 text-green-500" />Horário</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Início</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="text-center" disabled={isLoading}/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Duração (horas)</Label>
                <Input type="number" step="0.5" min="0.5" max="24" value={hours} onChange={(e) => setHours(e.target.value)} className="text-center" placeholder="6" disabled={isLoading}/>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">Fim: {calculateEndTime(startTime, hours)}</div>
          </div>

          {/* Número de vagas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700"><Users className="h-4 w-4 text-green-500" />Número de vagas</Label>
            <div className="flex flex-wrap gap-2">
              {slotOptions.map((slots) => (
                <Button key={slots} variant="outline" size="sm" className={cn("flex-1 min-w-10 h-10 border-gray-200", selectedSlots === slots && !showCustomSlots && "bg-green-500 text-white hover:bg-green-600 border-green-500")} onClick={() => { setSelectedSlots(slots); setShowCustomSlots(false);}} disabled={isLoading}>{slots}</Button>
              ))}
              <Button variant="outline" size="sm" className={cn("flex-1 min-w-10 h-10 border-gray-200", showCustomSlots && "bg-green-500 text-white hover:bg-green-600 border-green-500")} onClick={() => setShowCustomSlots(true)} disabled={isLoading}>Outro</Button>
            </div>
            {showCustomSlots && <div className="pt-2"><Input type="number" value={customSlots} onChange={(e) => setCustomSlots(e.target.value)} className="text-center" placeholder="Número personalizado de vagas" disabled={isLoading}/></div>}
          </div>

          {/* Tipos de militares permitidos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700"><Shield className="h-4 w-4 text-green-500" />Tipos de militares permitidos</Label>
            <div className="space-y-2">
              {militaryTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox id={type.id} checked={allowedMilitaryTypesInternal.includes(type.id)} onCheckedChange={(checked) => handleMilitaryTypeChange(type.id, checked as boolean)} disabled={isLoading}/>
                  <Label htmlFor={type.id} className="text-sm font-normal text-gray-700 cursor-pointer">{type.label}</Label>
                </div>
              ))}
            </div>
            {allowedMilitaryTypesInternal.length === 0 && <p className="text-xs text-red-500">Selecione pelo menos um tipo de militar.</p>}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700"><FileText className="h-4 w-4 text-green-500" />Descrição (opcional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px] resize-none" placeholder="Ex: Consulta de rotina, retorno, etc." disabled={isLoading}/>
          </div>

          {/* Opção para criar horários semanais - apenas para NOVOS horários */}
          {!editingTimeSlot && (
            <div className="flex items-center justify-between gap-2 pt-2 pb-1">
              <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-green-500" /><Label className="text-sm font-medium text-gray-700">Aplicar para toda a semana</Label></div>
              <Switch checked={useWeeklyLogic} onCheckedChange={setUseWeeklyLogic} className={cn("data-[state=checked]:bg-green-500", "data-[state=checked]:hover:bg-green-600")} disabled={isLoading}/>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-gray-700 border-gray-300" disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleRegister} disabled={isButtonDisabled()} className="bg-green-500 hover:bg-green-600 text-white">
            {isLoading ? (<span className="flex items-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processando...</span>) : (editingTimeSlot ? "Salvar alterações" : "Registrar horário")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotDialog;

// --- END OF FILE TimeSlotDialog (3).tsx ---
