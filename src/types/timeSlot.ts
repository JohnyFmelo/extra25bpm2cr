
export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  slots: number;
  slotsUsed: number;
  id?: string;
  isWeekly?: boolean;
  description?: string;
  allowedMilitaryTypes?: string[]; // Nova propriedade para categorias
}

export interface FirebaseTimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  id?: string;
  description?: string;
  allowed_military_types?: string[]; // Nova propriedade para Firebase
}

export type MilitaryType = 'Operacional' | 'Administrativo' | 'Inteligência';

export const MILITARY_TYPES: MilitaryType[] = ['Operacional', 'Administrativo', 'Inteligência'];
