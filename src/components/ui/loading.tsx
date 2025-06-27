import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: number;
}

export const Loading = ({ className, size = 24 }: LoadingProps) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className="h-6 w-6 animate-spin" style={{ width: size, height: size }} />
    </div>
  );
};

export const LoadingPage = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loading size={32} />
    </div>
  );
};

export const PageContentLoading = () => {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    </div>
  );
}; 