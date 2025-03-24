import { User as FirebaseUser } from 'firebase/auth';

export interface User extends FirebaseUser {
  id: string;
}

export function mapFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    ...firebaseUser,
    id: firebaseUser.uid
  };
} 