
import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collection, onSnapshot, query, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Users, UserPlus, Clock, Calendar, Loader2 } from "lucide-react";
import { parseISO, format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  warName: string;
  rank?: string;
}

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  volunteers?: string[];
}

interface AddVolunteerToSlotDialogProps {
  children: React.ReactNode;
  timeSlot: TimeSlot;
}

const AddVolunteerToSlotDialog = ({ children, timeSlot }: AddVolunteerToSlotDialogProps) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [volunteerName, setVolunteerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const usersCollection = collection(db, "users");
    const usersQuery = query(usersCollection);

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    const timeSlotsCollection = collection(db, 'timeSlots');
    const timeSlotsQuery = query(timeSlotsCollection);

    const unsubscribeTimeSlots = onSnapshot(timeSlotsQuery, (snapshot) => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let slotDateStr: string;
        if (data.date && typeof data.date.toDate === 'function') {
          slotDateStr = data.date.toDate().toISOString().split('T')[0];
        } else {
          slotDateStr = data.date as string;
        }
        return {
          id: docSnap.id,
          date: slotDateStr,
          start_time: data.start_time,
          end_time: data.end_time,
          volunteers: data.volunteers || []
        };
      });
      setTimeSlots(formattedSlots);
    });

    return () => {
      unsubscribeTimeSlots();
    };
  }, []);

  const handleAddVolunteer = async () => {
    if (!volunteerName) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, insira o nome do voluntário."
      });
      return;
    }

    setIsLoading(true);
    try {
      const timeSlotRef = doc(db, "timeSlots", timeSlot.id || "");
      await updateDoc(timeSlotRef, {
        volunteers: arrayUnion(volunteerName)
      });
      toast({
        title: "Voluntário adicionado",
        description: `${volunteerName} foi adicionado ao serviço.`
      });
      setOpen(false);
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

  const handleRemoveVolunteer = async (volunteerToRemove: string) => {
    setIsLoading(true);
    try {
      const timeSlotRef = doc(db, "timeSlots", timeSlot.id || "");
      await updateDoc(timeSlotRef, {
        volunteers: arrayRemove(volunteerToRemove)
      });
      toast({
        title: "Voluntário removido",
        description: `${volunteerToRemove} foi removido do serviço.`
      });
    } catch (error) {
      console.error("Error removing volunteer:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o voluntário."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentWeekSlots = useMemo(() => {
    const currentDate = new Date();
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    return timeSlots.filter(slot => {
      let dateValue: Date;
      const dateField = slot.date;
      
      if (!dateField) {
        dateValue = new Date();
      } else if (typeof dateField === 'object' && dateField !== null && 'toDate' in dateField) {
        dateValue = (dateField as any).toDate();
      } else if (typeof dateField === 'string') {
        dateValue = parseISO(dateField);
      } else {
        // Handle other date formats if needed
        dateValue = new Date(dateField);
      }

      return isWithinInterval(dateValue, { start: weekStart, end: weekEnd });
    });
  }, [timeSlots]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500" />
            Adicionar Voluntário
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data
            </Label>
            <Input
              id="date"
              value={timeSlot.date}
              className="col-span-3"
              disabled
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">
              Horário
            </Label>
            <Input
              id="time"
              value={`${timeSlot.start_time} - ${timeSlot.end_time}`}
              className="col-span-3"
              disabled
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddVolunteer} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aguarde...
              </>
            ) : (
              "Adicionar"
            )}
          </Button>
        </div>

        {timeSlot.volunteers && timeSlot.volunteers.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Voluntários Adicionados:</h3>
            <ul>
              {timeSlot.volunteers.map((volunteer, index) => (
                <li key={index} className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span>{volunteer}</span>
                  <Button variant="outline" size="sm" onClick={() => handleRemoveVolunteer(volunteer)} disabled={isLoading}>
                    Remover
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
