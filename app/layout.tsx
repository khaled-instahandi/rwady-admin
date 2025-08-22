import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
// ssr
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Rwady Admin Dashboard",
  description: "Professional e-commerce management interface",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
        <Script
          src="/dialog-fix.js"
          strategy="beforeInteractive"
        />
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/firebase-messaging-sw.js')
                  .then((registration) => {
                    console.log('SW registration successful: ', registration);
                  })
                  .catch((error) => {
                    console.log('SW registration failed: ', error);
                  });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
