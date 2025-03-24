import { User as FirebaseUser } from 'firebase/auth';

// Simplified User interface with just the fields we need
export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export function mapFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL
  };
} 