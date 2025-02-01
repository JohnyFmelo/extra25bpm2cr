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

  const calculateTimeDifference = (startTime: string, endTime: string): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Ajuste para quando o horário final é 00:00 (meia-noite)
    let adjustedEndHour = endHour;
    if (endHour === 0) {
      adjustedEndHour = 24;
    }
    
    let diffHours = adjustedEndHour - startHour;
    let diffMinutes = endMinute - startMinute;
    
    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }
    
    // Se ainda houver minutos, adiciona ao resultado
    const hourText = diffHours > 0 ? `${diffHours}h` : '';
    const minuteText = diffMinutes > 0 ? `${diffMinutes}min` : '';
    
    return `${hourText}${minuteText}`;
  };

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

  const formatDateHeader = (date: string) => {
    return format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const shouldShowVolunteerButton = (slot: TimeSlot) => {
    // Get user data from localStorage
    const userDataString = localStorage.getItem('user');
    const userData = userDataString ? JSON.parse(userDataString) : null;
    
    // If user is in "Estágio", don't show the volunteer button
    if (userData?.rank === "Estágio") {
      return false;
    }

    // If the current user is volunteered for this slot, show the unvolunteer button
    if (isVolunteered(slot)) {
      return true;
    }

    // If the slot is full, show the "Vagas Esgotadas" button
    if (isSlotFull(slot)) {
      return true;
    }

    // Check if user is volunteered for any slot on this date
    const slotsForDate = timeSlots.filter(s => s.date === slot.date);
    const isVolunteeredForDate = slotsForDate.some(s => 
      s.volunteers?.includes(volunteerName)
    );

    // Only show the volunteer button if user is not volunteered for any slot on this date
    return !isVolunteeredForDate;
  };

  const groupedTimeSlots = groupTimeSlotsByDate(timeSlots);

  if (isLoading) {
    return <div className="p-4">Carregando horários...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {Object.entries(groupedTimeSlots).sort().map(([date, slots]) => (
        <div key={date} className="bg-white rounded-lg shadow-sm p-4 md:p-5">
          <h3 className="font-medium text-lg mb-3 text-gray-800">
            {formatDateHeader(date)}
          </h3>
          <div className="space-y-3">
            {slots.map((slot) => (
              <div 
                key={slot.id} 
                className={`border rounded-lg p-3 space-y-2 ${isSlotFull(slot) ? 'bg-orange-50' : 'bg-gray-50'}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">
                      {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)} - {calculateTimeDifference(slot.start_time, slot.end_time)}
                    </p>
                    {slot.slots_used < slot.total_slots && (
                      <p className="text-sm text-gray-600">
                        {slot.total_slots - slot.slots_used} {slot.total_slots - slot.slots_used === 1 ? 'vaga' : 'vagas'}
                      </p>
                    )}
                  </div>
                  {shouldShowVolunteerButton(slot) && (
                    isVolunteered(slot) ? (
                      <Button 
                        onClick={() => handleUnvolunteer(slot)}
                        variant="destructive"
                        size="sm"
                      >
                        Desmarcar
                      </Button>
                    ) : !isSlotFull(slot) ? (
                      <Button 
                        onClick={() => handleVolunteer(slot)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        size="sm"
                      >
                        Voluntário
                      </Button>
                    ) : (
                      <Button disabled size="sm">
                        Vagas Esgotadas
                      </Button>
                    )
                  )}
                </div>
                {slot.volunteers && slot.volunteers.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm font-medium mb-1 text-gray-700">Voluntários:</p>
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