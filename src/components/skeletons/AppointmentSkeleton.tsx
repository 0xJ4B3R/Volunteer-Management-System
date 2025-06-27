import { cn } from "@/lib/utils";

interface AppointmentSkeletonProps {
  count?: number;
  className?: string;
}

export const AppointmentSkeleton = ({ count = 3, className }: AppointmentSkeletonProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-6 bg-white rounded-xl shadow-sm border border-slate-300 animate-pulse"
        >
          <div className="flex justify-between items-center">
            {/* Left side - Main content */}
            <div className="space-y-3">
              {/* Date and Status */}
              <div className="flex items-center gap-3">
                <div className="h-6 w-48 bg-slate-200 rounded" />
                <div className="h-6 w-24 bg-slate-200 rounded" />
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              <div className="h-9 w-32 bg-slate-200 rounded" />
              <div className="h-9 w-32 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 