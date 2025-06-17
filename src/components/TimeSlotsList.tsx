import React, { useState, useEffect } from "react";
import { format, isToday, isPast, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { TimeSlot, FirebaseTimeSlot } from "@/types/timeSlot";
import TimeSlotDialog from "./TimeSlotDialog";
import AddVolunteerToSlotDialog from "./AddVolunteerToSlotDialog";
import AbsencesList from "./AbsencesList";
import { parseISO } from "date-fns";

interface GroupedTimeSlots {
  [key: string]: TimeSlot[];
}

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const isAdmin = userData?.userType === 'admin';

  useEffect(() => {
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection, orderBy('date', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(doc => {
        const data = doc.data() as FirebaseTimeSlot;
        let dateValue: Date;
        const dateField = data.date;
        
        if (!dateField) {
          dateValue = new Date();
        } else if (dateField && typeof dateField === 'object' && 'toDate' in dateField) {
          dateValue = (dateField as any).toDate();
        } else if (typeof dateField === 'string') {
          dateValue = parseISO(dateField);
        } else {
          dateValue = new Date(dateField || new Date());
        }
        
        return {
          id: doc.id,
          date: dateValue,
          startTime: data.start_time ? data.start_time.slice(0, 5) : "00:00",
          endTime: data.end_time ? data.end_time.slice(0, 5) : "00:00",
          slots: data.total_slots || 0,
          slotsUsed: data.slots_used || 0,
          description: data.description || "",
          volunteers: data.volunteers || []
        };
      });

      // Auto-minimize past dates (including today) for non-admin users
      if (!isAdmin) {
        const pastDates = new Set<string>();
        formattedSlots.forEach(slot => {
          const slotDate = startOfDay(slot.date);
          const today = startOfDay(new Date());
          if (slotDate <= today) {
            pastDates.add(format(slot.date, 'yyyy-MM-dd'));
          }
        });
        setCollapsedDates(pastDates);
      } else {
        // For admin users, auto-minimize only past dates (excluding today)
        const pastDates = new Set<string>();
        formattedSlots.forEach(slot => {
          if (isPast(startOfDay(slot.date)) && !isToday(slot.date)) {
            pastDates.add(format(slot.date, 'yyyy-MM-dd'));
          }
        });
        setCollapsedDates(pastDates);
      }

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
  }, [toast, isAdmin]);

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

  const groupTimeSlotsByDate = (slots: TimeSlot[]): GroupedTimeSlots => {
    return slots.reduce((groups: GroupedTimeSlots, slot) => {
      const dateKey = format(slot.date, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(slot);
      return groups;
    }, {});
  };

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const onTimeSlotCreated = () => {
    // The real-time listener will automatically update the list
  };

  const groupedTimeSlots = groupTimeSlotsByDate(timeSlots);

  if (isLoading) {
    return <div className="text-center py-4">Carregando horários...</div>;
  }

  const shouldShowPastDates = (dateKey: string) => {
    if (isAdmin) return true;
    const slotDate = startOfDay(new Date(dateKey));
    const today = startOfDay(new Date());
    return slotDate > today;
  };

  return (
    <div className="space-y-6 pb-4 mb-16">
      <AbsencesList />
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Horários de Serviço</h2>
        {isAdmin && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Horário
          </Button>
        )}
      </div>

      {Object.keys(groupedTimeSlots).length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum horário encontrado.
        </div>
      ) : (
        Object.entries(groupedTimeSlots)
          .filter(([dateKey]) => shouldShowPastDates(dateKey))
          .map(([dateKey, slots]) => {
            const isCollapsed = collapsedDates.has(dateKey);
            const date = new Date(dateKey);
            const isPastDate = isPast(startOfDay(date)) && !isToday(date);
            const isTodayDate = isToday(date);

            return (
              <div key={dateKey} className="space-y-4">
                <div 
                  className={`flex items-center justify-between cursor-pointer p-3 rounded-lg border ${
                    isPastDate ? 'bg-gray-50 border-gray-200' : 
                    isTodayDate ? 'bg-blue-50 border-blue-200' : 
                    'bg-white border-gray-200'
                  }`}
                  onClick={() => toggleDateCollapse(dateKey)}
                >
                  <h3 className={`font-medium text-lg ${
                    isPastDate ? 'text-gray-600' : 
                    isTodayDate ? 'text-blue-800' : 
                    'text-gray-900'
                  }`}>
                    {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
                    {isTodayDate && <span className="ml-2 text-sm bg-blue-100 px-2 py-1 rounded-full">Hoje</span>}
                    {isPastDate && <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded-full">Passado</span>}
                  </h3>
                  {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </div>
                
                {!isCollapsed && (
                  <div className="space-y-4 ml-4">
                    {slots.map((slot) => (
                      <div 
                        key={slot.id} 
                        className={`border rounded-lg p-4 space-y-3 ${
                          isPastDate ? 'bg-gray-50 border-gray-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`font-medium ${isPastDate ? 'text-gray-600' : ''}`}>
                              {slot.startTime} às {slot.endTime} - {calculateTimeDifference(slot.startTime, slot.endTime)}
                            </p>
                            {slot.description && (
                              <p className={`text-sm mt-1 ${isPastDate ? 'text-gray-500' : 'text-gray-600'}`}>
                                {slot.description}
                              </p>
                            )}
                          </div>
                          {isAdmin && (
                            <AddVolunteerToSlotDialog 
                              timeSlot={slot} 
                              onVolunteerAdded={onTimeSlotCreated}
                            />
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${isPastDate ? 'text-gray-500' : 'text-gray-600'}`}>
                            Vagas: {slot.slotsUsed}/{slot.slots}
                          </span>
                        </div>

                        {slot.volunteers && slot.volunteers.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className={`text-sm font-medium mb-1 ${isPastDate ? 'text-gray-600' : ''}`}>
                              Voluntários:
                            </p>
                            <div className="space-y-1">
                              {slot.volunteers.map((volunteer, index) => (
                                <p key={index} className={`text-sm ${isPastDate ? 'text-gray-500' : 'text-gray-600'}`}>
                                  {volunteer}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
      )}

      <TimeSlotDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={new Date()}
        onAddTimeSlot={() => {}}
        onEditTimeSlot={() => {}}
        editingTimeSlot={null}
      />
    </div>
  );
};

export default TimeSlotsList;
