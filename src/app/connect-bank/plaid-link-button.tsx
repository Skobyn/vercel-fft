"use client";

import { Button } from "@/components/ui/button";
import { usePlaidLinkFlow } from "@/hooks/use-plaid-link";
import { Loader2 } from "lucide-react";

interface PlaidLinkButtonProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  onSuccess?: () => void;
}

export function PlaidLinkButton({
  children,
  variant = "default",
  onSuccess,
}: PlaidLinkButtonProps) {
  const { startLinkFlow, isLoading, ready } = usePlaidLinkFlow({
    onSuccess: () => {
      if (onSuccess) onSuccess();
    },
  });

  return (
    <Button
      variant={variant}
      onClick={startLinkFlow}
      disabled={isLoading || !ready}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
