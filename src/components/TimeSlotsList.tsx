import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase";
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

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [volunteerName] = useState("3° Sgt Johny Melo");

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const fetchTimeSlots = async () => {
    try {
      setIsLoading(true);
      const data = await dataOperations.fetch();
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format');
      }

      const formattedSlots = data.map((slot: any) => ({
        id: slot.id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        total_slots: slot.total_slots || slot.slots || 0,
        slots_used: slot.slots_used || 0,
        volunteers: slot.volunteers || []
      }));

      setTimeSlots(formattedSlots);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast({
        title: "Erro ao carregar horários",
        description: "Não foi possível carregar os horários.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolunteer = async (timeSlot: TimeSlot) => {
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

      await fetchTimeSlots();
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

      await fetchTimeSlots();
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

  const isLastSlot = (timeSlot: TimeSlot) => {
    return timeSlot.slots_used === timeSlot.total_slots - 1;
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
                className={`border rounded-lg p-4 space-y-3 ${isLastSlot(slot) ? 'bg-orange-100' : ''}`}
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
                  {slot.slots_used < slot.total_slots && !isVolunteered(slot) ? (
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