import React from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface WeeklyCalendarProps {
  className?: string;
}

const WeeklyCalendar = ({ className }: WeeklyCalendarProps) => {
  const today = new Date();
  const weekDays = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const currentMonth = format(today, "MMMM yyyy", { locale: ptBR });

  const getDaysOfWeek = () => {
    const days = [];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay()); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push({
        dayName: weekDays[i],
        date: currentDate.getDate(),
        isToday: currentDate.getDate() === today.getDate(),
      });
    }
    return days;
  };

  return (
    <div className={cn("bg-white rounded-xl shadow-sm p-6", className)}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{currentMonth}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="icon">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex justify-between px-4">
          {getDaysOfWeek().map((day, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg",
                day.isToday && "bg-black text-white"
              )}
            >
              <span className="text-sm">{day.dayName}</span>
              <span className="text-lg font-semibold mt-1">{day.date}</span>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WeeklyCalendar;