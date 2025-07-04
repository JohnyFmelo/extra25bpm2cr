
export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'admin' | 'user';
  password?: string;
  service?: string;
  warName?: string;
  rank?: string;
  rgpm?: string;
  isVolunteer?: boolean;
}

export interface TimeSlot {
  id: string;
  title: string;
  description: string;
  date: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: 'all' | 'individual';
}
