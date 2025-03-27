# Family Finance Tracker - Vercel Deployment Guide

This repository contains a version of the Family Finance Tracker application optimized for Vercel deployment.

## Environment Variables Setup

When deploying to Vercel, you need to set up the following environment variables:

### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

### Google Cloud / BigQuery Configuration
```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
```

For the `GOOGLE_APPLICATION_CREDENTIALS_JSON` variable, you need to:
1. Get your service account key JSON file
2. Copy the entire JSON content (including the curly braces)
3. Paste it as a single line in the environment variable

### Plaid Configuration (if used)
```
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
```

## Firebase Configuration

After deploying to Vercel:
1. Add your Vercel domain (e.g., `vercel-fft.vercel.app`) to the authorized domains in your Firebase Authentication settings
2. Make sure your Firestore security rules are properly configured

## BigQuery Integration

The application is set up to:
1. Stream Firestore data to BigQuery using the Firebase Extension
2. Use BigQuery for data analysis and forecasting

## Vercel Deployment

1. Import this repository into Vercel
2. Configure the environment variables
3. Deploy the application
4. Add the deployed URL to Firebase authorized domains

## Features

- Financial data tracking
- Data visualization with charts and reports
- BigQuery-powered forecasting
- Mobile-responsive design