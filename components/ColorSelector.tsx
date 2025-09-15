"use client"

import React, { useMemo, useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Plus } from "lucide-react"
import { useColors } from "@/contexts/ColorsContext"
import { ProductColorData } from "@/lib/types"
import { useTranslation } from 'next-i18next'
import Image from "next/image"

interface ColorSelectorProps {
  selectedColors: ProductColorData[]
  onColorsChange: (colors: ProductColorData[]) => void
  productId: number
  singleSelect?: boolean
}

export function ColorSelector({ selectedColors, onColorsChange, productId, singleSelect = false }: ColorSelectorProps) {
  const { t } = useTranslation()
  const { colors, createColor } = useColors()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newColorName, setNewColorName] = useState("")
  const [newColorImage, setNewColorImage] = useState<File | null>(null)
  const [newColorImagePreview, setNewColorImagePreview] = useState("")

  const isColorSelected = (colorId: number) => selectedColors.some(sc => sc.colorId === colorId)

  const selectedMap = useMemo(() => {
    const m: Record<number, ProductColorData> = {}
    selectedColors.forEach(sc => { m[sc.colorId] = sc })
    return m
  }, [selectedColors])

  const handleColorToggle = (colorId: number) => {
    if (isColorSelected(colorId)) {
      onColorsChange(selectedColors.filter(sc => sc.colorId !== colorId))
    } else {
      if (singleSelect) {
        onColorsChange([{ colorId, image: null, price: "" }])
      } else {
        onColorsChange([...selectedColors, { colorId, image: null, price: "" }])
      }
    }
  }

  const handleColorDataChange = (
    colorId: number,
    field: "image" | "price",
    value: File | string
  ) => {
    const updated = selectedColors.map(sc =>
      sc.colorId === colorId ? { ...sc, [field]: value } : sc
    )
    onColorsChange(updated)
  }

  const handleNewColorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewColorImage(file)
      setNewColorImagePreview(URL.createObjectURL(file))
    }
  }

  const handleCreateColor = async () => {
    if (!newColorName.trim() || !newColorImage) return
    
    try {
      const newColor = await createColor(newColorName.trim(), newColorImage)
      if (newColor) {
        onColorsChange([...selectedColors, { colorId: newColor.id, image: null, price: "" }])
        setNewColorName("")
        setNewColorImage(null)
        setNewColorImagePreview("")
        setIsCreateDialogOpen(false)
      }
    } catch (error) {
      console.error("Error creating color:", error)
      alert(t("failedToCreateColor") || "Failed to create color")
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Label className="text-lg font-semibold">{t("colors") || "Colors"}</Label>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              {t("createColor") || "Create Color"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("createNewColor") || "Create New Color"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="colorName">{t("colorName") || "Color Name"}</Label>
                <Input
                  id="colorName"
                  value={newColorName}
                  onChange={e => setNewColorName(e.target.value)}
                  placeholder={t("enterColorName") || "Enter color name"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="colorImage">{t("colorImage") || "Color Image"}</Label>
                <Input
                  id="colorImage"
                  type="file"
                  accept="image/*"
                  onChange={handleNewColorImageChange}
                  className="mt-2"
                />
                {newColorImagePreview && (
                  <div className="mt-2">
                    <Image
                      src={newColorImagePreview}
                      alt={t("preview") || "Preview"}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
              <Button
                onClick={handleCreateColor}
                className="w-full mt-4"
                disabled={!newColorName.trim() || !newColorImage}
                type="button"
              >
                {t("createColor") || "Create Color"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {colors.map(color => {
          const entry = selectedMap[color.id]
          const isSelected = isColorSelected(color.id)
          
          return (
            <div key={color.id} className="space-y-2">
              <div
                onClick={() => handleColorToggle(color.id)}
                className={`flex items-center gap-2 p-3 border rounded cursor-pointer transition-colors ${
                  isSelected ? "bg-primary/10 border-primary" : "hover:bg-gray-50"
                }`}
              >
                <div className="w-8 h-8 rounded border overflow-hidden">
                  <Image
                    src={color.image || "/placeholder.svg"}
                    alt={color.name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium">{color.name}</span>
                <div className={`w-3 h-3 rounded-full ml-auto ${isSelected ? "bg-primary" : "bg-gray-300"}`} />
              </div>

              {isSelected && (
                <div className="ml-8 space-y-3 p-4 bg-gray-50 rounded border">
                  <div>
                    <Label className="text-sm font-medium">
                      {t("productImageFor") || "Product Image for"} {color.name}
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleColorDataChange(color.id, "image", file)
                      }}
                      className="mt-2"
                    />
                    {entry?.image instanceof File && (
                      <p className="text-xs text-green-600 mt-1">
                        {t("imageSelected") || "Image selected"}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">
                      {t("priceFor") || "Price for"} {color.name}
                    </Label>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={typeof entry?.price === "string" ? entry.price : ""}
                      onChange={e => handleColorDataChange(color.id, "price", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}