import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Lock, Pencil, Trash2 } from "lucide-react";
import { format, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import TimeSlotDialog from "./TimeSlotDialog";

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
  const weekDays = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const fullWeekDays = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const currentMonth = format(currentDate, "MMMM yyyy", { locale: ptBR });
  const isMobile = useIsMobile();

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
    setSelectedDate(date);
  };

  const handlePlusClick = () => {
    if (selectedDate) {
      setIsDialogOpen(true);
    }
  };

  const handleTimeSlotAdd = (timeSlot: TimeSlot) => {
    setTimeSlots((prev) => [...prev, timeSlot]);
    setIsDialogOpen(false);
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
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
          onClose={() => setIsDialogOpen(false)}
          selectedDate={selectedDate}
          onAddTimeSlot={handleTimeSlotAdd}
        />
      )}
    </div>
  );
};

export default WeeklyCalendar;