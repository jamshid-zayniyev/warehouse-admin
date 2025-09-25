"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Users,
  ImageIcon,
  MessageSquare,
  Newspaper,
  Phone,
  Share2,
  Menu,
  X,
  LogOut,
  User,
  Grid,
  ShoppingBag,
  ShoppingCart,
  Palette,
  BadgeInfo,
  PackagePlus,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from 'next-i18next'

const navigation = [
  {
    name: "Dashdashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Dashorders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    name: "products",
    href: "/admin/products",
    icon: ShoppingBag,
  },
  {
    name: "categories",
    href: "/admin/categories",
    icon: Grid,
  },
    {
    name: "Newly bought products",
    href: "/admin/new-products",
    icon: PackagePlus,
  },
  {
    name: "banners",
    href: "/admin/banners",
    icon: ImageIcon,
  },
  {
    name: "contactMessages",
    href: "/admin/contact",
    icon: MessageSquare,
  },
  {
  name: "users",
  href: "/admin/users",
  icon: User,
},
  {
    name: "news",
    href: "/admin/news",
    icon: Newspaper,
  },
  {
    name: "ourContact",
    href: "/admin/our-contact",
    icon: Phone,
  },
  {
    name: "socialMedia",
    href: "/admin/social-media",
    icon: Share2,
  },
    {
    name: "about",
    href: "/admin/about",
    icon: BadgeInfo,
  },
  {
    name: "colors",
    href: "/admin/colors",
    icon: Palette,
  },
  {
    name: "Suppliers",
    href: "/admin/suppliers",
    icon: Users,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t } = useTranslation()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-12 items-center mt-[20px] border-b border-sidebar-border px-6 text-[20px] md:text-[30px] font-bold">
            {/* <Image src={logo} alt="logo" /> */} Amaar Plus
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.name)}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 mb-3 px-3 py-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{t('adminUser')}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{t('administrator')}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              {t('signOut')}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  )
}