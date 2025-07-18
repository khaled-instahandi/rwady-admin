"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing, Check, CheckCheck, Trash2, Settings, Loader2, RefreshCw, Filter, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useNotifications } from "@/components/providers/notification-provider"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/api"

const notificationTypeColors = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  error: "bg-red-50 border-red-200 text-red-800"
}

const notificationTypeIcons = {
  info: <Bell className="h-5 w-5 text-blue-600" />,
  success: <CheckCheck className="h-5 w-5 text-green-600" />,
  warning: <BellRing className="h-5 w-5 text-yellow-600" />,
  error: <BellRing className="h-5 w-5 text-red-600" />
}

const typeLabels = {
  info: "معلومات",
  success: "نجح",
  warning: "تحذير",
  error: "خطأ"
}

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    refreshNotifications, 
    markAsRead,
    fcmToken 
  } = useNotifications()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedTab, setSelectedTab] = useState<string>("all")

  // Filter notifications based on search and type
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === "all" || notification.type === selectedType
    
    const matchesTab = selectedTab === "all" || 
                      (selectedTab === "read" && notification.read_at) ||
                      (selectedTab === "unread" && !notification.read_at)
    
    return matchesSearch && matchesType && matchesTab
  })

  const unreadNotifications = notifications.filter(n => !n.read_at)
  const readNotifications = notifications.filter(n => n.read_at)

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    try {
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id)
      }
      toast.success("تم تمييز جميع الإشعارات كمقروءة")
    } catch (error) {
      toast.error("فشل في تمييز الإشعارات")
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "الآن"
    if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`
    if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`
    if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`
    return date.toLocaleDateString('ar-SA')
  }

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const isRead = !!notification.read_at
    
    return (
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer",
        !isRead && "border-l-4 border-l-blue-500 bg-blue-50/30"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {notificationTypeIcons[notification.type]}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      "font-medium text-sm",
                      !isRead && "font-semibold"
                    )}>
                      {notification.title}
                    </h3>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", notificationTypeColors[notification.type])}
                    >
                      {typeLabels[notification.type]}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                    
                    {!isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        تمييز كمقروء
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {!isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">الإشعارات</h1>
            <p className="text-sm text-gray-600">
              {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : "جميع الإشعارات مقروءة"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshNotifications}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            تحديث
          </Button>
          
          {unreadCount > 0 && (
            <Button
              size="sm"
              onClick={handleMarkAllAsRead}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              تمييز الكل كمقروء
            </Button>
          )}
        </div>
      </div>

      {/* FCM Token Info (for development) */}
      {fcmToken && process.env.NODE_ENV === 'development' && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">FCM Token (للتطوير):</div>
            <code className="text-xs bg-gray-100 p-1 rounded break-all">
              {fcmToken}
            </code>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في الإشعارات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="نوع الإشعار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="info">معلومات</SelectItem>
                <SelectItem value="success">نجح</SelectItem>
                <SelectItem value="warning">تحذير</SelectItem>
                <SelectItem value="error">خطأ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            الكل ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-2">
            <BellRing className="h-4 w-4" />
            غير مقروء ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read" className="flex items-center gap-2">
            <CheckCheck className="h-4 w-4" />
            مقروء ({readNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="mr-2">جاري التحميل...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد إشعارات</h3>
                <p className="text-gray-500 text-center">
                  {searchTerm || selectedType !== "all" 
                    ? "لم يتم العثور على إشعارات تطابق معايير البحث" 
                    : "ستظهر الإشعارات هنا عند وصولها"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCheck className="h-12 w-12 text-green-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">جميع الإشعارات مقروءة</h3>
                <p className="text-gray-500">ممتاز! لقد قرأت جميع الإشعارات</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {unreadNotifications
                .filter(notification => {
                  const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       notification.message.toLowerCase().includes(searchTerm.toLowerCase())
                  const matchesType = selectedType === "all" || notification.type === selectedType
                  return matchesSearch && matchesType
                })
                .map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {readNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد إشعارات مقروءة</h3>
                <p className="text-gray-500">الإشعارات التي تقرأها ستظهر هنا</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {readNotifications
                .filter(notification => {
                  const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       notification.message.toLowerCase().includes(searchTerm.toLowerCase())
                  const matchesType = selectedType === "all" || notification.type === selectedType
                  return matchesSearch && matchesType
                })
                .map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
