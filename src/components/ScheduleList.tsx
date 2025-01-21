import React from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "./ui/scroll-area";
import { dataOperations } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[];
}

interface GroupedTimeSlots {
  [date: string]: TimeSlot[];
}

const ScheduleList = () => {
  const { data: timeSlots = [], isLoading } = useQuery({
    queryKey: ["timeSlots"],
    queryFn: async () => {
      const slots = await dataOperations.fetch();
      console.log("Fetched slots:", slots);
      return slots.filter((slot: TimeSlot) => 
        slot.slots_used === slot.total_slots || 
        (slot.slots_used === 1 && slot.total_slots === 1)
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando horários...</p>
      </div>
    );
  }

  const groupedSlots = timeSlots.reduce((acc: GroupedTimeSlots, slot: TimeSlot) => {
    const date = slot.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSlots).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  if (sortedDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Nenhum horário completamente preenchido encontrado.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] px-4">
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date} className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold mb-3">
              {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <div className="space-y-3">
              {groupedSlots[date].map((slot: TimeSlot) => (
                <div
                  key={slot.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                >
                  <p className="font-medium">
                    {slot.start_time.slice(0, 5)} às {slot.end_time.slice(0, 5)}
                  </p>
                  <div className="mt-2 text-sm text-gray-600">
                    {slot.volunteers ? (
                      <div className="space-y-1">
                        {slot.volunteers.map((volunteer, index) => (
                          <p key={index}>{volunteer}</p>
                        ))}
                      </div>
                    ) : (
                      <p>Vagas preenchidas: {slot.slots_used}/{slot.total_slots}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ScheduleList;