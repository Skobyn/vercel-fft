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
      href: "/bills/expenses",
      label: "Bills",
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
