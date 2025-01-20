import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from './ui/card';

interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  slots: number;
  slotsUsed: number;
  volunteers?: string[];
}

interface ScheduleListProps {
  timeSlots: TimeSlot[];
}

const ScheduleList = ({ timeSlots }: ScheduleListProps) => {
  // Group time slots by date
  const groupedSlots = timeSlots.reduce((acc, slot) => {
    // Only include slots that are fully filled (unless it's a single slot)
    if (slot.slotsUsed < slot.slots && !(slot.slots === 1 && slot.slotsUsed === 1)) {
      return acc;
    }

    const dateStr = format(new Date(slot.date), 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedSlots).map(([dateStr, slots]) => (
        <Card key={dateStr} className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            {format(new Date(dateStr), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="space-y-4">
            {slots.map((slot, index) => (
              <Card key={index} className="p-3 bg-card">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">
                    {slot.startTime} às {slot.endTime}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {slot.slotsUsed}/{slot.slots} vagas
                  </span>
                </div>
                {slot.volunteers && (
                  <div className="text-sm space-y-1">
                    {slot.volunteers.map((volunteer, idx) => (
                      <div key={idx} className="text-foreground">
                        {volunteer}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ScheduleList;