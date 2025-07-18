"use client"

import { useState, useEffect, useMemo } from 'react'
import { notificationsApi, type Notification } from '@/lib/api'
import { toast } from 'sonner'

interface NotificationFilters {
  search: string
  type: string
  readStatus: "all" | "read" | "unread"
  page: number
  perPage: number
}

export const useNotificationsWithFilters = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  const [filters, setFilters] = useState<NotificationFilters>({
    search: "",
    type: "all",
    readStatus: "all",
    page: 1,
    perPage: 20
  })

  // Fetch notifications from backend with filters
  const fetchNotifications = async (newFilters = filters) => {
    try {
      setLoading(true)
      const response = await notificationsApi.getAll({
        page: newFilters.page,
        per_page: newFilters.perPage,
        search: newFilters.search || undefined,
        type: newFilters.type !== "all" ? newFilters.type : undefined,
        read_status: newFilters.readStatus !== "all" ? newFilters.readStatus : undefined
      })
      
      setNotifications(response.data || [])
      setTotalCount(response.meta?.total || 0)
      setTotalPages(response.meta?.last_page || 1)
      setCurrentPage(response.meta?.current_page || 1)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchNotifications()
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [filters])

  // Update filters
  const updateFilters = (newFilters: Partial<NotificationFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1 // Reset to page 1 when changing filters
    }))
  }

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev => 
        prev.map(n => 
          n.id === id 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      )
      toast.success('Notification marked as read')
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          read_at: n.read_at || new Date().toISOString() 
        }))
      )
      toast.success('All notifications marked as read')
      // Refresh to get updated counts
      fetchNotifications()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
  }

  // Delete notification
  const deleteNotification = async (id: number) => {
    try {
      await notificationsApi.deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  // Computed values
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read_at).length, 
    [notifications]
  )

  const unreadNotifications = useMemo(() => 
    notifications.filter(n => !n.read_at), 
    [notifications]
  )

  const readNotifications = useMemo(() => 
    notifications.filter(n => n.read_at), 
    [notifications]
  )

  return {
    notifications,
    loading,
    filters,
    updateFilters,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount,
    unreadNotifications,
    readNotifications,
    totalPages,
    currentPage,
    totalCount,
    refreshNotifications: () => fetchNotifications()
  }
}
