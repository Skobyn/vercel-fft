"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, Auth } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/firebase-auth-provider";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SignInPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const { user, loading } = useAuth();
  const redirectChecked = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  // Check URL parameters and show welcome message
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      toast.success("Account created! Please sign in with your credentials.");
    }
  }, []);

  // Redirect if user is already signed in - BUT ONLY ONCE
  useEffect(() => {
    // Only run this check once to prevent loops
    if (redirectChecked.current) return;
    redirectChecked.current = true;
    
    // If we're loading, don't do anything yet
    if (loading) return;
    
    // Clear any existing redirect flags to start fresh
    sessionStorage.removeItem('redirect_count');
    
    // Check if we're coming from a successful sign-in
    const justSignedIn = sessionStorage.getItem('just_signed_in');
    if (justSignedIn) {
      console.log("Just signed in flag found, redirecting to dashboard");
      sessionStorage.removeItem('just_signed_in');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
      return;
    }
    
    // If there's a logged-in user, redirect to dashboard
    if (user) {
      console.log("User already authenticated, redirecting to dashboard");
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
      return;
    }
    
    // As a fallback, check localStorage
    try {
      const storedUserData = localStorage.getItem('auth_user');
      if (storedUserData) {
        const storedUser = JSON.parse(storedUserData);
        // Ensure the data isn't too old (24 hour expiry)
        const userTimestamp = storedUser.timestamp || 0;
        if (Date.now() - userTimestamp < 24 * 60 * 60 * 1000) {
          console.log("Found stored user data, redirecting");
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 100);
          return;
        } else {
          console.log("Stored user data expired, clearing");
          localStorage.removeItem('auth_user');
        }
      }
    } catch (e) {
      console.error("Error parsing stored user data", e);
      localStorage.removeItem('auth_user');
    }
  }, [loading]); // Only depend on loading, not on user or router

  // Check if Firebase Auth is initialized
  useEffect(() => {
    if (auth) {
      console.log("Auth is initialized");
      setIsAuthInitialized(true);
    } else {
      console.log("Auth is not initialized");
    }
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Starting sign in process...");
    setIsSubmitting(true);
    
    if (!isAuthInitialized || !auth) {
      console.error("Firebase Auth is not initialized");
      toast.error("Authentication service is not available. Please try again later.");
      setIsSubmitting(false);
      return;
    }
    
    try {
      console.log(`Attempting to sign in with email: ${values.email}`);
      const userCredential = await signInWithEmailAndPassword(
        auth as Auth,
        values.email,
        values.password
      );
      
      console.log("Sign in successful:", userCredential.user.email);
      toast.success("Signed in successfully!");
      
      // Store auth info in localStorage
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        timestamp: Date.now(),
      };
      localStorage.setItem('auth_user', JSON.stringify(userData));
      console.log("User data saved to localStorage", userData);
      
      // Set a flag to prevent redirect loops
      sessionStorage.setItem('just_signed_in', 'true');
      sessionStorage.removeItem('redirect_count');
      
      // Redirect to dashboard
      window.location.href = '/dashboard';

    } catch (error) {
      console.error("Error signing in:", error);
      if (error instanceof Error) {
        // Handle specific Firebase Auth errors
        const errorMessage = error.message.includes("auth/")
          ? error.message
              .split("auth/")[1]
              .split(")")[0]
              .replace(/-/g, " ")
              .replace(
                /(^\w{1})|(\s+\w{1})/g,
                (letter) => letter.toUpperCase()
              )
          : error.message;
        console.error("Formatted error message:", errorMessage);
        toast.error(errorMessage);
      } else {
        console.error("Unknown error type:", typeof error);
        toast.error("Failed to sign in. Please check your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Enter your credentials to access your account
          </p>
        </div>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="you@example.com" 
                      type="email"
                      autoComplete="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      autoComplete="current-password"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Don't have an account?{" "}
                <a
                  href="/auth/signup"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </a>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
