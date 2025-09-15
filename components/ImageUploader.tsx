"use client"

import React from "react"
import { Label } from "./ui/label"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"
import { useTranslation } from 'next-i18next'

interface ImageUploaderProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  imagePreviews: string[]
  onPreviewsChange: (previews: string[]) => void
  productId: number | null
  uploadMode: "immediate" | "delayed"
}

export function ImageUploader({
  images,
  onImagesChange,
  imagePreviews,
  onPreviewsChange,
  productId,
  uploadMode = "delayed",
}: ImageUploaderProps) {
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArr = Array.from(files)

    onImagesChange([...images, ...fileArr])
    const newPreviews = fileArr.map((f) => URL.createObjectURL(f))
    onPreviewsChange([...imagePreviews, ...newPreviews])

    if (uploadMode === "immediate" && productId) {
      await uploadImages(fileArr, productId)
    }
  }

  const uploadImages = async (files: File[], targetProductId: number) => {
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("image", file)
        formData.append("product", targetProductId.toString())

        const token = authService.getAccessToken()

        const res = await apiFetch("/product/create-images/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(JSON.stringify(errData))
        }
      }

      toast({ title: t("imageUploader.uploadSuccess") })
    } catch (err) {
      toast({
        title: t("imageUploader.uploadError"),
        description: (err as Error).message,
        variant: "destructive",
      })
    }
  }

  const removeImageAt = (idx: number) => {
    const newImages = images.filter((_, i) => i !== idx)
    const newPreviews = imagePreviews.filter((_, i) => i !== idx)
    onImagesChange(newImages)
    onPreviewsChange(newPreviews)
  }

  return (
    <div>
      <Label>{t("imageUploader.images")}</Label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="mt-2"
      />

      <div className="flex gap-2 flex-wrap mt-2">
        {imagePreviews.map((src, idx) => (
          <div
            key={idx}
            className="relative w-24 h-24 border rounded overflow-hidden"
          >
            <img
              src={src}
              alt={`preview-${idx}`}
              className="w-full h-full object-cover"
              loading="eager"
            />
            <button
              type="button"
              onClick={() => removeImageAt(idx)}
              className="absolute top-1 right-1 bg-black/40 text-white rounded px-1 text-xs"
            >
              {t("imageUploader.remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
