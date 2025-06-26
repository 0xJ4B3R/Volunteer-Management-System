import React from "react";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ReportsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 -mt-6">
      {/* Mobile Search */}
      <div className="lg:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Skeleton className="h-10 w-full pl-9" />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 border border-slate-300">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-300 p-4 mb-6">
        <div className="flex space-x-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-md" />
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-300 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left Section - Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-9 w-[140px]" />
            <Skeleton className="h-9 w-[180px]" />
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-[140px]" />
          </div>
        </div>
      </div>

      {/* Report List */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Report Icon - matches getTypeIconWithBg */}
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Skeleton className="h-5 w-5 rounded" />
                  </div>

                  <div>
                    {/* Report Title and Badge - matches actual structure */}
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-96" />
                      <Skeleton className="h-6 w-20 rounded-full flex-shrink-0 p-4" />
                    </div>

                    {/* Report Date - matches actual structure */}
                    <Skeleton className="h-4 w-48 mt-1" />
                  </div>
                </div>

                {/* Action Buttons - matches actual structure */}
                <div className="flex items-center justify-center gap-2 p-2">
                  <Skeleton className="h-10 w-10 rounded" />
                  <Skeleton className="h-10 w-10 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsSkeleton; 