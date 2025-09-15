"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from 'next-i18next'

interface ProductColor {
  id: number
  product: number
  color: number
  image: string
  price: string
  name: string
  color_image: string
}

interface ProductColorsContextType {
  productColors: ProductColor[]
  loading: boolean
  fetchProductColors: () => Promise<void>
  createProductColor: (
    productId: number,
    colorId: number,
    image: File,
    price: string
  ) => Promise<ProductColor | null>
}

const ProductColorsContext = createContext<ProductColorsContextType | undefined>(undefined)

export function ProductColorsProvider({ children }: { children: React.ReactNode }) {
  const [productColors, setProductColors] = useState<ProductColor[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const fetchProductColors = async () => {
    setLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/product/create-product-colors/")
      if (!response.ok) throw new Error("Failed to fetch product colors")
      const data = await response.json()
      setProductColors(data)
    } catch (error) {
      toast({
        title: t("error"),
        description: t("productColors.failedToFetch"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createProductColor = async (
    productId: number,
    colorId: number,
    image: File,
    price: string
  ): Promise<ProductColor | null> => {
    try {
      const formData = new FormData()
      formData.append("product", productId.toString())
      formData.append("color", colorId.toString())
      formData.append("image", image)
      formData.append("price", price)

      const response = await authService.makeAuthenticatedRequest("/product/create-product-colors/", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to create product color")

      const newProductColor = await response.json()
      setProductColors((prev) => [...prev, newProductColor])

      toast({
        title: t("success"),
        description: t("productColors.created"),
      })

      return newProductColor
    } catch (error) {
      toast({
        title: t("error"),
        description: t("productColors.failedToCreate"),
        variant: "destructive",
      })
      return null
    }
  }

  useEffect(() => {
    fetchProductColors()
  }, [])

  return (
    <ProductColorsContext.Provider
      value={{
        productColors,
        loading,
        fetchProductColors,
        createProductColor,
      }}
    >
      {children}
    </ProductColorsContext.Provider>
  )
}

export function useProductColors() {
  const context = useContext(ProductColorsContext)
  if (context === undefined) {
    throw new Error("useProductColors must be used within a ProductColorsProvider")
  }
  return context
}
