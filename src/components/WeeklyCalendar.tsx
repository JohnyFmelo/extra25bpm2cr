import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, Eye, Trash, Calendar } from "lucide-react";
import { format, addWeeks, subWeeks, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import TimeSlotDialog from "./TimeSlotDialog";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { TimeSlot, FirebaseTimeSlot } from "@/types/timeSlot";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  // Estado
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllWeekSlots, setShowAllWeekSlots] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { toast } = useToast();
  
  // Valores derivados
  const currentDateValue = externalCurrentDate !== undefined ? externalCurrentDate : internalCurrentDate;
  const weekDays = ["Ter", "Qua", "Qui", "Sex", "Sáb", "Dom", "Seg"];
  const fullWeekDays = [" Ter ", " Qua ", " Qui ", " Sex ", " Sáb ", "Dom", " Seg "];
  const currentMonth = format(currentDateValue, "MMMM yyyy", { locale: ptBR });
  const isMobile = useIsMobile();

  // Efeitos
  useEffect(() => {
    fetchTimeSlots();
  }, []);

  // Funções auxiliares
  const hasTimeSlotsForDate = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return timeSlots.some(slot => format(slot.date, 'yyyy-MM-dd') === formattedDate);
  };

  const formatTimeForDB = (time: string) => {
    return time.includes(":") ? `${time}:00` : `${time}:00:00`;
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

  // Manipuladores de eventos
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

  // Operações de dados
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

  // Renderização
  const daysOfWeek = getDaysOfWeek();
  const weekTimeSlots = getCurrentWeekTimeSlots();
  
  return (
    <div className={cn("bg-white rounded-xl shadow-md overflow-hidden", className)}>
      {/* Cabeçalho do calendário */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            <h2 className="text-lg md:text-xl font-semibold capitalize">{currentMonth}</h2>
          </div>
          
          {showControls && (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 md:h-9 md:w-9 bg-white/20 hover:bg-white/30 text-white" 
                onClick={handlePlusClick} 
                disabled={!selectedDate || isLocked}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 md:h-9 md:w-9 bg-white/20 hover:bg-white/30 text-white", 
                  showAllWeekSlots && "bg-white/40"
                )} 
                onClick={handleEyeClick}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 md:h-9 md:w-9 bg-white/20 hover:bg-white/30 text-white" 
                onClick={() => setShowDeleteAlert(true)} 
                disabled={isLocked}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navegação semanal e dias */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-gray-600 border-gray-300" 
            onClick={handlePreviousWeek} 
            disabled={isLocked}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-gray-600 border-gray-300" 
            onClick={handleNextWeek} 
            disabled={isLocked}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Grade dos dias da semana */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
          {daysOfWeek.map((day, index) => (
            <div 
              key={index} 
              className={cn(
                "flex flex-col items-center p-2 md:p-3 rounded-lg transition-all cursor-pointer",
                day.isToday && "border-2 border-green-500",
                selectedDate?.toDateString() === day.fullDate.toDateString() && "bg-gray-100",
                day.hasTimeSlots && "relative after:absolute after:bottom-1 after:w-1.5 after:h-1.5 after:bg-green-500 after:rounded-full",
                "hover:bg-gray-50"
              )} 
              onClick={() => handleDayClick(day.fullDate)}
            >
              <span className="text-xs md:text-sm text-gray-500">{day.dayName}</span>
              <span className={cn(
                "text-base md:text-lg font-medium mt-1",
                day.isToday && "text-green-600"
              )}>
                {day.date}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Exibição de horários */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-8 text-gray-500">Carregando horários...</div>
        ) : showAllWeekSlots ? (
          <div className="space-y-4">
            {weekTimeSlots.length > 0 ? (
              weekTimeSlots.map(({ date, slots }) => (
                <div key={format(date, 'yyyy-MM-dd')} className="space-y-2">
                  <h3 className="font-medium text-gray-700 bg-gray-50 p-2 rounded">
                    {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <div className="space-y-2">
                    {slots.map((slot, index) => (
                      <div 
                        key={slot.id || index} 
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-200 hover:bg-green-50/30 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-gray-800">
                            {slot.startTime} às {slot.endTime}
                            {slot.description && (
                              <span className="ml-2 text-gray-600">| {slot.description}</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 flex items-center">
                            <span className={cn(
                              "inline-block w-2 h-2 rounded-full mr-2",
                              slot.slotsUsed >= slot.slots ? "bg-red-500" : 
                              slot.slotsUsed > slot.slots / 2 ? "bg-yellow-500" : "bg-green-500"
                            )}></span>
                            {slot.slotsUsed}/{slot.slots} vagas preenchidas
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50" 
                            onClick={() => handleDeleteTimeSlot(slot)}
                            disabled={isLocked}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum horário disponível nesta semana
              </div>
            )}
          </div>
        ) : selectedDate ? (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 bg-gray-50 p-2 rounded mb-3">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            
            {getTimeSlotsForDate(selectedDate).length > 0 ? (
              getTimeSlotsForDate(selectedDate).map((slot, index) => (
                <div 
                  key={slot.id || index} 
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-200 hover:bg-green-50/30 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {slot.startTime} às {slot.endTime}
                      {slot.description && (
                        <span className="ml-2 text-gray-600">| {slot.description}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex items-center">
                      <span className={cn(
                        "inline-block w-2 h-2 rounded-full mr-2",
                        slot.slotsUsed >= slot.slots ? "bg-red-500" : 
                        slot.slotsUsed > slot.slots / 2 ? "bg-yellow-500" : "bg-green-500"
                      )}></span>
                      {slot.slotsUsed}/{slot.slots} vagas preenchidas
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500 hover:text-blue-500 hover:bg-blue-50" 
                      onClick={() => handleEditClick(slot)}
                      disabled={isLocked}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50" 
                      onClick={() => handleDeleteTimeSlot(slot)}
                      disabled={isLocked}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum horário disponível nesta data
              </div>
            )}

            {!isLocked && (
              <div className="mt-4 flex justify-center">
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={handlePlusClick}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar horário
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Selecione uma data para ver ou adicionar horários
          </div>
        )}
      </div>

      {/* Diálogos e modais */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todos os horários</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir todos os horários? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearAllTimeSlots}
              className="bg-red-500 hover:bg-red-600"
            >
              Confirmar
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
        />
      )}
    </div>
  );
};

export default WeeklyCalendar;
