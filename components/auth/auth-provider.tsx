"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { setCookie, getCookie, deleteCookie } from "@/lib/cookies"

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  userRole: string | null
  userPhone: string | null
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for authentication in localStorage first (for backward compatibility)
    let storedToken = localStorage.getItem("auth_token")
    let storedRole = localStorage.getItem("user_role")
    let storedPhone = localStorage.getItem("user_phone")

    // If not in localStorage, check cookies
    if (!storedToken) {
      storedToken = getCookie("auth_token")
      
      // If found in cookie but not in localStorage, sync them
      if (storedToken) {
        localStorage.setItem("auth_token", storedToken)
      }
    } else {
      // Make sure cookie is set if token exists in localStorage
      setCookie("auth_token", storedToken)
    }

    if (storedToken) {
      setToken(storedToken)
      setUserRole(storedRole)
      setUserPhone(storedPhone)
      setIsAuthenticated(true)
    } else {
      // If on a protected route and no token, redirect to login
      const isProtectedRoute = 
        window.location.pathname.startsWith("/dashboard") || 
        window.location.pathname.startsWith("/catalog") ||
        window.location.pathname.startsWith("/website");
        
      if (isProtectedRoute) {
        router.push("/login");
      }
    }
  }, [])

  const logout = async () => {
    try {
      await fetch("https://backend.rwady.com/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Remove from localStorage
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_role")
      localStorage.removeItem("user_phone")
      
      // Remove from cookies
      deleteCookie("auth_token")
      
      // Update state
      setToken(null)
      setUserRole(null)
      setUserPhone(null)
      setIsAuthenticated(false)
      
      // Redirect to login page
      router.push("/login")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        userRole,
        userPhone,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
