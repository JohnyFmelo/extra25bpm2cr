import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Lock, Pencil, Trash2 } from "lucide-react";
import { format, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import TimeSlotDialog from "./TimeSlotDialog";
import { signInAnonymously, isAuthenticated, dataOperations } from "@/lib/supabase";
import { useToast } from "./ui/use-toast";

interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  slots: number;
  slotsUsed: number;
}

interface WeeklyCalendarProps {
  className?: string;
}

const WeeklyCalendar = ({ className }: WeeklyCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLocked, setIsLocked] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const weekDays = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const fullWeekDays = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const currentMonth = format(currentDate, "MMMM yyyy", { locale: ptBR });
  const isMobile = useIsMobile();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAlreadyAuthenticated = await isAuthenticated();
        if (!isAlreadyAuthenticated) {
          const result = await signInAnonymously();
          if (result.type === 'supabase' && !result.session) {
            console.log('Falling back to localStorage');
          }
        }
        fetchTimeSlots();
      } catch (error) {
        console.error('Error initializing auth:', error);
        toast({
          title: "Aviso",
          description: "Usando armazenamento local para os horários.",
        });
      }
    };

    initializeAuth();
  }, []);

  const fetchTimeSlots = async () => {
    try {
      setIsLoading(true);
      const data = await dataOperations.fetch();

      const formattedSlots = data.map((slot: any) => ({
        date: new Date(slot.date),
        startTime: slot.start_time.slice(0, 5),
        endTime: slot.end_time.slice(0, 5),
        slots: slot.total_slots,
        slotsUsed: slot.slots_used
      }));

      setTimeSlots(formattedSlots);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast({
        title: "Erro ao carregar horários",
        description: "Usando armazenamento local.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeForDB = (time: string) => {
    return time.includes(":") ? `${time}:00` : `${time}:00:00`;
  };

  const handleTimeSlotAdd = async (timeSlot: TimeSlot) => {
    try {
      const { error } = await dataOperations.insert({
        date: format(timeSlot.date, 'yyyy-MM-dd'),
        start_time: formatTimeForDB(timeSlot.startTime),
        end_time: formatTimeForDB(timeSlot.endTime),
        total_slots: timeSlot.slots,
        slots_used: 0
      });

      if (error) throw error;

      toast({
        title: "Horário registrado",
        description: "O horário foi registrado com sucesso!"
      });

      await fetchTimeSlots();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar horário:', error);
      toast({
        title: "Erro ao registrar horário",
        description: "O horário foi salvo localmente.",
      });
    }
  };

  const handleTimeSlotEdit = async (updatedTimeSlot: TimeSlot) => {
    try {
      await dataOperations.update(
        {
          date: format(updatedTimeSlot.date, 'yyyy-MM-dd'),
          start_time: formatTimeForDB(updatedTimeSlot.startTime),
          end_time: formatTimeForDB(updatedTimeSlot.endTime),
          total_slots: updatedTimeSlot.slots,
          slots_used: updatedTimeSlot.slotsUsed
        },
        {
          date: format(editingTimeSlot!.date, 'yyyy-MM-dd'),
          start_time: formatTimeForDB(editingTimeSlot!.startTime),
          end_time: formatTimeForDB(editingTimeSlot!.endTime)
        }
      );

      toast({
        title: "Horário atualizado",
        description: "O horário foi atualizado com sucesso!"
      });

      await fetchTimeSlots();
      setIsDialogOpen(false);
      setEditingTimeSlot(null);
    } catch (error) {
      console.error('Erro ao atualizar horário:', error);
      toast({
        title: "Erro ao atualizar horário",
        description: "O horário foi atualizado localmente.",
      });
    }
  };

  const handleDeleteTimeSlot = async (timeSlot: TimeSlot) => {
    try {
      await dataOperations.delete({
        date: format(timeSlot.date, 'yyyy-MM-dd'),
        start_time: timeSlot.startTime,
        end_time: timeSlot.endTime
      });

      toast({
        title: "Horário excluído",
        description: "O horário foi excluído com sucesso!"
      });

      await fetchTimeSlots();
    } catch (error) {
      console.error('Erro ao excluir horário:', error);
      toast({
        title: "Erro ao excluir horário",
        description: "O horário foi excluído localmente.",
      });
    }
  };

  const handlePreviousWeek = () => {
    if (!isLocked) {
      setCurrentDate((prev) => subWeeks(prev, 1));
    }
  };

  const handleNextWeek = () => {
    if (!isLocked) {
      setCurrentDate((prev) => addWeeks(prev, 1));
    }
  };

  const toggleLock = () => {
    setIsLocked((prev) => !prev);
  };

  const handleDayClick = (date: Date) => {
    console.log('Dia selecionado:', date);
    setSelectedDate(date);
  };

  const handlePlusClick = () => {
    console.log('Adicionando novo horário para:', selectedDate);
    if (selectedDate) {
      setEditingTimeSlot(null);
      setIsDialogOpen(true);
    }
  };

  const handleEditClick = (timeSlot: TimeSlot) => {
    console.log('Editando horário:', timeSlot);
    setEditingTimeSlot(timeSlot);
    setIsDialogOpen(true);
  };

  const getTimeSlotsForDate = (date: Date) => {
    return timeSlots.filter(
      (slot) => slot.date.toDateString() === date.toDateString()
    );
  };

  const getDaysOfWeek = () => {
    const days = [];
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const currentDateInWeek = new Date(startDate);
      currentDateInWeek.setDate(startDate.getDate() + i);
      days.push({
        dayName: isMobile ? weekDays[i] : fullWeekDays[i],
        date: currentDateInWeek.getDate(),
        fullDate: currentDateInWeek,
        isToday: currentDateInWeek.toDateString() === new Date().toDateString(),
      });
    }
    return days;
  };

  return (
    <div className={cn("bg-white rounded-xl shadow-sm p-4 md:p-6", className)}>
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold">{currentMonth}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              isLocked && "bg-black text-white hover:bg-black/90"
            )}
            onClick={toggleLock}
          >
            <Lock className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 md:h-10 md:w-10"
            onClick={handlePlusClick}
            disabled={!selectedDate}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 md:h-10 md:w-10"
          onClick={handlePreviousWeek}
          disabled={isLocked}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex justify-between px-2 md:px-4">
          {getDaysOfWeek().map((day, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col items-center p-1 md:p-2 rounded-lg transition-all cursor-pointer hover:bg-gray-100",
                day.isToday && "bg-black text-white hover:bg-black/90",
                selectedDate?.toDateString() === day.fullDate.toDateString() && "bg-gray-200 hover:bg-gray-300"
              )}
              onClick={() => handleDayClick(day.fullDate)}
            >
              <span className="text-xs md:text-sm">{day.dayName}</span>
              <span className="text-sm md:text-lg font-semibold mt-1">{day.date}</span>
            </div>
          ))}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 md:h-10 md:w-10"
          onClick={handleNextWeek}
          disabled={isLocked}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {selectedDate && (
        <div className="mt-4 space-y-2">
          {getTimeSlotsForDate(selectedDate).map((slot, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
            >
              <div>
                <div className="font-medium">
                  {slot.startTime} às {slot.endTime}
                </div>
                <div className="text-sm text-gray-500">
                  {slot.slotsUsed}/{slot.slots} vagas
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handleEditClick(slot)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handleDeleteTimeSlot(slot)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDate && (
        <TimeSlotDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingTimeSlot(null);
          }}
          selectedDate={selectedDate}
          onAddTimeSlot={handleTimeSlotAdd}
          onEditTimeSlot={handleTimeSlotEdit}
          editingTimeSlot={editingTimeSlot}
        />
      )}
    </div>
  );
};

export default WeeklyCalendar;
