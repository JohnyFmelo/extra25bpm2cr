import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { cn } from "@/lib/utils";
import { TimeSlot } from "@/types/timeSlot";

interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onAddTimeSlot: (timeSlot: TimeSlot) => void;
  onEditTimeSlot: (timeSlot: TimeSlot) => void;
  editingTimeSlot: TimeSlot | null;
}

const TimeSlotDialog = ({
  open,
  onOpenChange,
  selectedDate,
  onAddTimeSlot,
  onEditTimeSlot,
  editingTimeSlot,
}: TimeSlotDialogProps) => {
  const [timeSlot, setTimeSlot] = useState("07 às 13");
  const [selectedSlots, setSelectedSlots] = useState<number>(2);
  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlots, setCustomSlots] = useState("");
  const [useWeeklyLogic, setUseWeeklyLogic] = useState(false);

  useEffect(() => {
    if (editingTimeSlot) {
      setTimeSlot(`${editingTimeSlot.startTime} às ${editingTimeSlot.endTime}`);
      setSelectedSlots(editingTimeSlot.slots);
      if (!slotOptions.includes(editingTimeSlot.slots)) {
        setShowCustomSlots(true);
        setCustomSlots(editingTimeSlot.slots.toString());
      }
    } else {
      setTimeSlot("07 às 13");
      setSelectedSlots(2);
      setShowCustomSlots(false);
      setCustomSlots("");
    }
  }, [editingTimeSlot]);

  const slotOptions = [2, 3, 4, 5];

  const validateAndFormatTime = (timeString: string): { startTime: string, endTime: string } | null => {
    const [startTime, endTime] = timeString.split(" às ").map(t => t.trim());
    
    // Adiciona ":00" se o horário não tiver minutos
    const formatTime = (time: string) => {
      if (!time.includes(':')) return `${time}:00`;
      return time;
    };

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    // Validação básica do formato
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formattedStartTime) || !timeRegex.test(formattedEndTime)) {
      return null;
    }

    return {
      startTime: formattedStartTime,
      endTime: formattedEndTime
    };
  };

  const handleRegister = () => {
    const slots = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    const validatedTimes = validateAndFormatTime(timeSlot);
    
    if (!validatedTimes) {
      // Aqui você pode adicionar um toast ou alerta de erro
      console.error("Formato de horário inválido");
      return;
    }
    
    const { startTime, endTime } = validatedTimes;
    
    const newTimeSlot: TimeSlot = {
      date: selectedDate,
      startTime,
      endTime,
      slots,
      slotsUsed: editingTimeSlot ? editingTimeSlot.slotsUsed : 0,
      isWeekly: useWeeklyLogic
    };
    
    if (editingTimeSlot) {
      onEditTimeSlot(newTimeSlot);
    } else {
      onAddTimeSlot(newTimeSlot);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-bold">
            {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Input
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="text-center"
              placeholder="07 às 13"
            />
          </div>
          <div className="flex justify-center items-center gap-2">
            {slotOptions.map((slots) => (
              <Button
                key={slots}
                variant="outline"
                size="sm"
                className={cn(
                  "w-10 h-10",
                  selectedSlots === slots && !showCustomSlots && "bg-black text-white hover:bg-black/90"
                )}
                onClick={() => {
                  setSelectedSlots(slots);
                  setShowCustomSlots(false);
                }}
              >
                {slots}
              </Button>
            ))}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-10 h-10",
                  showCustomSlots && "bg-black text-white hover:bg-black/90"
                )}
                onClick={() => setShowCustomSlots(true)}
              >
                +
              </Button>
              <Switch
                checked={useWeeklyLogic}
                onCheckedChange={setUseWeeklyLogic}
                className={cn(
                  "data-[state=checked]:bg-green-500",
                  "data-[state=checked]:hover:bg-green-600"
                )}
              />
            </div>
          </div>
          {showCustomSlots && (
            <div>
              <Input
                type="number"
                value={customSlots}
                onChange={(e) => setCustomSlots(e.target.value)}
                className="text-center"
                placeholder="Número de vagas"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegister}>
              {editingTimeSlot ? "Salvar" : "Registrar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotDialog;
