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
type EditTimeSlotData = Partial<FirebaseTimeSlot> & { id: string };


interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onAddTimeSlot: (timeSlot: NewTimeSlotData) => void;
  onEditTimeSlot: (timeSlot: EditTimeSlotData) => void;
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
  const [startTime, setStartTime] = useState("07:00"); // Para input (pode ser camelCase)
  const [hours, setHours] = useState("6");             // Para input
  const [selectedSlots, setSelectedSlots] = useState<number>(2); // Para input
  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlots, setCustomSlots] = useState("");
  const [useWeeklyLogic, setUseWeeklyLogic] = useState(false);
  const [description, setDescription] = useState("");
  // Estado interno para os checkboxes (os valores aqui devem corresponder aos IDs abaixo)
  const [allowedMilitaryTypesInternal, setAllowedMilitaryTypesInternal] = useState<string[]>(["Operacional", "Administrativo", "Inteligencia"]);

  const slotOptions = [2, 3, 4, 5];
  const militaryTypes = [
    { id: "Operacional", label: "Operacional" },
    { id: "Administrativo", label: "Administrativo" },
    // Certifique-se que 'id' corresponde ao valor no Firebase se houver acento.
    // Ex: { id: "Inteligência", label: "Inteligência" }
    { id: "Inteligencia", label: "Inteligência" }
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
      setStartTime(editingTimeSlot.start_time); // Carrega snake_case
      const duration = calculateDuration(editingTimeSlot.start_time, editingTimeSlot.end_time);
      setHours(duration);
      setSelectedSlots(editingTimeSlot.total_slots); // Carrega snake_case
      setDescription(editingTimeSlot.description || "");
      
      // Carrega allowed_military_types (snake_case) do Firebase
      if (editingTimeSlot.allowed_military_types && editingTimeSlot.allowed_military_types.length > 0) {
        setAllowedMilitaryTypesInternal(editingTimeSlot.allowed_military_types);
      } else {
        // Se vazio no DB, definir um padrão (ex: todos selecionados, ou nenhum)
        // Aqui, se vazio, mostra todos selecionados. Ajuste se necessário.
        setAllowedMilitaryTypesInternal(["Operacional", "Administrativo", "Inteligencia"]);
      }

      if (!slotOptions.includes(editingTimeSlot.total_slots)) {
        setShowCustomSlots(true);
        setCustomSlots(editingTimeSlot.total_slots.toString());
      } else {
        setShowCustomSlots(false);
      }
      setUseWeeklyLogic(editingTimeSlot.isWeekly || false);
    } else {
      // Reset para novo slot
      setStartTime("07:00");
      setHours("6");
      setSelectedSlots(2);
      setShowCustomSlots(false);
      setCustomSlots("");
      setDescription("");
      setAllowedMilitaryTypesInternal(["Operacional", "Administrativo", "Inteligencia"]); // Padrão para novo
      setUseWeeklyLogic(false);
    }
  }, [editingTimeSlot, open]); // Adicionar slotOptions se for dinâmico

  const handleMilitaryTypeChange = (typeId: string, checked: boolean) => {
    setAllowedMilitaryTypesInternal(prev =>
      checked ? [...prev, typeId] : prev.filter(type => type !== typeId)
    );
  };

  const handleRegister = () => {
    const slotsValue = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    if (isNaN(slotsValue) || slotsValue <= 0) {
        // Adicionar toast ou validação visual
        return;
    }
    const hoursValue = parseFloat(hours);
     if (isNaN(hoursValue) || hoursValue <= 0) {
        // Adicionar toast ou validação visual
        return;
    }

    const endTimeValue = calculateEndTime(startTime, hours);
    
    // Objeto com a estrutura snake_case para o Firebase
    const baseTimeSlotData = {
      date: format(selectedDate, "yyyy-MM-dd"),
      start_time: startTime,
      end_time: endTimeValue,
      total_slots: slotsValue,
      description: description.trim(),
      allowed_military_types: allowedMilitaryTypesInternal, // Usa o estado interno
      isWeekly: useWeeklyLogic,
    };
    
    if (editingTimeSlot) {
      const editData: EditTimeSlotData = {
        ...baseTimeSlotData,
        id: editingTimeSlot.id!, // ID é obrigatório para editar
        // Manter campos não editáveis diretamente no formulário
        slots_used: editingTimeSlot.slots_used, 
        volunteers: editingTimeSlot.volunteers,
      };
      onEditTimeSlot(editData);
    } else {
      const addData: NewTimeSlotData = {
        ...baseTimeSlotData,
        slots_used: 0, // Novo slot
        // volunteers: [], // Firebase.ts pode inicializar se necessário
      };
      onAddTimeSlot(addData);
    }
    onOpenChange(false);
  };

  const isButtonDisabled = () => {
    if (isLoading) return true;
    if (showCustomSlots) {
      const numSlots = parseInt(customSlots);
      if (isNaN(numSlots) || numSlots <= 0) return true;
    }
    const hoursValue = parseFloat(hours);
    if (isNaN(hoursValue) || hoursValue <= 0) return true;
    if (allowedMilitaryTypesInternal.length === 0) return true; // Validação
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

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700"><FileText className="h-4 w-4 text-green-500" />Descrição (opcional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px] resize-none" placeholder="Ex: Consulta de rotina, retorno, etc." disabled={isLoading}/>
          </div>

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
