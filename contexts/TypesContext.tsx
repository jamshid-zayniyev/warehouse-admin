"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from 'next-i18next'

interface ProductType {
  id: number
  name:string
  name_uz: string
  name_ru: string
  name_en: string
  productId: number
}

interface TypesContextType {
  types: ProductType[]
  loading: boolean
  fetchTypes: () => Promise<void>
  createType: (productId: number, name_uz: string, name_ru: string, name_en: string,) => Promise<ProductType | null>
}

const TypesContext = createContext<TypesContextType | undefined>(undefined)

export function TypesProvider({ children }: { children: React.ReactNode }) {
  const [types, setTypes] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const fetchTypes = async () => {
    setLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/product/create-product-type/")
      if (!response.ok) throw new Error("Failed to fetch types")
      const data = await response.json()
      setTypes(data)
    } catch (error) {
      toast({
        title: t("error"),
        description: t("types.failedToFetch"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

const createType = async (productId: number, name_uz: string, name_ru: string, name_en: string): Promise<ProductType | null> => {


    try {
      const response = await authService.makeAuthenticatedRequest("/product/create-product-type/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product: productId, name_uz, name_ru, name_en}),
      })

      if (!response.ok) throw new Error("Failed to create type")

      const newType = await response.json()
      setTypes((prev) => [...prev, newType])

      toast({
        title: t("success"),
        description: t("types.created"),
      })

      return newType
    } catch (error) {
      toast({
        title: t("error"),
        description: t("types.failedToCreate"),
        variant: "destructive",
      })
      return null
    }
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  return (
    <TypesContext.Provider
      value={{
        types,
        loading,
        fetchTypes,
        createType,
      }}
    >
      {children}
    </TypesContext.Provider>
  )
}

export function useTypes() {
  const context = useContext(TypesContext)
  if (context === undefined) {
    throw new Error("useTypes must be used within a TypesProvider")
  }
  return context
}
