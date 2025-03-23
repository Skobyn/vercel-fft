import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { FirebaseAuthProvider } from '@/providers/firebase-auth-provider';
import { ThemeProvider } from "@/components/ui/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Financial Flow - Family Finance Management",
  description: "Track bills, budgets, expenses, and income with bank connectivity",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <FirebaseAuthProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </FirebaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
