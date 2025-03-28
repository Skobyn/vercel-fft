"use client";

import { MainNav } from "@/components/layout/main-nav";
import { UserNav } from "@/components/layout/user-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TrendingUp } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <a href="/dashboard" className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">Achievr</span>
            </a>
          </div>
          <div className="flex items-center md:hidden">
            <a href="/dashboard" className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-600 rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg">Achievr</span>
            </a>
          </div>
          <div className="hidden md:flex md:flex-1">
            <MainNav />
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
        <MobileNav />
      </header>
      <main className="flex-1 container px-4 md:px-6 pt-6">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>© {new Date().getFullYear()} Achievr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
