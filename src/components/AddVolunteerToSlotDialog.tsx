import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, registration: string, date: string) => void;
}

const AddVolunteerToSlotDialog: React.FC<AddVolunteerToSlotDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
}) => {
  const [name, setName] = useState("");
  const [registration, setRegistration] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const dateFieldRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (name && registration && selectedDate) {
      onAdd(name, registration, selectedDate);
      onOpenChange(false);
      setName("");
      setRegistration("");
      setSelectedDate("");
      if (dateFieldRef.current) {
        dateFieldRef.current.value = ""; // Clear the date field
      }
    } else {
      alert("Por favor, preencha todos os campos.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário ao Plantão</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para adicionar um voluntário ao plantão.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="registration" className="text-right">
              Matrícula
            </Label>
            <Input
              id="registration"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="col-span-3"
              ref={(el) => {
                if (el) {
                  dateFieldRef.current = el;
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Adicionar ao Plantão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
