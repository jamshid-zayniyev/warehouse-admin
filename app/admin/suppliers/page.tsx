"use client"

import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Users, Eye, Trash2, Search, Phone, UserIcon, ImageIcon, Edit, Plus, Shield } from "lucide-react"
import type { User } from "@/lib/types"
import { authService } from "@/lib/auth"
import Loader from "@/components/ui/loader"
import { useTranslation } from 'next-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SupplierManagement() {
  const { t } = useTranslation();
  const [userData, setUserData] = useState<User[]>([])
  const [filteredData, setFilteredData] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ full_name: "", })
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    full_name: "",
    phone_number: "",
    password: "",
  })
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<User | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const fetchUserData = async () => {
    setIsLoading(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/user/supplier/")
      if (response.ok) {
        const data: User[] = await response.json()
        setUserData(data)
        setFilteredData(data)
      } else {
        throw new Error("Failed to fetch users")
      }
    } catch (error) {
      toast({
        title: t('userManagement.error'),
        description: t('userManagement.failedFetch'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({ full_name: user.full_name })
    setIsEditDialogOpen(true)
  }

  const handleCreateUser = async () => {
    try {
      const response = await authService.makeAuthenticatedRequest(`/user/supplier/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      })

      if (response.ok) {
        const newUser = await response.json()
        const updatedData = [...userData, newUser]
        setUserData(updatedData)
        setFilteredData(updatedData)
        
        // Store the newly created user and open verification dialog
        setNewlyCreatedUser(newUser)
        setIsCreateDialogOpen(false)
        setIsVerifyDialogOpen(true)
        
        // Reset create form but keep password for potential retry
        setCreateForm(prev => ({ ...prev, full_name: "", phone_number: "" }))
        
        toast({
          title: t('userManagement.userCreated'),
          description: t('userManagement.verificationRequired'),
        })
      } else {
        throw new Error("Failed to create user")
      }
    } catch (error) {
      toast({
        title: t('userManagement.error'),
        description: t('userManagement.failedCreate'),
        variant: "destructive",
      })
    }
  }

  const handleVerifyUser = async () => {
    if (!newlyCreatedUser || !verificationCode.trim()) {
      toast({
        title: t('userManagement.error'),
        description: t('userManagement.enterVerificationCode'),
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    try {
      const response = await authService.makeAuthenticatedRequest("/user/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: verificationCode,
          user: newlyCreatedUser.id
        }),
      })

      if (response.ok) {
        toast({
          title: t('userManagement.verificationSuccess'),
          description: t('userManagement.userVerified'),
        })
        setIsVerifyDialogOpen(false)
        setVerificationCode("")
        setNewlyCreatedUser(null)
        
        // Refresh user data to get updated verification status
        fetchUserData()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Verification failed")
      }
    } catch (error) {
      toast({
        title: t('userManagement.verificationFailed'),
        description: error instanceof Error ? error.message : t('userManagement.verificationError'),
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    try {
      const response = await authService.makeAuthenticatedRequest(`/user/${editingUser.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: editForm.full_name,
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        const updatedData = userData.map((user) => (user.id === editingUser.id ? { ...user, ...updatedUser } : user))
        setUserData(updatedData)
        setFilteredData(updatedData)
        setIsEditDialogOpen(false)
        toast({
          title: t('userManagement.userUpdated'),
          description: t('userManagement.userUpdated'),
        })
      } else {
        throw new Error("Failed to update user")
      }
    } catch (error) {
      toast({
        title: t('userManagement.error'),
        description: t('userManagement.failedUpdate'),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm(t('userManagement.deleteConfirm'))) {
      try {
        const response = await authService.makeAuthenticatedRequest(`/user/${id}/`, {
          method: "DELETE",
        })

        if (response.ok) {
          const updatedData = userData.filter((item) => item.id !== id)
          setUserData(updatedData)
          setFilteredData(updatedData)
          toast({
            title: t('userManagement.userDeleted'),
            description: t('userManagement.userDeleted'),
          })
        } else {
          throw new Error("Failed to delete user")
        }
      } catch (error) {
        toast({
          title: t('userManagement.error'),
          description: t('userManagement.failedDelete'),
          variant: "destructive",
        })
      }
    }
  }

  useEffect(() => {
    let filtered = userData
    if (searchTerm)
      filtered = filtered.filter(
        (item) =>
          item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.phone_number.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    setFilteredData(filtered)
  }, [userData, searchTerm])

  useEffect(() => {
    fetchUserData()
  }, [])

  if (isLoading) {
    return <Loader />
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="animate-slide-in flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-foreground flex items-center gap-3 my-4">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              {t('userManagement.title')}
            </h1>
            <p className="text-muted-foreground mt-2">{t('userManagement.description')}</p>
          </div>
          <div className="flex items-center gap-2 my-4">
            <Badge variant="secondary" className="animate-slide-in" style={{ animationDelay: "0.1s" }}>
              {filteredData.length} {t('userManagement.usersCount')}
            </Badge>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> {t('userManagement.createUser')}
            </Button>
          </div>
        </div>

        <Card className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t('userManagement.searchUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('userManagement.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-in" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <CardTitle>{t('userManagement.users')}</CardTitle>
            <CardDescription>{t('userManagement.allUsers')}</CardDescription>
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
                    <TableHead>{t('userManagement.user')} - Bozor Nomi</TableHead>
                    <TableHead>{t('userManagement.phoneNumber')}</TableHead>
                    <TableHead>{t('userManagement.profileImage')}</TableHead>
                    <TableHead className="text-right">{t('userManagement.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? t('userManagement.noUsersMatch') : t('userManagement.noUsersFound')}
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
                          <div className="font-medium flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            {item.full_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {item.phone_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-3 w-3 text-muted-foreground" />
                            {item.image ? (
                              <Badge variant="secondary">{t('userManagement.hasImage')}</Badge>
                            ) : (
                              <Badge variant="outline">{t('userManagement.noImage')}</Badge>
                            )}
                          </div>
                        </TableCell>
                       
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUser(item)}
                              className="hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(item)}
                              className="hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
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

        {/* User Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('userManagement.userDetails')}
              </DialogTitle>
              <DialogDescription>{t('userManagement.profileInfo')} {selectedUser?.full_name} </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('userManagement.id')}</Label>
                    <p className="font-medium">{selectedUser.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('userManagement.fullName')}</Label>
                    <p className="font-medium">{selectedUser.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('userManagement.phoneNumber')}</Label>
                    <p className="font-medium">{selectedUser.phone_number}</p>
                  </div>
                 
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('userManagement.profileImage')}</Label>
                    <p className="font-medium">{selectedUser.image ? t('userManagement.available') : t('userManagement.notSet')}</p>
                  </div>
                </div>

                {selectedUser.image && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('userManagement.profileImage')}</Label>
                    <div className="mt-2 p-4 bg-background border border-border rounded-lg">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t('userManagement.close')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedUser.phone_number)
                      toast({ title: t('userManagement.copied'), description: t('userManagement.phoneCopied') })
                    }}
                  >
                    {t('userManagement.copyPhone')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" /> {t('userManagement.createUser')}
              </DialogTitle>
              <DialogDescription>{t('userManagement.addNewUser')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">{t('userManagement.fullName')} - Bozor Nomi</Label>
                <Input
                  id="full_name"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder='Zilola Shavkatova - Yangi Bozor'
                />
              </div>
              
              <div>
                <Label htmlFor="phone_number">{t('userManagement.phoneNumber')}</Label>
                <Input
                  id="phone_number"
                  value={createForm.phone_number}
                  onChange={(e) => setCreateForm({ ...createForm, phone_number: e.target.value })}
                  placeholder={t('userManagement.enterPhoneNumber')}
                />
              </div>
              <div>
                <Label htmlFor="password">{t('userManagement.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder={t('userManagement.enterPassword')}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('userManagement.cancel')}
                </Button>
                <Button onClick={handleCreateUser}>{t('userManagement.create')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Verification Dialog */}
        <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('userManagement.verifyUser')}
              </DialogTitle>
              <DialogDescription>
                {t('userManagement.verificationRequiredDesc')}
              </DialogDescription>
            </DialogHeader>

            {newlyCreatedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('userManagement.userId')}</Label>
                    <p className="font-medium">{newlyCreatedUser.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('userManagement.fullName')}</Label>
                    <p className="font-medium">{newlyCreatedUser.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('userManagement.phoneNumber')}</Label>
                    <p className="font-medium">{newlyCreatedUser.phone_number}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="verificationCode">{t('userManagement.verificationCode')}</Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder={t('userManagement.enterVerificationCode')}
                    disabled={isVerifying}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsVerifyDialogOpen(false)
                      setVerificationCode("")
                      setNewlyCreatedUser(null)
                    }}
                    disabled={isVerifying}
                  >
                    {t('userManagement.cancel')}
                  </Button>
                  <Button 
                    onClick={handleVerifyUser}
                    disabled={isVerifying || !verificationCode.trim()}
                  >
                    {isVerifying ? t('userManagement.verifying') : t('userManagement.verify')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                {t('userManagement.editUser')}
              </DialogTitle>
              <DialogDescription>{t('userManagement.updateUser')}</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">{t('userManagement.fullName')}</Label>
                  <Input
                    id="full_name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder={t('userManagement.enterFullName')}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    {t('userManagement.cancel')}
                  </Button>
                  <Button onClick={handleSaveEdit}>{t('userManagement.saveChanges')}</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}