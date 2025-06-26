import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, Eye, Trash, Calendar, Info, AlertTriangle, UserPlus } from "lucide-react";
import { format, addWeeks, subWeeks, parseISO, addDays, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import TimeSlotDialog from "./TimeSlotDialog";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { TimeSlot, FirebaseTimeSlot } from "@/types/timeSlot";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AddVolunteerToSlotDialog from "./AddVolunteerToSlotDialog";

interface WeeklyCalendarProps {
  className?: string;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  showControls?: boolean;
  isLocked?: boolean;
  onLockChange?: (locked: boolean) => void;
}

const WeeklyCalendar = ({
  className,
  currentDate: externalCurrentDate,
  onDateChange,
  showControls = true,
  isLocked = false,
  onLockChange
}: WeeklyCalendarProps) => {
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllWeekSlots, setShowAllWeekSlots] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showAddVolunteerDialog, setShowAddVolunteerDialog] = useState(false);
  const [selectedTimeSlotForVolunteer, setSelectedTimeSlotForVolunteer] = useState<TimeSlot | null>(null);
  const { toast } = useToast();
  
  // Definir isAdmin - assumindo que é sempre true para administradores por enquanto
  // TODO: Integrar com contexto de usuário real
  const isAdmin = true;
  
  const currentDateValue = externalCurrentDate !== undefined ? externalCurrentDate : internalCurrentDate;
  const weekDays = ["TER", "QUA", "QUI", "SEX", "SÁB", "DOM", "SEG"]; 
  const currentMonth = format(currentDateValue, "MMMM yyyy", { locale: ptBR });
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const hasTimeSlotsForDate = (date: Date) => {
    if (!isValid(date)) {
      console.warn('Invalid date passed to hasTimeSlotsForDate:', date);
      return false;
    }
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    return timeSlots.some(slot => {
      if (!slot.date || !isValid(slot.date)) {
        console.warn('Invalid slot date found:', slot);
        return false;
      }
      try {
        return format(slot.date, 'yyyy-MM-dd') === formattedDate;
      } catch (error) {
        console.warn('Error formatting slot date:', slot.date, error);
        return false;
      }
    });
  };

  const formatTimeForDB = (time: string) => {
    return time.includes(":") ? `${time}:00` : `${time}:00:00`;
  };

  const getTimeSlotsForDate = (date: Date) => {
    if (!isValid(date)) {
      console.warn('Invalid date passed to getTimeSlotsForDate:', date);
      return [];
    }
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    return timeSlots.filter(slot => {
      if (!slot.date || !isValid(slot.date)) {
        return false;
      }
      try {
        return format(slot.date, 'yyyy-MM-dd') === formattedDate;
      } catch (error) {
        console.warn('Error formatting slot date in getTimeSlotsForDate:', slot.date, error);
        return false;
      }
    }).sort((a, b) => a.startTime.localeCompare(b.startTime)); // Ordenar por hora de início
  };

  const getCurrentWeekTimeSlots = () => {
    const startDate = new Date(currentDateValue);
    const dayOfWeek = startDate.getDay(); // 0 (Dom) - 6 (Sáb)
    const daysToSubtract = (dayOfWeek === 0) ? 5 : (dayOfWeek === 1) ? 6 : (dayOfWeek - 2);
    startDate.setDate(currentDateValue.getDate() - daysToSubtract);

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
    const currentDay = startDate.getDay(); // 0 (Dom) - 6 (Sáb)
    
    // Queremos Terça como o primeiro dia da semana visualizada
    // Se hoje é Dom (0), subtrai 5 dias para chegar na Terça passada.
    // Se hoje é Seg (1), subtrai 6 dias para chegar na Terça passada.
    // Se hoje é Ter (2), subtrai 0 dias.
    // Se hoje é Qua (3), subtrai 1 dia.
    // ...
    // Se hoje é Sáb (6), subtrai 4 dias.
    // (currentDay + 7 - 2) % 7  -> (currentDay + 5) % 7 funciona.
    const daysToSubtract = (currentDay + 5) % 7; 
    startDate.setDate(currentDateValue.getDate() - daysToSubtract);

    for (let i = 0; i < 7; i++) {
      const currentDateInWeek = new Date(startDate);
      currentDateInWeek.setDate(startDate.getDate() + i);
      days.push({
        dayName: weekDays[i], // Usar o array ajustado
        date: currentDateInWeek.getDate(),
        fullDate: currentDateInWeek,
        isToday: currentDateInWeek.toDateString() === new Date().toDateString(),
        hasTimeSlots: hasTimeSlotsForDate(currentDateInWeek)
      });
    }
    return days;
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
    if (!showAllWeekSlots) { // Se estava false e vai para true
      setSelectedDate(null); // Limpa a seleção do dia
    }
  };

  const handleEditClick = (timeSlot: TimeSlot) => {
    setEditingTimeSlot(timeSlot);
    // Garante que selectedDate está definido para o TimeSlotDialog se necessário
    if (!selectedDate || format(selectedDate, 'yyyy-MM-dd') !== format(timeSlot.date, 'yyyy-MM-dd')) {
      setSelectedDate(timeSlot.date);
    }
    setIsDialogOpen(true);
  };

  // Função para lidar com o clique no botão de adicionar voluntário
  const handleAddVolunteerClick = (timeSlot: TimeSlot) => {
    setSelectedTimeSlotForVolunteer(timeSlot);
    setShowAddVolunteerDialog(true);
  };

  // Função para lidar com o sucesso ao adicionar voluntário
  const handleAddVolunteerSuccess = () => {
    fetchTimeSlots(); // Recarrega os dados
    setShowAddVolunteerDialog(false);
    setSelectedTimeSlotForVolunteer(null);
  };

  const fetchTimeSlots = async () => {
    try {
      setIsLoading(true);
      const data = await dataOperations.fetch();
      if (!Array.isArray(data)) {
        console.warn('Fetched data is not an array:', data);
        setTimeSlots([]);
        return;
      }
      const formattedSlots = data.map((slot: any) => {
        let parsedDate;
        try {
          parsedDate = parseISO(slot.date);
          if (!isValid(parsedDate)) {
            console.warn('Invalid date found in slot:', slot.date);
            return null;
          }
        } catch (error) {
          console.warn('Error parsing date:', slot.date, error);
          return null;
        }

        return {
          id: slot.id,
          date: parsedDate,
          startTime: slot.start_time ? slot.start_time.slice(0, 5) : "00:00",
          endTime: slot.end_time ? slot.end_time.slice(0, 5) : "00:00",
          slots: slot.total_slots || slot.slots || 0,
          slotsUsed: slot.slots_used || 0,
          description: slot.description || "",
          allowedMilitaryTypes: slot.allowedMilitaryTypes || [],
          volunteers: slot.volunteers || []
        };
      }).filter(Boolean); // Remove null values
      
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

  const handleTimeSlotAdd = async (timeSlot: TimeSlot) => {
    try {
      setIsLoading(true);
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
            description: timeSlot.description || "",
            allowedMilitaryTypes: timeSlot.allowedMilitaryTypes || []
          }));
        }
        const results = await Promise.all(promises);
        const hasError = results.some(result => !result.success);
        if (hasError) {
          throw new Error('Failed to insert some time slots');
        }
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
          description: timeSlot.description || "",
          allowedMilitaryTypes: timeSlot.allowedMilitaryTypes || []
        });
        if (!result.success) {
          throw new Error('Failed to insert time slot');
        }
        toast({
          title: "Sucesso",
          description: "Horário adicionado com sucesso!"
        });
      }
      await fetchTimeSlots(); // Atualiza a lista após adicionar
    } catch (error) {
      console.error('Erro ao adicionar horário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o horário.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeSlotEdit = async (updatedTimeSlot: TimeSlot) => {
    if (!editingTimeSlot) return;
    try {
      setIsLoading(true);
      const result = await dataOperations.update({
        date: format(updatedTimeSlot.date, 'yyyy-MM-dd'),
        start_time: formatTimeForDB(updatedTimeSlot.startTime),
        end_time: formatTimeForDB(updatedTimeSlot.endTime),
        total_slots: updatedTimeSlot.slots,
        slots_used: updatedTimeSlot.slotsUsed,
        description: updatedTimeSlot.description || "",
        allowedMilitaryTypes: updatedTimeSlot.allowedMilitaryTypes || []
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTimeSlot = async (timeSlot: TimeSlot) => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllTimeSlots = async () => {
    await handleClearData();
    setShowDeleteAlert(false);
  };

  const daysOfWeek = getDaysOfWeek();
  const weekTimeSlots = getCurrentWeekTimeSlots();
  
  const renderTimeSlotItem = (slot: TimeSlot, index: number, showEditButton: boolean) => (
    <div 
      key={slot.id || `${format(slot.date, 'yyyy-MM-dd')}-${slot.startTime}-${index}`} 
      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:shadow-md hover:border-green-300 transition-all duration-200 ease-in-out bg-white"
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 truncate">
          {slot.startTime} - {slot.endTime}
          {slot.description && (
            <span className="ml-2 text-sm text-gray-500 italic">| {slot.description}</span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1 flex items-center">
          <span className={cn(
            "inline-block w-2.5 h-2.5 rounded-full mr-1.5 shrink-0",
            slot.slotsUsed >= slot.slots ? "bg-red-500" : 
            slot.slotsUsed > slot.slots / 2 ? "bg-yellow-500" : "bg-green-500"
          )}></span>
          {slot.slotsUsed}/{slot.slots} vagas
        </div>
        {slot.allowedMilitaryTypes && slot.allowedMilitaryTypes.length > 0 && (
          <div className="text-xs text-blue-600 mt-1 flex items-center flex-wrap gap-1">
            <span className="font-medium">Tipos:</span>
            {slot.allowedMilitaryTypes.map((type, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                {type}
              </span>
            ))}
          </div>
        )}
        {slot.volunteers && slot.volunteers.length > 0 && (
          <div className="text-xs text-gray-600 mt-1">
            <span className="font-medium">Voluntários: </span>
            {slot.volunteers.slice(0, 2).join(", ")}
            {slot.volunteers.length > 2 && ` +${slot.volunteers.length - 2} mais`}
          </div>
        )}
      </div>
      <div className="flex gap-1 sm:gap-2 ml-2 shrink-0">
        {isAdmin && slot.slotsUsed < slot.slots && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-500 hover:text-green-600 hover:bg-green-50" 
            onClick={() => handleAddVolunteerClick(slot)}
            disabled={isLocked || isLoading}
            aria-label="Adicionar voluntário"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
        {showEditButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50" 
            onClick={() => handleEditClick(slot)}
            disabled={isLocked || isLoading}
            aria-label="Editar horário"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50" 
          onClick={() => handleDeleteTimeSlot(slot)}
          disabled={isLocked || isLoading}
          aria-label="Excluir horário"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderEmptyState = (message: string, subMessage?: string) => (
    <div className="text-center py-10 px-4 text-gray-500 flex flex-col items-center">
      <Calendar className="h-12 w-12 mb-3 text-gray-400" />
      <p className="text-md font-medium">{message}</p>
      {subMessage && <p className="text-sm mt-1">{subMessage}</p>}
    </div>
  );

  return (
    <div className={cn("bg-gray-50 rounded-xl shadow-lg overflow-hidden", className)}>
      {/* Cabeçalho do calendário */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 opacity-90" />
            <h2 className="text-lg md:text-xl font-semibold capitalize tracking-tight">{currentMonth}</h2>
          </div>
          
          {showControls && (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 md:h-9 md:w-9 bg-white/20 hover:bg-white/30 text-white rounded-full" 
                onClick={handlePlusClick} 
                disabled={!selectedDate || isLocked || isLoading}
                aria-label="Adicionar novo horário para data selecionada"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 md:h-9 md:w-9 bg-white/20 hover:bg-white/30 text-white rounded-full", 
                  showAllWeekSlots && "bg-white/40 ring-2 ring-white/50"
                )} 
                onClick={handleEyeClick}
                disabled={isLoading}
                aria-label={showAllWeekSlots ? "Mostrar horários do dia selecionado" : "Mostrar horários da semana toda"}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 md:h-9 md:w-9 bg-white/20 hover:bg-white/30 text-white rounded-full" 
                onClick={() => setShowDeleteAlert(true)} 
                disabled={isLocked || isLoading || timeSlots.length === 0}
                aria-label="Excluir todos os horários"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navegação semanal e dias */}
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 text-gray-700 border-gray-300 hover:bg-gray-100" 
            onClick={handlePreviousWeek} 
            disabled={isLocked || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 text-gray-700 border-gray-300 hover:bg-gray-100" 
            onClick={handleNextWeek} 
            disabled={isLocked || isLoading}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Grade dos dias da semana */}
        <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-4">
          {daysOfWeek.map((day, index) => {
            const isSelected = selectedDate?.toDateString() === day.fullDate.toDateString();
            return (
              <div 
                key={index} 
                className={cn(
                  "flex flex-col items-center justify-center p-1.5 md:p-2 rounded-lg transition-all duration-150 ease-in-out cursor-pointer min-h-[60px] md:min-h-[70px]",
                  "hover:bg-green-50",
                  isSelected && "bg-green-100 ring-2 ring-green-500 shadow-md",
                  !isSelected && day.isToday && "bg-green-50 ring-1 ring-green-300",
                  day.hasTimeSlots && !isSelected && "relative after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-green-500 after:rounded-full"
                )} 
                onClick={() => handleDayClick(day.fullDate)}
                role="button"
                aria-pressed={isSelected}
                aria-label={`Selecionar dia ${day.date}, ${day.dayName}`}
              >
                <span className={cn(
                  "text-[10px] md:text-xs font-medium uppercase",
                  isSelected ? "text-green-700" : "text-gray-500",
                  day.isToday && !isSelected && "text-green-600"
                )}>
                  {day.dayName}
                </span>
                <span className={cn(
                  "text-lg md:text-xl font-medium mt-0.5",
                  isSelected ? "text-green-700 font-bold" : "text-gray-700",
                  day.isToday && !isSelected && "text-green-600 font-semibold"
                )}>
                  {day.date}
                </span>
                {isSelected && day.hasTimeSlots && (
                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Exibição de horários */}
      <div className="px-3 sm:px-4 pb-4 min-h-[200px] bg-white pt-4 rounded-b-lg">
        {isLoading ? (
          <div className="flex justify-center items-center py-10 text-gray-500">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Carregando horários...
          </div>
        ) : showAllWeekSlots ? (
          <div className="space-y-6">
            {weekTimeSlots.length > 0 ? (
              weekTimeSlots.map(({ date, slots }) => (
                <div key={format(date, 'yyyy-MM-dd')} className="space-y-2">
                  <h3 className="font-semibold text-md text-green-700 bg-green-50 p-2.5 rounded-md sticky top-0 z-10 shadow-sm">
                    {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <div className="space-y-2 pt-1">
                    {slots.map((slot, index) => renderTimeSlotItem(slot, index, false))}
                  </div>
                </div>
              ))
            ) : (
              renderEmptyState("Nenhum horário disponível nesta semana.")
            )}
          </div>
        ) : selectedDate ? (
          <div className="space-y-3">
            <h3 className="font-semibold text-md text-green-700 bg-green-50 p-2.5 rounded-md sticky top-0 z-10 shadow-sm">
              Horários para {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            
            {getTimeSlotsForDate(selectedDate).length > 0 ? (
              <div className="space-y-2 pt-1">
                {getTimeSlotsForDate(selectedDate).map((slot, index) => renderTimeSlotItem(slot, index, true))}
              </div>
            ) : (
              renderEmptyState("Nenhum horário disponível para esta data.")
            )}

            {!isLocked && (
              <div className="mt-6 flex justify-center border-t border-gray-200 pt-4">
                <Button
                  size="default"
                  className="bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-shadow"
                  onClick={handlePlusClick}
                  disabled={isLoading}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar Horário
                </Button>
              </div>
            )}
          </div>
        ) : (
          renderEmptyState(
            "Selecione uma data no calendário",
            "Ou clique no ícone do olho para ver todos os horários da semana."
          )
        )}
      </div>

      {/* Diálogos e modais */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-red-500" />
              <AlertDialogTitle>Excluir todos os horários</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Tem certeza que deseja excluir TODOS os horários cadastrados? Esta ação não pode ser desfeita e removerá permanentemente todos os dados de agendamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearAllTimeSlots}
              className="bg-red-500 hover:bg-red-600"
              disabled={isLoading}
            >
              {isLoading ? "Excluindo..." : "Confirmar Exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedDate && (
        <TimeSlotDialog 
          open={isDialogOpen} 
          onOpenChange={open => {
            setIsDialogOpen(open);
            if (!open) setEditingTimeSlot(null);
          }} 
          selectedDate={selectedDate} 
          onAddTimeSlot={handleTimeSlotAdd} 
          onEditTimeSlot={handleTimeSlotEdit} 
          editingTimeSlot={editingTimeSlot} 
          isLoading={isLoading}
        />
      )}

      {selectedTimeSlotForVolunteer && (
        <AddVolunteerToSlotDialog
          open={showAddVolunteerDialog}
          onOpenChange={setShowAddVolunteerDialog}
          slotId={selectedTimeSlotForVolunteer.id}
          date={format(selectedTimeSlotForVolunteer.date, 'yyyy-MM-dd')}
          onVolunteerAdded={handleAddVolunteerSuccess}
        />
      )}
    </div>
  );
};

export default WeeklyCalendar;
