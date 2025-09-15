"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Edit, Users, DollarSign } from "lucide-react"
import type { About, CreateAbout, Currency, CreateCurrency } from "@/lib/types"
import { authService } from "@/lib/auth"
import Loader from "@/components/ui/loader"
import { useTranslation } from 'next-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AboutManagement() {
  const { t } = useTranslation()
  const [aboutData, setAboutData] = useState<About[]>([])
  const [currencyData, setCurrencyData] = useState<Currency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)
  const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = useState(false)
  const [editingAboutItem, setEditingAboutItem] = useState<About | null>(null)
  const [editingCurrencyItem, setEditingCurrencyItem] = useState<Currency | null>(null)
  const [aboutFormData, setAboutFormData] = useState<CreateAbout>({
    happy_clients: 0,
    product_type: 0,
    experience: 0,
  })
  const [currencyFormData, setCurrencyFormData] = useState<CreateCurrency>({
    name_uz: "",
    name_en: "",
    name_ru: "",
  })
  const { toast } = useToast()

  const fetchAboutData = async () => {
    try {
      const response = await authService.makeAuthenticatedRequest("/about/")
      if (response.ok) {
        const data = await response.json()
        setAboutData(data)
      } else {
        throw new Error("Failed to fetch about data")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: t("aboutManagement.messages.error.fetch"),
        variant: "destructive",
      })
    }
  }

  const fetchCurrencyData = async () => {
    try {
      const response = await authService.makeAuthenticatedRequest("/currency/")
      if (response.ok) {
        const data = await response.json()
        setCurrencyData(data)
      } else {
        throw new Error("Failed to fetch currency data")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: t("currencyManagement.messages.error.fetch"),
        variant: "destructive",
      })
    }
  }

  const fetchAllData = async () => {
    setIsLoading(true)
    await Promise.all([fetchAboutData(), fetchCurrencyData()])
    setIsLoading(false)
  }

  const handleAboutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingAboutItem) {
        // Update existing about item
        const response = await authService.makeAuthenticatedRequest(`/about/${editingAboutItem.id}/`, {
          method: "PUT",
          body: JSON.stringify(aboutFormData),
        })

        if (response.ok) {
          const updatedItem = await response.json()
          const updatedData = aboutData.map((item) => (item.id === editingAboutItem.id ? updatedItem : item))
          setAboutData(updatedData)
          toast({
            title: "Success",
            description: t("aboutManagement.messages.success.updated"),
          })
        } else {
          throw new Error("Failed to update about")
        }
      } else {
        // Create new about item
        const response = await authService.makeAuthenticatedRequest("/about/", {
          method: "POST",
          body: JSON.stringify(aboutFormData),
        })

        if (response.ok) {
          const newItem = await response.json()
          setAboutData([...aboutData, newItem])
          toast({
            title: "Success",
            description: t("aboutManagement.messages.success.created"),
          })
        } else {
          throw new Error("Failed to create about")
        }
      }

      setIsAboutDialogOpen(false)
      setEditingAboutItem(null)
      setAboutFormData({ happy_clients: 0, product_type: 0, experience: 0 })
    } catch (error) {
      toast({
        title: "Error",
        description: t("aboutManagement.messages.error.general"),
        variant: "destructive",
      })
    }
  }

  const handleCurrencySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingCurrencyItem) {
        // Update existing currency item
        const response = await authService.makeAuthenticatedRequest(`/edit-currency/${editingCurrencyItem.id}/`, {
          method: "PUT",
          body: JSON.stringify(currencyFormData),
        })

        if (response.ok) {
          const updatedItem = await response.json()
          const updatedData = currencyData.map((item) => (item.id === editingCurrencyItem.id ? updatedItem : item))
          setCurrencyData(updatedData)
          toast({
            title: "Success",
            description: t("currencyManagement.messages.success.updated"),
          })
        } else {
          throw new Error("Failed to update currency")
        }
      } else {
        // Create new currency item
        const response = await authService.makeAuthenticatedRequest("/currencies/", {
          method: "POST",
          body: JSON.stringify(currencyFormData),
        })

        if (response.ok) {
          const newItem = await response.json()
          setCurrencyData([...currencyData, newItem])
          toast({
            title: "Success",
            description: t("currencyManagement.messages.success.created"),
          })
        } else {
          throw new Error("Failed to create currency")
        }
      }

      setIsCurrencyDialogOpen(false)
      setEditingCurrencyItem(null)
      setCurrencyFormData({ name_uz: "", name_en: "", name_ru: "" })
    } catch (error) {
      toast({
        title: "Error",
        description: t("currencyManagement.messages.error.general"),
        variant: "destructive",
      })
    }
  }

  const handleAboutEdit = (item: About) => {
    setEditingAboutItem(item)
    setAboutFormData({
      happy_clients: item.happy_clients,
      product_type: item.product_type,
      experience: item.experience,
    })
    setIsAboutDialogOpen(true)
  }

  const handleCurrencyEdit = (item: Currency) => {
    setEditingCurrencyItem(item)
    setCurrencyFormData({
      name_uz: item.name_uz,
      name_en: item.name_en,
      name_ru: item.name_ru,
    })
    setIsCurrencyDialogOpen(true)
  }

  const handleAboutDelete = async (id: number) => {
    if (confirm(t("aboutManagement.messages.confirmDelete"))) {
      try {
        const response = await authService.makeAuthenticatedRequest(`/about/${id}/`, {
          method: "DELETE",
        })

        if (response.ok) {
          setAboutData(aboutData.filter((item) => item.id !== id))
          toast({
            title: "Success",
            description: t("aboutManagement.messages.success.deleted"),
          })
        } else {
          throw new Error("Failed to delete about")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: t("aboutManagement.messages.error.delete"),
          variant: "destructive",
        })
      }
    }
  }

  const handleCurrencyDelete = async (id: number) => {
    if (confirm(t("currencyManagement.messages.confirmDelete"))) {
      try {
        const response = await authService.makeAuthenticatedRequest(`/currencies/${id}/`, {
          method: "DELETE",
        })

        if (response.ok) {
          setCurrencyData(currencyData.filter((item) => item.id !== id))
          toast({
            title: "Success",
            description: t("currencyManagement.messages.success.deleted"),
          })
        } else {
          throw new Error("Failed to delete currency")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: t("currencyManagement.messages.error.delete"),
          variant: "destructive",
        })
      }
    }
  }

  const openAboutCreateDialog = () => {
    setEditingAboutItem(null)
    setAboutFormData({ happy_clients: 0, product_type: 0, experience: 0 })
    setIsAboutDialogOpen(true)
  }

  const openCurrencyCreateDialog = () => {
    setEditingCurrencyItem(null)
    setCurrencyFormData({ name_uz: "", name_en: "", name_ru: "" })
    setIsCurrencyDialogOpen(true)
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  if (isLoading) {
    return <Loader />
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-slide-in">
          <h1 className="text-xl md:text-3xl font-bold text-foreground flex items-center gap-3 my-4">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            {t("aboutManagement.title")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("aboutManagement.description")}</p>
        </div>

        {/* Tabs for About and Currency Management */}
        <Tabs defaultValue="about" className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <TabsList className="mb-4">
            <TabsTrigger value="about">{t("aboutManagement.tabs.about")}</TabsTrigger>
            <TabsTrigger value="currency">{t("aboutManagement.tabs.currency")}</TabsTrigger>
          </TabsList>

          {/* About Tab Content */}
          <TabsContent value="about">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("aboutManagement.sections")}</CardTitle>
                  <CardDescription>{t("aboutManagement.sectionsDescription")}</CardDescription>
                </div>
                {/* <Button onClick={openAboutCreateDialog}>
                  {t("aboutManagement.actions.create")}
                </Button> */}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("aboutManagement.table.id")}</TableHead>
                      <TableHead>{t("aboutManagement.table.happyClients")}</TableHead>
                      <TableHead>{t("aboutManagement.table.productTypes")}</TableHead>
                      <TableHead>{t("aboutManagement.table.experience")}</TableHead>
                      <TableHead className="text-right">{t("aboutManagement.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aboutData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {t("aboutManagement.table.noData")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      aboutData.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className="animate-fade-in hover:bg-muted/50 transition-colors"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              {item.happy_clients.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                              {item.product_type}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                              {item.experience}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAboutEdit(item)}
                                className="hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Currency Tab Content */}
          <TabsContent value="currency">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    {t("currencyManagement.title")}
                  </CardTitle>
                  <CardDescription>{t("currencyManagement.description")}</CardDescription>
                </div>
                {/* <Button onClick={openCurrencyCreateDialog}>
                  {t("currencyManagement.actions.create")}
                </Button> */}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("currencyManagement.table.id")}</TableHead>
                      <TableHead>{t("currencyManagement.table.nameUz")}</TableHead>
                      <TableHead>{t("currencyManagement.table.nameEn")}</TableHead>
                      <TableHead>{t("currencyManagement.table.nameRu")}</TableHead>
                      <TableHead className="text-right">{t("currencyManagement.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currencyData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {t("currencyManagement.table.noData")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currencyData.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className="animate-fade-in hover:bg-muted/50 transition-colors"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.name_uz}</TableCell>
                          <TableCell>{item.name_en}</TableCell>
                          <TableCell>{item.name_ru}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCurrencyEdit(item)}
                                className="hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* About Dialog */}
        <Dialog open={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingAboutItem 
                  ? t("aboutManagement.editDialog.title") 
                  : t("aboutManagement.createDialog.title")
                }
              </DialogTitle>
              <DialogDescription>
                {editingAboutItem
                  ? t("aboutManagement.editDialog.description")
                  : t("aboutManagement.createDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAboutSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="happy_clients">{t("aboutManagement.fields.happyClients")}</Label>
                <Input
                  id="happy_clients"
                  type="number"
                  value={aboutFormData.happy_clients}
                  onChange={(e) => setAboutFormData({ ...aboutFormData, happy_clients: Number.parseInt(e.target.value) || 0 })}
                  placeholder={t("aboutManagement.fields.happyClientsPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_type">{t("aboutManagement.fields.productTypes")}</Label>
                <Input
                  id="product_type"
                  type="number"
                  value={aboutFormData.product_type}
                  onChange={(e) => setAboutFormData({ ...aboutFormData, product_type: Number.parseInt(e.target.value) || 0 })}
                  placeholder={t("aboutManagement.fields.productTypesPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">{t("aboutManagement.fields.experience")}</Label>
                <Input
                  id="experience"
                  type="number"
                  value={aboutFormData.experience}
                  onChange={(e) => setAboutFormData({ ...aboutFormData, experience: Number.parseInt(e.target.value) || 0 })}
                  placeholder={t("aboutManagement.fields.experiencePlaceholder")}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAboutDialogOpen(false)}>
                  {t("aboutManagement.actions.cancel")}
                </Button>
                <Button type="submit">
                  {editingAboutItem 
                    ? t("aboutManagement.actions.update") 
                    : t("aboutManagement.actions.create")
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Currency Dialog */}
        <Dialog open={isCurrencyDialogOpen} onOpenChange={setIsCurrencyDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCurrencyItem 
                  ? t("currencyManagement.editDialog.title") 
                  : t("currencyManagement.createDialog.title")
                }
              </DialogTitle>
              <DialogDescription>
                {editingCurrencyItem
                  ? t("currencyManagement.editDialog.description")
                  : t("currencyManagement.createDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCurrencySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name_uz">{t("currencyManagement.fields.nameUz")}</Label>
                <Input
                  id="name_uz"
                  value={currencyFormData.name_uz}
                  onChange={(e) => setCurrencyFormData({ ...currencyFormData, name_uz: e.target.value })}
                  placeholder={t("currencyManagement.fields.nameUzPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">{t("currencyManagement.fields.nameEn")}</Label>
                <Input
                  id="name_en"
                  value={currencyFormData.name_en}
                  onChange={(e) => setCurrencyFormData({ ...currencyFormData, name_en: e.target.value })}
                  placeholder={t("currencyManagement.fields.nameEnPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ru">{t("currencyManagement.fields.nameRu")}</Label>
                <Input
                  id="name_ru"
                  value={currencyFormData.name_ru}
                  onChange={(e) => setCurrencyFormData({ ...currencyFormData, name_ru: e.target.value })}
                  placeholder={t("currencyManagement.fields.nameRuPlaceholder")}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCurrencyDialogOpen(false)}>
                  {t("currencyManagement.actions.cancel")}
                </Button>
                <Button type="submit">
                  {editingCurrencyItem 
                    ? t("currencyManagement.actions.update") 
                    : t("currencyManagement.actions.create")
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}