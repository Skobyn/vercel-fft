import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

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
}

export { db, auth, analytics };

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