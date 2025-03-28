import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/providers/firebase-auth-provider";
import { HouseholdProvider } from "@/providers/household-provider";

// Configure Inter font
const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Achievr",
  description: "Track and manage your family's finances with Achievr",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-touch-icon.png' }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <HouseholdProvider>
              {children}
              <Toaster />
            </HouseholdProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
