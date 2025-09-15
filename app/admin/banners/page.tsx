"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTranslation } from 'next-i18next' // Add i18n hook
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
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, ImageIcon, Upload } from "lucide-react"
import type { Banner, CreateBanner } from "@/lib/types"
// import { authService } from "@/lib/auth-service"
import Image from "next/image"
import { authService } from "@/lib/auth"
import { apiFetch } from "@/lib/api"
import Loader from "@/components/ui/loader"

export default function BannerManagement() {
  const { t } = useTranslation() // Initialize translation hook
  const [bannerData, setBannerData] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Banner | null>(null)
  const [formData, setFormData] = useState<CreateBanner>({
    image: "",
  })
  const [imagePreview, setImagePreview] = useState<string>("")
  const { toast } = useToast()

  const fetchBannerData = async () => {
    setIsLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/about/banners/")
      if (response.ok) {
        const data = await response.json()
        setBannerData(data)
      } else {
        throw new Error("Failed to fetch banner data")
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: t("bannerManagement.error.fetch"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      setFormData({ ...formData, image: file as any })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const formDataToSend = new FormData()

      if (formData?.image instanceof File) {
        formDataToSend.append("image", formData.image)
        console.log("[v0] Sending file upload with FormData")
      } else if (typeof formData.image === "string" && formData.image.startsWith("data:")) {
        const response = await apiFetch(formData.image)
        const blob = await response.blob()
        formDataToSend.append("image", blob, "image.png")
        console.log("[v0] Sending converted blob from base64")
      } else {
        throw new Error("No valid image data found")
      }

      const endpoint = editingItem ? `/about/banners/${editingItem.id}/` : "/about/banners/"
      console.log("[v0] Making request to:", endpoint)

      const response = await authService.makeAuthenticatedRequest(endpoint, {
        method: editingItem ? "PUT" : "POST",
        body: formDataToSend,
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Response data:", result)

        if (editingItem) {
          const updatedData = bannerData.map((item) => (item.id === editingItem.id ? result : item))
          setBannerData(updatedData)
          toast({
            title: t("success"),
            description: t("bannerManagement.success.updated"),
          })
        } else {
          setBannerData([...bannerData, result])
          toast({
            title: t("success"),
            description: t("bannerManagement.success.created"),
          })
        }
      } else {
        const errorText = await response.text()
        console.log("[v0] Error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      setIsDialogOpen(false)
      setEditingItem(null)
      setFormData({ image: "" })
      setImagePreview("")
    } catch (error) {
      console.log("[v0] Submit error:", error)
      const errorKey = editingItem ? "bannerManagement.error.update" : "bannerManagement.error.create"
      toast({
        title: t("error"),
        description: `${t(errorKey)}: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: Banner) => {
    setEditingItem(item)
    setFormData({
      image: item.image,
    })
    setImagePreview(item.image)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm(t("bannerManagement.deleteConfirmation"))) {
      try {
        const response = await authService.makeAuthenticatedRequest(`/about/banners/${id}/`, {
          method: "DELETE",
        })

        if (response.ok) {
          setBannerData(bannerData.filter((item) => item.id !== id))
          toast({
            title: t("success"),
            description: t("bannerManagement.success.deleted"),
          })
        } else {
          throw new Error("Failed to delete")
        }
      } catch (error) {
        toast({
          title: t("error"),
          description: t("bannerManagement.error.delete"),
          variant: "destructive",
        })
      }
    }
  }

  const openCreateDialog = () => {
    setEditingItem(null)
    setFormData({ image: "" })
    setImagePreview("")
    setIsDialogOpen(true)
  }

  useEffect(() => {
    fetchBannerData()
  }, [])

  if (isLoading) {
    return (
      <Loader />
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="animate-slide-in flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-foreground flex items-center gap-3 my-4">
              <ImageIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              {t("bannerManagement.title")}
            </h1>
            <p className="text-muted-foreground mt-2">{t("bannerManagement.description")}</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
                <Plus className="h-4 w-4 mr-2" />
                {t("bannerManagement.addBanner")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? t("bannerManagement.editBanner") : t("bannerManagement.createBanner")}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? t("bannerManagement.updateDescription") : t("bannerManagement.createDescription")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">{t("bannerManagement.bannerImage")}</Label>
                  <div className="space-y-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    {imagePreview && (
                      <div className="relative w-full h-32 border border-border rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={imagePreview || "/placeholder.svg"}
                          alt="Banner preview"
                          fill
                          className="object-cover"
                          sizes="(max-width: 500px) 100vw, 500px"
                        />
                      </div>
                    )}
                    {!imagePreview && (
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg bg-muted">
                        <div className="text-center">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">{t("bannerManagement.uploadPlaceholder")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t("bannerManagement.cancel")}
                  </Button>
                  <Button type="submit">
                    {editingItem ? t("bannerManagement.update") : t("bannerManagement.create")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Data Table */}
        <Card className="animate-slide-in" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <CardTitle>{t("bannerManagement.bannerCollection")}</CardTitle>
            <CardDescription>{t("bannerManagement.collectionDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("bannerManagement.id")}</TableHead>
                    <TableHead>{t("bannerManagement.preview")}</TableHead>
                    <TableHead>{t("bannerManagement.imagePath")}</TableHead>
                    <TableHead className="text-right">{t("bannerManagement.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bannerData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {t("bannerManagement.noBanners")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    bannerData.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className="animate-fade-in hover:bg-muted/50 transition-colors"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>
                          <div className="relative w-20 h-12 border border-border rounded overflow-hidden bg-muted">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={`Banner ${item.id}`}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm text-muted-foreground">{item.image}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {bannerData.length > 0 && (
          <Card className="animate-slide-in" style={{ animationDelay: "0.4s" }}>
            <CardHeader>
              <CardTitle>{t("bannerManagement.bannerGallery")}</CardTitle>
              <CardDescription>{t("bannerManagement.galleryDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bannerData.map((banner, index) => (
                  <div
                    key={banner.id}
                    className="animate-fade-in group relative aspect-video border border-border rounded-lg overflow-hidden bg-muted hover:shadow-lg transition-all duration-200"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Image
                      src={banner.image || "/placeholder.svg"}
                      alt={`Banner ${banner.id}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(banner)}
                          className="bg-background/90 hover:bg-background"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDelete(banner.id)}
                          className="bg-background/90 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}