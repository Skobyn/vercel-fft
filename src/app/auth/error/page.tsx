import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AuthError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/40">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center space-y-2 mb-6">
          <div className="p-2 bg-primary text-primary-foreground rounded-full">
            <CircleDollarSign className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Financial Flow</h1>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-center mb-2 text-amber-500">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <CardTitle className="text-center text-xl">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              An error occurred during authentication. Please try again.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/auth/signin">
                Try Again
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
