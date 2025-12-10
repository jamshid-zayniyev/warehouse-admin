"use client";

import React, { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Plus, Edit, Trash2, Palette, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { useColors } from "@/contexts/ColorsContext";
import { ProductColorData } from "@/lib/types";
import { useTranslation } from "next-i18next";

function ColorsContent() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { colors, fetchColors } = useColors();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name_uz: "",
    name_en: "",
    name_ru: "",
    image: null as File | null,
  });
  const [preview, setPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Use a ref to store the file reliably
  const fileRef = useRef<File | null>(null);

  useEffect(() => {
    fetchColors();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file);
    console.log("File type:", file?.type);
    console.log("File name:", file?.name);
    console.log("Is File object?", file instanceof File);
    
    if (file) {
      // Store in ref for reliable access
      fileRef.current = file;
      
      // Also update state for UI
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      console.log("Preview URL created:", previewUrl);
      setPreview(previewUrl);
    }
  };

  const openCreateDialog = () => {
    setEditingColor(null);
    setFormData({ name_uz: "", name_en: "", name_ru: "", image: null });
    setPreview("");
    fileRef.current = null; // Clear the ref
    setIsDialogOpen(true);
  };

  const openEditDialog = (color: any) => {
    console.log("Editing color:", color);
    setEditingColor(color);

    setFormData({
      name_uz: color.name_uz ?? "",
      name_en: color.name_en ?? "",
      name_ru: color.name_ru ?? "",
      image: null,
    });

    setPreview(color.image || "");
    fileRef.current = null; // Clear the ref when editing
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    console.log("=== START handleSubmit ===");
    
    // Check if file exists
    console.log("fileRef.current:", fileRef.current);
    console.log("formData.image:", formData.image);
    
    if (!formData.name_uz.trim() || !formData.name_en.trim() || !formData.name_ru.trim()) {
      toast({
        title: t("error"),
        description: t("allNamesRequired"),
        variant: "destructive",
      });
      return;
    }

    // Check if creating new color and no image is selected
    if (!editingColor && !fileRef.current) {
      toast({
        title: t("error"),
        description: t("colorManagement.imageRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append("name_uz", formData.name_uz);
      formDataToSend.append("name_en", formData.name_en);
      formDataToSend.append("name_ru", formData.name_ru);

      // Add file from ref (more reliable than state)
      if (fileRef.current && fileRef.current instanceof File) {
        console.log("Appending file from ref:", fileRef.current);
        console.log("File details:", {
          name: fileRef.current.name,
          type: fileRef.current.type,
          size: fileRef.current.size,
          lastModified: fileRef.current.lastModified
        });
        
        // Use the third parameter to specify filename
        formDataToSend.append("image", fileRef.current, fileRef.current.name);
      } else if (editingColor && preview && !preview.startsWith('blob:')) {
        // When editing and keeping existing image
        console.log("Keeping existing image:", preview);
      } else {
        console.log("No image to append");
      }

      // Debug: Check FormData contents
      console.log("=== FormData Contents ===");
      let hasFile = false;
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: FILE - ${value.name} (${value.type}, ${value.size} bytes)`);
          hasFile = true;
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      console.log("FormData has file?", hasFile);
      console.log("=========================");

      // Use the authService method that works
      let response;
      
      if (editingColor) {
        console.log(`Updating color ID: ${editingColor.id}`);
        
        response = await authService.makeAuthenticatedRequest(
          `/product/detail-color/${editingColor.id}/`,
          {
            method: "PUT",
            body: formDataToSend,
          }
        );
      } else {
        console.log("Creating new color");
        
        response = await authService.makeAuthenticatedRequest(
          "/product/create-color/",
          {
            method: "POST",
            body: formDataToSend,
          }
        );
      }

      console.log("Response status:", response.status);

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (response.ok) {
        toast({
          title: t("success"),
          description: editingColor ? t("colorUpdated") : t("colorCreated"),
        });
        setIsDialogOpen(false);
        fetchColors();
      } else {
        console.error("Backend error response:", responseData);
        
        // Show specific error message if available
        let errorMessage = t("failedToSaveColor");
        if (responseData.image) {
          errorMessage = responseData.image[0];
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else if (responseData.non_field_errors) {
          errorMessage = responseData.non_field_errors[0];
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error saving color:", error);
      toast({
        title: t("error"),
        description: error.message || t("failedToSaveColor"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
  if (!confirm(t("confirmDeleteColor"))) return;
  try {
    const response = await authService.makeAuthenticatedRequest(
      `/product/detail-color/${id}/`,
      {
        method: "DELETE",
      }
    );

    if (response.ok || response.status === 204) {
      toast({ title: t("success"), description: t("colorDeleted") });
      
      // Option 1: Remove the deleted color from local state immediately
      // This provides instant UI feedback
      // Note: You'll need access to setColors from useColors context
      // If your useColors hook doesn't expose setColors, use Option 2
      
      // Option 2: Refetch all colors from the server
      // This ensures data consistency
      fetchColors();
      
    } else if (response.status === 404) {
      // If the color doesn't exist, still refresh the list
      toast({
        title: t("error"),
        description: "Color not found. It may have already been deleted.",
        variant: "destructive",
      });
      fetchColors(); // Refresh to ensure UI is in sync
    } else {
      throw new Error(`Delete failed with status: ${response.status}`);
    }
  } catch (error: any) {
    console.error("Delete error:", error);
    toast({
      title: t("error"),
      description: error.message || t("failedToDeleteColor"),
      variant: "destructive",
    });
  }
};

  const getDisplayName = (color: any) => {
    return (
      color.name_en ||
      color.name_uz ||
      color.name_ru ||
      color.name ||
      "Untitled"
    );
  };

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
            <p className="text-muted-foreground my-2">
              {t("colorManagement.description")}
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" /> {t("colorManagement.addColor")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("colorManagement.colorList")}</CardTitle>
            <CardDescription>
              {t("colorManagement.manageColorsHere")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ID")}</TableHead>
                  <TableHead>{t("colorManagement.preview")}</TableHead>
                  <TableHead>{t("colorManagement.name")}</TableHead>
                  <TableHead className="text-right">
                    {t("colorManagement.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
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
                          <div className="font-medium">
                            {getDisplayName(color)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {color.name_uz && (
                              <span>
                                {t("categoryManagement.languages.uz")}:{" "}
                                {color.name_uz}
                              </span>
                            )}
                            {color.name_en && (
                              <span>
                                {color.name_uz && " | "}
                                {t("categoryManagement.languages.en")}:{" "}
                                {color.name_en}
                              </span>
                            )}
                            {color.name_ru && (
                              <span>
                                {(color.name_uz || color.name_en) && " | "}
                                {t("categoryManagement.languages.ru")}:{" "}
                                {color.name_ru}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(color)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(color.id)}
                        >
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
                {editingColor ? t("colorManagement.editColor") : t("colorManagement.addColor")}
              </DialogTitle>
              <DialogDescription>
                {editingColor
                  ? t("colorManagement.editDescription")
                  : t("colorManagement.addDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="en" className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />{" "}
                    {t("categoryManagement.languages.en")}
                  </TabsTrigger>
                  <TabsTrigger value="uz" className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />{" "}
                    {t("categoryManagement.languages.uz")}
                  </TabsTrigger>
                  <TabsTrigger value="ru" className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />{" "}
                    {t("categoryManagement.languages.ru")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name_en">
                      {t("categoryManagement.fields.nameEn")}
                    </Label>
                    <Input
                      id="name_en"
                      value={formData.name_en}
                      onChange={(e) =>
                        setFormData({ ...formData, name_en: e.target.value })
                      }
                      placeholder={t("categoryManagement.fields.nameEn")}
                      required
                    />
                  </div>
                </TabsContent>

                <TabsContent value="uz" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name_uz">
                      {t("categoryManagement.fields.nameUz")}
                    </Label>
                    <Input
                      id="name_uz"
                      value={formData.name_uz}
                      onChange={(e) =>
                        setFormData({ ...formData, name_uz: e.target.value })
                      }
                      placeholder={t("categoryManagement.fields.nameUz")}
                      required
                    />
                  </div>
                </TabsContent>

                <TabsContent value="ru" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name_ru">
                      {t("categoryManagement.fields.nameRu")}
                    </Label>
                    <Input
                      id="name_ru"
                      value={formData.name_ru}
                      onChange={(e) =>
                        setFormData({ ...formData, name_ru: e.target.value })
                      }
                      placeholder={t("categoryManagement.fields.nameRu")}
                      required
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label htmlFor="image">
                  {t("colorManagement.addImage")}
                  {!editingColor && " *"}
                </Label>
                <Input
                  id="image"
                  type="file"
                  accept=".webp,image/webp,image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("colorManagement.webpOnly")}
                </p>
                
                {/* File info display */}
                {fileRef.current && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium">Selected file:</div>
                    <div className="text-xs">
                      {fileRef.current.name} ({(fileRef.current.size / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                )}
                
                {preview && (
                  <div className="relative w-full h-32 border rounded mt-2 overflow-hidden">
                    {/* Use img tag for blob URLs */}
                    <img
                      src={preview}
                      alt="Preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  {t("cancel")}
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? t("loading") : editingColor ? t("update") : t("create")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default function ColorsPage() {
  return <ColorsContent />;
}