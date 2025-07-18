"use client"

import { AlertTriangle, CheckCircle2, Loader2, Settings } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useMaintenanceMode } from "@/hooks/use-maintenance-mode"
import { useRouter } from "next/navigation"

export default function MaintenanceStatusCard() {
  const { isMaintenanceMode, loading } = useMaintenanceMode()
  const router = useRouter()

  if (loading) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>جاري فحص حالة الموقع...</AlertTitle>
        <AlertDescription>
          يتم التحقق من حالة الصيانة الحالية للموقع
        </AlertDescription>
      </Alert>
    )
  }

  if (isMaintenanceMode) {
    return (
      <Alert variant="destructive" className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">الموقع في وضع الصيانة</AlertTitle>
        <AlertDescription className="text-orange-700">
          <div className="flex items-center justify-between mt-2">
            <div>
              <p>الموقع غير متاح للمستخدمين حالياً. يمكنك إدارة الإعدادات من هنا.</p>
              <Badge variant="secondary" className="mt-2 bg-orange-100 text-orange-800">
                وضع الصيانة نشط
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/settings')}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Settings className="h-4 w-4 mr-2" />
              إدارة الإعدادات
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">الموقع يعمل بشكل طبيعي</AlertTitle>
      <AlertDescription className="text-green-700">
        <div className="flex items-center justify-between mt-2">
          <div>
            <p>الموقع متاح ويعمل بشكل طبيعي للمستخدمين.</p>
            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
              متاح
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/settings')}
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            <Settings className="h-4 w-4 mr-2" />
            إدارة الإعدادات
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
