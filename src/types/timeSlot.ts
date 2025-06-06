
export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  slots: number;
  slotsUsed: number;
  id?: string;
  isWeekly?: boolean;
  description?: string;
  allowedMilitaryTypes?: string[];
  volunteers?: any[];
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

export type MilitaryType = 'Inteligência' | 'Administrativo' | 'Operacional';

export const MILITARY_TYPES: MilitaryType[] = ['Inteligência', 'Administrativo', 'Operacional'];
