import { User as FirebaseUser } from 'firebase/auth';

export interface CustomUser extends FirebaseUser {
  warName?: string;
  rank?: string;
  registration?: string;
  userType?: string;
  password?: string;
}