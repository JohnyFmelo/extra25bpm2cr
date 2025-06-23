
import React, { useState, useEffect } from "react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, onSnapshot, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { UserPlus, User, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import AddVolunteerDialog from "./AddVolunteerDialog";

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[];
  description?: string;
  allowedMilitaryTypes?: string[];
}

interface GroupedTimeSlots {
  [key: string]: TimeSlot[];
}

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddVolunteerDialog, setShowAddVolunteerDialog] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.userType === "admin";

  const calculateTimeDifference = (startTime: string, endTime: string): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    if (endHour === 0) endHour = 24;
    
    let diffHours = endHour - startHour;
    let diffMinutes = endMinute - startMinute;
    
    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }
    
    const hourText = diffHours > 0 ? `${diffHours}h` : '';
    const minuteText = diffMinutes > 0 ? `${diffMinutes}min` : '';
    
    return `${hourText}${minuteText}`;
  };

  useEffect(() => {
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(
      timeSlotsCollection,
      orderBy('date', 'asc')
    );
    
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
          description: data.description || "",
          allowedMilitaryTypes: data.allowedMilitaryTypes || []
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

  const handleAddVolunteer = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setShowAddVolunteerDialog(true);
  };

  const handleVolunteerAdded = () => {
    setShowAddVolunteerDialog(false);
    setSelectedTimeSlot(null);
  };

  const filteredTimeSlots = isAdmin ? timeSlots : timeSlots.filter(shouldShowTimeSlot);
  const groupedTimeSlots = isAdmin ? 
    timeSlots.reduce((groups: GroupedTimeSlots, slot) => {
      const date = slot.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(slot);
      return groups;
    }, {}) : 
    groupTimeSlotsByDate(timeSlots);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Carregando escala...</span>
      </div>
    );
  }

  if (Object.keys(groupedTimeSlots).length === 0) {
    return (
      <div className="text-center py-10">
        <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum horário encontrado</h3>
        <p className="text-gray-500">
          {isAdmin ? "Não há horários cadastrados no sistema." : "Não há escalas disponíveis no momento."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4 mb-16">
      {Object.entries(groupedTimeSlots)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, slots]) => {
          try {
            const parsedDate = parseISO(date);
            if (!isValid(parsedDate)) {
              console.warn('Invalid date found:', date);
              return null;
            }

            const formattedDate = format(parsedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
              .replace(/^\w/, (c) => c.toUpperCase());

            return (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-lg text-gray-800">{formattedDate}</h3>
                </div>
                
                <div className="grid gap-4">
                  {slots
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((slot) => (
                      <Card 
                        key={slot.id} 
                        className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-green-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 text-gray-800">
                                <Clock className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-lg">
                                  {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)}
                                </span>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {calculateTimeDifference(slot.start_time, slot.end_time)}
                                </span>
                              </div>
                              
                              {slot.description && (
                                <p className="text-sm text-gray-600 italic">
                                  {slot.description}
                                </p>
                              )}

                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  Vagas: {slot.slots_used}/{slot.total_slots}
                                </span>
                                <div className={`h-2 w-2 rounded-full ${
                                  slot.slots_used >= slot.total_slots ? 'bg-red-500' : 
                                  slot.slots_used > slot.total_slots / 2 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}></div>
                              </div>

                              {slot.allowedMilitaryTypes && slot.allowedMilitaryTypes.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-purple-600" />
                                  <div className="flex flex-wrap gap-1">
                                    {slot.allowedMilitaryTypes.map((type, idx) => (
                                      <span 
                                        key={idx} 
                                        className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium"
                                      >
                                        {type}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {slot.volunteers && slot.volunteers.length > 0 && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    Voluntários escalados:
                                  </h4>
                                  <div className="grid gap-1">
                                    {slot.volunteers.map((volunteer, index) => (
                                      <div 
                                        key={index} 
                                        className="flex items-center gap-2 text-sm text-gray-600 bg-white p-2 rounded border"
                                      >
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>{volunteer}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {isAdmin && slot.slots_used < slot.total_slots && (
                              <Button
                                onClick={() => handleAddVolunteer(slot)}
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white ml-4"
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Adicionar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            );
          } catch (error) {
            console.warn('Error formatting date:', date, error);
            return null;
          }
        })
        .filter(Boolean)}

      {selectedTimeSlot && (
        <AddVolunteerDialog
          open={showAddVolunteerDialog}
          onOpenChange={setShowAddVolunteerDialog}
          timeSlot={selectedTimeSlot}
          onVolunteerAdded={handleVolunteerAdded}
        />
      )}
    </div>
  );
};

export default TimeSlotsList;
