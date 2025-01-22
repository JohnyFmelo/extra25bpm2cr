import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimeSlotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onAddTimeSlot: (timeSlot: any) => void;
  onEditTimeSlot?: (timeSlot: any) => void;
  editingTimeSlot?: any;
}

const commonTimeSlots = [
  { start: "07:00", end: "08:00" },
  { start: "08:00", end: "09:00" },
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" },
  { start: "17:00", end: "18:00" },
];

const TimeSlotDialog: React.FC<TimeSlotDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onAddTimeSlot,
  onEditTimeSlot,
  editingTimeSlot,
}) => {
  const [startTime, setStartTime] = useState(editingTimeSlot?.startTime || "");
  const [endTime, setEndTime] = useState(editingTimeSlot?.endTime || "");
  const [slots, setSlots] = useState(editingTimeSlot?.slots || 1);
  const [isTimePopoverOpen, setIsTimePopoverOpen] = useState(false);

  useEffect(() => {
    if (editingTimeSlot) {
      setStartTime(editingTimeSlot.startTime);
      setEndTime(editingTimeSlot.endTime);
      setSlots(editingTimeSlot.slots);
    }
  }, [editingTimeSlot]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeSlot = {
      date: selectedDate,
      startTime,
      endTime,
      slots: Number(slots),
      slotsUsed: editingTimeSlot?.slotsUsed || 0,
    };

    if (editingTimeSlot && onEditTimeSlot) {
      onEditTimeSlot(timeSlot);
    } else {
      onAddTimeSlot(timeSlot);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingTimeSlot ? "Editar Horário" : "Novo Horário"} -{" "}
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Horário inicial</label>
            <Popover open={isTimePopoverOpen} onOpenChange={setIsTimePopoverOpen}>
              <PopoverTrigger asChild>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar horário..." />
                  <CommandList>
                    <CommandEmpty>Nenhum horário encontrado.</CommandEmpty>
                    <CommandGroup>
                      {commonTimeSlots.map((slot) => (
                        <CommandItem
                          key={slot.start}
                          onSelect={() => {
                            setStartTime(slot.start);
                            setEndTime(slot.end);
                            setIsTimePopoverOpen(false);
                          }}
                        >
                          {slot.start} - {slot.end}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Horário final</label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Número de vagas</label>
            <Input
              type="number"
              min="1"
              value={slots}
              onChange={(e) => setSlots(Number(e.target.value))}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingTimeSlot ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotDialog;