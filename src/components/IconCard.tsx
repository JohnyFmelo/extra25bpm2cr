import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconCardProps {
  icon: LucideIcon;
  label: string;
  className?: string;
  onClick?: () => void;
}

const IconCard = ({ icon: Icon, label, className, onClick }: IconCardProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group",
        className
      )}
      onClick={onClick}
    >
      <Icon className="w-12 h-12 text-gray-700 group-hover:text-indigo-600 transition-colors duration-300" />
      <span className="mt-3 text-gray-600 font-medium">{label}</span>
    </div>
  );
};

export default IconCard;