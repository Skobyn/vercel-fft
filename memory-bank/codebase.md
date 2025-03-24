# Codebase Reference

## Key Files and Directories

### Authentication
- `src/providers/firebase-auth-provider.tsx`: Main authentication provider using Firebase
- `src/lib/firebase-client.ts`: Firebase client configuration and initialization
- `src/app/auth/signin/page.tsx`: Sign-in page implementation
- `src/app/auth/signup/page.tsx`: Sign-up page implementation
- `src/lib/auth.ts`: Auth utility functions

### Page Components
- `src/app/dashboard/page.tsx`: Main dashboard page, requires authentication
- `src/app/budgets/page.tsx`: Budget management page
- `src/app/goals/page.tsx`: Savings goals page
- `src/app/reports/page.tsx`: Financial reports page
- `src/app/settings/page.tsx`: User and application settings
- `src/app/settings/family-sharing/page.tsx`: Family sharing settings

### Layout and UI
- `src/app/layout.tsx`: Root layout containing providers and global components
- `src/components/ui/`: UI components from Shadcn UI
- `src/components/layout/`: Layout components
- `src/components/shared/`: Shared components used across multiple pages

### Data and State Management
- `src/lib/db.ts`: Firestore database configuration and utility functions
- `src/hooks/`: Custom hooks for data fetching and state management

### Configuration
- `src/app/api/`: API routes
- `.env.local`: Environment variables (not in repository)
- `next.config.js`: Next.js configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration

### Documentation
- `memory-bank/`: Project documentation and context
- `STATUS.md`: Project status report
- `.cursorrules`: Editor rules and patterns for development

## Critical Code Patterns

### Authentication Flow
The application uses Firebase for authentication with the following flow:
1. User enters credentials on sign-in/sign-up page
2. Form validation is performed using Zod
3. Firebase auth methods are called
4. On success, user is redirected to dashboard
5. Protected pages check auth state and redirect if needed

### Protected Routes
Protected routes follow this pattern:
```typescript
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/firebase-auth-provider";

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    // Page content
  );
}
```

### Form Validation
Forms use react-hook-form with Zod for validation:
```typescript
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    email: "",
    password: "",
  },
  mode: "onChange",
});
```

### Error Handling
Error handling follows this pattern:
```typescript
try {
  // Async operation
} catch (error) {
  console.error("Error context:", error);
  
  // Format error message
  const errorMessage = error.message || "An unexpected error occurred";
  const formattedMessage = errorMessage.includes("Firebase:") 
    ? errorMessage.split("Firebase:")[1].trim() 
    : errorMessage;
  
  // Display to user
  toast.error(formattedMessage);
}
```

### Component Exports
Components are typically exported in this pattern:
```typescript
// Button.tsx
import { ButtonProps } from "./types";

export function Button({ children, ...props }: ButtonProps) {
  return <button {...props}>{children}</button>;
}

// index.ts
export * from "./Button";
``` 