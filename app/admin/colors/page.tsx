"use client"

import React, { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { Plus, Edit, Trash2, Palette, Languages } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { useColors } from "@/contexts/ColorsContext"
import { ProductColorData } from "@/lib/types"
import { useTranslation } from 'next-i18next'

function ColorsContent() {
    const { t } = useTranslation()
    const { toast } = useToast()
    const { colors, fetchColors } = useColors()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingColor, setEditingColor] = useState<any | null>(null)
    const [formData, setFormData] = useState({
        name_uz: "",
        name_en: "",
        name_ru: "",
        image: null as File | null
    })
    const [preview, setPreview] = useState<string>("")
    const [selectedColors, setSelectedColors] = useState<ProductColorData[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchColors()
    }, [])
   
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {

            if (!file.name.toLowerCase().endsWith('.webp')) {
                toast({
                    title: t("error"),
                    description: t("onlyWebpAllowed"),
                    variant: "destructive"
                })
                return
            }

            setFormData({ ...formData, image: file })
            setPreview(URL.createObjectURL(file))
        }
    }

    const openCreateDialog = () => {
        setEditingColor(null)
        setFormData({ name_uz: "", name_en: "", name_ru: "", image: null })
        setPreview("")
        setIsDialogOpen(true)
    }

    const openEditDialog = (color: any) => {
        console.log("Editing color:", color) 
        setEditingColor(color)

        setFormData({
            name_uz: color.name_uz ?? "",
            name_en: color.name_en ?? "",
            name_ru: color.name_ru ?? "",
            image: null,  // keep consistent type
        })

        setPreview(color.image || "")
        setIsDialogOpen(true)
    }
    const handleSubmit = async () => {
        if (!formData.name_uz.trim() || !formData.name_en.trim() || !formData.name_ru.trim()) {
            toast({
                title: t("error"),
                description: t("allNamesRequired"),
                variant: "destructive"
            })
            return
        }

        try {
            const formDataToSend = new FormData()
            formDataToSend.append("name_uz", formData.name_uz)
            formDataToSend.append("name_en", formData.name_en)
            formDataToSend.append("name_ru", formData.name_ru)

            if (formData.image instanceof File) {
                formDataToSend.append("image", formData.image)
            }

            if (editingColor) {
                // Use the correct API endpoint for updating
                const response = await authService.makeAuthenticatedRequest(`/product/detail-color/${editingColor.id}/`, {
                    method: "PUT",
                    body: formDataToSend,
                })

                if (response.ok) {
                    toast({ title: t("success"), description: t("colorUpdated") })
                } else {
                    throw new Error("Update failed")
                }
            } else {
                // Use the correct API endpoint for creating
                const response = await authService.makeAuthenticatedRequest("/product/create-color/", {
                    method: "POST",
                    body: formDataToSend,
                })

                if (response.ok) {
                    toast({ title: t("success"), description: t("colorCreated") })
                } else {
                    throw new Error("Create failed")
                }
            }

            setIsDialogOpen(false)
            fetchColors() // Refresh the list
        } catch {
            toast({ title: t("error"), description: t("failedToSaveColor"), variant: "destructive" })
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm(t("confirmDeleteColor"))) return
        try {
            // Use the correct API endpoint for deleting
            const response = await authService.makeAuthenticatedRequest(`/product/detail-color/${id}/`, {
                method: "DELETE",
            })

            if (response.ok) {
                toast({ title: t("success"), description: t("colorDeleted") })
                fetchColors()
            } else {
                throw new Error("Delete failed")
            }
        } catch {
            toast({ title: t("error"), description: t("failedToDeleteColor"), variant: "destructive" })
        }
    }

    const getDisplayName = (color: any) => {
        return color.name_en || color.name_uz || color.name_ru || color.name || "Untitled"
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between">
                    <div>
                        <h1 className="text-[24px] md:text-3xl font-bold flex items-center gap-3">
                            <Palette className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                            {t("colorManagement.title")}
                        </h1>
                        <p className="text-muted-foreground my-2">{t("colorManagement.description")}</p>
                    </div>
                    <Button onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" /> {t("colorManagement.addColor")}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("colorManagement.colorList")}</CardTitle>
                        <CardDescription>{t("colorManagement.manageColorsHere")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("ID")}</TableHead>
                                    <TableHead>{t("colorManagement.preview")}</TableHead>
                                    <TableHead>{t("colorManagement.name")}</TableHead>
                                    <TableHead className="text-right">{t("colorManagement.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {colors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            {t("colorManagement.noColors")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    colors.map((color) => (
                                        <TableRow key={color.id}>
                                            <TableCell>{color.id}</TableCell>
                                            <TableCell>
                                                <div className="w-8 h-8 rounded overflow-hidden border">
                                                    <Image
                                                        src={color.image || "/placeholder.svg"}
                                                        alt={getDisplayName(color)}
                                                        width={32}
                                                        height={32}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{getDisplayName(color)}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {color.name_uz && (
                                                            <span>
                                                                {t("categoryManagement.languages.uz")}: {color.name_uz}
                                                            </span>
                                                        )}
                                                        {color.name_en && (
                                                            <span>
                                                                {color.name_uz && " | "}
                                                                {t("categoryManagement.languages.en")}: {color.name_en}
                                                            </span>
                                                        )}
                                                        {color.name_ru && (
                                                            <span>
                                                                {(color.name_uz || color.name_en) && " | "}
                                                                {t("categoryManagement.languages.ru")}: {color.name_ru}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right flex gap-2 justify-end">
                                                <Button size="sm" variant="outline" onClick={() => openEditDialog(color)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleDelete(color.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Dialog for Create/Edit */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingColor ? t("colorManagement.title") : t("colorManagement.title")}
                            </DialogTitle>
                            <DialogDescription>
                                {editingColor
                                    ? t("colorManagement.description")
                                    : t("colorManagement.description")}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Tabs defaultValue="en" className="w-full">
                                <TabsList className="grid grid-cols-3 w-full">
                                    <TabsTrigger value="en" className="flex items-center gap-2">
                                        <Languages className="h-4 w-4" /> {t("categoryManagement.languages.en")}
                                    </TabsTrigger>
                                    <TabsTrigger value="uz" className="flex items-center gap-2">
                                        <Languages className="h-4 w-4" /> {t("categoryManagement.languages.uz")}
                                    </TabsTrigger>
                                    <TabsTrigger value="ru" className="flex items-center gap-2">
                                        <Languages className="h-4 w-4" /> {t("categoryManagement.languages.ru")}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="en" className="space-y-4 mt-4">
                                    <div>
                                        <Label htmlFor="name_en">{t("categoryManagement.fields.nameEn")}</Label>
                                        <Input
                                            id="name_en"
                                            value={formData.name_en}
                                            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                            placeholder={t("categoryManagement.fields.nameEn")}
                                            required
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="uz" className="space-y-4 mt-4">
                                    <div>
                                        <Label htmlFor="name_uz">{t("categoryManagement.fields.nameUz")}</Label>
                                        <Input
                                            id="name_uz"
                                            value={formData.name_uz}
                                            onChange={(e) => setFormData({ ...formData, name_uz: e.target.value })}
                                            placeholder={t("categoryManagement.fields.nameUz")}
                                            required
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="ru" className="space-y-4 mt-4">
                                    <div>
                                        <Label htmlFor="name_ru">{t("categoryManagement.fields.nameRu")}</Label>
                                        <Input
                                            id="name_ru"
                                            value={formData.name_ru}
                                            onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                                            placeholder={t("categoryManagement.fields.nameRu")}
                                            required
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div>
                                <Label htmlFor="image">{t("colorManagement.addImage")}</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept=".webp"
                                    onChange={handleFileChange}
                                />
                                {preview && (
                                    <div className="relative w-full h-32 border rounded mt-2 overflow-hidden">
                                        <Image src={preview} alt="Preview" fill className="object-cover" />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    {t("cancel")}
                                </Button>
                                <Button onClick={handleSubmit}>
                                    {editingColor ? t("update") : t("create")}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    )
}

export default function ColorsPage() {
    return <ColorsContent />
}