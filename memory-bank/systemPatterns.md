# System Patterns

## Architecture Overview
The Family Finance Tracker follows a client-side rendered Next.js application architecture with Firebase as the backend service. The application uses the App Router pattern introduced in Next.js 13, with client components for interactive elements and server components where possible for performance.

## Key Technical Decisions

### Authentication
- Firebase Authentication for user management
- Custom auth providers (`firebase-auth-provider.tsx`) for React context integration
- Session persistence using both Firebase and localStorage as a fallback
- Protection of routes using auth state checks

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

### Provider Pattern
Used for auth state and theme management throughout the application.

```tsx
// Auth Provider example
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // ...authentication logic
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Page Component Pattern
Each route is represented by a page component that follows a consistent structure.

```tsx
// Dashboard page example
export default function DashboardPage() {
  // Auth check and data fetching
  // Component rendering
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page content */}
      </div>
    </MainLayout>
  );
}
```

### Custom Hooks
Encapsulating complex logic in reusable hooks.

```tsx
// Auth hook example
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Form Management
Using react-hook-form with Zod for validation.

```tsx
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    email: "",
    password: "",
  },
  mode: "onChange",
});
```

## Component Relationships
The application follows a hierarchical component structure:

1. Layout Components (MainLayout)
2. Page Components (DashboardPage, TransactionsPage)
3. Feature Components (TransactionList, BudgetChart)
4. UI Components (Button, Card, Input)

## Data Flow
1. User actions trigger form submissions or API requests
2. Data is validated client-side
3. Requests are sent to Firebase or external APIs
4. UI is updated optimistically
5. Success/error states are handled with toast notifications 