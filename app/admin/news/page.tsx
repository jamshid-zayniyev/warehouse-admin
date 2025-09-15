"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,DialogTrigger,} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Newspaper, Eye, Calendar, ImageIcon, Upload, X, Languages } from "lucide-react"
import Image from "next/image"
import { authService } from "@/lib/auth"
import Loader from "@/components/ui/loader"
import { useTranslation } from 'next-i18next'


interface NewsImage {
  id: number
  image: string
  news: number
}

interface News {
  id: number
  title: string | null
  title_uz: string | null
  title_en: string | null
  title_ru: string | null
  description: string | null
  description_uz: string | null
  description_en: string | null
  description_ru: string | null
  type: "p" | "s" | "c" | "t"
  images: string[]
  created_at: string
}

interface CreateNews {
  title_uz: string
  title_en: string
  title_ru: string
  description_uz: string
  description_en: string
  description_ru: string
  type: "p" | "s" | "c" | "t"
}

interface Base64Image {
  base64: string
  type: string
  name: string
}


export default function NewsManagement() {
  const [newsData, setNewsData] = useState<News[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<News | null>(null)
  const [viewingItem, setViewingItem] = useState<News | null>(null)
  const [formData, setFormData] = useState<CreateNews>({
    title_uz: "",
    title_en: "",
    title_ru: "",
    description_uz: "",
    description_en: "",
    description_ru: "",
    type: "p",
  })
  const [uploadedImages, setUploadedImages] = useState<(File | string)[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const { toast } = useToast()

  // ✅ Convert File to Base64 with Type
  const convertToBase64 = (file: File): Promise<Base64Image> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve({
            base64: reader.result,
            type: file.type,
            name: file.name,
          })
        } else {
          reject(new Error("File conversion failed"))
        }
      }
      reader.onerror = (error) => reject(error)
    })
  }
const { t } = useTranslation()

const newsTypes = [
  { value: "p", label: t("newsManagement.types.product"), color: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
  { value: "s", label: t("newsManagement.types.security"), color: "bg-green-100 text-green-800 hover:bg-green-200" },
  { value: "c", label: t("newsManagement.types.company"), color: "bg-purple-100 text-purple-800 hover:bg-purple-200" },
  { value: "t", label: t("newsManagement.types.technology"), color: "bg-orange-100 text-orange-800 hover:bg-orange-200" },
]
  // ✅ Fetch News
  const fetchNewsData = async () => {
    setIsLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/about/news/")
      if (response.ok) {
        const data = await response.json()
        setNewsData(data)
      } else {
        throw new Error("Failed to fetch news")
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch news data", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files)
      setUploadedImages((prev) => [...prev, ...newFiles])
      const previews = newFiles.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...previews])
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  console.log(formData, uploadedImages);
  
  // ✅ Create or Update News
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const form = new FormData()
      form.append("title_uz", formData.title_uz)
      form.append("title_en", formData.title_en)
      form.append("title_ru", formData.title_ru)
      form.append("description_uz", formData.description_uz)
      form.append("description_en", formData.description_en)
      form.append("description_ru", formData.description_ru)
      form.append("type", formData.type)

      // Add files to form data
      uploadedImages.forEach((file) => {
        if (typeof file === 'string' && editingItem) {
          form.append("images", file)
          // This is an existing image URL, we don't need to re-upload it
          // But the backend might expect it as part of the update
        } else {
          form.append("images", file)
        }
      })

      const url = editingItem ? `/about/news/${editingItem.id}/` : "/about/news/"
      const method = editingItem ? "PUT" : "POST"

      const response = await authService.makeAuthenticatedRequest(url, {
        method,
        body: form,
      })

      if (response.ok) {
        const item = await response.json()
        if (editingItem) {
          setNewsData((prev) => prev.map((n) => (n.id === editingItem.id ? item : n)))
          toast({ title: "Success", description: "News updated successfully" })
        } else {
          setNewsData((prev) => [...prev, item])
          toast({ title: "Success", description: "News created successfully" })
        }
        setIsDialogOpen(false)
        resetForm()
        fetchNewsData()
      } else {
        const errBody = await response.text()
        console.error("Server error:", errBody)
        throw new Error("Request failed")
      }
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      title_uz: "",
      title_en: "",
      title_ru: "",
      description_uz: "",
      description_en: "",
      description_ru: "",
      type: "p",
    })
    setUploadedImages([])
    setImagePreviews([])
  }

  const handleEdit = (item: News) => {
    setEditingItem(item)
    setFormData({
      title_uz: item.title_uz || "",
      title_en: item.title_en || "",
      title_ru: item.title_ru || "",
      description_uz: item.description_uz || "",
      description_en: item.description_en || "",
      description_ru: item.description_ru || "",
      type: item.type,
    })
    setImagePreviews(item.images.map((img) => img))
    setUploadedImages(item.images.map((img) => img))
    setIsDialogOpen(true)
  }

  const handleView = (item: News) => {
    setViewingItem(item)
    setIsViewDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this news article?")) {
      try {
        const response = await authService.makeAuthenticatedRequest(`/about/news/${id}/`, { method: "DELETE" })
        if (response.ok) {
          setNewsData((prev) => prev.filter((item) => item.id !== id))
          toast({
            title: "Success",
            description: "News article deleted successfully",
          })
        } else throw new Error()
      } catch {
        toast({
          title: "Error",
          description: "Failed to delete news article",
          variant: "destructive",
        })
      }
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeInfo = (type: string) => {
    return newsTypes.find((t) => t.value === type) || newsTypes[0]
  }

  // Helper function to get display title (fallback to English if available)
  const getDisplayTitle = (item: News) => {
    return item.title_en || item.title_uz || item.title_ru || item.title || "Untitled"
  }

  // Helper function to get display description (fallback to English if available)
  const getDisplayDescription = (item: News) => {
    return item.description_en || item.description_uz || item.description_ru || item.description || "No description"
  }

  useEffect(() => {
    fetchNewsData()
  }, [])

      if (isLoading) {
        return (
          <Loader/>
        )
    }

  return (
  <AdminLayout>
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-slide-in flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground flex items-center gap-3 my-4">
            <Newspaper className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            {t("newsManagement.title")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("newsManagement.description")}</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
              <Plus className="h-4 w-4 mr-2" />
              {t("newsManagement.createArticle")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? t("newsManagement.editArticle") : t("newsManagement.createArticle")}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? t("newsManagement.editDescription") : t("newsManagement.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">{t("newsManagement.type")}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "p" | "s" | "c" | "t") => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("newsManagement.selectType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {newsTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="en" className="flex items-center gap-2">
                    <Languages className="h-4 w-4" /> {t("newsManagement.languages.english")}
                  </TabsTrigger>
                  <TabsTrigger value="uz" className="flex items-center gap-2">
                    <Languages className="h-4 w-4" /> {t("newsManagement.languages.uzbek")}
                  </TabsTrigger>
                  <TabsTrigger value="ru" className="flex items-center gap-2">
                    <Languages className="h-4 w-4" /> {t("newsManagement.languages.russian")}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="en" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title_en">{t("newsManagement.form.titleEnglish")}</Label>
                    <Input
                      id="title_en"
                      value={formData.title_en}
                      onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                      placeholder={t("newsManagement.form.titleEnglishPlaceholder")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_en">{t("newsManagement.form.descriptionEnglish")}</Label>
                    <Textarea
                      id="description_en"
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      placeholder={t("newsManagement.form.descriptionEnglishPlaceholder")}
                      rows={4}
                      required
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="uz" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title_uz">{t("newsManagement.form.titleUzbek")}</Label>
                    <Input
                      id="title_uz"
                      value={formData.title_uz}
                      onChange={(e) => setFormData({ ...formData, title_uz: e.target.value })}
                      placeholder={t("newsManagement.form.titleUzbekPlaceholder")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_uz">{t("newsManagement.form.descriptionUzbek")}</Label>
                    <Textarea
                      id="description_uz"
                      value={formData.description_uz}
                      onChange={(e) => setFormData({ ...formData, description_uz: e.target.value })}
                      placeholder={t("newsManagement.form.descriptionUzbekPlaceholder")}
                      rows={4}
                      required
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="ru" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title_ru">{t("newsManagement.form.titleRussian")}</Label>
                    <Input
                      id="title_ru"
                      value={formData.title_ru}
                      onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })}
                      placeholder={t("newsManagement.form.titleRussianPlaceholder")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_ru">{t("newsManagement.form.descriptionRussian")}</Label>
                    <Textarea
                      id="description_ru"
                      value={formData.description_ru}
                      onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                      placeholder={t("newsManagement.form.descriptionRussianPlaceholder")}
                      rows={4}
                      required
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="images">{t("newsManagement.images")}</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                {imagePreviews.length === 0 && (
                  <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg bg-muted">
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-sm text-muted-foreground">{t("newsManagement.uploadImages")}</p>
                    </div>
                  </div>
                )}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {imagePreviews.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-20 border border-border rounded overflow-hidden bg-muted">
                          <Image
                            src={img || "/placeholder.svg"}
                            alt={`${t("newsManagement.upload")} ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="150px"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("NewsCommon.cancel")}
                </Button>
                <Button type="submit">
                  {editingItem ? t("NewsCommon.update") : t("NewsCommon.create")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* News Table */}
      <Card className="animate-slide-in" style={{ animationDelay: "0.3s" }}>
        <CardHeader>
          <CardTitle>{t("newsManagement.newsArticles")}</CardTitle>
          <CardDescription>{t("newsManagement.manageArticles")}</CardDescription>
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
                  <TableHead>{t("newsManagement.table.title")}</TableHead>
                  <TableHead>{t("newsManagement.table.type")}</TableHead>
                  <TableHead>{t("newsManagement.table.images")}</TableHead>
                  <TableHead>{t("newsManagement.table.date")}</TableHead>
                  <TableHead className="text-right">{t("newsManagement.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t("newsManagement.noArticles")}
                    </TableCell>
                  </TableRow>
                ) : (
                  newsData.map((item, index) => {
                    const typeInfo = getTypeInfo(item.type)
                    return (
                      <TableRow
                        key={item.id}
                        className="animate-fade-in hover:bg-muted/50 transition-colors"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{getDisplayTitle(item)}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                              {getDisplayDescription(item)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeInfo.color} variant="secondary">
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item.images?.length || 0}</span>
                            {item.images?.length > 0 && (
                              <div className="flex -space-x-1">
                                {item.images?.slice(0, 3).map((img, imgIndex) => (
                                  <div
                                    key={imgIndex}
                                    className="relative w-6 h-6 border border-background rounded overflow-hidden bg-muted"
                                  >
                                    <Image
                                      src={img || "/placeholder.svg"}
                                      alt={`${t("newsManagement.image")} ${imgIndex + 1}`}
                                      fill
                                      className="object-cover"
                                      sizes="24px"
                                    />
                                  </div>
                                ))}
                                {item.images?.length > 3 && (
                                  <div className="w-6 h-6 bg-muted border border-background rounded flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">+{item.images?.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(item.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(item)}
                              className="hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Article Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              {viewingItem && getDisplayTitle(viewingItem)}
            </DialogTitle>
            <DialogDescription>
              {viewingItem && (
                <div className="flex items-center gap-4 mt-2">
                  <Badge className={getTypeInfo(viewingItem.type).color} variant="secondary">
                    {getTypeInfo(viewingItem.type).label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{formatDate(viewingItem.created_at)}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-6">
              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="en">{t("newsManagement.languages.english")}</TabsTrigger>
                  <TabsTrigger value="uz">{t("newsManagement.languages.uzbek")}</TabsTrigger>
                  <TabsTrigger value="ru">{t("newsManagement.languages.russian")}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="en" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t("newsManagement.form.titleEnglish")}</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm leading-relaxed">{viewingItem.title_en || t("newsManagement.notProvided")}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t("newsManagement.form.descriptionEnglish")}</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm leading-relaxed">{viewingItem.description_en || t("newsManagement.notProvided")}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="uz" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t("newsManagement.form.titleUzbek")}</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm leading-relaxed">{viewingItem.title_uz || t("newsManagement.notProvided")}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t("newsManagement.form.descriptionUzbek")}</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm leading-relaxed">{viewingItem.description_uz || t("newsManagement.notProvided")}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="ru" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t("newsManagement.form.titleRussian")}</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm leading-relaxed">{viewingItem.title_ru || t("newsManagement.notProvided")}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t("newsManagement.form.descriptionRussian")}</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm leading-relaxed">{viewingItem.description_ru || t("newsManagement.notProvided")}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Images */}
              {viewingItem.images?.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("newsManagement.images")} ({viewingItem.images?.length})
                  </Label>
                  <div className="mt-2 grid gap-4 md:grid-cols-2">
                    {viewingItem.images?.map((img, index) => (
                      <div
                        key={index}
                        className="relative aspect-video border border-border rounded-lg overflow-hidden bg-muted"
                      >
                        <Image
                          src={img || "/placeholder.svg"}
                          alt={`${t("newsManagement.articleImage")} ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  {t("NewsCommon.close")}
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    handleEdit(viewingItem)
                  }}
                >
                  {t("newsManagement.editArticle")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  </AdminLayout>
)
}