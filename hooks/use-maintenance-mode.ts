"use client"

import { useEffect, useState } from 'react'
import { settingsApi, type Setting } from '@/lib/api'
import { showMaintenanceNotification } from '@/lib/firebase'
import { toast } from 'sonner'

export const useMaintenanceMode = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await settingsApi.getAll({ per_page: 1000 })
        const maintenanceSetting = response.data.find(
          (setting: any) => setting.key === 'maintenance_mode' || setting.key === 'app.maintenance_mode'
        )
        
        if (maintenanceSetting) {
          const newMaintenanceMode = maintenanceSetting.value === 'true' || maintenanceSetting.value === '1'
          
          // Show notification if maintenance mode changed
          if (isMaintenanceMode !== null && isMaintenanceMode !== newMaintenanceMode) {
            showMaintenanceNotification(newMaintenanceMode)
            
            if (newMaintenanceMode) {
              toast.warning('تم تفعيل وضع الصيانة', {
                description: 'الموقع في وضع الصيانة حالياً',
                duration: 5000,
              })
            } else {
              toast.success('تم إلغاء وضع الصيانة', {
                description: 'الموقع أصبح متاحاً الآن',
                duration: 5000,
              })
            }
          }
          
          setIsMaintenanceMode(newMaintenanceMode)
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error)
      } finally {
        setLoading(false)
      }
    }

    // Check immediately
    checkMaintenanceMode()

    // Check every 30 seconds
    const interval = setInterval(checkMaintenanceMode, 30 * 1000)

    return () => clearInterval(interval)
  }, [isMaintenanceMode])

  return { isMaintenanceMode, loading }
}
