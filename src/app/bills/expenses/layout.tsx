import type { Metadata } from "next";
import { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Bills & Expenses | Family Finance Tracker",
  description: "Manage and track your recurring bills and plan for special expenses",
};

export default function BillsExpensesLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
} 