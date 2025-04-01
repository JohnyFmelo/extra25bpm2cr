
import { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TimeSlot, FirebaseTimeSlot } from "@/types/timeSlot";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export function useCalendar(externalCurrentDate?: Date, onDateChange?: (date: Date) => void) {
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllWeekSlots, setShowAllWeekSlots] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const currentDateValue = externalCurrentDate !== undefined ? externalCurrentDate : internalCurrentDate;

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const weekDays = ["Ter", "Qua", "Qui", "Sex", "Sáb", "Dom", "Seg"];
  const fullWeekDays = [" Ter ", " Qua ", " Qui ", " Sex ", " Sáb ", "Dom", " Seg "];
  const currentMonth = format(currentDateValue, "MMMM yyyy", { locale: ptBR });

  const hasTimeSlotsForDate = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return timeSlots.some(slot => format(slot.date, 'yyyy-MM-dd') === formattedDate);
  };

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
        slotsUsed: slot.slots_used || 0,
        description: slot.description || ""
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
          description: "Todos os horários foram removidos."
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
      if (timeSlot.isWeekly) {
        const startDate = timeSlot.date;
        const promises = [];
        for (let i = 0; i < 7; i++) {
          const currentDate = addDays(startDate, i);
          const formattedDate = format(currentDate, 'yyyy-MM-dd');
          promises.push(dataOperations.insert({
            date: formattedDate,
            start_time: formatTimeForDB(timeSlot.startTime),
            end_time: formatTimeForDB(timeSlot.endTime),
            total_slots: timeSlot.slots,
            slots_used: 0,
            description: timeSlot.description || ""
          }));
        }
        const results = await Promise.all(promises);
        const hasError = results.some(result => !result.success);
        if (hasError) {
          throw new Error('Failed to insert some time slots');
        }
        await fetchTimeSlots();
        toast({
          title: "Sucesso",
          description: "Horários semanais adicionados com sucesso!"
        });
      } else {
        const formattedDate = format(timeSlot.date, 'yyyy-MM-dd');
        const result = await dataOperations.insert({
          date: formattedDate,
          start_time: formatTimeForDB(timeSlot.startTime),
          end_time: formatTimeForDB(timeSlot.endTime),
          total_slots: timeSlot.slots,
          slots_used: 0,
          description: timeSlot.description || ""
        });
        if (!result.success) {
          throw new Error('Failed to insert time slot');
        }
        await fetchTimeSlots();
        toast({
          title: "Sucesso",
          description: "Horário adicionado com sucesso!"
        });
      }
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
      const result = await dataOperations.update({
        date: format(updatedTimeSlot.date, 'yyyy-MM-dd'),
        start_time: formatTimeForDB(updatedTimeSlot.startTime),
        end_time: formatTimeForDB(updatedTimeSlot.endTime),
        total_slots: updatedTimeSlot.slots,
        slots_used: updatedTimeSlot.slotsUsed,
        description: updatedTimeSlot.description || ""
      }, {
        date: format(editingTimeSlot.date, 'yyyy-MM-dd'),
        start_time: formatTimeForDB(editingTimeSlot.startTime),
        end_time: formatTimeForDB(editingTimeSlot.endTime)
      });
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

  const handleClearAllTimeSlots = async () => {
    await handleClearData();
    setShowDeleteAlert(false);
  };

  const handlePreviousWeek = () => {
    const newDate = subWeeks(currentDateValue, 1);
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalCurrentDate(newDate);
    }
    setShowAllWeekSlots(false);
  };

  const handleNextWeek = () => {
    const newDate = addWeeks(currentDateValue, 1);
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalCurrentDate(newDate);
    }
    setShowAllWeekSlots(false);
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
    const startDate = new Date(currentDateValue);
    startDate.setDate(currentDateValue.getDate() - currentDateValue.getDay() + 2);

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
    const startDate = new Date(currentDateValue);
    const currentDay = startDate.getDay();
    const daysToSubtract = (currentDay + 5) % 7;
    startDate.setDate(currentDateValue.getDate() - daysToSubtract);
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

  return {
    selectedDate,
    timeSlots,
    editingTimeSlot,
    isDialogOpen,
    showAllWeekSlots,
    showDeleteAlert,
    currentMonth,
    currentDateValue,
    isLoading,
    setShowDeleteAlert,
    setIsDialogOpen,
    setEditingTimeSlot,
    handleTimeSlotAdd,
    handleTimeSlotEdit,
    handleDeleteTimeSlot,
    handleClearAllTimeSlots,
    handlePreviousWeek,
    handleNextWeek,
    handleDayClick,
    handlePlusClick,
    handleEyeClick,
    handleEditClick,
    getTimeSlotsForDate,
    getCurrentWeekTimeSlots,
    getDaysOfWeek
  };
}
