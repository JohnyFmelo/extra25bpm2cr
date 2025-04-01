
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WeekDay from "./WeekDay";

interface WeekNavigationProps {
  days: Array<{
    dayName: string;
    date: number;
    fullDate: Date;
    isToday: boolean;
    hasTimeSlots: boolean;
  }>;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onDayClick: (date: Date) => void;
  selectedDate: Date | null;
  isLocked: boolean;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ({
  days,
  onPrevWeek,
  onNextWeek,
  onDayClick,
  selectedDate,
  isLocked,
}) => {
  return (
    <div className="flex justify-between items-center">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:h-10 md:w-10"
        onClick={onPrevWeek}
        disabled={isLocked}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1 flex justify-between px-2 md:px-4">
        {days.map((day, index) => (
          <WeekDay
            key={index}
            day={day}
            isSelected={selectedDate?.toDateString() === day.fullDate.toDateString()}
            onClick={onDayClick}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:h-10 md:w-10"
        onClick={onNextWeek}
        disabled={isLocked}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default WeekNavigation;
