"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { auth } from "@/lib/firebase-client";
import { sendPasswordResetEmail } from "firebase/auth";

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CircleDollarSign, ArrowLeft, TrendingUp } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      if (!auth) {
        throw new Error("Firebase auth not initialized");
      }
      
      await sendPasswordResetEmail(auth, data.email);
      
      setEmailSent(true);
      toast.success("Password reset email sent");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner message="Sending reset email..." size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/40">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center space-y-2 mb-6">
          <div className="p-2 bg-green-600 text-white rounded-full">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Achievr</h1>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Reset password</CardTitle>
            <CardDescription className="text-center">
              {emailSent 
                ? "Check your email for the reset link" 
                : "Enter your email to receive a password reset link"}
            </CardDescription>
          </CardHeader>
          {!emailSent ? (
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Send Reset Link
                  </Button>
                </form>
              </Form>
            </CardContent>
          ) : (
            <CardContent className="text-center py-6">
              <p className="mb-4">We've sent a password reset link to your email address.</p>
              <p className="text-sm text-muted-foreground">
                If you don't receive the email within a few minutes, please check your spam folder.
              </p>
            </CardContent>
          )}
          <CardFooter className="flex justify-center">
            <Link href="/auth/signin" className="flex items-center text-sm text-primary">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 