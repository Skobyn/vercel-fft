# Firebase Authentication Troubleshooting Guide

## Common Error 400 (Bad Request) Issues

When encountering Error 400 during Google sign-in, check the following common causes:

### 1. Unauthorized Domain

The most common cause of Error 400 is trying to authenticate from a domain that's not authorized in Firebase.

**Solution:**
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Authentication → Settings → Authorized domains
4. Add your testing domain (e.g., `localhost`, `127.0.0.1`, your deployed domain)

### 2. Incorrect Firebase Configuration

Ensure all environment variables are correctly set:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Solution:**
1. Double-check your `.env.local` file contains all required variables
2. Verify the values match those in Firebase Console → Project Settings → General → Your apps

### 3. Google Sign-in Method Not Enabled

The Google provider might not be enabled in Firebase Authentication.

**Solution:**
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable the "Google" provider
3. Ensure your project's support email is set

### 4. Browser Issues

Sometimes browser cache or cookies can interfere with the authentication process.

**Solution:**
1. Try using Incognito/Private browsing mode
2. Clear browser cache and cookies
3. Try a different browser

### 5. Local Development Environment

When testing locally:

**Solution:**
1. Use `http://localhost:3000` instead of `127.0.0.1:3000`
2. Make sure `localhost` is added to authorized domains in Firebase
3. Restart your development server after making changes

## Debugging Tools

We've created a debug page to help troubleshoot authentication issues:

1. Visit `/auth/debug` in your application
2. This page displays:
   - Current Firebase configuration
   - Authentication status
   - Test buttons for sign-in/sign-out
   - Error message display
   
## Firebase Console Error Logs

Check Firebase Authentication logs for additional insights:

1. Go to Firebase Console → Authentication → Users
2. Click on "More" → "Authentication events"
3. Look for failed sign-in attempts and their error messages

## Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `auth/popup-closed-by-user` | User closed the popup window | Normal behavior if user cancels |
| `auth/unauthorized-domain` | Domain not authorized | Add domain to Firebase authorized domains |
| `auth/user-disabled` | User account has been disabled | Contact admin or check user status in Firebase Console |
| `auth/cancelled-popup-request` | Multiple popup requests | Ensure you're not calling sign-in method multiple times |
| `auth/operation-not-allowed` | Provider not enabled | Enable the authentication provider in Firebase Console |

## Testing the Authentication Flow

1. Enable console logging in developer tools
2. Sign out completely first
3. Try signing in and watch for specific error messages
4. Check Network tab in developer tools for API responses

If issues persist, consider checking your code against the implementation in `src/providers/firebase-auth-provider.tsx` to ensure proper authentication flow handling. 