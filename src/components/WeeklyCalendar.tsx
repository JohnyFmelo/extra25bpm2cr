import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Lock, Pencil, Trash2, Eye } from "lucide-react";
import { format, addWeeks, subWeeks, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import TimeSlotDialog from "./TimeSlotDialog";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  slots: number;
  slotsUsed: number;
  id?: string;
}

interface WeeklyCalendarProps {
  className?: string;
  isLocked?: boolean;
  onLockChange?: (isLocked: boolean) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
}

const WeeklyCalendar = ({ 
  className,
  isLocked: externalIsLocked,
  onLockChange,
  currentDate: externalCurrentDate,
  onDateChange
}: WeeklyCalendarProps) => {
  const [internalIsLocked, setInternalIsLocked] = useState(false);
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllWeekSlots, setShowAllWeekSlots] = useState(false);
  const { toast } = useToast();

  const isLocked = externalIsLocked !== undefined ? externalIsLocked : internalIsLocked;
  const currentDateValue = externalCurrentDate !== undefined ? externalCurrentDate : internalCurrentDate;
  
  const weekDays = ["ter", "qua", "qui", "sex", "sáb", "dom", "seg"];
  const fullWeekDays = ["terça", "quarta", "quinta", "sexta", "sábado", "domingo", "segunda"];
  const currentMonth = format(currentDateValue, "MMMM yyyy", { locale: ptBR });
  const isMobile = useIsMobile();

  const hasTimeSlotsForDate = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return timeSlots.some(slot => format(slot.date, 'yyyy-MM-dd') === formattedDate);
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const fetchTimeSlots = async () => {
    try {
      setIsLoading(true);
      const data = await dataOperations.fetch();
      console.log('Fetched data:', data);

      if (!Array.isArray(data)) {
        throw new Error('Invalid data format');
      }

      const formattedSlots = data.map((slot: any) => ({
        id: slot.id,
        date: parseISO(slot.date),
        startTime: slot.start_time ? slot.start_time.slice(0, 5) : "00:00",
        endTime: slot.end_time ? slot.end_time.slice(0, 5) : "00:00",
        slots: slot.total_slots || slot.slots || 0,
        slotsUsed: slot.slots_used || 0
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

  const handleClearData = async () => {
    try {
      const result = await dataOperations.clear();
      if (result.success) {
        setTimeSlots([]);
        toast({
          title: "Sucesso",
          description: "Todos os horários foram removidos.",
        });
      } else {
        throw new Error('Failed to clear data');
      }
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar os horários.",
        variant: "destructive"
      });
    }
  };

  const formatTimeForDB = (time: string) => {
    return time.includes(":") ? `${time}:00` : `${time}:00:00`;
  };

  const handleTimeSlotAdd = async (timeSlot: TimeSlot) => {
    try {
      const formattedDate = format(timeSlot.date, 'yyyy-MM-dd');
      
      const existingSlots = timeSlots.filter(slot => 
        format(slot.date, 'yyyy-MM-dd') === formattedDate
      );

      const hasOverlap = existingSlots.some(slot => {
        const newStart = timeSlot.startTime;
        const newEnd = timeSlot.endTime;
        const existingStart = slot.startTime;
        const existingEnd = slot.endTime;

        return (
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        );
      });

      if (hasOverlap) {
        toast({
          title: "Horário indisponível",
          description: "Já existe um horário cadastrado que conflita com este período.",
          variant: "destructive"
        });
        return;
      }

      const result = await dataOperations.insert({
        date: formattedDate,
        start_time: formatTimeForDB(timeSlot.startTime),
        end_time: formatTimeForDB(timeSlot.endTime),
        total_slots: timeSlot.slots,
        slots_used: 0
      });

      if (!result.success) {
        throw new Error('Failed to insert time slot');
      }

      await fetchTimeSlots();
      setIsDialogOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Horário adicionado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao adicionar horário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o horário.",
        variant: "destructive"
      });
    }
  };

  const handleTimeSlotEdit = async (updatedTimeSlot: TimeSlot) => {
    if (!editingTimeSlot) return;
    
    try {
      const result = await dataOperations.update(
        {
          date: format(updatedTimeSlot.date, 'yyyy-MM-dd'),
          start_time: formatTimeForDB(updatedTimeSlot.startTime),
          end_time: formatTimeForDB(updatedTimeSlot.endTime),
          total_slots: updatedTimeSlot.slots,
          slots_used: updatedTimeSlot.slotsUsed
        },
        {
          date: format(editingTimeSlot.date, 'yyyy-MM-dd'),
          start_time: formatTimeForDB(editingTimeSlot.startTime),
          end_time: formatTimeForDB(editingTimeSlot.endTime)
        }
      );

      if (!result.success) {
        throw new Error('Failed to update time slot');
      }

      await fetchTimeSlots();
      setIsDialogOpen(false);
      setEditingTimeSlot(null);
      
      toast({
        title: "Sucesso",
        description: "Horário atualizado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao atualizar horário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o horário.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTimeSlot = async (timeSlot: TimeSlot) => {
    try {
      console.log('Deleting time slot:', timeSlot);
      const result = await dataOperations.delete({
        date: format(timeSlot.date, 'yyyy-MM-dd'),
        start_time: formatTimeForDB(timeSlot.startTime),
        end_time: formatTimeForDB(timeSlot.endTime)
      });

      if (!result.success) {
        throw new Error('Failed to delete time slot');
      }

      await fetchTimeSlots();
      
      toast({
        title: "Sucesso",
        description: "Horário excluído com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao excluir horário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o horário.",
        variant: "destructive"
      });
    }
  };

  const handlePreviousWeek = () => {
    if (!isLocked) {
      const newDate = subWeeks(currentDateValue, 1);
      if (onDateChange) {
        onDateChange(newDate);
      } else {
        setInternalCurrentDate(newDate);
      }
      setShowAllWeekSlots(false);
    }
  };

  const handleNextWeek = () => {
    if (!isLocked) {
      const newDate = addWeeks(currentDateValue, 1);
      if (onDateChange) {
        onDateChange(newDate);
      } else {
        setInternalCurrentDate(newDate);
      }
      setShowAllWeekSlots(false);
    }
  };

  const toggleLock = () => {
    const newLockState = !isLocked;
    if (onLockChange) {
      onLockChange(newLockState);
    } else {
      setInternalIsLocked(newLockState);
    }
  };

  const handleDayClick = (date: Date) => {
    console.log('Dia selecionado:', date);
    setSelectedDate(date);
    setShowAllWeekSlots(false);
  };

  const handlePlusClick = () => {
    if (selectedDate) {
      setEditingTimeSlot(null);
      setIsDialogOpen(true);
    }
  };

  const handleEyeClick = () => {
    setShowAllWeekSlots(prev => !prev);
    setSelectedDate(null);
  };

  const handleEditClick = (timeSlot: TimeSlot) => {
    setEditingTimeSlot(timeSlot);
    setIsDialogOpen(true);
  };

  const getTimeSlotsForDate = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return timeSlots.filter(slot => format(slot.date, 'yyyy-MM-dd') === formattedDate);
  };

  const getCurrentWeekTimeSlots = () => {
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - currentDate.getDay() + 2); // Adjust to start from Tuesday
    
    const weekSlots = [];
    for (let i = 0; i < 7; i++) {
      const currentDateInWeek = new Date(startDate);
      currentDateInWeek.setDate(startDate.getDate() + i);
      const slotsForDay = getTimeSlotsForDate(currentDateInWeek);
      if (slotsForDay.length > 0) {
        weekSlots.push({
          date: currentDateInWeek,
          slots: slotsForDay
        });
      }
    }
    return weekSlots;
  };

  const getDaysOfWeek = () => {
    const days = [];
    const startDate = new Date(currentDate);
    const currentDay = startDate.getDay();
    const daysToSubtract = (currentDay + 5) % 7; // Calculate days to subtract to reach Tuesday
    startDate.setDate(currentDate.getDate() - daysToSubtract);

    for (let i = 0; i < 7; i++) {
      const currentDateInWeek = new Date(startDate);
      currentDateInWeek.setDate(startDate.getDate() + i);
      days.push({
        dayName: isMobile ? weekDays[i] : fullWeekDays[i],
        date: currentDateInWeek.getDate(),
        fullDate: currentDateInWeek,
        isToday: currentDateInWeek.toDateString() === new Date().toDateString(),
        hasTimeSlots: hasTimeSlotsForDate(currentDateInWeek)
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
          <Button 
            variant="outline" 
            size="icon" 
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              showAllWeekSlots && "bg-gray-100"
            )}
            onClick={handleEyeClick}
          >
            <Eye className="h-4 w-4" />
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
                day.isToday && "border border-black rounded-lg",
                selectedDate?.toDateString() === day.fullDate.toDateString() && "bg-gray-200 hover:bg-gray-300",
                day.hasTimeSlots && "bg-[#F2FCE2]"
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
      
      {showAllWeekSlots ? (
        <div className="mt-4 space-y-4">
          {getCurrentWeekTimeSlots().map(({ date, slots }) => (
            <div key={format(date, 'yyyy-MM-dd')} className="space-y-2">
              <h3 className="font-medium text-gray-700">
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </h3>
              {slots.map((slot, index) => (
                <div
                  key={slot.id || index}
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
          ))}
        </div>
      ) : selectedDate && (
        <div className="mt-4 space-y-2">
          {getTimeSlotsForDate(selectedDate).map((slot, index) => (
            <div
              key={slot.id || index}
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
