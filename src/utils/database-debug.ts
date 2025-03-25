"use client";

import { db } from '@/lib/firebase-client';
import { doc, setDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { FinancialProfile } from '@/types/financial';

/**
 * Utility function to initialize Firebase collections for a user
 * This can be called from the browser console like:
 * import { initializeCollections } from '@/utils/database-debug';
 * initializeCollections('USER_ID_HERE');
 */
export async function initializeCollections(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  console.log(`Initializing collections for user: ${userId}`);
  
  try {
    // Create financial profile
    const profileRef = doc(db, 'financialProfiles', userId);
    const profileSnap = await getDoc(profileRef);
    
    let defaultProfile: FinancialProfile;
    if (!profileSnap.exists()) {
      // Create default financial profile
      defaultProfile = {
        userId,
        currentBalance: 0,
        lastUpdated: new Date().toISOString(),
        currency: 'USD',
        hasCompletedSetup: false
      };
      
      try {
        await setDoc(profileRef, defaultProfile, { merge: true });
        console.log("Financial profile initialized");
      } catch (error) {
        console.error("Error creating financial profile:", error);
        throw new Error(`Failed to create financial profile: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log("Financial profile already exists");
    }
    
    // Create user collections
    const collections = [
      { name: 'incomes', path: `users/${userId}/incomes` },
      { name: 'bills', path: `users/${userId}/bills` },
      { name: 'expenses', path: `users/${userId}/expenses` },
      { name: 'budgets', path: `users/${userId}/budgets` },
      { name: 'goals', path: `users/${userId}/goals` },
      { name: 'balanceAdjustments', path: `users/${userId}/balanceAdjustments` }
    ];
    
    // Create a placeholder document in each collection
    const results = [];
    for (const col of collections) {
      try {
        const placeholderRef = doc(db, col.path, '_metadata');
        await setDoc(placeholderRef, { 
          created: new Date().toISOString(),
          note: 'This document ensures the collection exists'
        }, { merge: true });
        console.log(`Initialized collection: ${col.name}`);
        results.push({ collection: col.name, success: true });
      } catch (error) {
        console.error(`Error initializing collection ${col.name}:`, error);
        results.push({ 
          collection: col.name, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Check if we had any failures
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      throw new Error(`Failed to initialize ${failures.length} collections. This is likely due to Firebase permissions issues. Make sure your security rules allow writes to these collections.`);
    }
    
    console.log("All collections successfully initialized");
  } catch (error) {
    console.error("Error initializing collections:", error);
    throw error;
  }
}

/**
 * Helper function to get the current user ID from localStorage
 * Can be used in the browser console
 */
export function getCurrentUserId(): string | null {
  try {
    const authUser = localStorage.getItem('firebase_user');
    if (authUser) {
      const parsedUser = JSON.parse(authUser);
      return parsedUser.uid;
    }
  } catch (error) {
    console.error("Error getting current user ID:", error);
  }
  
  return null;
}

/**
 * Add this to a global window object for easy console access
 */
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.initializeFirestoreCollections = initializeCollections;
  // @ts-ignore
  window.getCurrentFirebaseUserId = getCurrentUserId;
} 