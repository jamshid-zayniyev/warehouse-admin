"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from 'next-i18next'

interface Product {
  id: number
  title: string
  title_en?: string
  title_uz?: string
  title_ru?: string
  description?: string
  description_en?: string
  description_uz?: string
  description_ru?: string
  price?: string
  buy_price?: string
  sell_price?: string
  quantity?: string
  category: number | string
  images?: Array<{ image: string }>
  created: any
}

interface ProductsContextType {
  products: Product[]
  loading: boolean
  fetchProducts: () => Promise<void>
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/product/all/")
      if (!response.ok) throw new Error("Failed to fetch products")
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      toast({
        title: t("error"),
        description: t("fetchproducts.failedToFetch"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        fetchProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductsProvider")
  }
  return context
}