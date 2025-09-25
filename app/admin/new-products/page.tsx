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
import { Plus, Edit, Trash2, Languages } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { CategoriesProvider, useCategories } from "@/contexts/CategoriesContext"
import { ProductsProvider, useProducts } from "../../../contexts/ProductContext" 
import { Product } from "@/lib/types"
import Loader from "@/components/ui/loader"
import { useTranslation } from 'next-i18next'
import { CategorySelector } from "@/components/CategorySeletor"
import { ProductSelector } from "@/components/ProductSelector"

function ProductManagementContent() {
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)

  const blankForm = {
    id: 0,
    title_uz: "",
    title_en: "",
    title_ru: "",
    description_uz: "",
    description_en: "",
    description_ru: "",
    buy_price: "",
    sell_price: "",
    quantity: "",
    category: 0,
    product: 0,
    images: [] as File[],
    created: "", 
  }

  const imageForm = {
    images: [] as File[]
  }
  
  const [formData, setFormData] = useState<typeof blankForm>(blankForm)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [productData, setProductData] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<number | null>(null)
  const [uploadImages, setUploadImages] = useState<typeof imageForm>(imageForm)
  const { toast } = useToast()
  const { categories } = useCategories()
  const { products } = useProducts()

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().slice(0, 16) 
  }

  const normalizeImageUrl = (url?: string) => {
    if (!url) return "/placeholder.svg"
    if (url.startsWith("http")) return url
    return `https://warehouseats.pythonanywhere.com${url}`
  }

  const fetchProductsByCategory = async (categoryId: number | null) => {
    setIsLoading(true)
    try {
      let endpoint = "/product/all/"
      
      if (categoryId && categoryId !== 0) {
        endpoint = `/product/category/${categoryId}/products/`
      }
      
      const response = await authService.makeAuthenticatedRequest(endpoint)
      if (!response.ok) throw new Error("Failed to fetch products")
      const data = await response.json()

      const sorted = [...data].sort((a, b) => b.id - a.id)
      setProductData(sorted)
    } catch (error) {
      toast({
        title: t("productManagement.error"),
        description: t("productManagement.failedFetch"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProductsByCategory(filterCategory)
  }, [filterCategory])

  const getDisplayTitle = (item: Product) => {
    return item.title_en || item.title_uz || item.title_ru || item.title || "Untitled"
  }

  const getDisplayDescription = (item: Product) => {
    return item.description_en || item.description_uz || item.description_ru || item.description || "No description"
  }

  const formatDisplayDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString()
  }

  const openCreateDialog = () => {
    setEditingItem(null)
    const currentDate = new Date().toISOString().slice(0, 16)
    setFormData({
      ...blankForm,
      created: currentDate,
    })
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
      buy_price: item.buy_price || "",
      sell_price: item.sell_price || "",
      quantity: item.quantity || "",
      category: categoryId,
      product: item.id,
      images: [] as File[],
      created: formatDateForInput(item.created),
    })
    setImagePreviews((item.images || []).map((im) => normalizeImageUrl(im.image)))
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t("productManagement.deleteConfirm"))) return
    try {
      const response = await authService.makeAuthenticatedRequest(`/product/input/${id}/`, { method: "DELETE" })
      if (!response.ok) throw new Error("Delete failed")
      await fetchProductsByCategory(filterCategory)
      toast({ title: t("productManagement.success"), description: t("productManagement.productDeleted") })
    } catch {
      toast({
        title: t("productManagement.error"),
        description: t("productManagement.failedDelete"),
        variant: "destructive"
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
        category: Number(formData.category) || null,
        created_at: formData.created || new Date().toISOString(),
      }

      const productEndpoint = editingItem ? `/product/${editingItem.id}/` : "/product/create/"
      const productMethod = editingItem ? "PUT" : "POST"

      const productRes = await authService.makeAuthenticatedRequest(productEndpoint, {
        method: productMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productPayload),
      })

      if (!productRes.ok) {
        const text = await productRes.text().catch(() => "")
        throw new Error(`HTTP ${productRes.status} ${text}`)
      }

      const createdProduct = await productRes.json()
      const productId = editingItem?.id || createdProduct.id
      if (!productId) throw new Error("Backend did not return product ID")

      const inputPayload = {
        category: Number(formData.category) || 0,
        product: productId,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
        sell_price: formData.sell_price || "0",
        buy_price: formData.buy_price || "0",
      }

      let inputResponse
      if (editingItem) {
        inputResponse = await authService.makeAuthenticatedRequest(`/product/input/${editingItem.id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputPayload),
        })
      } else {
        inputResponse = await authService.makeAuthenticatedRequest("/product/input/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputPayload),
        })
      }

      if (!inputResponse.ok) {
        const inputText = await inputResponse.text().catch(() => "")
        throw new Error(`HTTP ${inputResponse.status} ${inputText}`)
      }


      await fetchProductsByCategory(filterCategory)
      
      setIsDialogOpen(false)
      setEditingItem(null)
      setFormData(blankForm)
      setImagePreviews([])
      
      toast({
        title: t("productManagement.success"),
        description: editingItem ? t("productManagement.productUpdated") : t("productManagement.productCreated")
      })

    } catch (err) {
      toast({
        title: t("productManagement.error"),
        description: editingItem ? t("productManagement.failedUpdate") : t("productManagement.failedCreate"),
        variant: "destructive",
      })
      console.error(err)
    }
  }

  if (isLoading) {
    return <Loader />
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

                  {/* Pricing + Category + Quantity + Product Selector + Date Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="buy_price">Buy Price</Label>
                          <Input
                            id="buy_price"
                            type="text"
                            value={formData.buy_price}
                            onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                            placeholder="Ex: 50000"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sell_price">Sell Price</Label>
                          <Input
                            id="sell_price"
                            type="text"
                            value={formData.sell_price}
                            onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                            placeholder="Ex: 55000"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          placeholder="Ex: 100"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <CategorySelector
                          selectedCategory={formData.category}
                          onCategoryChange={(categoryId) => setFormData({ ...formData, category: categoryId })}
                        />
                      </div>

                      <div className="space-y-2">
                        <ProductSelector
                          selectedProduct={formData.product}
                          onProductChange={(productId) => setFormData({ ...formData, product: productId })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Date Fields */}
                      <div className="space-y-2">
                        <Label htmlFor="created_at">Created Date</Label>
                        <Input
                          id="created_at"
                          type="datetime-local"
                          value={formData.created}
                          onChange={(e) => setFormData({ ...formData, created: e.target.value })}
                          required
                        />
                      </div>
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
        <Card>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6">
            <div>
              <CardTitle>{t("productManagement.productList")}</CardTitle>
              <CardDescription>{t("productManagement.description")}</CardDescription>
            </div>
            <div className="w-full md:w-auto">
              <CategorySelector
                selectedCategory={filterCategory || 0}
                onCategoryChange={(categoryId) => {
                  setFilterCategory(categoryId === 0 ? null : categoryId)
                }}
              />
            </div>
          </div>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("productManagement.id")}</TableHead>
                  <TableHead>{t("productManagement.image")}</TableHead>
                  <TableHead>{t("productManagement.titleLabel")}</TableHead>
                  <TableHead>{t("productManagement.descriptionLabel")}</TableHead>
                  <TableHead>Buy Price</TableHead>
                  <TableHead>Sell Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">{t("productManagement.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {filterCategory 
                        ? t("productManagement.noProductsInCategory")
                        : t("productManagement.noProducts")
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  productData.map((prod) => (
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
                      <TableCell>{getDisplayTitle(prod)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{getDisplayDescription(prod)}</TableCell>
                      <TableCell>{prod.buy_price || "-"}</TableCell>
                      <TableCell>{prod.sell_price || "-"}</TableCell>
                      <TableCell>{prod.quantity || "0"}</TableCell>
                      <TableCell>{formatDisplayDate(prod.created)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
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
          </CardContent>
        </Card>
        {productData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("productManagement.productGallery")}</CardTitle>
              <CardDescription>
                {filterCategory 
                  ? t("productManagement.productsInCategory") 
                  : t("productManagement.allProducts")
                }
              </CardDescription>
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
                      <div className="font-semibold text-sm mb-1 truncate">{getDisplayTitle(prod)}</div>
                      <div className="text-xs opacity-90">
                        Buy: ${prod.buy_price} • Sell: ${prod.sell_price} • Qty: {prod.quantity}
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        Created: {formatDisplayDate(prod.created)}
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
      <ProductsProvider>
        <ProductManagementContent />
      </ProductsProvider>
    </CategoriesProvider>
  )
}