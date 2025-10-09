"use client"

import { useState, useEffect } from "react"
import { useTranslation } from 'next-i18next'
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/api"
import { ImageIcon, MessageSquare, Newspaper, Phone, Share2, User, Grid, ShoppingBag, ShoppingCart } from "lucide-react"

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [bannersLength, setBannersLength] = useState(0)
  const [contactMessagesLength, setContactMessagesLength] = useState(0)
  const [newsLength, setNewsLength] = useState(0)
  const [contactInfoLength, setContactInfoLength] = useState(0)
  const [socialMediaLength, setSocialMediaLength] = useState(0)
  const [userLength, setUserLength] = useState(0)
  const [categoryLength, setCategoryLength] = useState(0)
  const [productsLength, setProductsLength] = useState(0)
  const [orderLength, setOrderLength] = useState(0)

  useEffect(() => {
    const fetchLength = async (url: string, setter: (val: number) => void) => {
      try {
        const token = localStorage.getItem("access_token")
        const res = await apiFetch(url, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        })
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        const data = await res.json()
        setter(Array.isArray(data) ? data.length : 0)
      } catch (err) {
        console.error(`Failed to fetch ${url}:`, err)
        setter(0)
      }
    }

    fetchLength("/user/", setUserLength)
    fetchLength("/product/categories/", setCategoryLength)
    fetchLength("/order/all/", setProductsLength)
    fetchLength("/product/all/", setOrderLength)
    fetchLength("/about/banners/", setBannersLength)
    fetchLength("/about/contact/", setContactMessagesLength)
    fetchLength("/about/news/", setNewsLength)
    fetchLength("/about/our-contact/", setContactInfoLength)
    fetchLength("/about/social-media/", setSocialMediaLength)
  }, [])

  const stats = [
    { name: t("dashboard.stats.users"), value: userLength.toString(), icon: User, description: t("dashboard.stats.users_desc") },
    { name: t("dashboard.stats.orders"), value: orderLength.toString(), icon: ShoppingCart, description: t("dashboard.stats.orders_desc") },
    { name: t("dashboard.stats.categories"), value: categoryLength.toString(), icon: Grid, description: t("dashboard.stats.categories_desc") },
    { name: t("dashboard.stats.products"), value: productsLength.toString(), icon: ShoppingBag, description: t("dashboard.stats.products_desc") },
    { name: t("dashboard.stats.banners"), value: bannersLength.toString(), icon: ImageIcon, description: t("dashboard.stats.banners_desc") },
    { name: t("dashboard.stats.messages"), value: contactMessagesLength.toString(), icon: MessageSquare, description: t("dashboard.stats.messages_desc") },
    { name: t("dashboard.stats.news"), value: newsLength.toString(), icon: Newspaper, description: t("dashboard.stats.news_desc") },
    { name: t("dashboard.stats.contact_info"), value: contactInfoLength.toString(), icon: Phone, description: t("dashboard.stats.contact_info_desc") },
    { name: t("dashboard.stats.social_media"), value: socialMediaLength.toString(), icon: Share2, description: t("dashboard.stats.social_media_desc") }
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-slide-in">
          <h1 className=" text-[24px] md:text-3xl font-bold text-foreground">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("dashboard.subtitle")}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <Card key={stat.name} className="animate-slide-in hover:shadow-lg transition-all duration-200 hover:scale-105" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">{stat.name}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="animate-slide-in" style={{ animationDelay: "0.6s" }}>
          <CardHeader>
            <CardTitle>{t("dashboard.quick_actions.title")}</CardTitle>
            <CardDescription>{t("dashboard.quick_actions.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                <ImageIcon className="h-5 w-5" />
                <span className="font-medium">{t("dashboard.quick_actions.add_banner")}</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                <Newspaper className="h-5 w-5" />
                <span className="font-medium">{t("dashboard.quick_actions.create_news")}</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">{t("dashboard.quick_actions.view_messages")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
