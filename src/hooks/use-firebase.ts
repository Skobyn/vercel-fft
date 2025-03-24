import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  DocumentData,
  Query,
  DocumentReference,
  getDoc,
  Firestore
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { db as firebaseDb, auth } from '@/lib/firebase-client';
import { User, mapFirebaseUser } from '@/types/user';

// Explicitly type the db variable
const db: Firestore | null = firebaseDb;

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On the server or if Firebase isn't initialized, set loading to false and return
    if (typeof window === 'undefined' || !auth) {
      setLoading(false);
      return;
    }

    // Import auth-related functions only on the client
    const importFirebaseAuthModules = async () => {
      const { 
        onAuthStateChanged,
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        signOut: firebaseSignOut
      } = await import('firebase/auth');
      
      const { 
        doc, 
        getDoc, 
        updateDoc, 
        setDoc 
      } = await import('firebase/firestore');

      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth as import('firebase/auth').Auth, async (authUser) => {
        setLoading(true);
        if (authUser) {
          setUser(mapFirebaseUser(authUser));
          try {
            // Check if db is null before using it
            if (!db) {
              console.error('Firestore is not initialized');
              setLoading(false);
              return;
            }
            
            const userDocRef = doc(db, 'profiles', authUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setUserProfile(userDoc.data());
            } else {
              // If profile doesn't exist but user is authenticated,
              // create a basic profile
              const defaultProfile = {
                email: authUser.email,
                first_name: authUser.displayName?.split(' ')[0] || '',
                last_name: authUser.displayName?.split(' ').slice(1).join(' ') || '',
                avatar_url: authUser.photoURL || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              await updateProfile(authUser.uid, defaultProfile);
              setUserProfile(defaultProfile);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    // Call the async function and store the unsubscribe function
    let unsubscribe: (() => void) | undefined;
    importFirebaseAuthModules().then((unsub) => {
      unsubscribe = unsub;
    });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    if (!auth) throw new Error('Firebase is not initialized');
    
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async function signUp(email: string, password: string, userData: any) {
    if (!auth || !db) throw new Error('Firebase is not initialized');
    
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create profile document
      await updateProfile(user.uid, {
        id: user.uid,
        email: email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        avatar_url: userData.avatar_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return user;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async function updateProfile(userId: string, profileData: any) {
    if (!db) throw new Error('Firebase is not initialized');
    
    try {
      const { doc, getDoc, updateDoc, setDoc } = await import('firebase/firestore');
      const profileRef = doc(db, 'profiles', userId);
      
      // Check if profile exists first
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        await updateDoc(profileRef, {
          ...profileData,
          updated_at: new Date().toISOString()
        });
      } else {
        // Use setDoc for new documents
        await setDoc(profileRef, {
          ...profileData,
          id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async function signOut() {
    if (!auth) throw new Error('Firebase is not initialized');
    
    try {
      const { signOut: firebaseSignOut } = await import('firebase/auth');
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  return {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  };
}

// Hook for easier Firestore data access
export function useFirestoreData<T>(collectionName: string) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function fetchData(queryFn?: (ref: Query<DocumentData>) => Query<DocumentData>) {
    try {
      setLoading(true);
      // Check if db is null before using it
      if (!db) {
        throw new Error('Firestore is not initialized');
      }
      
      let queryRef = collection(db, collectionName);
      let firestoreQuery = query(queryRef);
      
      // Apply custom query if provided
      if (queryFn) {
        firestoreQuery = queryFn(firestoreQuery);
      }
      
      const querySnapshot = await getDocs(firestoreQuery);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      setData(documents);
    } catch (err: any) {
      setError(new Error(err.message));
      console.error(`Error fetching data from ${collectionName}:`, err);
    } finally {
      setLoading(false);
    }
  }

  async function getDocument(id: string) {
    try {
      // Check if db is null before using it
      if (!db) {
        throw new Error('Firestore is not initialized');
      }
      
      const docRef = doc(db, collectionName, id);
      const docSnapshot = await getDoc(docRef);
      
      if (docSnapshot.exists()) {
        return { id: docSnapshot.id, ...docSnapshot.data() } as T;
      }
      
      return null;
    } catch (err: any) {
      console.error(`Error getting document from ${collectionName}:`, err);
      throw err;
    }
  }

  async function addDocument(document: Omit<T, 'id'>) {
    try {
      // Check if db is null before using it
      if (!db) {
        throw new Error('Firestore is not initialized');
      }
      
      // Add created_at and updated_at timestamps
      const docWithTimestamps = {
        ...document,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, collectionName), docWithTimestamps);
      
      // Refresh data after adding
      await fetchData();
      
      return { id: docRef.id, ...docWithTimestamps } as T;
    } catch (err: any) {
      console.error(`Error adding document to ${collectionName}:`, err);
      throw err;
    }
  }

  async function updateDocument(id: string, updates: Partial<T>) {
    try {
      // Check if db is null before using it
      if (!db) {
        throw new Error('Firestore is not initialized');
      }
      
      const docRef = doc(db, collectionName, id);
      
      // Add updated_at timestamp
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(docRef, updatesWithTimestamp as any);
      
      // Refresh data after updating
      await fetchData();
      
      return { id, ...updatesWithTimestamp } as T;
    } catch (err: any) {
      console.error(`Error updating document in ${collectionName}:`, err);
      throw err;
    }
  }

  async function deleteDocument(id: string) {
    try {
      // Check if db is null before using it
      if (!db) {
        throw new Error('Firestore is not initialized');
      }
      
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      
      // Refresh data after deleting
      await fetchData();
    } catch (err: any) {
      console.error(`Error deleting document from ${collectionName}:`, err);
      throw err;
    }
  }

  return {
    data,
    loading,
    error,
    fetchData,
    getDocument,
    addDocument,
    updateDocument,
    deleteDocument
  };
} 