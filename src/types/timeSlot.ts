
export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  slots: number;
  slotsUsed: number;
  id?: string;
  isWeekly?: boolean;
  description?: string;
}

export interface FirebaseTimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  id?: string;
  description?: string;
}
