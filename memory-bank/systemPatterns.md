# System Patterns

## Architecture Overview
The Family Finance Tracker follows a client-side rendered Next.js application architecture with Firebase as the backend service. The application uses the App Router pattern introduced in Next.js 13, with client components for interactive elements and server components where possible for performance.

## Key Technical Decisions

### Authentication
- Firebase Authentication with local persistence for user management
- Simplified auth provider with fallback mechanisms
- "Demo mode" pattern that shows content even without authentication
- Direct navigation with window.location for critical auth redirects
- LocalStorage backup for auth state to prevent data loss
- Safe localStorage operations with proper error handling

### Data Management
- Firestore for storing user data, transactions, budgets, and goals
- Typed data models with TypeScript interfaces
- Local state management with React hooks and context
- Optimistic UI updates for better user experience

### UI Components
- Shadcn UI as the component library foundation
- Custom theme with Tailwind CSS
- Responsive design principles throughout
- Component composition for reusability

### API Integration
- Plaid for bank account connection and transaction data
- Custom hooks for API data fetching and state management
- Error boundary implementation for graceful error handling

## Design Patterns

### Graceful Degradation Pattern
The application is designed to fail gracefully and maintain user experience even when services are unavailable:

```tsx
// Dashboard example with fallback content
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  
  useEffect(() => {
    // Show content after a short delay regardless of auth state
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // If no user is present, show in demo mode
      if (!loading && !user) {
        toast.warning("You are viewing in demo mode. Some features may be limited.");
        setIsUsingFallback(true);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [user, loading]);
  
  // Rest of component...
}
```

### Safe Operations Pattern
Using wrapper functions to safely perform operations that might fail:

```tsx
// Safe localStorage operations
const safeGetItem = (key: string): string | null => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return null;
  }
};
```

### Provider Pattern
Used for auth state and theme management throughout the application with improved error handling:

```tsx
// Improved Auth Provider example
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  
  // Initialize auth state with error handling
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    // Try to restore user from localStorage first
    const savedUser = safeGetItem("authUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved user:", error);
      }
    }
    
    // Setup Firebase auth listener with error handling
    // ...
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Page Component Pattern
Each route is represented by a page component that follows a consistent structure, now with better error handling and fallbacks:

```tsx
// Dashboard page example
export default function DashboardPage() {
  // Simplified auth handling
  // Always show content even if authentication fails
  return (
    <MainLayout>
      {isUsingFallback && (
        <DemoModeBanner />
      )}
      <div className="space-y-6">
        {/* Page content */}
      </div>
    </MainLayout>
  );
}
```

### Custom Hooks
Encapsulating complex logic in reusable hooks with better error handling:

```tsx
// Auth hook example
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Provide a useful error message
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Component Relationships
The application follows a hierarchical component structure:

1. Layout Components (MainLayout)
2. Page Components (DashboardPage, TransactionsPage)
3. Feature Components (TransactionList, BudgetChart)
4. UI Components (Button, Card, Input)
5. Feedback Components (DemoModeBanner, LoadingIndicator)

## Data Flow
1. User actions trigger form submissions or API requests
2. Data is validated client-side
3. Requests are sent to Firebase or external APIs
4. UI is updated optimistically
5. Success/error states are handled with toast notifications
6. Fallback UI is shown if operations fail 