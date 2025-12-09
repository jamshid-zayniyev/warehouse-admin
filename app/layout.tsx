import  React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Providers } from "./providers"
import { ColorsProvider } from "@/contexts/ColorsContext"

export const metadata: Metadata = {
  title: "DMX Group",
  description: "Professional Content Management System",
  generator: "ATS",
  icons: {
    icon: "https://i.pinimg.com/736x/31/70/1b/31701b90d6c9fb5df7174df87aa593ca.jpg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <ColorsProvider>
          <Providers>{children}</Providers>
          </ColorsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
