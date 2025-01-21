import React from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "./ui/scroll-area";
import { dataOperations } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";

const TimeSlotsList = () => {
  const lockedWeekStart = localStorage.getItem('lockedWeekStart');
  const lockedWeekEnd = localStorage.getItem('lockedWeekEnd');

  const { data: timeSlots = [], isLoading } = useQuery({
    queryKey: ["timeSlots", lockedWeekStart, lockedWeekEnd],
    queryFn: async () => {
      const slots = await dataOperations.fetch();
      console.log("Fetched slots:", slots);

      if (lockedWeekStart && lockedWeekEnd) {
        const startDate = new Date(lockedWeekStart);
        const endDate = new Date(lockedWeekEnd);
        
        return slots.filter((slot: any) => {
          const slotDate = new Date(slot.date);
          return slotDate >= startDate && slotDate <= endDate;
        });
      }

      return slots;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando horários...</p>
      </div>
    );
  }

  if (!timeSlots.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Nenhum horário encontrado para esta semana.</p>
      </div>
    );
  }

  const groupedSlots = timeSlots.reduce((acc: any, slot: any) => {
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

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] px-4">
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date} className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold mb-3">
              {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <div className="space-y-3">
              {groupedSlots[date].map((slot: any) => (
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
                        {slot.volunteers.map((volunteer: string, index: number) => (
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

export default TimeSlotsList;