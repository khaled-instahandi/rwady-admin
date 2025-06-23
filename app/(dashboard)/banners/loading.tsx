import { Card, CardContent } from "@/components/ui/card"

export default function BannersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Banners List Loading */}
        <div className="col-span-4">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="h-5 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="flex gap-2 mt-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 border-b animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-40"></div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-36 mt-1 ml-6"></div>
                        <div className="flex items-center gap-2 mt-2 ml-6">
                          <div className="h-3 bg-gray-200 rounded w-14"></div>
                          <div className="h-3 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-8"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Edit Form Loading */}
        <div className="col-span-8">
          <Card>
            <CardContent className="p-6 animate-pulse">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
                <div className="h-10 bg-gray-200 rounded w-40"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
