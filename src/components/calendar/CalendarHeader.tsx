
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Trash } from "lucide-react";

interface CalendarHeaderProps {
  currentMonth: string;
  showControls: boolean;
  selectedDate: Date | null;
  onPlusClick: () => void;
  onEyeClick: () => void;
  onTrashClick: () => void;
  showAllWeekSlots: boolean;
  isLocked: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentMonth,
  showControls,
  selectedDate,
  onPlusClick,
  onEyeClick,
  onTrashClick,
  showAllWeekSlots,
  isLocked,
}) => {
  return (
    <div className="flex justify-between items-center mb-4 md:mb-6">
      <h2 className="text-lg md:text-xl font-semibold">{currentMonth}</h2>
      {showControls && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10"
            onClick={onPlusClick}
            disabled={!selectedDate || isLocked}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`h-8 w-8 md:h-10 md:w-10 ${showAllWeekSlots && "bg-gray-100"}`}
            onClick={onEyeClick}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10"
            onClick={onTrashClick}
            disabled={isLocked}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CalendarHeader;
