# Family Finance Tracker

A comprehensive family finance management application built with Next.js, Firebase, and shadcn/ui.

## Features

- 📊 Intuitive dashboard with spending insights and financial overview
- 💸 Transaction tracking with receipt scanning
- 👨‍👩‍👧‍👦 Family sharing to manage finances together
- 🏦 Bank account connectivity through Plaid API
- 📱 Responsive design for mobile and desktop
- 🔐 Secure authentication with Firebase
- 📅 Bill management and payment scheduling
- 💰 Budget creation and tracking
- 🎯 Financial goal setting and monitoring
- 📈 Custom reports and spending analytics
- 🔄 Recurring transaction management
- 🌓 Light/dark mode support

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **Charts**: Recharts
- **Forms**: React Hook Form, Zod
- **API Integration**: Plaid API for bank connectivity
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- (Optional) Plaid API keys for bank connections

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/family-finance-tracker.git
cd family-finance-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Firebase and Plaid credentials:
```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Next Auth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Plaid API Keys (Optional)
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firestore Setup

The application uses Firestore as its database. See the `firestore/schema.md` file for details on the data model and collection structure.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
