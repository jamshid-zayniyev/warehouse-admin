"use client"

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useTypes } from '@/contexts/TypesContext'
import { Plus, X, Trash2, Settings, FileText, DollarSign, Tag } from 'lucide-react'
import { authService } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useTranslation } from 'react-i18next'

interface ProductFeature {
  id: number
  typeId: number
  typeName: string
  value: string
  price: string
}

interface FeatureSelectorProps {
  selectedFeatures: ProductFeature[]
  onFeaturesChange: (features: ProductFeature[]) => void
  productId: number
}

export function FeatureSelector({ selectedFeatures, onFeaturesChange, productId }: FeatureSelectorProps) {
  const { types, createType } = useTypes()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreateTypeDialogOpen, setIsCreateTypeDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterPro, setFilterPro] = useState<ProductFeature[]>([])
  const [allFeatures, setAllFeatures] = useState<any[]>([])
  const { toast } = useToast()

  const {t} = useTranslation()

  // New feature form
  const [newFeatureType, setNewFeatureType] = useState('')
  const [newFeatureValue, setNewFeatureValue] = useState('')
  const [newFeaturePrice, setNewFeaturePrice] = useState('')

  // New type form
  const [newTypeName_uz, setNewTypeName_uz] = useState('')
  const [newTypeName_ru, setNewTypeName_ru] = useState('')
  const [newTypeName_en, setNewTypeName_en] = useState('')

  // Barcha featureslarni olish
  const fetchAllFeatures = async () => {
    setLoading(true)
    try {
      const token = authService.getAccessToken()
      const res = await apiFetch(
        `/product/create-features/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (res.ok) {
        const featuresData = await res.json()
        setAllFeatures(featuresData)
        console.log('Barcha features:', featuresData)
        console.log('Product ID:', productId)

        // Faqat shu mahsulotga tegishli featureslarni filter qilish
        const productFeatures = featuresData
          .filter((feature: any) => {
            console.log('Feature product ID:', feature.product, 'Type:', typeof feature.product)
            console.log('Target product ID:', productId, 'Type:', typeof productId)
            return feature.product === productId
          })
          .map((feature: any) => ({
            id: feature.id,
            typeId: feature.type,
            typeName: types.find(t => t.id === feature.type)?.name || `Type ${feature.type}`,
            value: feature.value,
            price: feature.price
          }))

        console.log('Filtered features for product:', productFeatures)
        onFeaturesChange(productFeatures)
        setFilterPro(productFeatures)
      }
    } catch (error) {
      console.error("Error fetching features:", error)
      toast({
        title: "Error",
        description: "Failed to fetch features",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId) {
      console.log('FeatureSelector mounted with productId:', productId)
      fetchAllFeatures()
    }
  }, [productId])

  // Add a feature
  const handleAddFeature = async () => {
    if (!newFeatureType || !newFeatureValue.trim() || !newFeaturePrice.trim()) return

        const selectedType = types.find(t => t.id.toString() === newFeatureType)
        if (!selectedType) return

    try {
      const token = authService.getAccessToken()
      const res = await apiFetch(
        "/product/create-features/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product: productId,
            type: parseInt(newFeatureType),
            value: newFeatureValue.trim(),
            price: newFeaturePrice.trim(),
          }),

        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(`Failed to create feature: ${JSON.stringify(errorData)}`)
      }

      // Yangi feature yaratilgandan so'ng, barcha featureslarni qayta yuklash
      await fetchAllFeatures()

      // Reset form
      setNewFeatureType("")
      setNewFeatureValue("")
      setNewFeaturePrice("")
      setIsCreateDialogOpen(false)

      toast({
        title: "Success",
        description: "Feature added successfully",
      })

    } catch (error) {
      console.error("Error creating feature:", error)
      toast({
        title: "Error",
        description: "Failed to add feature",
        variant: "destructive",
      })
    }
  }

  // Delete a feature
  const handleDeleteFeature = async (featureId: number) => {
    try {
      const token = authService.getAccessToken()
      const res = await apiFetch(
        `/product/detail-features/${featureId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        throw new Error("Failed to delete feature")
      }

      // Feature o'chirilgandan so'ng, barcha featureslarni qayta yuklash
      await fetchAllFeatures()

      toast({
        title: "Success",
        description: "Feature deleted successfully",
      })

    } catch (error) {
      console.error("Error deleting feature:", error)
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      })
    }
  }

  // Create a new type
  const handleCreateType = async () => {
    if (!newTypeName_uz.trim() && !newTypeName_ru.trim() && !newTypeName_en.trim()) return

    const newType = await createType(productId, newTypeName_uz.trim(), newTypeName_ru.trim(), newTypeName_en.trim())
    if (newType) {
      setNewFeatureType(newType.id.toString())
      setNewTypeName_uz('')
      setNewTypeName_ru('')
      setNewTypeName_en('')
      setIsCreateTypeDialogOpen(false)

      toast({
        title: "Success",
        description: "Type created successfully",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            {t("features")}
          </h2>
          <p className="text-muted-foreground mt-1">
            {t("managefeatures")} <Badge variant="secondary">{productId}</Badge>
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("addFeature")}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Feature
              </DialogTitle>
              <DialogDescription>
                Add a new feature to this product. Fill in all required fields.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Type Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Feature Type
                  </Label>
                  <Dialog open={isCreateTypeDialogOpen} onOpenChange={setIsCreateTypeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="h-3 w-3" />
                        New Type
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px]">
                      <DialogHeader>
                        <DialogTitle>Create New Feature Type</DialogTitle>
                        <DialogDescription>
                          Add a new feature type in multiple languages
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="uz" className="w-full">
                        <TabsList className="grid grid-cols-3">
                          <TabsTrigger value="uz">Uzbek</TabsTrigger>
                          <TabsTrigger value="ru">Russian</TabsTrigger>
                          <TabsTrigger value="en">English</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="uz" className="space-y-3">
                          <Label>Type Name (Uzbek)</Label>
                          <Input
                            value={newTypeName_uz}
                            onChange={(e) => setNewTypeName_uz(e.target.value)}
                            placeholder="Enter Uzbek name"
                          />
                        </TabsContent>
                        
                        <TabsContent value="ru" className="space-y-3">
                          <Label>Type Name (Russian)</Label>
                          <Input
                            value={newTypeName_ru}
                            onChange={(e) => setNewTypeName_ru(e.target.value)}
                            placeholder="Enter Russian name"
                          />
                        </TabsContent>
                        
                        <TabsContent value="en" className="space-y-3">
                          <Label>Type Name (English)</Label>
                          <Input
                            value={newTypeName_en}
                            onChange={(e) => setNewTypeName_en(e.target.value)}
                            placeholder="Enter English name"
                          />
                        </TabsContent>
                      </Tabs>
                      
                      <Button onClick={handleCreateType} className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Create Type
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <Select value={newFeatureType} onValueChange={setNewFeatureType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feature type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{type.name}</span>
                          <Badge variant="outline" className="text-xs">ID: {type.id}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Feature Value
                </Label>
                <Input
                  value={newFeatureValue}
                  onChange={(e) => setNewFeatureValue(e.target.value)}
                  placeholder="Enter feature value"
                />
              </div>

              {/* Price Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Feature Price ($)
                </Label>
                <Input
                  type="number"
                  value={newFeaturePrice}
                  onChange={(e) => setNewFeaturePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <Button onClick={handleAddFeature} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Feature
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Features List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {t("currentFeatures")}
                <Badge variant="outline">{filterPro.length}</Badge>
              </CardTitle>
              <CardDescription>
                {t("assignedfeatures")}
              </CardDescription>
            </div>
            {loading && (
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("loadingfeatures")}</p>
              </div>
            ) : filterPro.length > 0 ? (
              filterPro.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{feature.typeName}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {feature.value}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${feature.price}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="outline">ID: {feature.id}</Badge>
                      <Badge variant="outline">{t("newsManagement.table.type")} ID: {feature.typeId}</Badge>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFeature(feature.id)}
                    className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Delete feature"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-semibold text-lg mb-1">{t("nofeature")}</h3>
                <p className="text-muted-foreground text-sm px-2">
                  {t("firstFeature")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{allFeatures.length}</div>
              <div className="text-sm text-muted-foreground">{t("TotalFeatures")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{filterPro.length}</div>
              <div className="text-sm text-muted-foreground">{t("ThisProduct")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{types.length}</div>
              <div className="text-sm text-muted-foreground">{t("AvailableTypes")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}