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
  const [timeSlot, setTimeSlot] = useState("13 às 19");
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
      setTimeSlot("13 às 19");
      setSelectedSlots(2);
      setShowCustomSlots(false);
      setCustomSlots("");
    }
  }, [editingTimeSlot]);

  const slotOptions = [2, 3, 4, 5];

  const handleRegister = () => {
    const slots = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    const [startTime, endTime] = timeSlot.split(" às ");
    
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
              placeholder="13 às 19"
            />
          </div>
          <div className="flex justify-center gap-2">
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
          <div className="flex items-center justify-between space-x-2">
            <span className="text-sm text-gray-500">Criar horários semanais</span>
            <Switch
              checked={useWeeklyLogic}
              onCheckedChange={setUseWeeklyLogic}
              className={cn(
                "data-[state=checked]:bg-green-500",
                "data-[state=checked]:hover:bg-green-600"
              )}
            />
          </div>
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