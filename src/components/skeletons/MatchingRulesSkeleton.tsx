import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MatchingRulesSkeletonProps {
  title?: string;
  metricsCount?: number;
  rulesCount?: number;
}

const MatchingRulesSkeleton: React.FC<MatchingRulesSkeletonProps> = ({
  title = "Matching Rules",
  metricsCount = 3,
  rulesCount = 6,
}) => {
  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-slate-300">
        <CardHeader className="pb-3.5">
          <div className="flex items-center space-x-2 mb-2.5">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-64" />
          </div>
          <Skeleton className="h-5 w-[600px]" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: metricsCount }).map((_, i) => (
              <div key={i} className="flex items-start p-3.5 bg-white rounded-md shadow-sm border border-slate-300">
                <Skeleton className="h-10 w-10 rounded-full mr-3" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 pb-5 rounded-lg shadow-sm border border-slate-300">
        <div className="flex-1"></div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      </div>

      {/* Essential Rules Section */}
      <div className="mb-8">
        <div className="flex items-center gap-x-2 mb-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: Math.min(3, rulesCount) }).map((_, i) => (
            <div key={i} className="relative p-6 rounded-lg shadow-sm border border-slate-300 bg-white flex flex-col h-full">
              <div className="flex-grow mb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="mb-5">
                <div className="py-3">
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 border-t border-slate-200 pt-4 min-h-[3rem]">
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Rules Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-16 ml-2" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm text-center border border-slate-300">
          <div className="flex flex-col items-center">
            <Skeleton className="h-12 w-12 rounded-full mb-4" />
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-4" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingRulesSkeleton; 