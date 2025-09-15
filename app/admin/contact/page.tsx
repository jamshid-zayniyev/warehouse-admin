"use client"

import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, Eye, Trash2, Search, Filter, Mail, Calendar, User } from "lucide-react"
import type { Contact } from "@/lib/types"
import { authService } from "@/lib/auth"
import Loader from "@/components/ui/loader"
import { useTranslation } from 'next-i18next'

export default function ContactManagement() {
  const { t } = useTranslation()
  const [contactData, setContactData] = useState<Contact[]>([])
  const [filteredData, setFilteredData] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Contact | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTheme, setFilterTheme] = useState("all")
  const { toast } = useToast()

  // Fetch contact messages from API
  const fetchContactData = async () => {
    setIsLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/about/contact/")
      if (response.ok) {
        const data: Contact[] = await response.json()
        setContactData(data)
        setFilteredData(data)
      } else {
        throw new Error("Failed to fetch contact messages")
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("contactManagement.toasts.error.fetch"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewMessage = (contact: Contact) => {
    setSelectedMessage(contact)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm(t("contactManagement.actions.deleteConfirm"))) {
      try {
        const response = await authService.makeAuthenticatedRequest(`/about/contact/${id}/`, {
          method: "DELETE",
        })
        if (response.ok) {
          const updatedData = contactData.filter((item) => item.id !== id)
          setContactData(updatedData)
          setFilteredData(updatedData)
          toast({
            title: t("common.success"),
            description: t("contactManagement.toasts.success.delete"),
          })
        } else {
          throw new Error("Failed to delete message")
        }
      } catch (error) {
        toast({
          title: t("common.error"),
          description: t("contactManagement.toasts.error.delete"),
          variant: "destructive",
        })
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getThemeColor = (theme: string) => {
    switch (theme.toLowerCase()) {
      case "general inquiry":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "technical support":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "partnership":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "feedback":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const uniqueThemes = Array.from(new Set(contactData.map((item) => item.theme)))

  // Filter & search
  useEffect(() => {
    let filtered = contactData
    if (filterTheme !== "all") filtered = filtered.filter((item) => item.theme === filterTheme)
    if (searchTerm)
      filtered = filtered.filter(
        (item) =>
          item.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.message.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    setFilteredData(filtered)
  }, [contactData, filterTheme, searchTerm])

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
              <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              {t("contactManagement.title")}
            </h1>
            <p className="text-muted-foreground mt-2">{t("contactManagement.description")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="animate-slide-in" style={{ animationDelay: "0.1s" }}>
              {t("contactManagement.messagesCount", { count: filteredData.length })}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t("contactManagement.filters.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("contactManagement.filters.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="sm:w-48">
                <Select value={filterTheme} onValueChange={setFilterTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("contactManagement.filters.filterTheme")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("contactManagement.filters.allThemes")}</SelectItem>
                    {uniqueThemes.map((theme) => (
                      <SelectItem key={theme} value={theme}>
                        {theme}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages Table */}
        <Card className="animate-slide-in" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <CardTitle>{t("contactManagement.table.title")}</CardTitle>
            <CardDescription>{t("contactManagement.table.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("contactManagement.table.headers.contact")}</TableHead>
                    <TableHead>{t("contactManagement.table.headers.theme")}</TableHead>
                    <TableHead>{t("contactManagement.table.headers.messagePreview")}</TableHead>
                    <TableHead>{t("contactManagement.table.headers.date")}</TableHead>
                    <TableHead className="text-right">{t("contactManagement.table.headers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchTerm || filterTheme !== "all"
                          ? t("contactManagement.table.noResults.filtered")
                          : t("contactManagement.table.noResults.empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className="animate-fade-in hover:bg-muted/50 transition-colors"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {item.first_name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {item.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getThemeColor(item.theme)} variant="secondary">
                            {item.theme}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm">{item.message}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(item.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewMessage(item)}
                              className="hover:bg-accent hover:text-accent-foreground transition-colors"
                              title={t("contactManagement.actions.view")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              title={t("contactManagement.actions.delete")}
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

        {/* Message Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t("contactManagement.dialog.title")}
              </DialogTitle>
              <DialogDescription>
                {t("contactManagement.dialog.description", { name: selectedMessage?.first_name })}
              </DialogDescription>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t("contactManagement.dialog.fields.name")}</Label>
                    <p className="font-medium">{selectedMessage.first_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t("contactManagement.dialog.fields.email")}</Label>
                    <p className="font-medium">{selectedMessage.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t("contactManagement.dialog.fields.theme")}</Label>
                    <Badge className={getThemeColor(selectedMessage.theme)} variant="secondary">
                      {selectedMessage.theme}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t("contactManagement.dialog.fields.date")}</Label>
                    <p className="font-medium">{formatDate(selectedMessage.created_at)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t("contactManagement.dialog.fields.message")}</Label>
                  <div className="mt-2 p-4 bg-background border border-border rounded-lg">
                    <p className="text-sm leading-relaxed">{selectedMessage.message}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t("contactManagement.dialog.buttons.close")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedMessage.email)
                      toast({ 
                        title: t("common.copied"), 
                        description: t("contactManagement.toasts.error.copyEmail") 
                      })
                    }}
                  >
                    {t("contactManagement.dialog.buttons.copyEmail")}
                  </Button>
                  <Button
                    onClick={() => {
                      window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.theme}`
                    }}
                  >
                    {t("contactManagement.dialog.buttons.reply")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}