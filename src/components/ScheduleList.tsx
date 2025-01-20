import React, { useEffect, useState } from "react";
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
  const { toast } = useToast();

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
    }, (error) => {
      console.error('Error listening to time slots:', error);
      toast({
        title: "Erro ao carregar escala",
        description: "Não foi possível receber atualizações em tempo real.",
        variant: "destructive"
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const groupTimeSlotsByDate = (slots: TimeSlot[]): GroupedTimeSlots => {
    return slots.reduce((groups: GroupedTimeSlots, slot) => {
      // Only include slots that are properly filled
      if (slot.slots_used === slot.total_slots || (slot.total_slots === 1 && slot.slots_used === 1)) {
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

  return (
    <div className="space-y-6 p-4">
      {Object.entries(groupedTimeSlots).sort().map(([date, slots]) => (
        <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-4">
          <h3 className="font-medium text-lg border-b pb-2 text-gray-900 dark:text-white">
            {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="grid gap-4">
            {slots.map((slot) => (
              <div 
                key={slot.id} 
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)}
                  </p>
                  {slot.volunteers && slot.volunteers.length > 0 && (
                    <div className="space-y-1">
                      {slot.volunteers.map((volunteer, index) => (
                        <p key={index} className="text-sm text-gray-600 dark:text-gray-300">
                          {volunteer}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScheduleList;