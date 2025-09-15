"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from 'next-i18next'

interface Feature {
  id: number
  product: number
  type: number
  value: string
  price: string
}

interface FeaturesContextType {
  features: Feature[]
  loading: boolean
  fetchFeatures: () => Promise<void>
  createFeature: (
    productId: number,
    typeId: number,
    value: string,
    price: string
  ) => Promise<Feature | null>
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined)

export function FeaturesProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const fetchFeatures = async () => {
    setLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/product/create-features/")
      if (!response.ok) throw new Error("Failed to fetch features")
      const data = await response.json()
      setFeatures(data)
    } catch (error) {
      toast({
        title: t("error"),
        description: t("fetchfeatures.failedToFetch"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createFeature = async (
    productId: number,
    typeId: number,
    value: string,
    price: string
  ): Promise<Feature | null> => {
    try {
      const response = await authService.makeAuthenticatedRequest("/product/create-features/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: productId,
          type: typeId,
          value,
          price,
        }),
      })

      if (!response.ok) throw new Error("Failed to create feature")

      const newFeature = await response.json()
      setFeatures((prev) => [...prev, newFeature])

      toast({
        title: t("success"),
        description: t("fetchfeatures.created"),
      })

      return newFeature
    } catch (error) {
      toast({
        title: t("error"),
        description: t("fetchfeatures.failedToCreate"),
        variant: "destructive",
      })
      return null
    }
  }

  useEffect(() => {
    fetchFeatures()
  }, [])

  return (
    <FeaturesContext.Provider
      value={{
        features,
        loading,
        fetchFeatures,
        createFeature,
      }}
    >
      {children}
    </FeaturesContext.Provider>
  )
}

export function useFeatures() {
  const context = useContext(FeaturesContext)
  if (context === undefined) {
    throw new Error("useFeatures must be used within a FeaturesProvider")
  }
  return context
}
