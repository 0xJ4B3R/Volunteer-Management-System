import { Skeleton } from "@/components/ui/skeleton";

interface DataTableSkeletonProps {
  title?: string;
  metricsCount?: number;
  rowsCount?: number;
  showMobileSearch?: boolean;
}

const DataTableSkeleton = ({
  title = "Data",
  metricsCount = 4,
  rowsCount = 3,
  showMobileSearch = true
}: DataTableSkeletonProps) => {
  return (
    <div className="space-y-6 -mt-6">
      {/* Mobile Search Skeleton */}
      {showMobileSearch && (
        <div className="lg:hidden">
          <div className="relative">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      )}

      {/* Metrics Overview Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(metricsCount)].map((_, i) => (
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

      {/* Controls Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-300">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left Section - Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-9 w-[140px]" />
              <Skeleton className="h-9 w-[120px]" />
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-[120px]" />
              <Skeleton className="h-9 w-[120px]" />
              <Skeleton className="h-9 w-[120px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Data List Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-300">
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="py-3 px-4 text-left">
                    <Skeleton className="h-4 w-4" />
                  </th>
                  <th className="py-3 px-4 text-left">
                    <Skeleton className="h-4 w-24" />
                  </th>
                  <th className="py-3 px-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="py-3 px-4 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="py-3 px-4 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="py-3 px-4 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="py-3 px-4 text-center">
                    <Skeleton className="h-4 w-8" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {[...Array(rowsCount)].map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-4" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Skeleton className="h-8 w-8" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-300">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-[70px]" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-[80px] px-3" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-[80px] px-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTableSkeleton; 