import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TimeSlot {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  slots: number;
  slotsUsed: number;
  isWeekly?: boolean;
}

interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  isWeekly?: boolean;
}

const TimeSlotDialog = ({ open, onOpenChange, selectedDate, isWeekly = false }: TimeSlotDialogProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("19:00");
  const [slots, setSlots] = useState(2);

  const handleRegister = async () => {
    try {
      if (!selectedDate) {
        toast({
          title: "Erro",
          description: "Selecione uma data",
          variant: "destructive",
        });
        return;
      }

      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      const timeSlotData: TimeSlot = {
        title,
        description,
        date: formattedDate,
        startTime,
        endTime,
        slots,
        slotsUsed: 0,
        isWeekly,
      };

      // Convert the data to a plain object before sending
      const serializedData = JSON.parse(JSON.stringify(timeSlotData));

      await addDoc(collection(db, "timeSlots"), serializedData);

      toast({
        title: "Sucesso",
        description: "Horário registrado com sucesso",
      });

      onOpenChange(false);
      
      // Reset form
      setTitle("");
      setDescription("");
      setStartTime("13:00");
      setEndTime("19:00");
      setSlots(2);
    } catch (error) {
      console.error("Error registering time slot:", error);
      toast({
        title: "Erro",
        description: "Erro ao registrar horário",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Horário {isWeekly ? "Semanal" : "Diário"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Quantidade de vagas"
              value={slots}
              onChange={(e) => setSlots(parseInt(e.target.value))}
              min={1}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleRegister}>Registrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotDialog;