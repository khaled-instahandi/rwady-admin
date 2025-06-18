"use client"

import { Bell, HelpCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"

export function Header() {
  const { userPhone, userRole } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="text-blue-600">
          <HelpCircle className="w-4 h-4 mr-2" />
          Get Help
        </Button>

        <Button variant="ghost" size="sm">
          <Bell className="w-4 h-4" />
        </Button>

        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
          <User className="w-4 h-4 text-gray-600" />
          <div className="text-sm">
            <div className="font-medium text-gray-900">{userRole}</div>
            <div className="text-gray-500 text-xs">{userPhone}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
