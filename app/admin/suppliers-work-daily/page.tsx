"use client"

import React, { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { SupplierRequestWithDetails, User, Product, Order } from "@/lib/types"
import { Eye, Calendar, Package, User as UserIcon, Phone, Tag } from "lucide-react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminLayout } from "@/components/admin-layout"

export default function SupplierRequestsTable() {
    const [requests, setRequests] = useState<SupplierRequestWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [orderDialogOpen, setOrderDialogOpen] = useState(false)
    const { toast } = useToast()

    const fetchSupplierRequests = async () => {
        try {
            const response = await authService.makeAuthenticatedRequest("/supplier/supplier-requests/")
            if (!response.ok) throw new Error("Failed to fetch requests")
            const data = await response.json()

            const requestsWithDetails = await Promise.all(
                data.map(async (request: any) => {
                    const [supplierDetails, productDetails, orderDetails] = await Promise.all([
                        fetchSupplierDetails(request.supplier),
                        fetchProductDetails(request.product),
                        fetchOrderDetails(request.orders)
                    ])

                    return {
                        ...request,
                        supplier_details: supplierDetails,
                        product_details: productDetails,
                        order_details: orderDetails
                    }
                })
            )

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

    const fetchProductDetails = async (productId: number): Promise<Product | null> => {
        try {
            const response = await authService.makeAuthenticatedRequest(`/product/${productId}/`)
            if (!response.ok) return null
            return await response.json()
        } catch {
            return null
        }
    }

    const fetchOrderDetails = async (orderIds: number[]): Promise<Order[]> => {
        try {
            const orders = await Promise.all(
                orderIds.map(async (orderId) => {
                    const response = await authService.makeAuthenticatedRequest(`/order/${orderId}/`)
                    if (!response.ok) return null
                    return await response.json()
                })
            )
            return orders.filter(Boolean) as Order[]
        } catch {
            return []
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            p: { label: "Pending", variant: "secondary" as const },
            a: { label: "Accepted", variant: "default" as const },
            r: { label: "Rejected", variant: "destructive" as const }
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

    useEffect(() => {
        fetchSupplierRequests()
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
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-6 w-6" />
                            Supplier Requests
                        </CardTitle>
                        <CardDescription>
                            Manage and view all supplier requests with detailed information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Orders</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    {/* <TableHead className="text-right">Actions</TableHead> */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No supplier requests found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {request.supplier_details?.image ? (
                                                        <img
                                                            src={normalizeImageUrl(request.supplier_details.image)}
                                                            alt={request.supplier_details.full_name}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{request.supplier_details?.full_name || "Unknown Supplier"}</div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {request.supplier_details?.phone_number || "N/A"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {request.product_details?.images?.[0] ? (
                                                        <img
                                                            src={normalizeImageUrl(request.product_details.images[0].image)}
                                                            alt={request.product_details.title}
                                                            className="h-10 w-10 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                            <Package className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium line-clamp-1">
                                                            {request.product_details?.title || "Unknown Product"}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            ${request.product_details?.price || "N/A"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {request.orders.map((orderId) => (
                                                        <Button
                                                            key={orderId}
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewOrder(orderId)}
                                                            className="h-7 text-xs"
                                                        >
                                                            #{orderId}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono font-medium">
                                                {request.total_quantity.toLocaleString()}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(request.created_at), "MMM dd, yyyy")}
                                                </div>
                                            </TableCell>
                                            {/* <TableCell className="text-right">
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                            </TableCell> */}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Order Details Dialog */}
                <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

                                {/* Order Items */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Order Items</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {selectedOrder.items_detail.map((item, index) => (
                                                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                                                    {item.images?.[0] && (
                                                        <img
                                                            src={item.images[0]}
                                                            alt={item.product}
                                                            className="h-16 w-16 object-cover rounded"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="font-medium">{item.product}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Quantity: {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                                                        </div>
                                                        {item.color && (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-sm text-muted-foreground">Color:</span>
                                                                <div
                                                                    className="w-4 h-4 rounded-full border"
                                                                    style={{ backgroundColor: item.color }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium">${parseFloat(item.price).toFixed(2)}</div>
                                                        <div className="text-sm text-muted-foreground">Total</div>
                                                    </div>
                                                </div>
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
                                                {selectedOrder.location.latitude && selectedOrder.location.latitude && (
                                                    <div className="mt-4 flex justify-end">
                                                        <button
                                                            onClick={() => {
                                                                const url = `https://www.google.com/maps?q=${selectedOrder.location.latitude},${selectedOrder.location.longitude}`;
                                                                window.open(url, '_blank');
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            View Location on Map
                                                        </button>
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