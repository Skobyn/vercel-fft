import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  centered?: boolean;
}

export function LoadingSpinner({ 
  size = "md", 
  message,
  centered = true
}: LoadingSpinnerProps) {
  // Size mappings
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const sizeClass = sizes[size];
  
  const container = centered 
    ? "flex flex-col items-center justify-center min-h-[200px]" 
    : "flex flex-col items-center";

  return (
    <div className={container}>
      <Loader2 className={`${sizeClass} animate-spin text-primary`} />
      {message && (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
} 