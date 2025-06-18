import { Skeleton } from "@/components/ui/skeleton"

export function CategorySkeleton() {
  return (
    <div className="flex h-full">
      {/* Left Sidebar Skeleton */}
      <div className="w-80 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-7 w-32 mb-4" />

          {/* Action Buttons Skeleton */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>

          {/* Search Skeleton */}
          <Skeleton className="h-10 w-full mb-4" />

          {/* Collapse/Expand Controls Skeleton */}
          <div className="flex justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>

        {/* Categories Tree Skeleton */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-5 w-24" />
          </div>

          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-8 w-full" />
                {index === 0 && (
                  <div className="ml-6 space-y-2">
                    <Skeleton className="h-7 w-[90%]" />
                    <Skeleton className="h-7 w-[90%]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 bg-gray-50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-16" />
          </div>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg bg-white p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-5 w-32 mb-1" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-32 w-32" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-[200px] w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-[200px] w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
