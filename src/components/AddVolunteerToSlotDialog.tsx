
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";
import { TimeSlot, FirebaseTimeSlot } from "@/types/timeSlot";

interface User {
  id: string;
  email: string;
  warName: string;
  rank?: string;
  isVolunteer?: boolean;
  maxSlots?: number;
}

interface AddVolunteerToSlotDialogProps {
  timeSlot: TimeSlot;
  onVolunteerAdded: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AddVolunteerToSlotDialog: React.FC<AddVolunteerToSlotDialogProps> = ({
  timeSlot,
  onVolunteerAdded,
  open,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
  const { toast } = useToast();

  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (isOpen) {
      fetchVolunteers();
      fetchAllTimeSlots();
    }
  }, [isOpen]);

  const fetchVolunteers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        maxSlots: doc.data().maxSlots || 1
      }) as User);
      
      const volunteerUsers = usersData.filter(user => user.isVolunteer);
      setVolunteers(volunteerUsers);
    } catch (error) {
      console.error("Error fetching volunteers:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a lista de voluntários."
      });
    }
  };

  const fetchAllTimeSlots = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "timeSlots"));
      const slots = querySnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseTimeSlot;
        return {
          id: doc.id,
          date: new Date(data.date),
          startTime: data.start_time ? data.start_time.slice(0, 5) : "00:00",
          endTime: data.end_time ? data.end_time.slice(0, 5) : "00:00",
          slots: data.total_slots || 0,
          slotsUsed: data.slots_used || 0,
          description: data.description || "",
          volunteers: data.volunteers || []
        } as TimeSlot;
      });
      setAllTimeSlots(slots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
    }
  };

  const getVolunteerSlotCount = (volunteerName: string): number => {
    return allTimeSlots.reduce((count, slot) => {
      if (slot.volunteers && slot.volunteers.includes(volunteerName)) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  const getVolunteerMaxSlots = (volunteerName: string): number => {
    const volunteer = volunteers.find(v => {
      const fullName = `${v.rank || ''} ${v.warName}`.trim();
      return fullName === volunteerName;
    });
    return volunteer?.maxSlots || 1;
  };

  const isVolunteerAtLimit = (volunteerName: string): boolean => {
    const currentSlots = getVolunteerSlotCount(volunteerName);
    const maxSlots = getVolunteerMaxSlots(volunteerName);
    return currentSlots >= maxSlots;
  };

  const isVolunteerAlreadyInSlot = (volunteerName: string): boolean => {
    return timeSlot.volunteers?.includes(volunteerName) || false;
  };

  const handleAddVolunteer = async () => {
    if (!selectedVolunteer) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione um voluntário."
      });
      return;
    }

    if (isVolunteerAlreadyInSlot(selectedVolunteer)) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Este voluntário já está inscrito neste horário."
      });
      return;
    }

    if (isVolunteerAtLimit(selectedVolunteer)) {
      const maxSlots = getVolunteerMaxSlots(selectedVolunteer);
      toast({
        variant: "destructive",
        title: "Limite atingido",
        description: `Este voluntário já atingiu o limite máximo de ${maxSlots} serviço(s).`
      });
      return;
    }

    setIsLoading(true);
    try {
      const timeSlotRef = doc(db, "timeSlots", timeSlot.id!);
      await updateDoc(timeSlotRef, {
        volunteers: arrayUnion(selectedVolunteer),
        slots_used: (timeSlot.slotsUsed || 0) + 1
      });

      toast({
        title: "Sucesso",
        description: "Voluntário adicionado com sucesso!"
      });

      setSelectedVolunteer("");
      setOpen(false);
      onVolunteerAdded();
    } catch (error) {
      console.error("Error adding volunteer:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o voluntário."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const availableVolunteers = volunteers.filter(volunteer => {
    const fullName = `${volunteer.rank || ''} ${volunteer.warName}`.trim();
    return !isVolunteerAlreadyInSlot(fullName);
  });

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar Voluntário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário ao Horário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Horário: {timeSlot.startTime} - {timeSlot.endTime}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Data: {new Date(timeSlot.date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          <div>
            <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um voluntário" />
              </SelectTrigger>
              <SelectContent>
                {availableVolunteers.map((volunteer) => {
                  const fullName = `${volunteer.rank || ''} ${volunteer.warName}`.trim();
                  const currentSlots = getVolunteerSlotCount(fullName);
                  const maxSlots = volunteer.maxSlots || 1;
                  const atLimit = isVolunteerAtLimit(fullName);
                  
                  return (
                    <SelectItem 
                      key={volunteer.id} 
                      value={fullName}
                      disabled={atLimit}
                      className={atLimit ? "opacity-50" : ""}
                    >
                      <div className="flex flex-col">
                        <span>{fullName}</span>
                        <span className="text-xs text-gray-500">
                          {currentSlots}/{maxSlots} serviços
                          {atLimit && " (Limite atingido)"}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddVolunteer} disabled={isLoading || !selectedVolunteer}>
              {isLoading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
