import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Only initialize Firebase in the browser environment
// This prevents SSR/build errors when environment variables aren't available

let app: FirebaseApp | undefined;
let db: Firestore | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

// Check if we're in the browser environment
if (typeof window !== 'undefined') {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Initialize Firebase
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  // Set authentication persistence to local (survives browser restarts)
  if (auth) {
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('Firebase persistence set to browserLocalPersistence');
      })
      .catch((error) => {
        console.error('Error setting persistence:', error);
      });
  }

  // Initialize Analytics - only in browser
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { db, auth, analytics };

// Helper functions for common database operations
export const getCurrentUser = async (): Promise<User | null> => {
  if (!auth) return null;
  
  return new Promise((resolve, reject) => {
    const unsubscribe = auth?.onAuthStateChanged((user) => {
      unsubscribe?.();
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