"use client"

import React from "react"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
// import { useProducts } from "@/contexts/ProductsContext"
import { useTranslation } from 'next-i18next'
import { useProducts } from "@/contexts/ProductContext"
import { Product } from "@/lib/types"

interface ProductSelectorProps {
  selectedProduct: number
  onProductChange: (productId: number) => void
  disabled?: boolean
  className?: string
}

export function ProductSelector({ 
  selectedProduct, 
  onProductChange, 
  disabled = false,
  className = "" 
}: ProductSelectorProps) {
  const { products, loading } = useProducts()
  const { t } = useTranslation()

  // Helper function to get display title
  const getDisplayTitle = (product: Product) => {
    return product.title_en || product.title_uz || product.title_ru || product.title || `Product ${product.id}`
  }

  if (loading) {
    return (
      <div className={className}>
        <Label>{t("Product")}</Label>
        <div className="mt-2 p-2 border rounded bg-gray-50 text-sm text-gray-500">
          {t("loadingProducts")}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Label className="mb-2" htmlFor="product">{t("Product")}</Label>
      <Select
        value={selectedProduct ? selectedProduct.toString() : "0"}
        onValueChange={(val) => onProductChange(Number(val))}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("SelectProduct")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">{t("SelectProduct")}</SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id.toString()}>
              {getDisplayTitle(product)} (ID: {product.id})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}