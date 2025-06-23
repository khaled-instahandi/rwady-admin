"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function ToastTest() {
  const { toast } = useToast()

  const showSuccessToast = () => {
    toast({
      title: "نجح العملية!",
      description: "تم حفظ البيانات بنجاح",
      variant: "default",
    })
  }

  const showErrorToast = () => {
    toast({
      title: "خطأ!",
      description: "حدث خطأ أثناء العملية",
      variant: "destructive",
    })
  }

  const showInfoToast = () => {
    toast({
      title: "معلومات",
      description: "هذه رسالة تجريبية للتوست",
    })
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Toast Test Page</h1>
      <div className="space-x-4">
        <Button onClick={showSuccessToast} variant="default">
          Success Toast
        </Button>
        <Button onClick={showErrorToast} variant="destructive">
          Error Toast
        </Button>
        <Button onClick={showInfoToast} variant="outline">
          Info Toast
        </Button>
      </div>
    </div>
  )
}
