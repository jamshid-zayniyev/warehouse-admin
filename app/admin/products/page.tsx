"use client"

import React, { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { Plus, Edit, Trash2, Languages, Settings, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { CategoriesProvider, useCategories } from "@/contexts/CategoriesContext"
import { ColorsProvider, useColors } from "@/contexts/ColorsContext"
import { FeaturesProvider } from "@/contexts/FeaturesContext"
import { TypesProvider, useTypes } from "@/contexts/TypesContext"
import { ProductColorsProvider } from "@/contexts/ProductColorsContext"
import { ColorSelector } from "@/components/ColorSelector"
import { FeatureSelector } from "@/components/FeatureSelector"
import { ImageUploader } from "@/components/ImageUploader"
import { CategorySelector } from "@/components/CategorySeletor"
import { Product, ProductColorData, ProductFeature } from "@/lib/types"
import Loader from "@/components/ui/loader"
import { apiFetch } from "@/lib/api"
import { useTranslation } from 'next-i18next'

function ProductManagementContent() {
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)
  const [selectedColors, setSelectedColors] = useState<ProductColorData[]>([])
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [uploadMode, setUploadMode] = useState<"immediate" | "delayed">("delayed")
  const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false)
  const [productColors, setProductColors] = useState<any[]>([])

  const blankForm = {
    id: 0,
    title_uz: "",
    title_en: "",
    title_ru: "",
    description_uz: "",
    description_en: "",
    description_ru: "",
    price: "",
    old_price: "",
    category: 0,
    images: [] as File[],
    colors: [] as ProductColorData[],
    features: [] as ProductFeature[],
  }

  const imageForm = {
    images: [] as File[]
  }
  const [formData, setFormData] = useState<typeof blankForm>(blankForm)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [selectedLang, setSelectedLang] = useState<"en" | "uz" | "ru">("en")
  const [productData, setProductData] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<number | null>(null)
  const [uploadImages, setUploadImages] = useState<typeof imageForm>(imageForm)
  const { toast } = useToast()
  const { categories } = useCategories()
  const { types } = useTypes()
  const { colors } = useColors()

  const normalizeImageUrl = (url?: string) => {
    if (!url) return "/placeholder.svg"
    if (url.startsWith("http")) return url
    return `https://uzbekfoodstuff.pythonanywhere.com${url}`
  }

  const fetchProductData = async () => {
    setIsLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/product/all/")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()

      // Sort so newest products appear first
      const sorted = [...data].sort((a, b) => b.id - a.id)

      setProductData(sorted)
    } catch {
      toast({
        title: t("productManagement.error"),
        description: t("productManagement.failedFetch"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch product colors for a specific product
const fetchProductColors = async (productId: number) => {
  try {
    // First try to get all colors and then filter by product ID
    const response = await authService.makeAuthenticatedRequest(`/product/create-product-colors/`)
    
    if (!response.ok) {
      // If that fails, try the alternative endpoint
      const altResponse = await authService.makeAuthenticatedRequest(`/product/detail-product-colors/`)
      if (!altResponse.ok) throw new Error("Failed to fetch product colors")
      const data = await altResponse.json()
      
      // Filter colors by product ID
      const filteredData = data.filter((item: any) => item.product === productId)
      setProductColors(filteredData)
      return
    }
    
    const data = await response.json()
    
    const filteredData = data.filter((item: any) => item.product === productId)
    setProductColors(filteredData)
  } catch (error) {
    console.error("Error fetching product colors:", error)
    toast({
      title: t("productManagement.error"),
      description: t("productManagement.failedFetchColors"),
      variant: "destructive",
    })
  }
}

  useEffect(() => {
    fetchProductData()
  }, [])

  useEffect(() => {
    if (selectedProductId) {
      fetchProductColors(selectedProductId)
    }
  }, [selectedProductId])

  // Helper function to get display title (fallback to English if available)
  const getDisplayTitle = (item: Product) => {
    return item.title_en || item.title_uz || item.title_ru || item.title || "Untitled"
  }
  // Helper function to get display description (fallback to English if available)
  const getDisplayDescription = (item: Product) => {
    return item.description_en || item.description_uz || item.description_ru || item.description || "No description"
  }

  const openCreateDialog = () => {
    setEditingItem(null)
    setFormData(blankForm)
    setImagePreviews([])
    setIsDialogOpen(true)
  }

  const handleEdit = (item: Product) => {
    setEditingItem(item)
    const categoryObj = categories.find((c) => c.slug === String(item.category))
    const categoryId = categoryObj ? categoryObj.id : 0

    setFormData({
      id: item.id,
      title_uz: item.title_uz || "",
      title_en: item.title_en || "",
      title_ru: item.title_ru || "",
      description_uz: item.description_uz || "",
      description_en: item.description_en || "",
      description_ru: item.description_ru || "",
      price: item.price || "",
      old_price: item.old_price || "",
      category: categoryId,
      images: [] as File[],
      colors: item.colors?.map((c) => ({ colorId: c.colorId, image: null, price: c.price })) || [],
      features: item.features || [],
    })
    setImagePreviews((item.images || []).map((im) => normalizeImageUrl(im.image)))
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t("productManagement.deleteConfirm"))) return
    try {
      const response = await authService.makeAuthenticatedRequest(`/product/${id}/`, { method: "DELETE" })
      if (!response.ok) throw new Error("Delete failed")
      setProductData((prev) => prev.filter((p) => p.id !== id))
      toast({ title: t("productManagement.success"), description: t("productManagement.productDeleted") })
    } catch {
      toast({
        title: t("productManagement.error"),
        description: t("productManagement.failedDelete"),
        variant: "destructive"
      })
    }
  }

  // Add this function to handle image uploading after product creation
  const uploadImagesToProduct = async (images: File[], productId: number) => {
    try {
      for (const file of images) {
        const formData = new FormData()
        formData.append("image", file)
        formData.append("product", productId.toString())

        const token = authService.getAccessToken()

        const res = await apiFetch("/product/create-images/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(JSON.stringify(errData))
        }
      }

      toast({ title: t("productManagement.imagesUploaded") })
      // Clear the images after successful upload
      setUploadImages({ images: [] })
    } catch (err) {
      toast({
        title: t("productManagement.errorUploading"),
        description: (err as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    try {
      const productPayload = {
        title_uz: formData.title_uz || "",
        title_en: formData.title_en || "",
        title_ru: formData.title_ru || "",
        description_uz: formData.description_uz || "",
        description_en: formData.description_en || "",
        description_ru: formData.description_ru || "",
        price: formData.price || "",
        old_price: formData.old_price || null,
        category: Number(formData.category) || null,
      }

      const endpoint = editingItem ? `/product/${editingItem.id}/` : "/product/create/"
      const method = editingItem ? "PUT" : "POST"

      const res = await authService.makeAuthenticatedRequest(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productPayload),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`HTTP ${res.status} ${text}`)
      }
      const createdProduct = await res.json()
      const productId = editingItem?.id || createdProduct.id
      if (!productId) throw new Error("Backend did not return product ID")

      // Upload images if we have any and we're in delayed mode
      if (uploadImages.images.length > 0) {
        // Switch to immediate mode for the feature dialog
        setUploadMode("immediate")
        await uploadImagesToProduct(uploadImages.images, productId)
      }

      await fetchProductData()
      toast({
        title: t("productManagement.success"),
        description: editingItem ? t("productManagement.productUpdated") : t("productManagement.productCreated")
      })

      setIsDialogOpen(false)
    } catch (err) {
      toast({
        title: t("productManagement.error"),
        description: editingItem ? t("productManagement.failedUpdate") : t("productManagement.failedCreate"),
        variant: "destructive",
      })
      console.error(err)
    }
  }

  // Function to open feature dialog for a specific product
  const openFeatureDialog = (productId: number) => {
    setSelectedProductId(productId)

    // Pre-populate selectedColors with the product's current colors
    const product = productData.find(p => p.id === productId)
    if (product && product.colors) {
      setSelectedColors(product.colors)
    } else {
      setSelectedColors([])
    }

    setIsFeatureDialogOpen(true)
  }

  // Function to add a color to the product
  const handleAddColor = async (colorId: number, image: File | null, price: string) => {
    if (!selectedProductId) return

    try {
      const formData = new FormData()
      formData.append("product", selectedProductId.toString())
      formData.append("color", colorId.toString())
      formData.append("price", price)

      // The API requires an image, so we need to provide one
      if (image) {
        formData.append("image", image)
      } else {
        // If no image is provided, create a placeholder image
        // Create a small transparent PNG as a placeholder
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = 'transparent'
          ctx.fillRect(0, 0, 1, 1)

          // Convert canvas to blob and add to formData
          const blob = await new Promise<Blob>(resolve => {
            canvas.toBlob(resolve as BlobCallback, 'image/png')
          })

          // Create a file from the blob
          const placeholderFile = new File([blob], 'placeholder.png', { type: 'image/png' })
          formData.append("image", placeholderFile)
        } else {
          throw new Error("Could not create placeholder image")
        }
      }

      const response = await authService.makeAuthenticatedRequest("/product/create-product-colors/", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server response:", errorText)
        throw new Error(`Failed to add color: ${response.status} ${errorText}`)
      }

      // Refresh the product colors
      await fetchProductColors(selectedProductId)

      toast({
        title: t("productManagement.success"),
        description: t("productManagement.colorAdded")
      })

      // Close the color selector
      setIsColorSelectorOpen(false)
    } catch (error) {
      console.error("Error adding color:", error)
      toast({
        title: t("productManagement.error"),
        description: t("productManagement.failedAddColor"),
        variant: "destructive"
      })
    }
  }
  // Function to remove a color from the product
  const handleRemoveColor = async (productColorId: number) => {
    if (!selectedProductId) return

    try {
      const response = await authService.makeAuthenticatedRequest(`/product/detail-product-colors/${productColorId}/`, {
        method: "DELETE",
      })

      if (!response.ok) {
        // Try the alternative endpoint if the first one fails
        const altResponse = await authService.makeAuthenticatedRequest(`/product/create-product-colors/${productColorId}/`, {
          method: "DELETE",
        })
        if (!altResponse.ok) throw new Error("Failed to remove color")
      }

      // Refresh the product colors
      await fetchProductColors(selectedProductId)

      toast({
        title: t("productManagement.success"),
        description: t("productManagement.colorRemoved")
      })
    } catch (error) {
      toast({
        title: t("productManagement.error"),
        description: t("productManagement.failedRemoveColor"),
        variant: "destructive"
      })
    }
  }

  const filteredProducts = filterCategory
    ? productData.filter((p) => {
      const categoryObj = categories.find((c) => c.slug === p.category)
      return categoryObj?.id === filterCategory
    })
    : productData

  if (isLoading) {
    return (
      <Loader />
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-slide-in flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Plus className="h-6 w-6 md:h-8 md:w-8 text-primary" /> {t("productManagement.title")}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("productManagement.description")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Product dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" /> {t("productManagement.createProduct")}
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingItem ? t("productManagement.editProduct") : t("productManagement.createProduct")}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? t("productManagement.updateProduct") : t("productManagement.addProduct")}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Language Tabs */}
                  <Tabs defaultValue="uz" className="w-full">
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="uz" className="flex items-center gap-2">
                        <Languages className="h-4 w-4" /> Uzbek
                      </TabsTrigger>
                      <TabsTrigger value="ru" className="flex items-center gap-2">
                        <Languages className="h-4 w-4" /> Russian
                      </TabsTrigger>
                      <TabsTrigger value="en" className="flex items-center gap-2">
                        <Languages className="h-4 w-4" /> English
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="uz" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="title_uz">{t("productManagement.titleLabel")} (Uzbek)</Label>
                        <Input
                          id="title_uz"
                          value={formData.title_uz}
                          onChange={(e) => setFormData({ ...formData, title_uz: e.target.value })}
                          placeholder={t('placeholderTitle')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_uz">{t("productManagement.descriptionLabel")} (Uzbek)</Label>
                        <Textarea
                          id="description_uz"
                          value={formData.description_uz}
                          onChange={(e) => setFormData({ ...formData, description_uz: e.target.value })}
                          rows={4}
                          placeholder="Mahsulot haqida tavsif yozing"
                          required
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="ru" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="title_ru">{t("productManagement.titleLabel")} (Russian)</Label>
                        <Input
                          id="title_ru"
                          value={formData.title_ru}
                          onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })}
                          placeholder={t('placeholderTitle')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_ru">{t("productManagement.descriptionLabel")} (Russian)</Label>
                        <Textarea
                          id="description_ru"
                          value={formData.description_ru}
                          onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                          rows={4}
                          placeholder="Напишите описание продукта"
                          required
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="en" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="title_en">{t("productManagement.titleLabel")} (English)</Label>
                        <Input
                          id="title_en"
                          value={formData.title_en}
                          onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                          placeholder={t('placeholderTitle')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_en">{t("productManagement.descriptionLabel")} (English)</Label>
                        <Textarea
                          id="description_en"
                          value={formData.description_en}
                          onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                          rows={4}
                          placeholder="Write product description"
                          required
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Price + Category + Images */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">{t("productManagement.price")}</Label>
                          <Input
                            id="price"
                            type="text"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="Ex: 50000"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="old_price">{t("productManagement.oldPrice")}</Label>
                          <Input
                            id="old_price"
                            type="text"
                            value={formData.old_price}
                            onChange={(e) => setFormData({ ...formData, old_price: e.target.value })}
                            placeholder="Ex: 55000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <CategorySelector
                          selectedCategory={formData.category}
                          onCategoryChange={(categoryId) => setFormData({ ...formData, category: categoryId })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <ImageUploader
                        images={uploadImages.images}
                        onImagesChange={(images) => setUploadImages({ images })}
                        imagePreviews={imagePreviews}
                        onPreviewsChange={setImagePreviews}
                        productId={editingItem?.id || null}
                        uploadMode={uploadMode}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingItem(null)
                        setFormData(blankForm)
                        setImagePreviews([])
                      }}
                    >
                      {t("productManagement.cancel")}
                    </Button>
                    <Button type="submit">
                      {editingItem ? t("productManagement.update") : t("productManagement.create")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Product Table */}
        <Card>
          <div className="flex justify-between px-2">
            <CardHeader className="w-full">
              <CardTitle>{t("productManagement.productList")}</CardTitle>
              <CardDescription>{t("productManagement.description")}</CardDescription>
            </CardHeader>
            <CategorySelector
              categories={[{ id: 0, name_en: "All Categories", slug: "all" }, ...categories]}
              selectedCategory={filterCategory || 0}
              onCategoryChange={(categoryId) =>
                setFilterCategory(categoryId === 0 ? null : categoryId)
              }
              className="bg-green-700 z-10"
            />
          </div>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("productManagement.id")}</TableHead>
                    <TableHead>{t("productManagement.image")}</TableHead>
                    <TableHead>{t("productManagement.titleLabel")}</TableHead>
                    <TableHead>{t("productManagement.descriptionLabel")}</TableHead>
                    <TableHead>{t("productManagement.price")}</TableHead>
                    <TableHead>{t("features")}</TableHead>
                    <TableHead className="text-right">{t("productManagement.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {t("productManagement.noProducts")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((prod) => (
                      <TableRow key={prod.id}>
                        <TableCell>{prod.id}</TableCell>
                        <TableCell>
                          {prod.images && prod.images.length > 0 ? (
                            <div className="relative w-12 h-12 rounded overflow-hidden">
                              <Image
                                src={normalizeImageUrl(prod.images[0].image)}
                                alt={'pic'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <span>-</span>
                          )}
                        </TableCell>
                        <TableCell>{prod.title}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{prod.description}</TableCell>
                        <TableCell>{prod.price}</TableCell>
                        <TableCell>
                          {prod.features?.length || 0} {t("features")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openFeatureDialog(prod.id)}
                              title={t("productManagement.addFeatures")}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(prod)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(prod.id)}>
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

        {/* Feature & Color dialog content */}
        <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("productManagement.addFeaturesColors")}</DialogTitle>
              <DialogDescription>
                {t("productManagement.addFeaturesDescription")}
              </DialogDescription>
            </DialogHeader>

            {selectedProductId && (
              <>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800">
                    {t("managefeatures")} {selectedProductId}
                  </h3>
                  
                </div>
                <FeatureSelector
                  selectedFeatures={[]}
                  onFeaturesChange={(features) => {
                    setProductData(prev =>
                      prev.map(p => p.id === selectedProductId ? { ...p, features } : p)
                    )
                  }}
                  productId={selectedProductId}
                />

                <div className="my-6 border-t border-gray-200" />

                {/* Color management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t("colors")}</h3>
                    <Button
                      onClick={() => setIsColorSelectorOpen(true)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" /> {t("addColor")}
                    </Button>
                  </div>

                 

                  {/* Color selector */}
                  {isColorSelectorOpen && (
                    <div className="p-4 border rounded-lg bg-muted/30 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">{t("productManagement.selectColor")}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsColorSelectorOpen(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <ColorSelector
                        selectedColors={selectedColors}
                        onColorsChange={setSelectedColors}
                        productId={selectedProductId || 0}
                        singleSelect={true}
                      />

                      {selectedColors.length > 0 && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            onClick={() => {
                              // This will trigger the handleAddColor function
                              const color = selectedColors[0]
                              handleAddColor(color.colorId, color.image, color.price)
                            }}
                            disabled={selectedColors.some(color => !color.price || !color.image)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t("productManagement.addColor")}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Display product colors */}
                  <div className="space-y-3">
                    {productColors.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        {t("productManagement.noColorsAdded")}
                      </p>
                    ) : (
                      productColors.map((productColor) => {
                        const color = colors.find(c => c.id === productColor.color)
                        return (
                          <div key={productColor.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {productColor.image && (
                                <div className="relative w-10 h-10 rounded overflow-hidden">
                                  <Image
                                    src={normalizeImageUrl(productColor.image)}
                                    alt={color?.name_en || `Color ${productColor.color}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              {color?.color_image && (
                                <div className="relative w-10 h-10 rounded overflow-hidden">
                                  <Image
                                    src={normalizeImageUrl(color.color_image)}
                                    alt={color.name_en}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{color?.name || `Color ${productColor.color}`}</div>
                                <div className="text-sm text-muted-foreground">{productColor.price}</div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveColor(productColor.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFeatureDialogOpen(false)
                  setSelectedProductId(null)
                  setSelectedColors([]) // Clear the colors state
                  setIsColorSelectorOpen(false) // Close color selector
                  fetchProductData() // Refresh to get latest data
                }}
              >
                {t("productManagement.done")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Product Grid */}
        {productData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("productManagement.productGallery")}</CardTitle>
              <CardDescription>{t("productManagement.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {productData.map((prod) => (
                  <div key={prod.id} className="relative aspect-video border rounded-lg overflow-hidden group">
                    <Image
                      src={prod.images[0] ? normalizeImageUrl(prod.images[0].image) : "/placeholder.svg"}
                      alt={'pic'}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white p-3">
                      <div className="font-semibold text-sm mb-1 w-[550px]">{prod.title}</div>
                      <div className="text-xs opacity-90">
                        ${prod.price} • {prod.colors?.length || 0} colors • {prod.features?.length || 0} features
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

export default function ProductManagement() {
  return (
    <CategoriesProvider>
      <ColorsProvider>
        <FeaturesProvider>
          <TypesProvider>
            <ProductColorsProvider>
              <ProductManagementContent />
            </ProductColorsProvider>
          </TypesProvider>
        </FeaturesProvider>
      </ColorsProvider>
    </CategoriesProvider>
  )
}