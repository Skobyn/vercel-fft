import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, PiggyBank, LineChart, Calendar } from "lucide-react";

// This is a Server Component - more efficient and reliable for the home page
export default function Home() {
  return (
    <div className="flex flex-col min-h-[100vh]">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="/">
          <CircleDollarSign className="h-6 w-6 mr-2" />
          <span className="font-bold">Financial Flow</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/about">
            About
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/dashboard">
            Dashboard
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Simplify Your Family Finances
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Connect your bank accounts, track expenses, manage bills, and plan your financial future in one secure place.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <a href="/dashboard">
                    <Button size="lg" className="w-full">Enter Demo</Button>
                  </a>
                  <a href="/dashboard">
                    <Button size="lg" variant="outline" className="w-full">Explore Features</Button>
                  </a>
                </div>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 mt-4">
                  <p className="text-sm">
                    <strong>Demo Mode Active:</strong> All features are available without authentication.
                  </p>
                </div>
              </div>
              <div className="mx-auto flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-4">
                    <PiggyBank className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold">Budget Planning</h3>
                    <p className="text-center text-muted-foreground">Set and track budgets for every category</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-4">
                    <LineChart className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold">Financial Insights</h3>
                    <p className="text-center text-muted-foreground">Track spending patterns and trends</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-4">
                    <Calendar className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold">Bill Management</h3>
                    <p className="text-center text-muted-foreground">Never miss a payment deadline</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-4">
                    <CircleDollarSign className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold">Bank Connectivity</h3>
                    <p className="text-center text-muted-foreground">Sync with your accounts securely</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Features That Matter</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Financial Flow helps you manage your family finances with powerful features designed for everyday use.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6">
                <CircleDollarSign className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Bank Connectivity</h3>
                <p className="text-center text-muted-foreground">
                  Connect securely to your bank accounts to automatically import transactions.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6">
                <Calendar className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Bill Scheduling</h3>
                <p className="text-center text-muted-foreground">
                  Set up monthly, quarterly, and annual bills with reminders and payment tracking.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6">
                <PiggyBank className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Budget Planning</h3>
                <p className="text-center text-muted-foreground">
                  Create detailed budgets for regular expenses and special occasions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full border-t px-4 md:px-6">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Financial Flow. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/terms">
            Terms
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/privacy">
            Privacy
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/contact">
            Contact
          </Link>
        </nav>
      </footer>
    </div>
  );
}
