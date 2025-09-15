"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from 'next-i18next'

interface Category {
  id: number
  name: string
  slug: string
}

interface CategoriesContextType {
  categories: Category[]
  loading: boolean
  fetchCategories: () => Promise<void>
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined)

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/product/categories/")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      toast({
        title: t("error"),
        description: t("fetchcategories.failedToFetch"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        loading,
        fetchCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const context = useContext(CategoriesContext)
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoriesProvider")
  }
  return context
}
