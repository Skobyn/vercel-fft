# Firebase Data Cleanup Script

This script allows you to clear all data from your Firebase project (both Authentication users and Firestore data) to start fresh.

## Prerequisites

- Node.js installed on your machine
- Firebase Admin SDK (will be installed in the steps below)
- Service account credentials from your Firebase project

## Setup

1. **Create scripts directory** (if it doesn't exist already):
   ```bash
   mkdir -p scripts
   ```

2. **Install dependencies**:
   ```bash
   cd scripts
   npm init -y
   npm install firebase-admin
   ```

3. **Get your Firebase service account key**:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings (gear icon) > Service accounts
   - Click on "Generate new private key"
   - Save the JSON file as `serviceAccountKey.json` in the `scripts` directory

## Usage

1. **Make sure your serviceAccountKey.json is in the scripts directory**

2. **Run the script**:
   ```bash
   node clear-firebase.js
   ```

3. **What it does**:
   - Deletes all users from Firebase Authentication
   - Deletes all collections and documents from Firestore
   - Provides detailed logs of the deletion process

## Warning

**⚠️ This script will delete ALL data in your Firebase project. This action is irreversible! ⚠️**

- Use this script only if you want to completely start fresh
- Consider backing up important data before running
- Use with caution in production environments

## Troubleshooting

- **Permission errors**: Make sure your service account has the necessary permissions (Firebase Admin) to delete users and Firestore data
- **Timeout errors**: For large datasets, you might need to increase timeouts or process in smaller batches
- **CORS issues**: This script is designed to run locally, not in a browser 