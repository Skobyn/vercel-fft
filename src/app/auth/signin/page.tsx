"use client";

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
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SignInPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) {
      toast.error("Authentication service is not available");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      
      toast.success("Signed in successfully!");
      
      // Direct navigation to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      let errorMessage = "Failed to sign in. Please check your credentials.";
      
      if (error instanceof Error) {
        if (error.message.includes("auth/")) {
          const errorCode = error.message.split("auth/")[1].split(")")[0];
          errorMessage = errorCode.replace(/-/g, " ").replace(
            /(^\w{1})|(\s+\w{1})/g,
            (letter) => letter.toUpperCase()
          );
        }
      }
      
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
