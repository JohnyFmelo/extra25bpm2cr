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
import { TimeSlot } from "@/types/timeSlot";
import { Label } from "./ui/label";

interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onAddTimeSlot: (timeSlot: TimeSlot | any) => void;
  onEditTimeSlot: (timeSlot: TimeSlot | any) => void;
  editingTimeSlot: TimeSlot | null | any;
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
  const [useWeeklyLogic, setUseWeeklyLogic] = useState(false);
  const [description, setDescription] = useState("");
  // ALTERAÇÃO: inicia vazio
  const [allowedMilitaryTypes, setAllowedMilitaryTypes] = useState<string[]>([]);

  const slotOptions = [2, 3, 4, 5];
  const militaryTypes = [
    { id: "Operacional", label: "Operacional" },
    { id: "Administrativo", label: "Administrativo" },
    { id: "Inteligencia", label: "Inteligência" }
  ];

  const calculateEndTime = (start: string, duration: string): string => {
    if (!start || !duration || isNaN(parseFloat(duration))) {
      return "Inválido";
    }
    const [startHour, startMinute] = start.split(':').map(Number);
    const durationHours = parseFloat(duration);
    const totalMinutes = startHour * 60 + startMinute + (durationHours * 60);
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) {
      return "0";
    }
    const [startHour, startMinute] = start.split(':').map(Number);
    let [endHour, endMinute] = end.split(':').map(Number);

    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
      return "0";
    }

    if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
      endHour += 24;
    }

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const durationMinutes = endTotalMinutes - startTotalMinutes;

    if (durationMinutes < 0) return "0";

    const durationHours = durationMinutes / 60;
    return durationHours.toString();
  };

  useEffect(() => {
    if (editingTimeSlot) {
      const fbStartTime = editingTimeSlot.start_time || editingTimeSlot.startTime || "07:00";
      const fbEndTime = editingTimeSlot.end_time || editingTimeSlot.endTime;
      const fbSlots = editingTimeSlot.total_slots || editingTimeSlot.slots || 2;
      const fbDescription = editingTimeSlot.description || "";
      const fbIsWeekly = editingTimeSlot.is_weekly || editingTimeSlot.isWeekly || false;
      const fbAllowedMilitaryTypes = editingTimeSlot.allowed_military_types ?? [];

      setStartTime(fbStartTime);
      if (fbStartTime && fbEndTime) {
        setHours(calculateDuration(fbStartTime, fbEndTime));
      } else {
        setHours("6");
      }
      setSelectedSlots(fbSlots);
      setDescription(fbDescription);
      setAllowedMilitaryTypes(fbAllowedMilitaryTypes);
      setUseWeeklyLogic(fbIsWeekly);

      if (!slotOptions.includes(fbSlots)) {
        setShowCustomSlots(true);
        setCustomSlots(fbSlots.toString());
      } else {
        setShowCustomSlots(false);
      }
    } else {
      // RESET ALTERADO: inicia vazio
      setStartTime("07:00");
      setHours("6");
      setSelectedSlots(2);
      setShowCustomSlots(false);
      setCustomSlots("");
      setDescription("");
      setAllowedMilitaryTypes([]);
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
    const currentSlots = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    const currentHours = parseFloat(hours);

    if (isNaN(currentHours) || currentHours <= 0) {
      console.error("Duração inválida");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      console.error("Horário de início inválido");
      return;
    }

    const currentEndTime = calculateEndTime(startTime, hours);

    const timeSlotObject: TimeSlot = {
      date: selectedDate,
      startTime: startTime,
      endTime: currentEndTime,
      slots: currentSlots,
      slotsUsed: editingTimeSlot ? (editingTimeSlot.slots_used ?? editingTimeSlot.slotsUsed ?? 0) : 0,
      isWeekly: useWeeklyLogic,
      description: description.trim(),
      allowedMilitaryTypes: allowedMilitaryTypes
    };

    if (editingTimeSlot) {
      onEditTimeSlot({ ...timeSlotObject, id: editingTimeSlot.id || (editingTimeSlot as any).idFromFirebase });
    } else {
      onAddTimeSlot(timeSlotObject);
    }
    onOpenChange(false);
  };

  const isButtonDisabled = () => {
    const numSlots = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    if (isNaN(numSlots) || numSlots <= 0) return true;
    const hoursValue = parseFloat(hours);
    if (isNaN(hoursValue) || hoursValue <= 0) return true;
    return isLoading || allowedMilitaryTypes.length === 0;
  };

  const displayedEndTime = calculateEndTime(startTime, hours);

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
              Fim: {displayedEndTime}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4 text-green-500" />
              Número de vagas
            </Label>
            <div className="flex flex-wrap gap-2">
              {slotOptions.map((slotsVal) => (
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
                  value={customSlots}
                  onChange={(e) => setCustomSlots(e.target.value)}
                  className="text-center"
                  placeholder="Número personalizado de vagas"
                  disabled={isLoading}
                  min="1"
                />
              </div>
            )}
          </div>

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
                Selecione pelo menos um tipo de militar
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4 text-green-500" />
              Descrição (opcional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
              placeholder="Ex: Consulta de rotina, retorno, etc."
              disabled={isLoading}
            />
          </div>

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
