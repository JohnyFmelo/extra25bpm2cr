import React, { useState, useEffect } from "react";
import { format, differenceInHours, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Clock, Calendar, Users, RefreshCw, FileText, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeSlot, MilitaryType, MILITARY_TYPES } from "@/types/timeSlot";
import { Label } from "./ui/label";

interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onAddTimeSlot: (timeSlot: TimeSlot) => void;
  onEditTimeSlot: (timeSlot: TimeSlot) => void;
  editingTimeSlot: TimeSlot | null;
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
  const [endTime, setEndTime] = useState("13:00");
  const [hours, setHours] = useState("6");
  const [selectedSlots, setSelectedSlots] = useState<number>(2);
  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlots, setCustomSlots] = useState("");
  const [useWeeklyLogic, setUseWeeklyLogic] = useState(false);
  const [description, setDescription] = useState("");
  const [allowedMilitaryTypes, setAllowedMilitaryTypes] = useState<string[]>([]);

  const slotOptions = [2, 3, 4, 5];

  // Função para calcular horas entre startTime e endTime
  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return "";
    const startDate = new Date(`2000-01-01T${start}:00`);
    const endDate = new Date(`2000-01-01T${end}:00`);
    const diff = differenceInHours(endDate, startDate);
    return diff >= 0 ? diff.toString() : "";
  };

  // Função para calcular endTime com base em startTime e horas
  const calculateEndTime = (start: string, hours: string) => {
    if (!start || !hours) return endTime;
    const startDate = new Date(`2000-01-01T${start}:00`);
    const hoursNum = parseInt(hours);
    if (isNaN(hoursNum)) return endTime;
    const endDate = addHours(startDate, hoursNum);
    return format(endDate, "HH:mm");
  };

  // Reset ou preencher os campos quando o diálogo abrir
  useEffect(() => {
    if (editingTimeSlot) {
      setStartTime(editingTimeSlot.startTime);
      setEndTime(editingTimeSlot.endTime);
      setHours(calculateHours(editingTimeSlot.startTime, editingTimeSlot.endTime));
      setSelectedSlots(editingTimeSlot.slots);
      setDescription(editingTimeSlot.description || "");
      setAllowedMilitaryTypes(editingTimeSlot.allowedMilitaryTypes || []);
      if (!slotOptions.includes(editingTimeSlot.slots)) {
        setShowCustomSlots(true);
        setCustomSlots(editingTimeSlot.slots.toString());
      } else {
        setShowCustomSlots(false);
      }
      setUseWeeklyLogic(false);
    } else {
      // Valores padrão para novo registro
      setStartTime("07:00");
      setEndTime("13:00");
      setHours("6");
      setSelectedSlots(2);
      setShowCustomSlots(false);
      setCustomSlots("");
      setDescription("");
      setUseWeeklyLogic(false);
      setAllowedMilitaryTypes([]);
    }
  }, [editingTimeSlot, open]);

  // Atualizar horas quando startTime ou endTime mudarem
  useEffect(() => {
    setHours(calculateHours(startTime, endTime));
  }, [startTime, endTime]);

  const handleMilitaryTypeToggle = (type: MilitaryType) => {
    setAllowedMilitaryTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleRegister = () => {
    const slots = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    
    const newTimeSlot: TimeSlot = {
      date: selectedDate,
      startTime,
      endTime,
      slots,
      slotsUsed: editingTimeSlot ? editingTimeSlot.slotsUsed : 0,
      isWeekly: useWeeklyLogic,
      description: description.trim(),
      allowedMilitaryTypes,
      volunteers: editingTimeSlot ? editingTimeSlot.volunteers : []
    };
    
    if (editingTimeSlot) {
      onEditTimeSlot(newTimeSlot);
    } else {
      onAddTimeSlot(newTimeSlot);
    }
    onOpenChange(false);
  };

  const isButtonDisabled = () => {
    if (showCustomSlots) {
      const numSlots = parseInt(customSlots);
      return isNaN(numSlots) || numSlots <= 0 || isLoading;
    }
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
          {/* Horário de início, fim e horas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="h-4 w-4 text-green-500" />
              Horário
            </Label>
            <div className="grid grid-cols-3 gap-3">
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
                <Label className="text-xs text-gray-500">Fim</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className=" surfaceduo:text-center"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Horas</Label>
                <Input
                  type="number"
                  value={hours}
                  onChange={(e) => {
                    setHours(e.target.value);
                    if (e.target.value) {
                      setEndTime(calculateEndTime(startTime, e.target.value));
                    }
                  }}
                  className="text-center"
                  placeholder="Horas"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Número de vagas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4 text-green-500" />
              Número de vagas
            </Label>
            <div className="flex flex-wrap gap-2">
              {slotOptions.map((slots) => (
                <Button
                  key={slots}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 min-w-10 h-10 border-gray-200",
                    selectedSlots === slots && !showCustomSlots && "bg-green-500 text-white hover:bg-green-600 border-green-500"
                  )}
                  onClick={() => {
                    setSelectedSlots(slots);
                    setShowCustomSlots(false);
                  }}
                  disabled={isLoading}
                >
                  {slots}
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
                />
              </div>
            )}
          </div>

          {/* Tipos Militares Permitidos */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4 text-green-500" />
              Tipos militares permitidos
            </Label>
            <div className="space-y-3">
              {MILITARY_TYPES.map((type) => (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">{type}</span>
                  <Switch
                    checked={allowedMilitaryTypes.includes(type)}
                    onCheckedChange={() => handleMilitaryTypeToggle(type)}
                    className={cn(
                      "data-[state=checked]:bg-green-500",
                      "data-[state=checked]:hover:bg-green-600"
                    )}
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
            {allowedMilitaryTypes.length === 0 && (
              <p className="text-xs text-gray-500 italic">
                Selecione pelo menos um tipo militar para permitir participação
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
              placeholder="Ex: Consulta de rotina, retorno, etc."
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
