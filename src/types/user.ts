export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'admin' | 'user';
  password?: string;
}

export interface TimeSlot {
  id: string;
  title: string;
  description: string;
  date: string;
  isWeekly?: boolean;
}