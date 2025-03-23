"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Lock, FileQuestion, CreditCard, Shield, AlertCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PlaidLinkButton } from "./plaid-link-button"; // Added import

// Mock connected accounts for UI demonstration
type ConnectedAccount = {
  id: string;
  name: string;
  institution: string;
  logo: string;
  lastSync: string;
  accountType: "checking" | "savings" | "credit" | "investment";
  balance: number;
  status: "active" | "error" | "pending";
};

export default function ConnectBankPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  // Mock data for connected accounts
  const connectedAccounts: ConnectedAccount[] = [
    {
      id: "acc-1",
      name: "Primary Checking",
      institution: "Chase Bank",
      logo: "https://placehold.co/32x32?text=CHASE",
      lastSync: "2025-03-23T10:30:00Z",
      accountType: "checking",
      balance: 3245.67,
      status: "active",
    },
    {
      id: "acc-2",
      name: "Savings Account",
      institution: "Chase Bank",
      logo: "https://placehold.co/32x32?text=CHASE",
      lastSync: "2025-03-23T10:30:00Z",
      accountType: "savings",
      balance: 12500.00,
      status: "active",
    },
    {
      id: "acc-3",
      name: "Credit Card",
      institution: "American Express",
      logo: "https://placehold.co/32x32?text=AMEX",
      lastSync: "2025-03-22T15:45:00Z",
      accountType: "credit",
      balance: -1850.45,
      status: "active",
    },
    {
      id: "acc-4",
      name: "Checking Account",
      institution: "Bank of America",
      logo: "https://placehold.co/32x32?text=BOA",
      lastSync: "2025-03-20T09:15:00Z",
      accountType: "checking",
      balance: 754.32,
      status: "error",
    },
  ];

  // Banking institutions for connection UI
  const institutions = [
    { id: "chase", name: "Chase", logo: "https://placehold.co/64x64?text=CHASE" },
    { id: "bofa", name: "Bank of America", logo: "https://placehold.co/64x64?text=BOA" },
    { id: "wells", name: "Wells Fargo", logo: "https://placehold.co/64x64?text=WF" },
    { id: "citi", name: "Citibank", logo: "https://placehold.co/64x64?text=CITI" },
    { id: "cap1", name: "Capital One", logo: "https://placehold.co/64x64?text=CAP1" },
    { id: "amex", name: "American Express", logo: "https://placehold.co/64x64?text=AMEX" },
    { id: "discover", name: "Discover", logo: "https://placehold.co/64x64?text=DISC" },
    { id: "usbank", name: "US Bank", logo: "https://placehold.co/64x64?text=USB" },
    { id: "pnc", name: "PNC Bank", logo: "https://placehold.co/64x64?text=PNC" },
    { id: "tdbank", name: "TD Bank", logo: "https://placehold.co/64x64?text=TD" },
    { id: "other", name: "Other Banks", logo: "https://placehold.co/64x64?text=..." },
  ];

  // Handle bank selection and connection
  const handleConnectBank = (bankId: string) => {
    setSelectedBank(bankId);

    // In a real app, this would open a secure Plaid connection dialog
    console.log(`Connecting to bank: ${bankId}`);

    // After successful connection, we would update the connected accounts list
    // and show a success message
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connect Bank Accounts</h1>
          <p className="text-muted-foreground">
            Link your financial accounts to automatically import and categorize transactions
          </p>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="connect">Connect Account</TabsTrigger>
            <TabsTrigger value="manage">Manage Connections</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Financial Hub</CardTitle>
                <CardDescription>
                  Connect your bank accounts, credit cards, and investment accounts for a complete financial picture.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-4">
                    <Building className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold">Bank Accounts</h3>
                    <p className="text-center text-muted-foreground">Connect checking and savings accounts</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-4">
                    <CreditCard className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold">Credit Cards</h3>
                    <p className="text-center text-muted-foreground">Track spending and manage payments</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-4">
                    <Shield className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold">Secure Connection</h3>
                    <p className="text-center text-muted-foreground">Bank-level encryption protects your data</p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-semibold">Security & Privacy</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    We use Plaid to securely connect to your bank. We never store your bank
                    credentials and use end-to-end encryption to protect your financial data.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button variant="link" size="sm" className="h-auto p-0">
                      <Link href="/privacy">Privacy Policy</Link>
                    </Button>
                    <Separator orientation="vertical" className="h-4 my-auto" />
                    <Button variant="link" size="sm" className="h-auto p-0">
                      <Link href="/security">Security Details</Link>
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <PlaidLinkButton onSuccess={() => window.location.reload()}> {/* Updated Button */}
                    Connect an Account
                  </PlaidLinkButton>
                </div>
              </CardContent>
            </Card>

            {connectedAccounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>
                    Your linked financial accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {connectedAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded overflow-hidden">
                            <img src={account.logo} alt={account.institution} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{account.name}</h4>
                              {account.status === "error" && (
                                <Badge variant="destructive" className="text-xs">Sync Error</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{account.institution}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${account.balance < 0 ? 'text-rose-500' : ''}`}>
                            ${Math.abs(account.balance).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last updated: {new Date(account.lastSync).toLocaleTimeString()} today
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="ghost" onClick={() => setActiveTab("connect")}>
                    Add Account
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("manage")}>
                    Manage Connections
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="connect" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connect a Financial Account</CardTitle>
                <CardDescription>
                  Select your bank or financial institution to establish a secure connection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {institutions.map((institution) => (
                    <button
                      key={institution.id}
                      onClick={() => handleConnectBank(institution.id)}
                      className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                        selectedBank === institution.id ? 'ring-2 ring-primary bg-muted/50' : ''
                      }`}
                    >
                      <div className="w-16 h-16 mb-2">
                        <img src={institution.logo} alt={institution.name} className="w-full h-full object-contain" />
                      </div>
                      <p className="text-sm font-medium">{institution.name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                <Button variant="outline" onClick={() => setActiveTab("overview")}>
                  Back to Overview
                </Button>
                {selectedBank && (
                  <PlaidLinkButton onSuccess={() => window.location.reload()}> {/* Updated Button */}
                    Continue with {institutions.find(i => i.id === selectedBank)?.name}
                  </PlaidLinkButton>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                <div className="space-y-1">
                  <h4 className="font-medium">Is my data secure?</h4>
                  <p className="text-muted-foreground">
                    Yes, we use bank-level 256-bit encryption and never store your login credentials. We only receive read-only access to your transaction data.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">Will this affect my credit score?</h4>
                  <p className="text-muted-foreground">
                    No, connecting your accounts is considered a "soft pull" that doesn't impact your credit score. It's similar to checking your own accounts.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">Can I disconnect at any time?</h4>
                  <p className="text-muted-foreground">
                    Yes, you can disconnect any linked account at any time from the Manage Connections tab.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">My bank isn't listed, what do I do?</h4>
                  <p className="text-muted-foreground">
                    Select "Other Banks" to see a more comprehensive list of supported financial institutions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Connected Accounts</CardTitle>
                <CardDescription>
                  View, update, and remove your linked financial accounts
                </CardDescription>
              </CardHeader>
              {connectedAccounts.length > 0 ? (
                <CardContent>
                  <div className="space-y-6">
                    {connectedAccounts.map((account) => (
                      <div key={account.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded overflow-hidden">
                              <img src={account.logo} alt={account.institution} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="font-medium">{account.name}</h4>
                              <p className="text-sm text-muted-foreground">{account.institution}</p>
                            </div>
                          </div>
                          <Badge variant={account.status === "active" ? "outline" : "destructive"}>
                            {account.status === "active" ? "Connected" : "Connection Error"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="border-l-4 border-primary pl-2">
                            <p className="text-xs text-muted-foreground">Account Type</p>
                            <p className="font-medium capitalize">{account.accountType}</p>
                          </div>
                          <div className="border-l-4 border-primary pl-2">
                            <p className="text-xs text-muted-foreground">Current Balance</p>
                            <p className={`font-medium ${account.balance < 0 ? 'text-rose-500' : ''}`}>
                              ${Math.abs(account.balance).toFixed(2)} {account.balance < 0 ? 'owed' : ''}
                            </p>
                          </div>
                          <div className="border-l-4 border-primary pl-2">
                            <p className="text-xs text-muted-foreground">Last Synced</p>
                            <p className="font-medium">
                              {new Date(account.lastSync).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline">
                            Sync Now
                          </Button>
                          {account.status === "error" && (
                            <Button size="sm" variant="outline">
                              Fix Connection
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                            Disconnect
                          </Button>
                        </div>

                        {account.status === "error" && (
                          <div className="mt-4 flex items-start gap-2 p-2 rounded bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300">
                            <AlertCircle className="h-4 w-4 mt-0.5" />
                            <p className="text-xs">
                              There was an error syncing this account. This may be due to changed credentials or temporary connection issues. Please reconnect or try again later.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              ) : (
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Accounts Connected</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't connected any financial accounts yet. Connect accounts to automatically import transactions.
                    </p>
                    <Button onClick={() => setActiveTab("connect")}>
                      Connect an Account
                    </Button>
                  </div>
                </CardContent>
              )}
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("overview")}>
                  Back to Overview
                </Button>
                <Button onClick={() => setActiveTab("connect")}>
                  Add New Account
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
