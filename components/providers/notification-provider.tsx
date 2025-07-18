"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { requestNotificationPermission, onMessageListener, showMaintenanceNotification } from '@/lib/firebase'
import { notificationsApi, type Notification } from '@/lib/api'
import { toast } from 'sonner'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  refreshNotifications: () => void
  markAsRead: (id: number) => void
  clearAll: () => void
  fcmToken: string | null
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  
  // Use maintenance mode hook

  const unreadCount = notifications.filter(n => !n.read_at).length

  // Initialize FCM and request permission
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        const token = await requestNotificationPermission()
        setFcmToken(token)
        
        if (token) {
          console.log('FCM Token:', token)
          // Here you can send the token to your backend to store it
          // await saveTokenToBackend(token)
        }
      } catch (error) {
        console.error('Error initializing FCM:', error)
      }
    }

    initializeFCM()
  }, [])

  // Listen for foreground messages
  useEffect(() => {
    const unsubscribe = onMessageListener()
      .then((payload: any) => {
        console.log('Received foreground message:', payload)
        
        // Show toast notification
        toast.success(payload.notification?.title || 'New Notification', {
          description: payload.notification?.body || 'You have a new notification',
          action: {
            label: 'View',
            onClick: () => {
              // Navigate to notifications page or handle click
              window.location.href = '/notifications'
            }
          }
        })

        // Refresh notifications
        refreshNotifications()
      })
      .catch((err) => console.log('Failed to receive message:', err))

    return () => {
      // Clean up listener if needed
    }
  }, [])

  // Load notifications on mount
  useEffect(() => {
    refreshNotifications()
  }, [])

  const refreshNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsApi.getAll({ 
        per_page: 100,
        page: 1 
      })
      setNotifications(response.data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        )
      )
      toast.success('Notification marked as read')
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const clearAll = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          read_at: n.read_at || new Date().toISOString() 
        }))
      )
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error clearing all notifications:', error)
      toast.error('Failed to mark all notifications as read')
    }
  }

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    clearAll,
    fcmToken
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
