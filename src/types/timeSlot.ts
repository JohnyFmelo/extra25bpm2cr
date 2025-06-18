
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
  volunteers?: string[];
}

export interface FirebaseTimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  id?: string;
  description?: string;
  volunteers?: string[];
}

export type MilitaryType = 'Inteligência' | 'Administrativo' | 'Operacional';

export const MILITARY_TYPES: MilitaryType[] = ['Inteligência', 'Administrativo', 'Operacional'];

export interface Volunteer {
  id: string;
  name: string;
  rank: string;
  service: MilitaryType;
}
