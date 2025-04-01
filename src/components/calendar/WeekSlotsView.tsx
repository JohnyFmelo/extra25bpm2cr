
import React from "react";
import { TimeSlot } from "@/types/timeSlot";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TimeSlotCard from "./TimeSlotCard";

interface WeekSlotsViewProps {
  weekSlots: Array<{
    date: Date;
    slots: TimeSlot[];
  }>;
  onEdit: (slot: TimeSlot) => void;
  onDelete: (slot: TimeSlot) => void;
}

const WeekSlotsView: React.FC<WeekSlotsViewProps> = ({
  weekSlots,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="mt-4 space-y-4">
      {weekSlots.map(({ date, slots }) => (
        <div key={format(date, "yyyy-MM-dd")} className="space-y-2">
          <h3 className="font-medium text-gray-700">
            {format(date, "EEEE, dd 'de' MMMM", {
              locale: ptBR,
            })}
          </h3>
          {slots.map((slot, index) => (
            <TimeSlotCard
              key={slot.id || index}
              slot={slot}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default WeekSlotsView;
