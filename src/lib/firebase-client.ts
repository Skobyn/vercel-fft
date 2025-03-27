import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase in a way that's safe for both client and server
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: Functions;
let analytics: Analytics | null = null;

// Initialize Firebase
if (typeof window !== 'undefined') {
  try {
    console.log("Initializing Firebase");
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase initialized with new app");
    } else {
      app = getApp();
      console.log("Firebase initialized with existing app");
    }
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Authentication with local persistence
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log("Firebase persistence set successfully"))
      .catch((error) => console.error("Error setting persistence:", error));
    
    // Initialize Functions
    functions = getFunctions(app);
    
    // Connect to Functions emulator if in development
    if (process.env.NODE_ENV === 'development') {
      const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
      if (useEmulator) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.log("Connected to Firebase Functions emulator");
      }
    }
    
    // Initialize Analytics when possible
    isSupported()
      .then(supported => {
        if (supported) {
          analytics = getAnalytics(app);
          console.log("Firebase analytics initialized");
        }
      })
      .catch(error => console.error("Error initializing analytics:", error));
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
  }
} else {
  // Dummy implementations for SSR
  console.log("Firebase not initialized (server-side)");
  //@ts-ignore - these are placeholders for SSR
  app = {} as FirebaseApp;
  //@ts-ignore - these are placeholders for SSR
  db = {} as Firestore;
  //@ts-ignore - these are placeholders for SSR
  auth = {} as Auth;
  //@ts-ignore - these are placeholders for SSR
  functions = {} as Functions;
}

export { db, auth, analytics, functions };

// Helper functions for common database operations
export const getCurrentUser = async (): Promise<User | null> => {
  if (!auth) return null;
  
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

export const getUserProfile = async (userId: string) => {
  if (!db) return null;
  
  try {
    // Import dynamically to prevent SSR issues
    const { getDoc, doc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, 'profiles', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Helper for maintaining a persistent auth cookie that can be read by middleware
export const updateAuthCookie = (user: User | null) => {
  if (typeof window === 'undefined') return;
  
  if (user) {
    // User is signed in, create/update the cookie with a 7-day expiration
    user.getIdToken().then(token => {
      document.cookie = `firebase-auth-token=${token}; path=/; max-age=604800; SameSite=Strict`;
      console.log('Auth cookie updated');
    });
  } else {
    // User is signed out, clear the cookie
    document.cookie = 'firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    console.log('Auth cookie cleared');
  }
}; 