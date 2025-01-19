import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[];
}

interface GroupedTimeSlots {
  [key: string]: TimeSlot[];
}

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Get logged in user data from localStorage
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';

  useEffect(() => {
    // Set up real-time listener
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          volunteers: data.volunteers || [],
          slots_used: data.slots_used || 0,
          total_slots: data.total_slots || data.slots || 0,
        };
      });
      setTimeSlots(formattedSlots);
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to time slots:', error);
      toast({
        title: "Erro ao atualizar horários",
        description: "Não foi possível receber atualizações em tempo real.",
        variant: "destructive"
      });
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [toast]);

  const handleVolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    // Check if user is already registered in any slot for this date
    const slotsForDate = timeSlots.filter(slot => slot.date === timeSlot.date);
    const isAlreadyRegistered = slotsForDate.some(slot => 
      slot.volunteers?.includes(volunteerName)
    );

    if (isAlreadyRegistered) {
      toast({
        title: "Erro",
        description: "Você já está registrado em um horário nesta data.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used + 1,
        volunteers: [...(timeSlot.volunteers || []), volunteerName]
      };

      const result = await dataOperations.update(
        updatedSlot,
        {
          date: timeSlot.date,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time
        }
      );

      if (!result.success) {
        throw new Error('Failed to update time slot');
      }

      toast({
        title: "Sucesso",
        description: "Vaga reservada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao voluntariar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reservar a vaga.",
        variant: "destructive"
      });
    }
  };

  const handleUnvolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used - 1,
        volunteers: (timeSlot.volunteers || []).filter(v => v !== volunteerName)
      };

      const result = await dataOperations.update(
        updatedSlot,
        {
          date: timeSlot.date,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time
        }
      );

      if (!result.success) {
        throw new Error('Failed to update time slot');
      }

      toast({
        title: "Sucesso",
        description: "Vaga desmarcada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao desmarcar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desmarcar a vaga.",
        variant: "destructive"
      });
    }
  };

  const groupTimeSlotsByDate = (slots: TimeSlot[]): GroupedTimeSlots => {
    return slots.reduce((groups: GroupedTimeSlots, slot) => {
      const date = slot.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(slot);
      return groups;
    }, {});
  };

  const isVolunteered = (timeSlot: TimeSlot) => {
    return timeSlot.volunteers?.includes(volunteerName);
  };

  const isSlotFull = (timeSlot: TimeSlot) => {
    return timeSlot.slots_used === timeSlot.total_slots;
  };

  const groupedTimeSlots = groupTimeSlotsByDate(timeSlots);

  if (isLoading) {
    return <div className="p-4">Carregando horários...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {Object.entries(groupedTimeSlots).sort().map(([date, slots]) => (
        <div key={date} className="space-y-4">
          <h3 className="font-medium text-lg">
            {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="space-y-4">
            {slots.map((slot) => (
              <div 
                key={slot.id} 
                className={`border rounded-lg p-4 space-y-3 ${isSlotFull(slot) ? 'bg-orange-100' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {slot.slots_used}/{slot.total_slots} vagas ocupadas
                    </p>
                  </div>
                  {!isSlotFull(slot) && !isVolunteered(slot) ? (
                    <Button 
                      onClick={() => handleVolunteer(slot)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Voluntário
                    </Button>
                  ) : isVolunteered(slot) ? (
                    <Button 
                      onClick={() => handleUnvolunteer(slot)}
                      variant="destructive"
                    >
                      Desmarcar
                    </Button>
                  ) : (
                    <Button disabled>
                      Vagas Esgotadas
                    </Button>
                  )}
                </div>
                {slot.volunteers && slot.volunteers.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-1">Voluntários:</p>
                    <div className="space-y-1">
                      {slot.volunteers.map((volunteer, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          {volunteer}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimeSlotsList;