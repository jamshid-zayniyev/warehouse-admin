import  React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Providers } from "./providers"
import { ColorsProvider } from "@/contexts/ColorsContext"
import { I18nextProvider } from "react-i18next"

export const metadata: Metadata = {
  title: "Amaar plus",
  description: "Professional Content Management System",
  generator: "ATS",
  icons: {
    icon: "/logo.png",
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
