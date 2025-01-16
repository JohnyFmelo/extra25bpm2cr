import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import WeeklyCalendar from "./WeeklyCalendar";

interface IconCardProps {
  icon: LucideIcon;
  label: string;
  className?: string;
  showCalendar?: boolean;
}

const IconCard = ({ icon: Icon, label, className, showCalendar }: IconCardProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group",
        showCalendar && "col-span-full",
        className
      )}
    >
      {showCalendar ? (
        <div className="w-full">
          <div className="flex items-center gap-3 mb-4">
            <Icon className="w-8 h-8 text-gray-700 group-hover:text-indigo-600 transition-colors duration-300" />
            <span className="text-gray-600 font-medium">{label}</span>
          </div>
          <WeeklyCalendar />
        </div>
      ) : (
        <>
          <Icon className="w-12 h-12 text-gray-700 group-hover:text-indigo-600 transition-colors duration-300" />
          <span className="mt-3 text-gray-600 font-medium">{label}</span>
        </>
      )}
    </div>
  );
};

export default IconCard;