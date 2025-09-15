"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Phone, Mail, MapPin, Clock, X } from "lucide-react"
import type { OurContact, CreateOurContact } from "@/lib/types"
import { authService } from "@/lib/auth"
import Loader from "@/components/ui/loader"
import { useTranslation } from 'next-i18next'

interface LocalizedContact {
  id: number
  address: string
  address_uz: string
  address_ru: string
  address_en: string
  working_time: string
  working_time_uz: string
  working_time_ru: string
  working_time_en: string
  phone_numbers: string[]
  emails: string[]
}

interface CreateLocalizedContact extends Omit<CreateOurContact, 'address' | 'working_time'> {
  address_uz: string
  address_ru: string
  address_en: string
  working_time_uz: string
  working_time_ru: string
  working_time_en: string
}

export default function OurContactManagement() {
  const { t } = useTranslation() // Add this hook
  const [contactData, setContactData] = useState<LocalizedContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LocalizedContact | null>(null)
  const [formData, setFormData] = useState<CreateLocalizedContact>({
    address_uz: "",
    address_ru: "",
    address_en: "",
    phone_numbers: [],
    emails: [],
    working_time_uz: "",
    working_time_ru: "",
    working_time_en: "",
  })
  const { toast } = useToast()

  const fetchContactData = async () => {
    setIsLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/about/our-contact/")
      if (response.ok) {
        const data = await response.json()
        // Agar API dan bitta address va working_time kelsa, ularni 3 tilga tarqatish
        const localizedData = data.map((item: LocalizedContact) => ({
          ...item,
          address_uz: item.address_uz || "",
          address_ru: item.address_ru || "",
          address_en: item.address_en || "",
          working_time_uz: item.working_time_uz || "",
          working_time_ru: item.working_time_ru || "",
          working_time_en: item.working_time_en || "",
        }))
        setContactData(localizedData)
      } else {
        throw new Error("Failed to fetch contact info")
      }
    } catch {
      toast({
        title: t("OurContactCommon.error"),
        description: t("OurcontactManagement.errors.fetchFailed"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Backendga yuborish uchun ma'lumotlarni tayyorlash
      const submitData = {
        ...formData,
        // Agar backend hali ham bitta address va working_time kutayotgan bo'lsa
        address_uz: formData.address_uz,
        address_ru: formData.address_ru,
        address_en: formData.address_en,
        working_time_uz: formData.working_time_uz,
        working_time_ru: formData.working_time_ru,
        working_time_en: formData.working_time_en,
      }

      if (editingItem) {
        const response = await authService.makeAuthenticatedRequest(`/about/our-contact/${editingItem.id}/`, {
          method: "PUT",
          body: JSON.stringify(submitData),
        })

        if (response.ok) {
          const updatedItem = await response.json()
          // Yangilangan ma'lumotni 3 tilga tarqatish
          const localizedItem = {
            ...updatedItem,
            address_uz: formData.address_uz,
            address_ru: formData.address_ru,
            address_en: formData.address_en,
            working_time_uz: formData.working_time_uz,
            working_time_ru: formData.working_time_ru,
            working_time_en: formData.working_time_en,
          }
          console.log(localizedItem);

          setContactData(contactData.map((item) => (item.id === editingItem.id ? localizedItem : item)))
          toast({ 
            title: t("OurContactCommon.success"), 
            description: t("OurcontactManagement.success.updated") 
          })
        } else {
          throw new Error("Update failed")
        }
      } else {
        const response = await authService.makeAuthenticatedRequest("/about/our-contact/", {
          method: "POST",
          body: JSON.stringify(submitData),
        })

        if (response.ok) {
          const newItem = await response.json()
          // Yangi ma'lumotni 3 tilga tarqatish
          const localizedItem = {
            ...newItem,
            address_uz: formData.address_uz,
            address_ru: formData.address_ru,
            address_en: formData.address_en,
            working_time_uz: formData.working_time_uz,
            working_time_ru: formData.working_time_ru,
            working_time_en: formData.working_time_en,
          }
          setContactData([...contactData, localizedItem])
          toast({ 
            title: t("OurContactCommon.success"), 
            description: t("OurcontactManagement.success.created") 
          })
        } else {
          throw new Error("Create failed")
        }
      }

      setIsDialogOpen(false)
      resetForm()
    } catch {
      toast({
        title: t("OurContactCommon.error"),
        description: editingItem ? t("OurcontactManagement.errors.updateFailed") : t("OurcontactManagement.errors.createFailed"),
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: LocalizedContact) => {
    setEditingItem(item)
    setFormData({
      address_uz: item.address_uz,
      address_ru: item.address_ru,
      address_en: item.address_en,
      phone_numbers: item.phone_numbers.map((p) => p),
      emails: item.emails.map((e) => e),
      working_time_uz: item.working_time_uz,
      working_time_ru: item.working_time_ru,
      working_time_en: item.working_time_en,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t("OurcontactManagement.deleteConfirmation"))) return
    try {
      const response = await authService.makeAuthenticatedRequest(`/about/our-contact/${id}/`, {
        method: "DELETE",
      })

      if (response.ok) {
        setContactData(contactData.filter((item) => item.id !== id))
        toast({ 
          title: t("OurContactCommon.success"), 
          description: t("OurcontactManagement.success.deleted") 
        })
      } else {
        throw new Error("Delete failed")
      }
    } catch {
      toast({ 
        title: t("OurContactCommon.error"), 
        description: t("OurcontactManagement.errors.deleteFailed"), 
        variant: "destructive" 
      })
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      address_uz: "",
      address_ru: "",
      address_en: "",
      phone_numbers: [],
      emails: [],
      working_time_uz: "",
      working_time_ru: "",
      working_time_en: ""
    })
  }

  const addPhoneNumber = () => setFormData({ ...formData, phone_numbers: [...formData.phone_numbers, ''] })
  const removePhoneNumber = (i: number) => setFormData({ ...formData, phone_numbers: formData.phone_numbers.filter((_, idx) => idx !== i) })
  const updatePhoneNumber = (i: number, val: string) => {
    const updated = [...formData.phone_numbers]
    updated[i] = val
    setFormData({ ...formData, phone_numbers: updated })
  }

  const addEmail = () => setFormData({ ...formData, emails: [...formData.emails, ''] })
  const removeEmail = (i: number) => setFormData({ ...formData, emails: formData.emails.filter((_, idx) => idx !== i) })
  const updateEmail = (i: number, val: string) => {
    const updated = [...formData.emails]
    updated[i] = val
    setFormData({ ...formData, emails: updated })
  }

  useEffect(() => {
    fetchContactData()
  }, [])

  if (isLoading) {
    return (
      <Loader />
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-slide-in flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-foreground flex items-center gap-3 my-4">
              <Phone className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              {t("OurcontactManagement.title")}
            </h1>
            <p className="text-muted-foreground mt-2">{t("OurcontactManagement.description")}</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? t("OurcontactManagement.editContactInfo") : t("OurcontactManagement.createContactInfo")}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? t("OurcontactManagement.editDescription")
                    : t("OurcontactManagement.createDescription")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Address - 3 ta input bir-biri ostida */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <Label>{t("OurcontactManagement.address")}</Label>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="address_uz" className="text-sm">{t("OurcontactManagement.languages.uzbek")}</Label>
                      <Textarea
                        id="address_uz"
                        value={formData.address_uz}
                        onChange={(e) => setFormData({ ...formData, address_uz: e.target.value })}
                        placeholder={t("OurcontactManagement.placeholders.addressUz")}
                        rows={2}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_ru" className="text-sm">{t("OurcontactManagement.languages.russian")}</Label>
                      <Textarea
                        id="address_ru"
                        value={formData.address_ru}
                        onChange={(e) => setFormData({ ...formData, address_ru: e.target.value })}
                        placeholder={t("OurcontactManagement.placeholders.addressRu")}
                        rows={2}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_en" className="text-sm">{t("OurcontactManagement.languages.english")}</Label>
                      <Textarea
                        id="address_en"
                        value={formData.address_en}
                        onChange={(e) => setFormData({ ...formData, address_en: e.target.value })}
                        placeholder={t("OurcontactManagement.placeholders.addressEn")}
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t("OurcontactManagement.phoneNumbers")}</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPhoneNumber}>
                      <Plus className="h-4 w-4 mr-1" />
                      {t("OurcontactManagement.addPhone")}
                    </Button>
                  </div>
                  {formData.phone_numbers.map((phone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          value={phone}
                          onChange={(e) => updatePhoneNumber(index, e.target.value)}
                          placeholder={t("OurcontactManagement.placeholders.phoneNumber")}
                          required
                        />
                      </div>
                      {formData.phone_numbers.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePhoneNumber(index)}
                          className="px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Email Addresses */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t("OurcontactManagement.emailAddresses")}</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addEmail}>
                      <Plus className="h-4 w-4 mr-1" />
                      {t("OurcontactManagement.addEmail")}
                    </Button>
                  </div>
                  {formData.emails.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => updateEmail(index, e.target.value)}
                          placeholder={t("OurcontactManagement.placeholders.emailAddress")}
                          required
                        />
                      </div>
                      {formData.emails.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEmail(index)}
                          className="px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Working Time - 3 ta input bir-biri ostida */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <Label>{t("OurcontactManagement.workingHours")}</Label>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="working_time_uz" className="text-sm">{t("OurcontactManagement.languages.uzbek")}</Label>
                      <Input
                        id="working_time_uz"
                        value={formData.working_time_uz}
                        onChange={(e) => setFormData({ ...formData, working_time_uz: e.target.value })}
                        placeholder={t("OurcontactManagement.placeholders.workingTimeUz")}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="working_time_ru" className="text-sm">{t("OurcontactManagement.languages.russian")}</Label>
                      <Input
                        id="working_time_ru"
                        value={formData.working_time_ru}
                        onChange={(e) => setFormData({ ...formData, working_time_ru: e.target.value })}
                        placeholder={t("OurcontactManagement.placeholders.workingTimeRu")}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="working_time_en" className="text-sm">{t("OurcontactManagement.languages.english")}</Label>
                      <Input
                        id="working_time_en"
                        value={formData.working_time_en}
                        onChange={(e) => setFormData({ ...formData, working_time_en: e.target.value })}
                        placeholder={t("OurcontactManagement.placeholders.workingTimeEn")}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t("OurContactCommon.cancel")}
                  </Button>
                  <Button type="submit">
                    {editingItem ? t("OurContactCommon.update") : t("OurContactCommon.create")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Contact Information Cards */}
        <div className="space-y-6">
          {isLoading ? (
            <Card className="animate-slide-in" style={{ animationDelay: "0.3s" }}>
              <CardContent className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : contactData.length === 0 ? (
            <Card className="animate-slide-in" style={{ animationDelay: "0.3s" }}>
              <CardContent className="text-center py-8">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">{t("OurcontactManagement.noContactInfo")}</h3>
                <p className="text-muted-foreground mb-4">{t("OurcontactManagement.noContactInfoDescription")}</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("OurcontactManagement.addContactInfo")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            contactData.map((item, index) => (
              <Card
                key={item.id}
                className="animate-slide-in hover:shadow-lg transition-all duration-200"
                style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {t("OurcontactManagement.contactInfoNumber", { id: item.id })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {t("OurcontactManagement.address")}
                    </div>
                    <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md mt-1">{item.address}</p>
                  </div>

                  {/* Phone Numbers */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {t("OurcontactManagement.phoneNumbers")} ({item.phone_numbers.length})
                    </div>
                    <div className="pl-6 space-y-1">
                      {item.phone_numbers.map((phone, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {phone}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Email Addresses */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {t("OurcontactManagement.emailAddresses")} ({item.emails.length})
                    </div>
                    <div className="pl-6 space-y-1">
                      {item.emails.map((email, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {email}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Working Time - 3 ta versiya bir-biri ostida */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {t("OurcontactManagement.workingHours")}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("OurcontactManagement.languages.english")}</Label>
                        <p className="text-sm bg-muted/30 p-3 rounded-md mt-1">{item.working_time}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}