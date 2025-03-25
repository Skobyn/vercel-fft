"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/layout/main-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleDollarSign } from "lucide-react";
import { useAuth } from "@/providers/firebase-auth-provider";
import { toast } from "sonner";

export function Header() {
  const { user, demoMode, signOut, updateUserInfo } = useAuth();

  const handleChangeName = () => {
    if (!user) return;
    
    const newName = prompt("Enter your new display name:", user.displayName);
    if (newName && newName !== user.displayName) {
      updateUserInfo({ displayName: newName })
        .catch(error => {
          console.error("Error updating name:", error);
          toast.error("Failed to update display name");
        });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <CircleDollarSign className="h-6 w-6" />
          <span className="font-bold">Financial Flow</span>
        </Link>
        <MainNav />
        <div className="ml-auto flex items-center">
          {demoMode && (
            <div className="mr-4 text-sm px-3 py-1 bg-amber-100 text-amber-800 rounded-md">
              Demo Mode
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user?.displayName?.[0] || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.displayName || "Guest"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "No email"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleChangeName}>
                Change Display Name
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {demoMode ? (
                <DropdownMenuItem onClick={() => toast.info("This is demo mode - no sign out needed!")}>
                  Demo Mode Info
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
