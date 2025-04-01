
import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface WeekDayProps {
  day: {
    dayName: string;
    date: number;
    fullDate: Date;
    isToday: boolean;
    hasTimeSlots: boolean;
  };
  isSelected: boolean;
  onClick: (date: Date) => void;
}

const WeekDay: React.FC<WeekDayProps> = ({ day, isSelected, onClick }) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center p-1 md:p-2 rounded-lg transition-all cursor-pointer hover:bg-gray-100",
        day.isToday && "border border-black rounded-lg",
        isSelected && "bg-gray-200 hover:bg-gray-300",
        day.hasTimeSlots && "bg-[#25D366]"
      )}
      onClick={() => onClick(day.fullDate)}
    >
      <span className="text-xs md:text-sm">{day.dayName}</span>
      <span className="text-sm md:text-lg font-semibold mt-1">{day.date}</span>
    </div>
  );
};

export default WeekDay;
