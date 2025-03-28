"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/firebase-auth-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Settings, Users, PiggyBank, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <LoadingSpinner size="lg" message="Loading settings..." />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    // This should ideally not be reached due to the redirect, but included as a fallback
    return null;
  }

  const settingsOptions = [
    {
      title: "Accounts",
      description: "Manage your connected financial accounts",
      icon: <PiggyBank className="h-6 w-6" />,
      href: "/settings/accounts",
    },
    {
      title: "Family Sharing",
      description: "Share access with family members",
      icon: <Users className="h-6 w-6" />,
      href: "/settings/family-sharing",
    },
    // Add more settings options here in the future
    // {
    //   title: "Profile",
    //   description: "Manage your personal information",
    //   icon: <User className="h-6 w-6" />,
    //   href: "/settings/profile",
    // },
    // {
    //   title: "Notifications",
    //   description: "Configure your notification preferences",
    //   icon: <Bell className="h-6 w-6" />,
    //   href: "/settings/notifications",
    // },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {settingsOptions.map((option) => (
            <Card key={option.href} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-muted rounded-full text-primary">
                    {option.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={option.href} passHref>
                  <Button variant="outline" className="w-full justify-between">
                    Go to {option.title}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 