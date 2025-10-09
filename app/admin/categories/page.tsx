"use client";

import React from "react";
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Tags, Languages } from "lucide-react";
import Image from "next/image";
import { authService } from "@/lib/auth";
import Loader from "@/components/ui/loader";
import { useTranslation } from "next-i18next";

type Supplier = {
  id: number;
  role: string;
  full_name: string;
  phone_number: string;
  image: string | null;
  auth_type: string | null;
  is_active: boolean;
  date_joined: string;
  assigned_categories: {
    id: number;
    name: string;
  }[];
};

type Category = {
  id: number;
  name: string | null;
  name_uz: string | null;
  name_en: string | null;
  name_ru: string | null;
  slug: string;
  supplier: {
    id: number;
    full_name: string;
    phone_number: string;
  };
  image: string;
};

type CreateCategory = {
  name_uz: string;
  name_en: string;
  name_ru: string;
  supplier: number;
  image: File | string;
};

type FormErrors = {
  name_uz?: string;
  name_en?: string;
  name_ru?: string;
  supplier?: string;
  image?: string;
  non_field_errors?: string;
};

export default function CategoryManagement() {
  const { t } = useTranslation();
  const [categoryData, setCategoryData] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuppliersLoading, setIsSuppliersLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategory>({
    name_uz: "",
    name_en: "",
    name_ru: "",
    supplier: 0,
    image: "",
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const normalizeImageUrl = (url: string) => {
    if (!url) return "/placeholder.svg";
    if (url.startsWith("http")) return url;
    return `https://warehouseats.pythonanywhere.com${url}?t=${Date.now()}`;
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const response = await authService.makeAuthenticatedRequest(
        "/user/supplier/"
      );

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      } else {
        throw new Error("Failed to fetch suppliers");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      });
    } finally {
      setIsSuppliersLoading(false);
    }
  };

  const fetchCategoryData = async () => {
    setIsLoading(true);
    try {
      const response = await authService.makeAuthenticatedRequest(
        "/product/categories/"
      );
      if (response.ok) {
        const data = await response.json();
        setCategoryData(data);
      } else {
        throw new Error("Failed to fetch category data");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: t("categoryManagement.messages.error.fetch"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setFormData({ ...formData, image: file });

      // Clear image error when new image is selected
      if (errors.image) {
        setErrors({ ...errors, image: undefined });
      }
    }
  };

  const handleSupplierChange = (value: string) => {
    const supplierId = parseInt(value);
    setFormData({ ...formData, supplier: supplierId });

    // Clear supplier error when supplier is selected
    if (errors.supplier) {
      setErrors({ ...errors, supplier: undefined });
    }
  };

  const clearError = (fieldName: keyof FormErrors) => {
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate supplier selection
    if (!formData.supplier || formData.supplier === 0) {
      setErrors({ supplier: "Please select a supplier" });
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name_uz", formData.name_uz);
      formDataToSend.append("name_en", formData.name_en);
      formDataToSend.append("name_ru", formData.name_ru);
      formDataToSend.append("supplier", formData.supplier.toString());

      if (formData.image instanceof File) {
        formDataToSend.append("image", formData.image);
      } else if (formData.image && formData.image !== editingItem?.image) {
        // Handle base64 image if needed (only if it's different from the existing one)
        const response = await fetch(formData.image as string);
        const blob = await response.blob();
        formDataToSend.append("image", blob, "image.png");
      }

      const endpoint = editingItem
        ? `/product/categories/${editingItem.id}/`
        : "/product/categories/";
      const method = editingItem ? "PUT" : "POST";

      const response = await authService.makeAuthenticatedRequest(endpoint, {
        method,
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        if (editingItem) {
          setCategoryData(
            categoryData.map((item) =>
              item.id === editingItem.id
                ? { ...result, image: normalizeImageUrl(result.image) }
                : item
            )
          );
          toast({
            title: "Success",
            description: t("categoryManagement.messages.success.updated"),
          });
        } else {
          setCategoryData([
            ...categoryData,
            { ...result, image: normalizeImageUrl(result.image) },
          ]);
          toast({
            title: "Success",
            description: t("categoryManagement.messages.success.created"),
          });
        }
        setIsDialogOpen(false);
        resetForm();
        fetchSuppliers();
        fetchCategoryData();
      } else {
        const errorData = await response.json();
        console.log("Backend error response:", errorData);

        const newErrors: FormErrors = {};

        // Handle non_field_errors (like "This Category already exists")
        if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
          newErrors.non_field_errors = errorData.non_field_errors[0];
        }

        // Handle field-specific errors
        if (errorData.name_en && errorData.name_en.length > 0) {
          newErrors.name_en = errorData.name_en[0];
        }
        if (errorData.name_uz && errorData.name_uz.length > 0) {
          newErrors.name_uz = errorData.name_uz[0];
        }
        if (errorData.name_ru && errorData.name_ru.length > 0) {
          newErrors.name_ru = errorData.name_ru[0];
        }
        if (errorData.supplier && errorData.supplier.length > 0) {
          newErrors.supplier = errorData.supplier[0];
        }
        if (errorData.image && errorData.image.length > 0) {
          newErrors.image = errorData.image[0];
        }

        setErrors(newErrors);

        // If no specific errors found, show generic error
        if (Object.keys(newErrors).length === 0) {
          toast({
            title: "Error",
            description: `HTTP ${response.status}: ${JSON.stringify(errorData)}`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Category submission error:", error);
      toast({
        title: "Error",
        description: t(
          editingItem
            ? "categoryManagement.messages.error.update"
            : "categoryManagement.messages.error.create"
        ),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name_uz: "",
      name_en: "",
      name_ru: "",
      supplier: 0,
      image: "",
    });
    setImagePreview("");
    setErrors({});
  };

  const handleEdit = (item: Category) => {
    setEditingItem(item);
    setFormData({
      name_uz: item.name_uz || "",
      name_en: item.name_en || "",
      name_ru: item.name_ru || "",
      supplier: item.supplier.id,
      image: item.image,
    });
    setImagePreview(normalizeImageUrl(item.image));
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t("categoryManagement.messages.confirmDelete"))) {
      try {
        const response = await authService.makeAuthenticatedRequest(
          `/product/categories/${id}/`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setCategoryData(categoryData.filter((item) => item.id !== id));
          toast({
            title: "Success",
            description: t("categoryManagement.messages.success.deleted"),
          });
        } else {
          throw new Error("Failed to delete");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: t("categoryManagement.messages.error.delete"),
          variant: "destructive",
        });
      }
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Helper function to get display name (fallback to English if available)
  const getDisplayName = (item: Category) => {
    return (
      item.name_en || item.name_uz || item.name_ru || item.name || "Untitled"
    );
  };

  // Helper function to get supplier name by ID
  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? `${supplier.full_name} (${supplier.phone_number})` : `Supplier #${supplierId}`;
  };

  useEffect(() => {
    fetchSuppliers();
    fetchCategoryData();
  }, []);

  if (isLoading || isSuppliersLoading) {
    return <Loader />;
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-slide-in flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-[24px] md:text-3xl font-bold flex items-center gap-3">
              <Tags className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              {t("categoryManagement.title")}
            </h1>
            <p className="flex justify-center md:justify-start text-muted-foreground my-2">
              {t("categoryManagement.description")}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {t("categoryManagement.actions.addCategory")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem
                    ? t("categoryManagement.editDialog.title")
                    : t("categoryManagement.createDialog.title")}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? t("categoryManagement.editDialog.description")
                    : t("categoryManagement.createDialog.description")}
                </DialogDescription>
              </DialogHeader>

              {/* General errors display */}
              {errors.non_field_errors && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm font-medium">{errors.non_field_errors}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                        onChange={(e) => {
                          setFormData({ ...formData, name_en: e.target.value });
                          clearError('name_en');
                        }}
                        placeholder={t("categoryManagement.fields.nameEnPlaceholder")}
                        required
                        className={errors.name_en ? "border-red-500" : ""}
                      />
                      {errors.name_en && (
                        <p className="text-red-500 text-sm mt-1">{errors.name_en}</p>
                      )}
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
                        onChange={(e) => {
                          setFormData({ ...formData, name_uz: e.target.value });
                          clearError('name_uz');
                        }}
                        placeholder={t("categoryManagement.fields.nameUzPlaceholder")}
                        required
                        className={errors.name_uz ? "border-red-500" : ""}
                      />
                      {errors.name_uz && (
                        <p className="text-red-500 text-sm mt-1">{errors.name_uz}</p>
                      )}
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
                        onChange={(e) => {
                          setFormData({ ...formData, name_ru: e.target.value });
                          clearError('name_ru');
                        }}
                        placeholder={t("categoryManagement.fields.nameRuPlaceholder")}
                        required
                        className={errors.name_ru ? "border-red-500" : ""}
                      />
                      {errors.name_ru && (
                        <p className="text-red-500 text-sm mt-1">{errors.name_ru}</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Supplier Selector */}
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select
                    value={formData.supplier.toString()}
                    onValueChange={handleSupplierChange}
                    required
                  >
                    <SelectTrigger className={errors.supplier ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.full_name} ({supplier.phone_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supplier && (
                    <p className="text-red-500 text-sm mt-1">{errors.supplier}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="image">
                    {t("categoryManagement.fields.image")}
                  </Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={errors.image ? "border-red-500" : ""}
                  />
                  {errors.image && (
                    <p className="text-red-500 text-sm mt-1">{errors.image}</p>
                  )}
                  {imagePreview && (
                    <div className="relative w-full h-32 border rounded mt-2 overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    {t("categoryManagement.actions.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>
                        {t("categoryManagement.actions.processing")}
                      </>
                    ) : (
                      editingItem
                        ? t("categoryManagement.actions.update")
                        : t("categoryManagement.actions.create")
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("categoryManagement.list")}</CardTitle>
            <CardDescription>
              {t("categoryManagement.listDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("categoryManagement.table.id")}</TableHead>
                    <TableHead>{t("categoryManagement.table.name")}</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>{t("categoryManagement.table.slug")}</TableHead>
                    <TableHead>{t("categoryManagement.table.image")}</TableHead>
                    <TableHead className="text-right">
                      {t("categoryManagement.table.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {t("categoryManagement.table.noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    categoryData.map((cat, i) => (
                      <TableRow
                        key={cat.id}
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <TableCell>{cat.id}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {getDisplayName(cat)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {cat.name_uz && (
                                <span>
                                  {t("categoryManagement.table.languageLabels.uz")}
                                  : {cat.name_uz}
                                </span>
                              )}
                              {cat.name_en && (
                                <span>
                                  {cat.name_uz && " | "}
                                  {t("categoryManagement.table.languageLabels.en")}
                                  : {cat.name_en}
                                </span>
                              )}
                              {cat.name_ru && (
                                <span>
                                  {(cat.name_uz || cat.name_en) && " | "}
                                  {t("categoryManagement.table.languageLabels.ru")}
                                  : {cat.name_ru}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {cat?.supplier?.full_name} ({cat?.supplier?.phone_number})
                        </TableCell>
                        <TableCell>{cat.slug}</TableCell>
                        <TableCell>
                          <div className="relative w-16 h-10 border rounded overflow-hidden">
                            <Image
                              src={normalizeImageUrl(cat.image)}
                              alt={getDisplayName(cat)}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(cat)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(cat.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Grid Preview */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("categoryManagement.gallery")}</CardTitle>
              <CardDescription>
                {t("categoryManagement.galleryDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryData.map((cat) => (
                  <div
                    key={cat.id}
                    className="relative aspect-video border rounded-lg overflow-hidden group"
                  >
                    <Image
                      src={normalizeImageUrl(cat.image)}
                      alt={getDisplayName(cat)}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-0 w-full bg-black/70 text-white p-3">
                      <div className="font-medium">{getDisplayName(cat)}</div>
                      <div className="text-xs opacity-80 mt-1">
                        Supplier: {cat?.supplier?.full_name}
                      </div>
                      <div className="text-xs opacity-80 mt-1">
                        {cat.name_uz && (
                          <div>
                            {t("categoryManagement.table.languageLabels.uz")}:{" "}
                            {cat.name_uz}
                          </div>
                        )}
                        {cat.name_en && (
                          <div>
                            {t("categoryManagement.table.languageLabels.en")}:{" "}
                            {cat.name_en}
                          </div>
                        )}
                        {cat.name_ru && (
                          <div>
                            {t("categoryManagement.table.languageLabels.ru")}:{" "}
                            {cat.name_ru}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}