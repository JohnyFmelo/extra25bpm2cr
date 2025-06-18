import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { dataOperations } from "@/lib/firebase";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVolunteer: () => void;
}

const AddVolunteerToSlotDialog = ({ open, onOpenChange, onAddVolunteer }: AddVolunteerToSlotDialogProps) => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slots, setSlots] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dateField = document.getElementById('date') as HTMLInputElement | null;
    const startTimeField = document.getElementById('startTime') as HTMLInputElement | null;
    const endTimeField = document.getElementById('endTime') as HTMLInputElement | null;
    const slotsField = document.getElementById('slots') as HTMLInputElement | null;
    
    if (!dateField?.value || !startTimeField?.value || !endTimeField?.value || !slotsField?.value) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!date || !startTime || !endTime || !slots) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const formattedDate = format(date, "yyyy-MM-dd");

    const newTimeSlot = {
      date: formattedDate,
      start_time: startTime,
      end_time: endTime,
      total_slots: parseInt(slots, 10),
      slots_used: 0,
      volunteers: [],
    };

    dataOperations.create(newTimeSlot).then((result) => {
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Horário criado com sucesso.",
        });
        onAddVolunteer();
        onOpenChange(false);
      } else {
        toast({
          title: "Erro",
          description: "Falha ao criar o horário.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Horário</DialogTitle>
          <DialogDescription>
            Crie um novo horário para voluntários se inscreverem.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date > new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              Início
            </Label>
            <Input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="text-right">
              Fim
            </Label>
            <Input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="slots" className="text-right">
              Vagas
            </Label>
            <Input
              type="number"
              id="slots"
              value={slots}
              onChange={(e) => setSlots(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <Button type="submit" onClick={handleSubmit}>
          Adicionar
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
