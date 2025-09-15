"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from 'next-i18next'

interface Color {
  id: number
  name: string
  image: string
  name_uz?: string
  name_en?: string
  name_ru?: string
}

interface ColorsContextType {
  colors: Color[]
  loading: boolean
  fetchColors: () => Promise<void>
  createColor: (name: string, image: File) => Promise<Color | null>
}

const ColorsContext = createContext<ColorsContextType | undefined>(undefined)

export function ColorsProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<Color[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const fetchColors = async () => {
    setLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/product/create-color/")
      if (!response.ok) throw new Error("Failed to fetch colors")
      const data = await response.json()
      setColors(data)
    } catch (error) {
      toast({
        title: t("error"),
        description: t("fetchcolors.failedToFetch"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createColor = async (name: string, image: File): Promise<Color | null> => {
    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("image", image)

      const response = await authService.makeAuthenticatedRequest("/product/create-color/", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to create color")

      const newColor = await response.json()
      setColors((prev) => [...prev, newColor])

      toast({
        title: t("success"),
        description: t("fetchcolors.created"),
      })

      return newColor
    } catch (error) {
      toast({
        title: t("error"),
        description: t("fetchcolors.failedToCreate"),
        variant: "destructive",
      })
      return null
    }
  }

  useEffect(() => {
    fetchColors()
  }, [])

  return (
    <ColorsContext.Provider
      value={{
        colors,
        loading,
        fetchColors,
        createColor,
      }}
    >
      {children}
    </ColorsContext.Provider>
  )
}

export function useColors() {
  const context = useContext(ColorsContext)
  if (context === undefined) {
    throw new Error("useColors must be used within a ColorsProvider")
  }
  return context
}
