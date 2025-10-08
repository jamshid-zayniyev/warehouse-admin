"use client"

import React, { useEffect, useState, useCallback } from "react"
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
import { Plus, Edit, Trash2, Languages, Search, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { CategoriesProvider, useCategories } from "@/contexts/CategoriesContext"
import { useTranslation } from 'next-i18next'
import { CategorySelector } from "@/components/CategorySeletor"
import { ProductSelector } from "@/components/ProductSelector"
import Loader from "@/components/ui/loader"

// Yangi typelar
interface ProductInput {
  id: number
  category: number
  category_name: string
  product: number
  product_title: string
  quantity: number
  sell_price: string
  supplier_name:string
  buy_price: string
  date_joined: string
  product_details?: {
    title_uz?: string
    title_en?: string
    title_ru?: string
    description_uz?: string
    description_en?: string
    description_ru?: string
    images?: Array<{ image: string }>
  }
  category_details?: {
    name: string
  }
}

interface Category {
  id: number
  name: string
  slug: string
}

interface Product {
  id: number
  title_uz?: string
  title_en?: string
  title_ru?: string
  description_uz?: string
  description_en?: string
  description_ru?: string
  category: number
}

function ProductManagementContent() {
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductInput | null>(null)
  const [dateFilter, setDateFilter] = useState({ year: '', month: '', day: '' })
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const blankForm = {
    category: 0,
    product: 0,
    quantity: 0,
    sell_price: "0",
    buy_price: "0",
    date_joined: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  }

  const [formData, setFormData] = useState<typeof blankForm>(blankForm)
  const [productInputs, setProductInputs] = useState<ProductInput[]>([])
  const [allProductInputs, setAllProductInputs] = useState<ProductInput[]>([]) // Barcha ma'lumotlar
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const { toast } = useToast()

  // Kategoriyalarni olish
  const fetchCategories = async () => {
    try {
      const response = await authService.makeAuthenticatedRequest("/product/categories/")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      toast({
        title: t("productManagement.error"),
        description: t("productManagement.failedFetchCategories"),
        variant: "destructive",
      })
    }
  }

  // Kategoriya bo'yicha mahsulotlarni olish
  const fetchProductsByCategory = async (categoryId: number) => {
    if (!categoryId) {
      setProducts([])
      return
    }

    try {
      const response = await authService.makeAuthenticatedRequest(`/product/category/${categoryId}/products/`)
      if (!response.ok) throw new Error("Failed to fetch products")
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      toast({
        title: t("productManagement.error"),
        description: t("productManagement.failedFetchProducts"),
        variant: "destructive",
      })
    }
  }

  // Kunlik mahsulot kirimlarini olish (faqat bir marta)
  const fetchDailyInputs = useCallback(async (year?: string, month?: string, day?: string) => {
    setIsLoading(true)
    try {
      let endpoint = "/product/daily/"

      if (year && month && day) {
        endpoint = `/product/daily/${year}/${month}/${day}/`
      } else {
        // Agar sana berilmasa, bugungi sana uchun so'rov yuboramiz
        const today = new Date()
        endpoint = `/product/daily/${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}/`
      }

      const response = await authService.makeAuthenticatedRequest(endpoint)
      if (!response.ok) throw new Error("Failed to fetch daily inputs")
      const data = await response.json()
      
      // Barcha ma'lumotlarni saqlaymiz
      setAllProductInputs(data)
      
      // Filtrlash funksiyasini chaqiramiz
      applyFilters(data, searchFilter, { year, month, day })
    } catch (error) {
      toast({
        title: t("productManagement.error"),
        description: t("productManagement.failedFetch"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchFilter, toast, t])

  // Filtrlash funksiyasi
  const applyFilters = useCallback((data: ProductInput[], search: string, date: { year?: string, month?: string, day?: string }) => {
    let filteredData = data

    // Sana bo'yicha filtrlash
    if (date.year && date.month && date.day) {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.date_joined)
        return itemDate.getFullYear() === parseInt(date.year!) &&
               itemDate.getMonth() + 1 === parseInt(date.month!) &&
               itemDate.getDate() === parseInt(date.day!)
      })
    }

    // Qidiruv bo'yicha filtrlash
    if (search) {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter(item =>
        item.category_name.toLowerCase().includes(searchLower) ||
        item.product_title.toLowerCase().includes(searchLower) ||
        item.product_details?.title_uz?.toLowerCase().includes(searchLower) ||
        item.product_details?.title_en?.toLowerCase().includes(searchLower) ||
        item.product_details?.title_ru?.toLowerCase().includes(searchLower)
      )
    }

    setProductInputs(filteredData)
  }, [])

  // Faqat birinchi renderda va kerak bo'lganda ma'lumotlarni yuklash
  useEffect(() => {
    fetchCategories()
    fetchDailyInputs()
  }, [fetchDailyInputs])

  // Kategoriya o'zgarganda mahsulotlarni olish
  useEffect(() => {
    if (formData.category > 0) {
      fetchProductsByCategory(formData.category)
    } else {
      setProducts([])
      setFormData(prev => ({ ...prev, product: 0 }))
    }
  }, [formData.category])

  // Faqat search filter o'zgarganda filtrlash
  useEffect(() => {
    applyFilters(allProductInputs, searchFilter, dateFilter)
  }, [searchFilter, allProductInputs, applyFilters])

  // Sana filter o'zgarganda yangi ma'lumotlarni yuklash
  useEffect(() => {
    if (dateFilter.year && dateFilter.month && dateFilter.day) {
      fetchDailyInputs(dateFilter.year, dateFilter.month, dateFilter.day)
    } else if (!dateFilter.year && !dateFilter.month && !dateFilter.day) {
      // Agar sana filteri bo'sh bo'lsa, barcha ma'lumotlarni ko'rsatish
      fetchDailyInputs()
    }
  }, [dateFilter.year, dateFilter.month, dateFilter.day, fetchDailyInputs])

  const getDisplayTitle = (item: ProductInput) => {
    return item.product_details?.title_en ||
      item.product_details?.title_uz ||
      item.product_details?.title_ru ||
      "Untitled"
  }

  const getDisplayDescription = (item: ProductInput) => {
    return item.product_details?.description_en ||
      item.product_details?.description_uz ||
      item.product_details?.description_ru ||
      "No description"
  }

  const normalizeImageUrl = (url?: string) => {
    if (!url) return "/placeholder.svg"
    if (url.startsWith("http")) return url
    return `https://warehouseats.pythonanywhere.com${url}`
  }

  const openCreateDialog = () => {
    setEditingItem(null)
    setFormData({
      ...blankForm,
      date_joined: new Date().toISOString().split('T')[0]
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: ProductInput) => {
    setEditingItem(item)
    setFormData({
      category: item.category,
      product: item.product,
      quantity: item.quantity,
      sell_price: item.sell_price,
      buy_price: item.buy_price,
      date_joined: item.date_joined
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t("productManagement.deleteConfirm"))) return
    try {
      const response = await authService.makeAuthenticatedRequest(`/product/input/${id}/`, {
        method: "DELETE"
      })
      if (!response.ok) throw new Error("Delete failed")
      
      // Yangi ma'lumotlarni yuklash
      if (dateFilter.year && dateFilter.month && dateFilter.day) {
        await fetchDailyInputs(dateFilter.year, dateFilter.month, dateFilter.day)
      } else {
        await fetchDailyInputs()
      }
      
      toast({
        title: t("productManagement.success"),
        description: t("productManagement.productDeleted")
      })
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

    // Sanani tekshirish (kelajakdagi sanani cheklash)
    const selectedDate = new Date(formData.date_joined).toDateString()
    const today = new Date().toDateString()

    if (new Date(selectedDate) > new Date(today)) {
      toast({
        title: t("productManagement.error"),
        description: t("productManagement.futureDateError"),
        variant: "destructive",
      })
      return
    }

    try {
      const payload = {
        category: formData.category,
        product: formData.product,
        quantity: Number(formData.quantity),
        sell_price: formData.sell_price,
        buy_price: formData.buy_price,
        date_joined: formData.date_joined
      }

      let response
      if (editingItem) {
        response = await authService.makeAuthenticatedRequest(`/product/input/${editingItem.id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        response = await authService.makeAuthenticatedRequest("/product/input/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(`HTTP ${response.status} ${text}`)
      }

      // Yangi ma'lumotlarni yuklash
      if (dateFilter.year && dateFilter.month && dateFilter.day) {
        await fetchDailyInputs(dateFilter.year, dateFilter.month, dateFilter.day)
      } else {
        await fetchDailyInputs()
      }

      setIsDialogOpen(false)
      setEditingItem(null)
      setFormData(blankForm)

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

  // Sana filterini o'rnatish
  const handleDateFilterChange = (type: 'year' | 'month' | 'day', value: string) => {
    setDateFilter(prev => {
      const newFilter = { ...prev, [type]: value }

      // Agar barcha sana qismlari to'ldirilgan bo'lsa, filter qo'llaymiz
      if (newFilter.year && newFilter.month && newFilter.day) {
        return newFilter
      }

      // Agar biron bir qism o'chirilsa, filter ni to'liq olib tashlaymiz
      if (!value) {
        return { year: '', month: '', day: '' }
      }

      return newFilter
    })
  }

  // Bugungi sana uchun filter
  const setTodayFilter = () => {
    const today = new Date()
    setSelectedDate(today)
    setDateFilter({
      year: today.getFullYear().toString(),
      month: (today.getMonth() + 1).toString(),
      day: today.getDate().toString()
    })
  }

  // Filterni tozalash
  const clearDateFilter = () => {
    setSelectedDate(null)
    setDateFilter({ year: '', month: '', day: '' })
    setSearchFilter('')
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

              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingItem ? t("productManagement.editProduct") : t("productManagement.createProduct")}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? t("productManagement.updateProduct") : t("productManagement.addProduct")}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category va Product selection */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: Number(e.target.value), product: 0 })}
                        className="w-full p-2 border rounded-md"
                        required
                      >
                        <option value={0}>Select Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product">Product</Label>
                      <select
                        id="product"
                        value={formData.product}
                        onChange={(e) => setFormData({ ...formData, product: Number(e.target.value) })}
                        className="w-full p-2 border rounded-md"
                        disabled={!formData.category}
                        required
                      >
                        <option value={0}>Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.title_en || product.title_uz || product.title_ru || `Product ${product.id}`}
                          </option>
                        ))}
                      </select>
                      {!formData.category && (
                        <p className="text-sm text-muted-foreground">Please select a category first</p>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Quantity */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buy_price">Buy Price</Label>
                      <Input
                        id="buy_price"
                        type="number"
                        value={formData.buy_price}
                        onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sell_price">Sell Price</Label>
                      <Input
                        id="sell_price"
                        type="number"
                        value={formData.sell_price}
                        onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date_joined">Date</Label>
                    <Input
                      id="date_joined"
                      type="date"
                      value={formData.date_joined}
                      onChange={(e) => setFormData({ ...formData, date_joined: e.target.value })}
                      max={new Date().toISOString().split('T')[0]} // Kelajakdagi sanalarni cheklash
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingItem(null)
                        setFormData(blankForm)
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

        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter products by date and search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Sana filteri */}
              <div className="space-y-2">
                <Label htmlFor="date-filter" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Select Date
                </Label>
                <div className="relative">
                  <Input
                    id="date-filter"
                    type="date"
                    value={dateFilter.year && dateFilter.month && dateFilter.day
                      ? `${dateFilter.year}-${dateFilter.month.padStart(2, '0')}-${dateFilter.day.padStart(2, '0')}`
                      : ""
                    }
                    onChange={(e) => {
                      const selectedDate = e.target.value
                      if (selectedDate) {
                        const [year, month, day] = selectedDate.split('-')
                        setDateFilter({
                          year: year,
                          month: month.replace(/^0+/, ''), // Leading nollarni olib tashlash
                          day: day.replace(/^0+/, '')
                        })
                      } else {
                        clearDateFilter()
                      }
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pr-10 cursor-pointer"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Qidiruv filteri */}
              <div className="space-y-2">
                <Label htmlFor="search-filter" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search Products & Categories
                </Label>
                <div className="relative">
                  <Input
                    id="search-filter"
                    placeholder="Search by product name or category..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <Label>Actions</Label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={setTodayFilter} size="sm" className="flex-1">
                    Today
                  </Button>
                  <Button variant="outline" onClick={clearDateFilter} size="sm" className="flex-1">
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Inputs Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("productManagement.productList")}</CardTitle>
            <CardDescription>
              {dateFilter.year && dateFilter.month && dateFilter.day
                ? `Showing products for ${dateFilter.year}-${dateFilter.month}-${dateFilter.day}`
                : "Showing recent products"
              }
              {searchFilter && ` • Filtered by: "${searchFilter}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Buy Price</TableHead>
                  <TableHead>Sell Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productInputs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("productManagement.noProducts")}
                    </TableCell>
                  </TableRow>
                ) : (
                  productInputs.map((input) => (
                    <TableRow key={input.id}>
                      <TableCell>{input.id}</TableCell>
                      <TableCell>{input.category_name}</TableCell>
                      <TableCell>{input.product_title}</TableCell>
                      <TableCell>{input.buy_price}</TableCell>
                      <TableCell>{input.sell_price}</TableCell>
                      <TableCell>{input.quantity}</TableCell>
                      <TableCell>{input.supplier_name}</TableCell>
                      <TableCell>{new Date(input.date_joined).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(input)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(input.id)}>
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
      </div>
    </AdminLayout>
  )
}

export default function ProductManagement() {
  return (
    <CategoriesProvider>
      <ProductManagementContent />
    </CategoriesProvider>
  )
}