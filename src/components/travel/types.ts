
export interface Travel {
  id: string;
  startDate: string;
  endDate: string;
  slots: number;
  destination: string;
  dailyAllowance?: number | null;
  dailyRate?: number | null;
  halfLastDay: boolean;
  volunteers: string[];           // Todos que se inscreveram
  selectedVolunteers?: string[];  // Somente os que foram selecionados
  archived: boolean;
  isLocked?: boolean;
}
