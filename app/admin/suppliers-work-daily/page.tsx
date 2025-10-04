"use client"

import React, { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Category, Product, SupplierRequestWithDetails, User } from "@/lib/types"
import { Eye, Calendar, Package, User as UserIcon, Phone, Tag, CalendarIcon, RotateCcw, X, ChevronDown, ChevronUp, CheckCircle, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminLayout } from "@/components/admin-layout"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import OrderItemRow from "@/components/OrderItemRow"

export default function SupplierRequestsTable() {
    const [requests, setRequests] = useState<SupplierRequestWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [orderDialogOpen, setOrderDialogOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [datePickerOpen, setDatePickerOpen] = useState(false)
    const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
    const [successDialogOpen, setSuccessDialogOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<SupplierRequestWithDetails | null>(null)
    const [suppliers, setSuppliers] = useState<User[]>([])
    const [reassignLoading, setReassignLoading] = useState(false)
    const [rejectLoading, setRejectLoading] = useState(false)
    const [successLoading, setSuccessLoading] = useState(false)
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
    const [reassignForm, setReassignForm] = useState({
        new_supplier: "",
        quantity: "0",
        buy_price: ""
    })
    const [successForm, setSuccessForm] = useState({
        buy_price: ""
    })
    const [categories, setCategories] = useState<Category[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [selectedCategory, setSelectedCategory] = useState("")
    const [selectedProduct, setSelectedProduct] = useState("")
    const [newProductQuantity, setNewProductQuantity] = useState("")
    const [addProductLoading, setAddProductLoading] = useState(false)
    const { toast } = useToast()

    // Yangi funksiyalar
    const fetchCategories = async () => {
        try {
            const response = await authService.makeAuthenticatedRequest("/product/categories/")
            if (!response.ok) throw new Error("Failed to fetch categories")
            const data = await response.json()
            setCategories(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch categories",
                variant: "destructive",
            })
        }
    }

    const fetchProductsByCategory = async (categoryId: number) => {
        if (!categoryId) {
            setProducts([])
            return
        }

        try {
            const response = await authService.makeAuthenticatedRequest(`/product/category/${categoryId}/products/`)
            if (!response.ok) throw new Error("Failed to fetch products")
            const data = await response.json()
            setProducts(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch products",
                variant: "destructive",
            })
        }
    }

    const handleAddProduct = async () => {
        if (!selectedProduct || !newProductQuantity) {
            toast({
                title: "Error",
                description: "Please select product and enter quantity",
                variant: "destructive"
            })
            return
        }

        const quantity = parseInt(newProductQuantity)
        if (quantity <= 0) {
            toast({
                title: "Error",
                description: "Quantity must be greater than 0",
                variant: "destructive"
            })
            return
        }

        setAddProductLoading(true)
        try {
            const response = await authService.makeAuthenticatedRequest(
                `/supplier/supplier-requests/add-product/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        order_id: selectedOrder.id,
                        product_id: parseInt(selectedProduct),
                        quantity: quantity
                    })
                }
            )

            if (!response.ok) throw new Error("Failed to add product")

            toast({
                title: "Success",
                description: "Product added to order successfully",
            })

            // Formani tozalash
            setSelectedCategory("")
            setSelectedProduct("")
            setNewProductQuantity("")
            setProducts([])

            // Order ma'lumotlarini yangilash
            const updatedOrderResponse = await authService.makeAuthenticatedRequest(`/order/${selectedOrder.id}/`)
            if (updatedOrderResponse.ok) {
                const updatedOrder = await updatedOrderResponse.json()
                setSelectedOrder(updatedOrder)
            }

            // Supplier requestlarni yangilash
            fetchSupplierRequests()

        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add product to order",
                variant: "destructive"
            })
        } finally {
            setAddProductLoading(false)
        }
    }

  

    // Format date for API endpoint (YYYY/MM/DD)
    const formatDateForAPI = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}/${month}/${day}`
    }

    const fetchSupplierRequests = async (date?: Date) => {
        try {
            const targetDate = date || selectedDate
            const dateString = formatDateForAPI(targetDate)

            const response = await authService.makeAuthenticatedRequest(`/supplier/supplier-requests/${dateString}/`)
            if (!response.ok) throw new Error("Failed to fetch requests")
            const data = await response.json()

            const requestsWithDetails = await Promise.all(
                data.map(async (request: any) => {
                    const [supplierDetails, productDetails, orderDetails, newSupplierDetails] = await Promise.all([
                        fetchSupplierDetails(request.supplier),
                        fetchProductDetails(request.product),
                        fetchOrderDetails(request.orders),
                        request.new_supplier ? fetchSupplierDetails(request.new_supplier) : Promise.resolve(null)
                    ])

                    return {
                        ...request,
                        supplier_details: supplierDetails,
                        product_details: productDetails,
                        order_details: orderDetails,
                        new_supplier_details: newSupplierDetails
                    }
                })
            )
            console.log(requestsWithDetails);

            setRequests(requestsWithDetails)

        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load supplier requests",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchSupplierDetails = async (supplierId: number): Promise<User | null> => {
        try {
            const response = await authService.makeAuthenticatedRequest(`/user/${supplierId}/`)
            if (!response.ok) return null
            return await response.json()
        } catch {
            return null
        }
    }

    const fetchProductDetails = async (productId: number): Promise<any | null> => {
        try {
            const response = await authService.makeAuthenticatedRequest(`/product/${productId}/`)
            if (!response.ok) return null
            return await response.json()
        } catch {
            return null
        }
    }

    const fetchOrderDetails = async (orderIds: number[]): Promise<any[]> => {
        try {
            const orders = await Promise.all(
                orderIds.map(async (orderId) => {
                    const response = await authService.makeAuthenticatedRequest(`/order/${orderId}/`)
                    if (!response.ok) return null
                    return await response.json()
                })
            )
            return orders.filter(Boolean) as any[]
        } catch {
            return []
        }
    }

    const fetchSuppliers = async () => {
        try {
            const response = await authService.makeAuthenticatedRequest(`/user/supplier/`)
            if (!response.ok) throw new Error("Failed to fetch suppliers")
            const data = await response.json()
            // Filter out the current supplier from the list
            if (selectedRequest?.supplier) {
                const filteredSuppliers = data.filter((supplier: User) => supplier.id !== selectedRequest.supplier)
                setSuppliers(filteredSuppliers)
            } else {
                setSuppliers(data)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load suppliers",
                variant: "destructive"
            })
        }
    }

    const handleSuccess = (request: SupplierRequestWithDetails) => {
        setSelectedRequest(request)
        setSuccessForm({
            buy_price: ""
        })
        setSuccessDialogOpen(true)
    }

    const handleSuccessSubmit = async () => {
        if (!selectedRequest) return

        if (!successForm.buy_price) {
            toast({
                title: "Error",
                description: "Please enter buy price",
                variant: "destructive"
            })
            return
        }

        const buyPrice = parseFloat(successForm.buy_price)
        if (buyPrice < 0) {
            toast({
                title: "Error",
                description: "Buy price must be greater than 0",
                variant: "destructive"
            })
            return
        }

        setSuccessLoading(true)
        try {
            const response = await authService.makeAuthenticatedRequest(
                `/supplier/supplier-request/${selectedRequest.id}/success/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        buy_price: buyPrice.toString()
                    })
                }
            )

            if (!response.ok) throw new Error("Failed to mark request as success")

            toast({
                title: "Success",
                description: "Request marked as successful",
            })

            setSuccessDialogOpen(false)
            setSelectedRequest(null)
            fetchSupplierRequests() // Refresh the list
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to mark request as success",
                variant: "destructive"
            })
        } finally {
            setSuccessLoading(false)
        }
    }

    const handleReassign = (request: SupplierRequestWithDetails) => {
        setSelectedRequest(request)
        setReassignForm({
            new_supplier: "",
            quantity: "0",
            buy_price: ""
        })
        // Fetch suppliers after setting selectedRequest to ensure we can filter out current supplier
        fetchSuppliers()
        setReassignDialogOpen(true)
    }

    const handleReassignSubmit = async () => {
        if (!selectedRequest) return

        if (!reassignForm.new_supplier || !reassignForm.quantity || !reassignForm.buy_price) {
            toast({
                title: "Error",
                description: "Please fill all required fields",
                variant: "destructive"
            })
            return
        }

        const quantity = parseInt(reassignForm.quantity)
        const buyPrice = parseFloat(reassignForm.buy_price)
        if (quantity < 0 || buyPrice < 0) {
            toast({
                title: "Error",
                description: "Quantity and buy price must be greater than 0",
                variant: "destructive"
            })
            return
        }

        setReassignLoading(true)
        try {
            const response = await authService.makeAuthenticatedRequest(
                `/supplier/supplier-requests/${selectedRequest.id}/reassign/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        new_supplier: parseInt(reassignForm.new_supplier),
                        quantity: quantity,
                        buy_price: buyPrice.toString()
                    })
                }
            )

            if (!response.ok) throw new Error("Failed to reassign request")

            toast({
                title: "Success",
                description: "Request reassigned successfully",
            })

            setReassignDialogOpen(false)
            setSelectedRequest(null)
            fetchSupplierRequests() // Refresh the list
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reassign request",
                variant: "destructive"
            })
        } finally {
            setReassignLoading(false)
        }
    }

    const handleReject = async (requestId: number) => {
        setRejectLoading(true)
        try {
            const response = await authService.makeAuthenticatedRequest(
                `/supplier/supplier-requests/${requestId}/reject/`,
                {
                    method: 'POST'
                }
            )

            if (!response.ok) throw new Error("Failed to reject request")

            toast({
                title: "Success",
                description: "Request rejected successfully",
            })

            fetchSupplierRequests() // Refresh the list
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reject request",
                variant: "destructive"
            })
        } finally {
            setRejectLoading(false)
        }
    }

    const getStatusBadge = (request: SupplierRequestWithDetails) => {
        const { status, new_supplier, amount_received } = request

        if (status === 'pt' && new_supplier !== null && typeof new_supplier === 'number') {
            return <Badge variant="outline">Partial</Badge>
        }

        const statusConfig = {
            p: { label: "Pending", variant: "secondary" as const },
            s: { label: "Success", variant: "default" as const },
            r: { label: "Rejected", variant: "destructive" as const },
            pt: { label: "Partial", variant: "outline" as const }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.p
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const normalizeImageUrl = (url?: string) => {
        if (!url) return "/placeholder.svg"
        if (url.startsWith("http")) return url
        return `https://warehouseats.pythonanywhere.com${url}`
    }

    const handleViewOrder = async (orderId: number) => {
        try {
            const response = await authService.makeAuthenticatedRequest(`/order/${orderId}/`)
            if (!response.ok) throw new Error("Failed to fetch order")
            const order = await response.json()
            setSelectedOrder(order)
            setOrderDialogOpen(true)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load order details",
                variant: "destructive"
            })
        }
    }

    const handleDateChange = (date: Date) => {
        setSelectedDate(date)
        setDatePickerOpen(false)
        setLoading(true)
        fetchSupplierRequests(date)
    }

    const toggleRowExpansion = (requestId: number) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(requestId)) {
            newExpanded.delete(requestId)
        } else {
            newExpanded.add(requestId)
        }
        setExpandedRows(newExpanded)
    }

    // Quick date selection options
    const quickDateOptions = [
        { label: "Today", value: "today", date: new Date() },
        { label: "Yesterday", value: "yesterday", date: new Date(new Date().setDate(new Date().getDate() - 1)) },
        { label: "Last 7 days", value: "last7", date: new Date(new Date().setDate(new Date().getDate() - 7)) },
        { label: "Last 30 days", value: "last30", date: new Date(new Date().setDate(new Date().getDate() - 30)) },
    ]

    useEffect(() => {
        fetchSupplierRequests()
        fetchSupplierRequests()
        fetchCategories() // Kategoriyalarni yuklash
        // Don't fetch suppliers here, fetch when reassign dialog opens
    }, [])



    if (loading) {
        return (
            <AdminLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Requests</CardTitle>
                        <CardDescription>Loading supplier requests...</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[250px]" />
                                        <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-6 my-5">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-6 w-6" />
                                    Supplier Requests
                                </CardTitle>
                                <CardDescription>
                                    Manage and view all supplier requests with detailed information
                                </CardDescription>
                            </div>

                            {/* Date Selection */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Quick Date Selector */}
                                <Select onValueChange={(value) => {
                                    const option = quickDateOptions.find(opt => opt.value === value)
                                    if (option) {
                                        handleDateChange(option.date)
                                    }
                                }}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Quick select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {quickDateOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Custom Date Picker */}
                                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full sm:w-[240px] justify-start text-left font-normal",
                                                !selectedDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        <input
                                            type="date"
                                            value={selectedDate.toISOString().split('T')[0]}
                                            onChange={(e) => handleDateChange(new Date(e.target.value))}
                                            className="w-full sm:w-[240px] p-2 border rounded-md"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Selected Date Info */}
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                    <span>Showing requests for:</span>
                                    <Badge variant="secondary" className="ml-1">
                                        {format(selectedDate, "MMMM d, yyyy")}
                                    </Badge>
                                </div>
                                <span className="text-muted-foreground sm:ml-2">
                                    ({requests.length} requests found)
                                </span>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table className="min-w-[800px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="whitespace-nowrap">Supplier</TableHead>
                                            <TableHead className="whitespace-nowrap">Product</TableHead>
                                            <TableHead className="whitespace-nowrap">Total Qty</TableHead>
                                            <TableHead className="whitespace-nowrap">Status</TableHead>
                                            <TableHead className="whitespace-nowrap">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No supplier requests found for {format(selectedDate, "MMMM d, yyyy")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            requests.map((request) => (
                                                <React.Fragment key={request.id}>
                                                    <TableRow className="hover:bg-muted/50">
                                                        <TableCell className="py-3">
                                                            <div className="flex items-center gap-3 min-w-[150px]">
                                                                {request.supplier_details?.image ? (
                                                                    <img
                                                                        src={normalizeImageUrl(request.supplier_details.image)}
                                                                        alt={request.supplier_details.full_name}
                                                                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="font-medium text-sm truncate">
                                                                        {request.supplier_details?.full_name || "Unknown Supplier"}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                                                        <Phone className="h-3 w-3 flex-shrink-0" />
                                                                        {request.supplier_details?.phone_number || "N/A"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            <div className="flex items-center gap-3 min-w-[150px]">
                                                                {request.product_details?.images?.[0] ? (
                                                                    <img
                                                                        src={normalizeImageUrl(request.product_details.images[0].image)}
                                                                        alt={request.product_details.title}
                                                                        className="h-8 w-8 rounded object-cover flex-shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="font-medium text-sm line-clamp-1">
                                                                        {request.product_details?.title || "Unknown Product"}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        ${request.product_details?.price || "N/A"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3 font-mono font-medium text-sm whitespace-nowrap">
                                                            {request.total_quantity.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="py-3 whitespace-nowrap">
                                                            {getStatusBadge(request)}
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => toggleRowExpansion(request.id)}
                                                                    className="h-7 text-xs"
                                                                >
                                                                    {expandedRows.has(request.id) ? (
                                                                        <ChevronUp className="h-3 w-3 mr-1" />
                                                                    ) : (
                                                                        <ChevronDown className="h-3 w-3 mr-1" />
                                                                    )}
                                                                    More
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleSuccess(request)}
                                                                            disabled={request.status !== 'p'}
                                                                        >
                                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                                            Success
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleReassign(request)}
                                                                            disabled={request.status !== 'p'}
                                                                        >
                                                                            <RotateCcw className="h-4 w-4 mr-2" />
                                                                            Reassign
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleReject(request.id)}
                                                                            disabled={request.status !== 'p' || rejectLoading}
                                                                            className="text-destructive"
                                                                        >
                                                                            <X className="h-4 w-4 mr-2" />
                                                                            Reject
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    {expandedRows.has(request.id) && (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="bg-muted/30 p-0">
                                                                <div className="p-4 space-y-4">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div>
                                                                            <h4 className="font-medium text-sm mb-2">Orders</h4>
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {request.orders.map((orderId) => (
                                                                                    <Button
                                                                                        key={orderId}
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() => handleViewOrder(orderId)}
                                                                                        className="h-6 text-xs px-2"
                                                                                    >
                                                                                        #{orderId}
                                                                                    </Button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-medium text-sm mb-2">Amount Information</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-muted-foreground">Amount Received:</span>
                                                                                    <span className="font-medium">
                                                                                        {request.amount_received ? request.amount_received.toLocaleString() : "0"}
                                                                                    </span>
                                                                                </div>
                                                                                {request.status === 'pt' && request.new_supplier && (
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-muted-foreground">Transferred Quantity:</span>
                                                                                        <span className="font-medium">
                                                                                            {request.total_quantity - (request.amount_received || 0)} units
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                                        <div>
                                                                            <span className="text-muted-foreground text-xs">Created Date:</span>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <Calendar className="h-3 w-3" />
                                                                                <span className="text-sm">{format(new Date(request.created_at), "MMM dd, yyyy")}</span>
                                                                            </div>
                                                                        </div>
                                                                        {request.status === 'pt' && request.new_supplier_details && (
                                                                            <div>
                                                                                <span className="text-muted-foreground text-xs">Transferred To:</span>
                                                                                <div className="font-medium text-sm mt-1 flex items-center gap-2">
                                                                                    {request.new_supplier_details.image ? (
                                                                                        <img
                                                                                            src={normalizeImageUrl(request.new_supplier_details.image)}
                                                                                            alt={request.new_supplier_details.full_name}
                                                                                            className="h-4 w-4 rounded-full object-cover"
                                                                                        />
                                                                                    ) : (
                                                                                        <UserIcon className="h-4 w-4" />
                                                                                    )}
                                                                                    {request.new_supplier_details.full_name}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {request.status === 'p' && request.reassigned_from && (
                                                                            <div>
                                                                                <span className="text-muted-foreground text-xs">Reassigned From:</span>
                                                                                <div className="font-medium text-sm mt-1 flex items-center gap-2">
                                                                                    {request.reassigned_from}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Success Dialog */}
                <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Mark Request as Success</DialogTitle>
                            <DialogDescription>
                                Enter the buy price to mark this request as successfully completed.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="buy_price">Buy Price *</Label>
                                <Input
                                    id="buy_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={successForm.buy_price}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        if (value === "" || parseFloat(value) >= 0) {
                                            setSuccessForm(prev => ({ ...prev, buy_price: value }))
                                        }
                                    }}
                                    placeholder="Enter buy price"
                                />
                            </div>
                            {selectedRequest && (
                                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                                    <div className="font-medium">Request Details:</div>
                                    <div>Product: {selectedRequest.product_details?.title}</div>
                                    <div>Quantity: {selectedRequest.total_quantity}</div>
                                    <div>Supplier: {selectedRequest.supplier_details?.full_name}</div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setSuccessDialogOpen(false)}
                                disabled={successLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSuccessSubmit}
                                disabled={successLoading}
                            >
                                {successLoading ? "Processing..." : "Mark as Success"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reassign Dialog */}
                <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Reassign Request</DialogTitle>
                            <DialogDescription>
                                Transfer this request to another supplier with the desired quantity and buy price.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="new_supplier">New Supplier *</Label>
                                <Select
                                    value={reassignForm.new_supplier}
                                    onValueChange={(value) => setReassignForm(prev => ({ ...prev, new_supplier: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                {supplier.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Quantity to Transfer *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={reassignForm.quantity}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        if (value === "" || parseInt(value) >= 0) {
                                            setReassignForm(prev => ({ ...prev, quantity: value }))
                                        }
                                    }}
                                    placeholder="Enter quantity"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Must be greater than 0
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="reassign_buy_price">Buy Price *</Label>
                                <Input
                                    id="reassign_buy_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={reassignForm.buy_price}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        if (value === "" || parseFloat(value) >= 0) {
                                            setReassignForm(prev => ({ ...prev, buy_price: value }))
                                        }
                                    }}
                                    placeholder="Enter buy price"
                                />
                            </div>
                            {selectedRequest && (
                                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                                    <div className="font-medium">Current Request Details:</div>
                                    <div>Product: {selectedRequest.product_details?.title}</div>
                                    <div>Original Quantity: {selectedRequest.total_quantity}</div>
                                    <div>Current Supplier: {selectedRequest.supplier_details?.full_name}</div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setReassignDialogOpen(false)}
                                disabled={reassignLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReassignSubmit}
                                disabled={reassignLoading}
                            >
                                {reassignLoading ? "Reassigning..." : "Reassign Request"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                {/* Order Details Dialog */}
                {/* Order Details Dialog */}
                <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                    <DialogContent className="w-full max-w-lg md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5" />
                                Order Details #{selectedOrder?.id}
                            </DialogTitle>
                            <DialogDescription>
                                Complete information about the selected order
                            </DialogDescription>
                        </DialogHeader>

                        {selectedOrder && (
                            <div className="space-y-6">
                                {/* Order Basic Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Order Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Status:</span>
                                                <Badge variant="outline">{selectedOrder.status}</Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Payment:</span>
                                                <span className="font-medium">{selectedOrder.payment}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Total Price:</span>
                                                <span className="font-medium">${selectedOrder.price}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Customer:</span>
                                                <span className="font-medium">{selectedOrder.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Phone:</span>
                                                <span className="font-medium">{selectedOrder.phone_number}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Date:</span>
                                                <span className="font-medium">
                                                    {format(new Date(selectedOrder.created), "PPP")}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Add Product Section - YANGI QO'SHILGAN QISM */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Add Product to Order</CardTitle>
                                        <CardDescription>
                                            Add additional products to this order
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="category">Category</Label>
                                                <Select
                                                    value={selectedCategory}
                                                    onValueChange={(value) => {
                                                        setSelectedCategory(value)
                                                        fetchProductsByCategory(parseInt(value))
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((category) => (
                                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="product">Product</Label>
                                                <Select
                                                    value={selectedProduct}
                                                    onValueChange={setSelectedProduct}
                                                    disabled={!selectedCategory}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select product" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map((product) => (
                                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                                {product.title_uz || product.title_en || product.title_ru || `Product ${product.id}`}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="quantity">Quantity</Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={newProductQuantity}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        if (value === "" || parseInt(value) >= 1) {
                                                            setNewProductQuantity(value)
                                                        }
                                                    }}
                                                    placeholder="Enter quantity"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleAddProduct}
                                            disabled={!selectedProduct || !newProductQuantity || addProductLoading}
                                            className="mt-4"
                                        >
                                            {addProductLoading ? "Adding..." : "Add Product to Order"}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Order Items */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Order Items</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {selectedOrder.items_detail?.map((item: any, index: number) => (
                                                <OrderItemRow
                                                    key={index}
                                                    item={item}
                                                    order={requests}
                                                    onQuantityUpdate={fetchSupplierRequests}
                                                />
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Location Info */}
                                {selectedOrder.location && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Delivery Location</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Address:</span>
                                                    <span className="font-medium text-right">{selectedOrder.location.fullAddress}</span>
                                                </div>
                                                {selectedOrder.location.latitude && selectedOrder.location.longitude && (
                                                    <div className="mt-4 flex justify-end">
                                                        <Button
                                                            onClick={() => {
                                                                const url = `https://www.google.com/maps?q=${selectedOrder.location.latitude},${selectedOrder.location.longitude}`;
                                                                window.open(url, '_blank');
                                                            }}
                                                        >
                                                            View Location on Map
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    )
}
