
import React from "react";
import { TimeSlot } from "@/types/timeSlot";
import TimeSlotCard from "./TimeSlotCard";

interface WeekDaySlotsProps {
  selectedDate: Date | null;
  timeSlots: TimeSlot[];
  onEdit: (slot: TimeSlot) => void;
  onDelete: (slot: TimeSlot) => void;
}

const WeekDaySlots: React.FC<WeekDaySlotsProps> = ({
  selectedDate,
  timeSlots,
  onEdit,
  onDelete,
}) => {
  if (!selectedDate) return null;

  const slotsForDate = timeSlots.filter(
    (slot) => new Date(slot.date).toDateString() === selectedDate.toDateString()
  );

  return (
    <div className="mt-4 space-y-2">
      {slotsForDate.map((slot, index) => (
        <TimeSlotCard
          key={slot.id || index}
          slot={slot}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default WeekDaySlots;
