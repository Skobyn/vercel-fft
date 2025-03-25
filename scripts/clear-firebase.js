/**
 * Firebase Data Cleanup Script
 * 
 * This script will delete all users from Firebase Authentication
 * and all collections/documents from Firestore.
 * 
 * Usage:
 * 1. Download service account key from Firebase Console > Project Settings > Service Accounts
 * 2. Save it as serviceAccountKey.json in the same directory as this script
 * 3. Run: node clear-firebase.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Path to service account key file
const serviceAccountKeyPath = path.join(__dirname, 'serviceAccountKey.json');

// Check if service account key exists
if (!fs.existsSync(serviceAccountKeyPath)) {
  console.error('Error: Service account key file not found at:', serviceAccountKeyPath);
  console.log('Please download your service account key from:');
  console.log('Firebase Console > Project Settings > Service Accounts > Generate new private key');
  console.log('Save it as "serviceAccountKey.json" in the same directory as this script.');
  process.exit(1);
}

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require(serviceAccountKeyPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  process.exit(1);
}

/**
 * Delete all Firebase Authentication users
 */
async function deleteAllUsers() {
  console.log('Starting user deletion...');
  
  try {
    // Get list of users (in batches of 1000)
    let userCount = 0;
    let nextPageToken;
    
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      
      if (listUsersResult.users.length === 0) {
        console.log('No users found to delete');
        break;
      }
      
      // Process users in batches to avoid memory issues
      const deletePromises = listUsersResult.users.map(user => {
        console.log(`Deleting user: ${user.email || user.uid}`);
        return admin.auth().deleteUser(user.uid)
          .then(() => userCount++)
          .catch(error => console.error(`Error deleting user ${user.uid}:`, error));
      });
      
      await Promise.all(deletePromises);
      nextPageToken = listUsersResult.pageToken;
      
    } while (nextPageToken);
    
    console.log(`Successfully deleted ${userCount} users`);
  } catch (error) {
    console.error('Error deleting users:', error);
    throw error;
  }
}

/**
 * Delete all Firestore collections and documents
 */
async function deleteAllFirestoreData() {
  console.log('Starting Firestore data deletion...');
  const db = admin.firestore();
  
  try {
    // Get all collections
    const collections = await db.listCollections();
    
    if (collections.length === 0) {
      console.log('No collections found to delete');
      return;
    }
    
    // Process each collection
    for (const collection of collections) {
      console.log(`Processing collection: ${collection.id}`);
      await deleteCollection(db, collection.id);
    }
    
    console.log('Successfully deleted all Firestore data');
  } catch (error) {
    console.error('Error deleting Firestore data:', error);
    throw error;
  }
}

/**
 * Helper function to delete a collection
 */
async function deleteCollection(db, collectionPath, batchSize = 500) {
  const collectionRef = db.collection(collectionPath);
  let docCount = 0;
  
  try {
    // Process in batches
    const query = collectionRef.limit(batchSize);
    
    return new Promise((resolve, reject) => {
      deleteQueryBatch(db, query, resolve, reject, docCount, collectionPath);
    });
  } catch (error) {
    console.error(`Error deleting collection ${collectionPath}:`, error);
    throw error;
  }
}

/**
 * Helper function to delete documents in batches
 */
async function deleteQueryBatch(db, query, resolve, reject, docCount, collectionPath) {
  try {
    const snapshot = await query.get();
    
    // When there are no documents left, we're done
    if (snapshot.size === 0) {
      console.log(`Deleted ${docCount} documents from ${collectionPath}`);
      resolve();
      return;
    }
    
    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    docCount += snapshot.size;
    
    // Recurse on the next process tick to avoid exploding the stack
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve, reject, docCount, collectionPath);
    });
  } catch (error) {
    console.error(`Error in batch delete for ${collectionPath}:`, error);
    reject(error);
  }
}

/**
 * Main function to clear Firebase data
 */
async function clearFirebase() {
  console.log('Starting Firebase data cleanup...');
  
  try {
    // First delete all users
    await deleteAllUsers();
    
    // Then delete all Firestore data
    await deleteAllFirestoreData();
    
    console.log('Firebase data cleanup complete!');
  } catch (error) {
    console.error('Error during Firebase cleanup:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the cleanup
clearFirebase(); 