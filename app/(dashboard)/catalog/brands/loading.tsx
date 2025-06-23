import { Card, CardContent } from "@/components/ui/card"

export default function BrandsLoading() {
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
        {/* Left Panel - Brands List Loading */}
        <div className="col-span-4">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 border-b animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-24 mt-1 ml-6"></div>
                        <div className="flex items-center gap-2 mt-2 ml-6">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-14"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
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
            <CardContent className="p-6">
              <div className="space-y-6 animate-pulse">
                <div>
                  <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="flex items-center gap-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-32 bg-gray-200 rounded w-full"></div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-10 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
