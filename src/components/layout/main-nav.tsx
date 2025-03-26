"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { 
  BarChart3, 
  CalendarDays, 
  CreditCard, 
  DollarSign, 
  Home, 
  PiggyBank, 
  Settings, 
  Target, 
  Wallet 
} from "lucide-react";

export const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Bills & Expenses",
    href: "/bills",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    title: "Income",
    href: "/income",
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    title: "Budgets",
    href: "/budgets",
    icon: <PiggyBank className="h-4 w-4" />,
  },
  {
    title: "Goals",
    href: "/goals",
    icon: <Target className="h-4 w-4" />,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: <CalendarDays className="h-4 w-4" />,
    description: "View spending activity across days and weeks",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

export function MainNav() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

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
      href: "/bills",
      label: "Bills & Expenses",
      active: pathname === "/bills" || pathname === "/bills/expenses",
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
    <div className="flex items-center space-x-4 lg:space-x-6">
      <NavigationMenu>
        <NavigationMenuList>
          {routes.map((route) => (
            <NavigationMenuItem key={route.href}>
              <Link href={route.href} legacyBehavior passHref>
                <NavigationMenuLink
                  className={cn(
                    navigationMenuTriggerStyle(),
                    route.active
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {route.label}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="ml-auto"
      >
        {theme === "light" ? (
          <MoonIcon className="h-5 w-5" />
        ) : (
          <SunIcon className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
