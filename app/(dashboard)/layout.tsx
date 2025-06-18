"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const { isAuthenticated } = useAuth()
  // const router = useRouter()

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push("/login")
  //   }
  // }, [isAuthenticated, router])

  // if (!isAuthenticated) {
  //   return null
  // }

  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50 px-8 py-4">{children}</main>
      </div>
    </div>
  )
}
