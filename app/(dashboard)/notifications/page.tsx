"use client"

import { useState } from "react"
import { Bell, BellRing, Check, CheckCheck, Trash2, Settings, Loader2, RefreshCw, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useNotificationsWithFilters } from "@/hooks/use-notifications"
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
    info: "Info",
    success: "Success",
    warning: "Warning",
    error: "Error"
}

export default function NotificationsPage() {
    const { fcmToken } = useNotifications() // For FCM token display only

    const {
        notifications,
        loading,
        filters,
        updateFilters,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        unreadCount,
        unreadNotifications,
        readNotifications,
        totalCount,
        currentPage,
        totalPages,
        refreshNotifications
    } = useNotificationsWithFilters()

    const [selectedTab, setSelectedTab] = useState<string>("all")

    // Filter notifications based on current tab
    const getDisplayNotifications = () => {
        switch (selectedTab) {
            case "unread":
                return unreadNotifications
            case "read":
                return readNotifications
            default:
                return notifications
        }
    }

    const displayNotifications = getDisplayNotifications()

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) {
            toast.info("No unread notifications")
            return
        }
        await markAllAsRead()
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return "now"
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
        return date.toLocaleDateString('en-US')
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

                                        <div className="flex items-center gap-1">
                                            {!isRead && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        markAsRead(notification.id)
                                                    }}
                                                    className="h-6 px-2 text-xs"
                                                >
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Mark as Read
                                                </Button>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    deleteNotification(notification.id)
                                                }}
                                                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
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
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-sm text-gray-600">
                            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : "All notifications read"}
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
                        Refresh
                    </Button>

                    {unreadCount > 0 && (
                        <Button
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Mark All as Read
                        </Button>
                    )}
                </div>
            </div>

            {/* FCM Token Info (for development) */}
            {/* {fcmToken && process.env.NODE_ENV === 'development' && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">FCM Token (Development):</div>
            <code className="text-xs bg-gray-100 p-1 rounded break-all">
              {fcmToken}
            </code>
          </AlertDescription>
        </Alert>
      )} */}

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search notifications..."
                                    value={filters.search}
                                    onChange={(e) => updateFilters({ search: e.target.value, page: 1 })}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <Select
                            value={filters.type}
                            onValueChange={(value) => updateFilters({ type: value, page: 1 })}
                        >
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Notification Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-xl font-semibold">{totalCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <BellRing className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="text-sm text-gray-600">Unread</p>
                                <p className="text-xl font-semibold">{unreadCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <CheckCheck className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-600">Read</p>
                                <p className="text-xl font-semibold">{totalCount - unreadCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notifications Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        All ({totalCount})
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="flex items-center gap-2">
                        <BellRing className="h-4 w-4" />
                        Unread ({unreadCount})
                    </TabsTrigger>
                    <TabsTrigger value="read" className="flex items-center gap-2">
                        <CheckCheck className="h-4 w-4" />
                        Read ({totalCount - unreadCount})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Loading...</span>
                        </div>
                    ) : displayNotifications.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                                <p className="text-gray-500 text-center">
                                    {filters.search || filters.type !== "all"
                                        ? "No notifications match your search criteria"
                                        : "Notifications will appear here when they arrive"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {displayNotifications.map((notification) => (
                                <NotificationCard key={notification.id} notification={notification} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="unread" className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Loading...</span>
                        </div>
                    ) : unreadNotifications.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CheckCheck className="h-12 w-12 text-green-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">All notifications read</h3>
                                <p className="text-gray-500">Great! You've read all your notifications</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {unreadNotifications.map((notification) => (
                                <NotificationCard key={notification.id} notification={notification} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="read" className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Loading...</span>
                        </div>
                    ) : readNotifications.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No read notifications</h3>
                                <p className="text-gray-500">Notifications you read will appear here</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {readNotifications.map((notification) => (
                                <NotificationCard key={notification.id} notification={notification} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Pagination */}
            {totalPages > 1 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing {notifications.length} of {totalCount} notifications
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateFilters({ page: currentPage - 1 })}
                                    disabled={currentPage === 1 || loading}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm font-medium">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateFilters({ page: currentPage + 1 })}
                                    disabled={currentPage === totalPages || loading}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
