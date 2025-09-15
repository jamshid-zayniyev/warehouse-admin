"use client"

import React from "react"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useCategories } from "@/contexts/CategoriesContext"
import { useTranslation } from 'next-i18next'

interface CategorySelectorProps {
  selectedCategory: number
  onCategoryChange: (categoryId: number) => void
}

export function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
  const { categories, loading } = useCategories()
  const {t} = useTranslation()
  if (loading) {
    return (
      <div>
        <Label>{t("Category")}</Label>
        <div className="mt-2 p-2 border rounded bg-gray-50 text-sm text-gray-500">
          {t("loadingCategories")}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Label className="mb-2" htmlFor="category">{t("Category")}</Label>
      <Select
        value={selectedCategory ? selectedCategory.toString() : "0"}
        onValueChange={(val) => onCategoryChange(Number(val))}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("Selectcategory")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">{t("AllCategories")}</SelectItem>

          {/* ✅ Render all categories */}
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
