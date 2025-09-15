"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Share2, ExternalLink, Copy } from "lucide-react"
import type { SocialMedia, CreateSocialMedia } from "@/lib/types"
import { authService } from "@/lib/auth"
import Loader from "@/components/ui/loader"
import { useTranslation } from 'next-i18next'

export default function SocialMediaManagement() {
  const { t } = useTranslation()
  const [socialData, setSocialData] = useState<SocialMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SocialMedia | null>(null)
  const [formData, setFormData] = useState<CreateSocialMedia>({ telegram: "", facebook: "", x: "", instagram: "", youtube: "" })
  const { toast } = useToast()

  const socialPlatforms = [
    { 
      key: "telegram" as keyof SocialMedia, 
      name: t("SocialMediaManagement.platforms.telegram"), 
      icon: "📱", 
      color: "bg-blue-100 text-blue-800 hover:bg-blue-200", 
      placeholder: t("SocialMediaManagement.placeholders.telegram")
    },
    { 
      key: "facebook" as keyof SocialMedia, 
      name: t("SocialMediaManagement.platforms.facebook"), 
      icon: "📘", 
      color: "bg-blue-100 text-blue-800 hover:bg-blue-200", 
      placeholder: t("SocialMediaManagement.placeholders.facebook")
    },
    { 
      key: "x" as keyof SocialMedia, 
      name: t("SocialMediaManagement.platforms.x"), 
      icon: "🐦", 
      color: "bg-gray-100 text-gray-800 hover:bg-gray-200", 
      placeholder: t("SocialMediaManagement.placeholders.x")
    },
    { 
      key: "instagram" as keyof SocialMedia, 
      name: t("SocialMediaManagement.platforms.instagram"), 
      icon: "📷", 
      color: "bg-pink-100 text-pink-800 hover:bg-pink-200", 
      placeholder: t("SocialMediaManagement.placeholders.instagram")
    },
    { 
      key: "youtube" as keyof SocialMedia, 
      name: t("SocialMediaManagement.platforms.youtube"), 
      icon: "📺", 
      color: "bg-red-100 text-red-800 hover:bg-red-200", 
      placeholder: t("SocialMediaManagement.placeholders.youtube")
    },
  ]

  const fetchSocialData = async () => {
    setIsLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/about/social-media/")
      if (response.ok) {
        const data: SocialMedia[] = await response.json()
        setSocialData(data)
      } else throw new Error("Failed to fetch")
    } catch {
      toast({ 
        title: t("SocialMediaCommon.error"), 
        description: t("SocialMediaManagement.errors.fetchFailed"), 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateUrl = (url: string, platform: string) => {
    if (!url.trim()) return true
    try { new URL(url); return true } catch { return url.startsWith("@") && url.length > 1 }
  }

  const formatUrl = (url: string, platform: string) => {
    if (!url.trim()) return ""
    if (url.startsWith("@")) {
      const username = url.substring(1)
      switch (platform) {
        case "telegram": return `https://t.me/${username}`
        case "x": return `https://x.com/${username}`
        case "instagram": return `https://instagram.com/${username}`
        case "youtube": return `https://youtube.com/@${username}`
        case "facebook": return `https://facebook.com/${username}`
        default: return url
      }
    }
    return url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    for (const platform of socialPlatforms) {
      const url = formData[platform.key] as string
      if (!validateUrl(url, platform.key)) {
        toast({ 
          title: t("SocialMediaCommon.error"), 
          description: t("SocialMediaManagement.errors.invalidUrl", { platform: platform.name }), 
          variant: "destructive" 
        })
        return
      }
    }

    const formattedData: CreateSocialMedia = {
      telegram: formatUrl(formData.telegram, "telegram"),
      facebook: formatUrl(formData.facebook, "facebook"),
      x: formatUrl(formData.x, "x"),
      instagram: formatUrl(formData.instagram, "instagram"),
      youtube: formatUrl(formData.youtube, "youtube"),
    }

    try {
      if (editingItem) {
        const response = await authService.makeAuthenticatedRequest(`/about/social-media/${editingItem.id}/`, { method: "PUT", body: JSON.stringify(formattedData) })
        if (!response.ok) throw new Error("Failed to update")
        const updatedItem: SocialMedia = await response.json()
        setSocialData(socialData.map((item) => (item.id === editingItem.id ? updatedItem : item)))
        toast({ 
          title: t("SocialMediaCommon.success"), 
          description: t("SocialMediaManagement.success.updated") 
        })
      } else {
        const response = await authService.makeAuthenticatedRequest(`/about/social-media/`, { method: "POST", body: JSON.stringify(formattedData) })
        if (!response.ok) throw new Error("Failed to create")
        const newItem: SocialMedia = await response.json()
        setSocialData([...socialData, newItem])
        toast({ 
          title: t("SocialMediaCommon.success"), 
          description: t("SocialMediaManagement.success.created") 
        })
      }

      setIsDialogOpen(false)
      setEditingItem(null)
      setFormData({ telegram: "", facebook: "", x: "", instagram: "", youtube: "" })
    } catch {
      toast({ 
        title: t("SocialMediaCommon.error"), 
        description: editingItem ? t("SocialMediaManagement.errors.updateFailed") : t("SocialMediaManagement.errors.createFailed"), 
        variant: "destructive" 
      })
    }
  }

  const handleEdit = (item: SocialMedia) => {
    setEditingItem(item)
    setFormData({ telegram: item.telegram, facebook: item.facebook, x: item.x, instagram: item.instagram, youtube: item.youtube })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t("SocialMediaManagement.deleteConfirmation"))) return
    try {
      const response = await authService.makeAuthenticatedRequest(`/about/social-media/${id}/`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      setSocialData(socialData.filter((item) => item.id !== id))
      toast({ 
        title: t("SocialMediaCommon.success"), 
        description: t("SocialMediaManagement.success.deleted") 
      })
    } catch {
      toast({ 
        title: t("SocialMediaCommon.error"), 
        description: t("SocialMediaManagement.errors.deleteFailed"), 
        variant: "destructive" 
      })
    }
  }

  const openCreateDialog = () => {
    setEditingItem(null)
    setFormData({ telegram: "", facebook: "", x: "", instagram: "", youtube: "" })
    setIsDialogOpen(true)
  }

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text)
    toast({ 
      title: t("SocialMediaCommon.copied"), 
      description: t("SocialMediaManagement.success.linkCopied", { platform }) 
    })
  }

  const openLink = (url: string) => { if (url) window.open(url, "_blank") }

  useEffect(() => { fetchSocialData() }, [])

  if (isLoading) {
    return (
      <Loader />
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-in">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Share2 className="h-6 w-6 md:h-8 md:w-8 text-primary" /> 
              {t("SocialMediaManagement.title")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("SocialMediaManagement.description")}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? t("SocialMediaManagement.editSocialMediaLinks") : t("SocialMediaManagement.addSocialMediaLinks")}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? t("SocialMediaManagement.editDescription") : t("SocialMediaManagement.createDescription")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {socialPlatforms.map((platform) => (
                  <div key={platform.key} className="space-y-2">
                    <Label htmlFor={platform.key} className="flex items-center gap-2">
                      <span className="text-lg">{platform.icon}</span> {platform.name}
                    </Label>
                    <Input 
                      id={platform.key} 
                      value={formData[platform.key] as string} 
                      onChange={(e) => setFormData({ ...formData, [platform.key]: e.target.value })} 
                      placeholder={platform.placeholder} 
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("SocialMediaManagement.inputHelpText")}
                    </p>
                  </div>
                ))}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t("SocialMediaCommon.cancel")}
                  </Button>
                  <Button type="submit">
                    {editingItem ? t("SocialMediaCommon.update") : t("SocialMediaCommon.create")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Social Media Cards */}
        <div className="space-y-6">
          {isLoading ? (
            <Card className="animate-slide-in">
              <CardContent className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : socialData.length === 0 ? (
            <Card className="animate-slide-in">
              <CardContent className="text-center py-8">
                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {t("SocialMediaManagement.noSocialMediaLinks")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t("SocialMediaManagement.noSocialMediaDescription")}
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" /> 
                  {t("SocialMediaManagement.addSocialMedia")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            socialData.map((item, index) => (
              <Card key={item.id} className="animate-slide-in hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-primary" /> 
                      {t("SocialMediaManagement.socialMediaLinksNumber", { id: item.id })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {socialPlatforms.map((platform) => {
                      const url = item[platform.key] as string
                      const hasUrl = url && url.trim()
                      return (
                        <div key={platform.key} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{platform.icon}</span>
                            <div>
                              <div className="font-medium text-sm">{platform.name}</div>
                              {hasUrl ? (
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{url}</div>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  {t("SocialMediaCommon.notConfigured")}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {hasUrl ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(url, platform.name)} 
                                  className="h-8 w-8 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => openLink(url)} 
                                  className="h-8 w-8 p-0"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                {t("SocialMediaCommon.empty")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}