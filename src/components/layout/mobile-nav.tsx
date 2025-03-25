"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/transactions",
      label: "Transactions",
      active: pathname === "/transactions",
    },
    {
      href: "/budgets",
      label: "Budgets",
      active: pathname === "/budgets",
    },
    {
      href: "/income",
      label: "Income",
      active: pathname === "/income",
    },
    {
      href: "/bills/expenses",
      label: "Bills & Expenses",
      active: pathname === "/bills/expenses" || pathname === "/bills",
    },
    {
      href: "/forecasting",
      label: "Forecasting",
      active: pathname === "/forecasting",
    },
    {
      href: "/goals",
      label: "Goals",
      active: pathname === "/goals",
    },
    {
      href: "/reports",
      label: "Reports",
      active: pathname === "/reports",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="px-7 flex items-center space-x-2 mb-8">
          <div className="p-1 bg-green-600 rounded-md">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold">Achievr</span>
        </div>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10">
          <div className="flex flex-col space-y-2 px-6">
            {routes.map((route) => (
              <Link key={route.href} href={route.href}>
                <Button
                  variant={route.active ? "secondary" : "ghost"}
                  className={cn("w-full justify-start", {
                    "bg-muted": route.active,
                  })}
                  onClick={() => setOpen(false)}
                >
                  {route.label}
                </Button>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
} 