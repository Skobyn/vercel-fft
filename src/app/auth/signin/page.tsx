"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function SignInPage() {
  useEffect(() => {
    toast.success("Demo mode active - redirecting to dashboard");
    
    // Redirect to dashboard immediately
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 500);
  }, []);

  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">Demo Mode</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Redirecting to dashboard...
        </p>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
