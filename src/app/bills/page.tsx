"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
            <p className="text-muted-foreground">
              Manage and track your recurring bills
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bills</CardTitle>
              <CardDescription>
                Stay on top of your payment schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Your bills will appear here.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your recurring bills to get reminders and track your payment history.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
