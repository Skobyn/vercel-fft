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
import { useState, useEffect } from "react";
import { useAuth } from "@/providers/firebase-auth-provider";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SignInPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, isAuthenticated } = useAuth();
  const [redirectInProgress, setRedirectInProgress] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  // Reset all session flags when landing on sign-in page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear all auth-related flags to prevent redirect loops
      sessionStorage.removeItem('just_signed_in');
      sessionStorage.removeItem('redirect_loop_blocker');
      
      console.log("Cleared session storage flags to prevent redirect loops");
    }
  }, []);

  // Handle redirect if already authenticated
  useEffect(() => {
    // Only redirect if auth check is complete, user exists, and we're not already redirecting
    if (!loading && isAuthenticated && !redirectInProgress) {
      console.log("Already authenticated, redirecting to dashboard");
      
      // Set flag first to prevent duplicate redirects
      setRedirectInProgress(true);
      
      // Slight delay to ensure state is updated before redirect
      setTimeout(() => {
        // Set a flag to prevent immediate redirect back
        sessionStorage.setItem('redirect_loop_blocker', 'true');
        window.location.href = "/dashboard";
      }, 100);
    }
  }, [loading, isAuthenticated, redirectInProgress]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) {
      toast.error("Authentication service is not available");
      return;
    }
    
    if (redirectInProgress) {
      console.log("Redirect already in progress, ignoring form submission");
      return;
    }

    console.log("Starting sign in process...");
    setIsSubmitting(true);
    
    try {
      console.log(`Attempting to sign in with email: ${values.email}`);
      
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth as Auth,
        values.email,
        values.password
      );
      
      console.log("Sign in successful:", userCredential.user.email);
      toast.success("Signed in successfully!");
      
      // Set flag to prevent redirect loops
      setRedirectInProgress(true);
      
      // Set flag to prevent immediate redirect back
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('just_signed_in', 'true');
        sessionStorage.setItem('redirect_loop_blocker', 'true');
      }
      
      // Simple and direct redirect approach
      console.log("Redirecting to dashboard");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error signing in:", error);
      
      let errorMessage = "Failed to sign in. Please check your credentials.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // Try to extract a more user-friendly message from Firebase errors
        if (error.message.includes("auth/")) {
          const errorCode = error.message.split("auth/")[1].split(")")[0];
          errorMessage = errorCode.replace(/-/g, " ").replace(
            /(^\w{1})|(\s+\w{1})/g,
            (letter) => letter.toUpperCase()
          );
        }
      }
      
      console.error("Formatted error message:", errorMessage);
      toast.error(errorMessage);
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
              disabled={isSubmitting || !form.formState.isValid || redirectInProgress}
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
            
            {/* Debug button for development */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-8 pt-4 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    console.log("Debug Auth State:", { 
                      user, 
                      loading,
                      isAuthenticated,
                      authFromLocalStorage: localStorage.getItem('authUser'),
                      sessionStorage: {
                        justSignedIn: sessionStorage.getItem('just_signed_in'),
                        redirectLoopBlocker: sessionStorage.getItem('redirect_loop_blocker')
                      }
                    });
                    
                    if (user) {
                      toast.success(`Signed in as: ${user.email}`);
                    } else {
                      toast.error("Not signed in");
                    }
                    
                    // Force clear all storage to reset state
                    sessionStorage.clear();
                    localStorage.removeItem('authUser');
                    toast.info("Cleared all storage");
                  }}
                >
                  Debug Auth State
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full text-xs mt-2"
                  onClick={() => {
                    // Set redirect blocker and go directly to dashboard
                    sessionStorage.setItem('redirect_loop_blocker', 'true');
                    window.location.href = "/dashboard";
                  }}
                >
                  Go to Dashboard (Demo Mode)
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
