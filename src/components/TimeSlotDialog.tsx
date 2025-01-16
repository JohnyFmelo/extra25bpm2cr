import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

interface TimeSlotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

const TimeSlotDialog = ({ isOpen, onClose, selectedDate }: TimeSlotDialogProps) => {
  const [timeSlot, setTimeSlot] = useState("13 às 19");
  const [selectedSlots, setSelectedSlots] = useState<number>(2);
  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlots, setCustomSlots] = useState("");

  const slotOptions = [2, 3, 4, 5];

  const handleRegister = () => {
    const slots = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    console.log("Registering time slot:", {
      date: selectedDate,
      timeSlot,
      slots,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleRegister}>
              Registrar Horário
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotDialog;