import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full md:w-48" />
            <Skeleton className="h-10 w-full md:w-48" />
          </div>
        </CardContent>
      </Card>

      {/* Settings Categories Skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, categoryIndex) => (
          <Card key={categoryIndex} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {Array.from({ length: Math.floor(Math.random() * 4) + 2 }).map((_, settingIndex) => (
                  <div
                    key={settingIndex}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-5 w-12" />
                          {Math.random() > 0.5 && <Skeleton className="h-5 w-12" />}
                        </div>
                        
                        <div className="mt-2">
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
