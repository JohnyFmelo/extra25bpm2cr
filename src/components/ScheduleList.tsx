import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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

const ScheduleList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const calculateTimeDifference = (startTime: string, endTime: string): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    // Detecta quando é meia-noite e ajusta para 24
    let [endHour, endMinute] = endTime.split(':').map(Number);
    if (endHour === 0) endHour = 24;
    
    let diffHours = endHour - startHour;
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
        title: "Erro ao atualizar escala",
        description: "Não foi possível receber atualizações em tempo real.",
        variant: "destructive"
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const shouldShowTimeSlot = (slot: TimeSlot) => {
    if (!slot.volunteers || slot.volunteers.length === 0) {
      return false;
    }

    if (slot.total_slots === 1) {
      return slot.volunteers.length === 1;
    }

    return slot.volunteers.length > 1;
  };

  const groupTimeSlotsByDate = (slots: TimeSlot[]): GroupedTimeSlots => {
    return slots.reduce((groups: GroupedTimeSlots, slot) => {
      if (shouldShowTimeSlot(slot)) {
        const date = slot.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(slot);
      }
      return groups;
    }, {});
  };

  const groupedTimeSlots = groupTimeSlotsByDate(timeSlots);

  if (isLoading) {
    return <div className="text-center py-4">Carregando escala...</div>;
  }

  if (Object.keys(groupedTimeSlots).length === 0) {
    return <div className="text-center py-4">Nenhum horário encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedTimeSlots).sort().map(([date, slots]) => (
        <div key={date} className="space-y-4">
          <h3 className="font-medium text-lg">
            {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
          </h3>
          <div className="space-y-4">
            {slots.map((slot) => (
              <div 
                key={slot.id} 
                className="border rounded-lg p-4 space-y-3"
              >
                <div>
                  <p className="font-medium">
                    {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)} - {calculateTimeDifference(slot.start_time, slot.end_time)}
                  </p>
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

export default ScheduleList;
