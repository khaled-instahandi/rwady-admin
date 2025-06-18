"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  Truck,
  Palette,
  Globe,
  TwitterIcon as TikTok,
  Smartphone,
  UserPlus,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { motion, AnimatePresence } from "framer-motion"

interface NavigationItem {
  name: string
  href: string
  icon: React.ElementType
  children?: { name: string; href: string }[]
}

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  // { name: "My Sales", href: "/sales", icon: ShoppingBag },
  {
    name: "Catalog",
    href: "/catalog",
    icon: Package,
    children: [
      { name: "Products", href: "/catalog/products" },
      { name: "Categories", href: "/catalog/categories" },
      { name: "Brands", href: "/catalog/brands" },
      // { name: "Gift Cards", href: "/catalog/gift-cards" },
      // { name: "Data Import & Export", href: "/catalog/import-export" },
      // { name: "MercuryAI", href: "/catalog/mercury-ai" },
    ],
  },
  { name: "Home Sections", href: "/home-sections", icon: LayoutDashboard },
  { name: "Featured Sections", href: "/featured-sections", icon: LayoutDashboard },
  { name: "Banners", href: "/banners", icon: LayoutDashboard },

  // { name: "Marketing", href: "/marketing", icon: BarChart3 },
  // { name: "Reports", href: "/reports", icon: BarChart3 },
  // { name: "Sales Channels", href: "/sales-channels", icon: Globe },

  // { name: "TikTok", href: "/tiktok", icon: TikTok },
  // { name: "Link in bio", href: "/link-in-bio", icon: UserPlus },
  // { name: "Mobile", href: "/mobile", icon: Smartphone },
  // { name: "Other Channels", href: "/other-channels", icon: Globe },
  // { name: "Design", href: "/design", icon: Palette },
  // { name: "Payment", href: "/payment", icon: CreditCard },
  // { name: "Shipping & Pickup", href: "/shipping", icon: Truck },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    // Initialize with the current active parent expanded
    ...navigation.reduce(
      (acc, item) => {
        if (item.children && pathname.startsWith(item.href)) {
          acc[item.href] = true
        }
        return acc
      },
      {} as Record<string, boolean>,
    ),
  })

  const toggleExpand = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    setExpandedItems((prev) => ({
      ...prev,
      [href]: !prev[href],
    }))
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <Package className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Rwady</div>
            <div className="text-gray-400 text-xs">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const isExpanded = expandedItems[item.href]

          return (
            <div key={item.name} className="mb-1">
              {item.children ? (
                // Item with children - make it expandable
                <div>
                  <button
                    onClick={(e) => toggleExpand(item.href, e)}
                    className={cn(
                      "group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive ? "text-white" : "text-gray-400 group-hover:text-white",
                      )}
                    />
                    <span className="flex-1 text-sart" style={{
                      textAlign: "start",
                    }}>{item.name}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  {/* Sub-navigation */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-8 mt-1 space-y-1 overflow-hidden"
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={cn(
                              "block px-2 py-1.5 text-sm rounded-md transition-colors",
                              pathname === child.href
                                ? "text-blue-300 bg-gray-800"
                                : "text-gray-400 hover:text-white hover:bg-gray-800",
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                // Regular item - just a link
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-white" : "text-gray-400 group-hover:text-white",
                    )}
                  />
                  {item.name}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex w-full items-center px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}
