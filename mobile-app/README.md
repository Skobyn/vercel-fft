# Financial Flow Mobile App

> A React Native companion app for the Financial Flow web application

## Overview

The Financial Flow Mobile App is a companion application to the Financial Flow web platform, providing on-the-go access to your financial data. The app allows users to track expenses, manage budgets, view bills, and monitor savings goals directly from their mobile devices.

## Features

- **User Authentication**: Secure login via email/password or social login providers
- **Dashboard**: Get a quick overview of your financial health
- **Transaction Management**: View, add, and categorize transactions
- **Budget Tracking**: Monitor your spending against budget categories
- **Bill Reminders**: Stay on top of upcoming bills with notifications
- **Savings Goals**: Track progress towards your financial goals
- **Bank Connectivity**: Securely connect your bank accounts via Plaid
- **Data Synchronization**: Real-time sync with web application
- **Offline Mode**: Access and input data even without internet connection

## Technology Stack

- **Framework**: React Native
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **Authentication**: JWT Tokens with Secure Storage
- **UI Components**: React Native Paper
- **Charts**: Victory Native
- **Banking Integration**: Plaid React Native SDK
- **API Client**: Axios
- **Storage**: Async Storage + SQLite (for offline support)
- **Push Notifications**: Firebase Cloud Messaging

## Project Structure

```
mobile-app/
├── android/             # Android native code
├── ios/                 # iOS native code
├── src/
│   ├── api/             # API service integration
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   ├── constants/       # App constants
│   ├── hooks/           # Custom React hooks
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # Application screens
│   ├── store/           # Redux store configuration
│   ├── theme/           # App theme (colors, spacing, etc.)
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── App.tsx              # Main app component
├── index.js             # Entry point
└── package.json         # Dependencies
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- Yarn or npm
- XCode (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/financial-flow.git
   cd financial-flow/mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the application:
   ```bash
   # For iOS
   npm run ios
   # or
   yarn ios

   # For Android
   npm run android
   # or
   yarn android
   ```

## API Integration

The mobile app connects to the same backend API as the web application, enabling a seamless experience across platforms. The API endpoints provide functionality for:

- User authentication
- Transaction management
- Budget tracking
- Bill management
- Savings goals
- Bank account integration

## Syncing with the Web Application

Any changes made in the mobile application automatically sync with the web version when an internet connection is available. If you make changes while offline, they will be queued and synced when connectivity is restored.

## Security

- All sensitive data is encrypted at rest
- Authentication tokens are securely stored using the device's secure storage
- Bank credentials are never stored; only secure access tokens
- Biometric authentication support (FaceID, TouchID, etc.)
- Automatic logout after period of inactivity

## Roadmap

- **Q3 2025**: Add expense receipt scanning and OCR
- **Q4 2025**: Implement smart categorization with machine learning
- **Q1 2026**: Add support for investment accounts
- **Q2 2026**: Introduce financial insights and recommendations
