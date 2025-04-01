
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { TimeSlot } from "@/types/timeSlot";

interface TimeSlotCardProps {
  slot: TimeSlot;
  onEdit: (slot: TimeSlot) => void;
  onDelete: (slot: TimeSlot) => void;
  isLocked?: boolean;
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  slot,
  onEdit,
  onDelete,
  isLocked = false
}) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
      <div>
        <div className="font-medium">
          {slot.startTime} às {slot.endTime}
        </div>
        {slot.description && (
          <div className="text-sm text-gray-600">
            {slot.description}
          </div>
        )}
        <div className="text-sm text-gray-500">
          {slot.slotsUsed}/{slot.slots} vagas
        </div>
      </div>
      <div className="flex gap-2">
        {!isLocked && (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(slot)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(slot)}>
              <Trash className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default TimeSlotCard;
