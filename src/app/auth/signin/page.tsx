"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
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
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const { user, loading } = useAuth();

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

  // Redirect if user is already signed in
  useEffect(() => {
    if (!loading && user) {
      console.log("User is already signed in, redirecting to dashboard...");
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Check if Firebase Auth is initialized
  useEffect(() => {
    const checkAuth = () => {
      console.log("Checking auth initialization...");
      if (auth) {
        console.log("Auth is initialized");
        setIsAuthInitialized(true);
      } else {
        console.log("Auth is not initialized");
      }
    };
    checkAuth();
  }, []);

  // Debug form state
  useEffect(() => {
    console.log("Form state:", {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      isDirty: form.formState.isDirty,
      isSubmitting: form.formState.isSubmitting,
    });
  }, [form.formState]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Starting sign in process...");
    if (!isAuthInitialized) {
      console.error("Auth not initialized");
      toast.error("Authentication is not initialized yet. Please try again.");
      return;
    }

    if (!auth) {
      console.error("Auth object is null");
      toast.error("Authentication service is not available. Please try again.");
      return;
    }

    setIsSubmitting(true);
    console.log("Attempting to sign in with email:", values.email);
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      
      console.log("Sign in successful:", userCredential.user.email);
      toast.success("Signed in successfully!");
      
      // Store auth info in localStorage as a more reliable mechanism
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        timestamp: Date.now(),
      };
      localStorage.setItem('auth_user', JSON.stringify(userData));
      console.log("User data saved to localStorage", userData);
      
      // Force immediate redirection
      console.log("Manual direct redirect to dashboard...");
      window.location.replace('/dashboard');

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
