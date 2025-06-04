
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
  const [selectedSlots, setSelectedSlots] = useState<number>(2);
  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlots, setCustomSlots] = useState("");
  const [useWeeklyLogic, setUseWeeklyLogic] = useState(false);
  const [description, setDescription] = useState("");
  const [allowedMilitaryTypes, setAllowedMilitaryTypes] = useState<string[]>(["Operacional", "Administrativo", "Inteligencia"]);

  const slotOptions = [2, 3, 4, 5];
  const militaryTypes = [
    { id: "Operacional", label: "Operacional" },
    { id: "Administrativo", label: "Administrativo" },
    { id: "Inteligencia", label: "Inteligência" }
  ];

  useEffect(() => {
    if (editingTimeSlot) {
      setStartTime(editingTimeSlot.startTime);
      setEndTime(editingTimeSlot.endTime);
      setSelectedSlots(editingTimeSlot.slots);
      setDescription(editingTimeSlot.description || "");
      setAllowedMilitaryTypes(editingTimeSlot.allowedMilitaryTypes || ["Operacional", "Administrativo", "Inteligencia"]);
      if (!slotOptions.includes(editingTimeSlot.slots)) {
        setShowCustomSlots(true);
        setCustomSlots(editingTimeSlot.slots.toString());
      } else {
        setShowCustomSlots(false);
      }
      setUseWeeklyLogic(false);
    } else {
      setStartTime("07:00");
      setEndTime("13:00");
      setSelectedSlots(2);
      setShowCustomSlots(false);
      setCustomSlots("");
      setDescription("");
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
    const slots = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    
    const newTimeSlot: TimeSlot = {
      date: selectedDate,
      startTime,
      endTime,
      slots,
      slotsUsed: editingTimeSlot ? editingTimeSlot.slotsUsed : 0,
      isWeekly: useWeeklyLogic,
      description: description.trim(),
      allowedMilitaryTypes
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
      return isNaN(numSlots) || numSlots <= 0 || isLoading || allowedMilitaryTypes.length === 0;
    }
    return isLoading || allowedMilitaryTypes.length === 0;
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
          {/* Horário de início e fim */}
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
                <Label className="text-xs text-gray-500">Fim</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="text-center"
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
                Selecione pelo menos um tipo de militar
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
