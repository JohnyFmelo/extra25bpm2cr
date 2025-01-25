import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  slots: number;
  slotsUsed: number;
  isWeekly?: boolean;
}

interface TimeSlotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onAddTimeSlot: (timeSlot: TimeSlot) => void;
  onEditTimeSlot: (timeSlot: TimeSlot) => void;
  editingTimeSlot: TimeSlot | null;
  isWeekly?: boolean;
}

const TimeSlotDialog = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onAddTimeSlot, 
  onEditTimeSlot,
  editingTimeSlot,
  isWeekly = false,
}: TimeSlotDialogProps) => {
  const [timeSlot, setTimeSlot] = useState("13 às 19");
  const [selectedSlots, setSelectedSlots] = useState<number>(2);
  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlots, setCustomSlots] = useState("");
  const [selectedTab, setSelectedTab] = useState("daily");

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

  useEffect(() => {
    // Reset to daily tab when opening for non-weekly dialog
    if (!isWeekly) {
      setSelectedTab("daily");
    }
  }, [isOpen, isWeekly]);

  const slotOptions = [2, 3, 4, 5];

  const createTimeSlot = (): TimeSlot => {
    const slots = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    const [startTime, endTime] = timeSlot.split(" às ");
    
    return {
      date: selectedDate,
      startTime,
      endTime,
      slots,
      slotsUsed: editingTimeSlot ? editingTimeSlot.slotsUsed : 0
    };
  };

  const handleRegister = () => {
    const newTimeSlot = createTimeSlot();
    
    if (editingTimeSlot) {
      onEditTimeSlot(newTimeSlot);
    } else if (isWeekly && selectedTab === "weekly") {
      // Criar horário semanal apenas quando estiver no modo semanal E na aba semanal
      onAddTimeSlot({ ...newTimeSlot, isWeekly: true });
    } else {
      // Criar horário diário em todos os outros casos
      onAddTimeSlot(newTimeSlot);
    }
    
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
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">Horário Diário</TabsTrigger>
            <TabsTrigger value="weekly" disabled={!isWeekly}>Horário Semanal</TabsTrigger>
          </TabsList>
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
                {editingTimeSlot ? "Salvar" : selectedTab === "weekly" ? "Registrar Horário Semanal" : "Registrar Horário"}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotDialog;