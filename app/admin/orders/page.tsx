"use client"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import {
    Package, MapPin, CreditCard, Clock, CheckCircle, XCircle, Truck,
    User, Phone, ImageIcon, Eye, X
} from "lucide-react"
import { authService } from "@/lib/auth"
import { Order, OrderCom } from "@/lib/types"
import { AdminLayout } from "@/components/admin-layout"
import Loader from "@/components/ui/loader"
import { useTranslation } from 'next-i18next'

export default function OrdersPage() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<OrderCom | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        async function fetchOrders() {
            try {
                const res = await authService.makeAuthenticatedRequest("/order/all/", {
                    method: "GET",
                })

                if (!res.ok) throw new Error("Failed to fetch orders")

                const data: Order[] = await res.json()
                setOrders(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchOrders()
    }, [])

    async function updateStatus(orderId: number, status: string) {
        try {
            const res = await authService.makeAuthenticatedRequest(`/order/status/${orderId}/`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            })

            if (!res.ok) throw new Error("Failed to update status")

            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status } : o))
            )
        } catch (err) {
            console.error(err)
            alert("Failed to update status")
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'p': return <Clock className="w-4 h-4 text-amber-400" />
            case 's': return <CheckCircle className="w-4 h-4 text-emerald-400" />
            case 'd': return <Truck className="w-4 h-4 text-blue-400" />
            case 'c': return <XCircle className="w-4 h-4 text-red-400" />
            default: return <Clock className="w-4 h-4 text-gray-400" />
        }
    }

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'p': return 'bg-amber-100 text-amber-800'
            case 's': return 'bg-emerald-100 text-emerald-800'
            case 'd': return 'bg-blue-100 text-blue-800'
            case 'c': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        return t(`orders.statuses.${status}` as any, { defaultValue: t('orders.statuses.unknown') });
    }

    const openOrderModal = (order: Order) => {
        setSelectedOrder(order)
        setIsModalOpen(true)
    }

    const closeOrderModal = () => {
        setIsModalOpen(false)
        setSelectedOrder(null)
    }

    if (loading) {
        return (
            <Loader />
        )
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background relative overflow-hidden py-4 md:p-8 ">
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        {t('orders.title')}
                    </h1>
                    <motion.div
                        className="w-24 h-1 bg-primary mx-auto rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: 96 }}
                        transition={{ delay: 0.5, duration: 1 }}
                    />
                </motion.div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.orderId')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.customer')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.phone')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.total')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.status')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.payment')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order, index) => (
                                    <motion.tr
                                        key={order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.phone_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${order.price}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                <span className="ml-1">{getStatusText(order.status)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.payment}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openOrderModal(order)}
                                                    className="flex items-center"
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    {t('orders.view')}
                                                </Button>
                                                <Select
                                                    defaultValue={order.status}
                                                    onValueChange={(val) => updateStatus(order.id, val)}
                                                >
                                                    <SelectTrigger className="w-35 h-8 flex items-center justify-center">
                                                        <SelectValue placeholder={t('orders.status')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="p">{t('orders.statuses.p')}</SelectItem>
                                                        <SelectItem value="s">{t('orders.statuses.s')}</SelectItem>
                                                        <SelectItem value="d">{t('orders.statuses.d')}</SelectItem>
                                                        <SelectItem value="c">{t('orders.statuses.c')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty state */}
                    {orders.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                        >
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                                <Package className="w-12 h-12 text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('orders.noOrders')}</h3>
                            <p className="text-gray-500">{t('orders.noOrdersDescription')}</p>
                        </motion.div>
                    )}
                </div>

                {/* Order Details Modal */}
                {isModalOpen && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-2xl font-bold text-gray-900">{t('orders.orderDetails')} #{selectedOrder.id}</h2>
                                <Button variant="ghost" size="icon" onClick={closeOrderModal}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Customer Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                            <User className="w-5 h-5 mr-2 text-blue-500" />
                                            {t('orders.customerInformation')}
                                        </h3>
                                        <p className="text-gray-800 font-medium">{selectedOrder.name}</p>
                                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                                            <p className="flex items-center">
                                                <Phone className="w-4 h-4 mr-2" />
                                                {selectedOrder.phone_number}
                                            </p>
                                            {selectedOrder.additional_phone_number && (
                                                <p className="flex items-center">
                                                    <Phone className="w-4 h-4 mr-2" />
                                                    {selectedOrder.additional_phone_number}
                                                </p>
                                            )}
                                        </div>

                                        {/* Vaqtni birinchi bo'limga qo'shish */}
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-sm text-gray-800 flex items-center">
                                                {/* <Calendar className="w-4 h-4 mr-2 text-purple-500" /> */}
                                                <span className="font-medium">{t('orders.createdAt')}:</span>
                                                <span className="ml-1">
                                                    {new Date(selectedOrder.created).toLocaleString('uz-UZ', {
                                                        year: 'numeric',
                                                        month: 'numeric',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                            <MapPin className="w-5 h-5 mr-2 text-green-500" />
                                            {t('orders.deliveryInformation')}
                                        </h3>
                                        <p className="text-sm text-gray-600">{selectedOrder.location.fullAddress}</p>
                                        <p className="mt-2 text-sm text-gray-800">
                                            <span className="font-medium">{t('orders.deliveryType')}:</span> {selectedOrder.receive === "p" ? t('orders.pickup') : t('orders.delivery')}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Package className="w-5 h-5 mr-2 text-purple-500" />
                                        {t('orders.orderItems')}
                                    </h3>

                                    <div className="space-y-4">
                                        {selectedOrder.items_detail.map((item, i) => {
                                            return (
                                                <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="font-medium text-gray-900">{item.product}</h4>
                                                        <span className="font-semibold text-gray-900">${parseFloat(item.price).toFixed(1)}</span>
                                                    </div>

                                                    <div className="flex justify-between text-sm text-gray-600 mb-3">
                                                        <span>${(parseFloat(item.price) / parseInt(item.quantity)).toFixed(1)} × {item.quantity}</span>
                                                        <span>{t('orders.subtotal')}: ${parseFloat(item.price).toFixed(1)}</span>
                                                    </div>

                                                    {/* Supplier information */}
                                                    {item.is_there && (
                                                        <div className="mb-3 p-3 bg-gray-50 rounded-md">
                                                            {typeof item.is_there === 'object' && item.is_there.supplier_requests ? (
                                                                <div className="space-y-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="font-medium text-sm text-gray-700">Status:</span>
                                                                        <span className="font-semibold text-gray-900 capitalize">
                                                                            {item.is_there.status.replace(/_/g, ' ')}
                                                                        </span>
                                                                    </div>
                                                                    {item.is_there.supplier_requests.map((supplier, index) => (
                                                                        <div key={supplier.id} className="border-t pt-2 first:border-t-0 first:pt-0">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="font-medium text-sm text-gray-700">Supplier:</span>
                                                                                <span className="font-semibold text-gray-900">{supplier.full_name}</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center text-xs text-gray-600">
                                                                                <span>Phone:</span>
                                                                                <span>{supplier.phone}</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center text-xs">
                                                                                <span>Status:</span>
                                                                                <span className={`font-medium ${supplier.status === 'Rejected' ? 'text-red-600' :
                                                                                    supplier.status === 'Pending' ? 'text-orange-600' :
                                                                                        supplier.status === 'Success' ? 'text-green-600' : 'text-blue-600'
                                                                                    }`}>
                                                                                    {supplier.status}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : item.is_there === true ? (
                                                                <div className="text-green-600 font-medium text-sm">✓ In Stock</div>
                                                            ) : null}
                                                        </div>
                                                    )}

                                                    {/* Product image */}
                                                    {item.images && item.images.length > 0 ? (
                                                        <div className="mb-3">
                                                            <img
                                                                src={item.images[0]}
                                                                alt={item.product}
                                                                className="h-32 w-full object-contain rounded-md border border-gray-200 bg-white p-2"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-20 bg-gray-100 rounded-md mb-3">
                                                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                                                                <ImageIcon className="w-4 h-4" />
                                                                <span>{t('orders.noImage')}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Display color if available */}
                                                    {item.color && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-600">{t('orders.color')}:</span>
                                                            <div
                                                                className="w-5 h-5 rounded-full border border-gray-300"
                                                                style={{ backgroundColor: item.color }}
                                                                title={item.color}
                                                            ></div>
                                                            <span className="text-gray-800">{item.color}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Order Summary */}
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                                            <span>{t('orders.orderTotal')}</span>
                                            <span>${selectedOrder.price}</span>
                                        </div>
                                    </div>

                                    {/* Location Button - Only show if coordinates exist */}
                                    {selectedOrder.location.latitude && selectedOrder.location.latitude && (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={() => {
                                                    const url = `https://www.google.com/maps?q=${selectedOrder.location.latitude},${selectedOrder.location.longitude}`;
                                                    window.open(url, '_blank');
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <MapPin className="w-4 h-4" />
                                                View Location on Map
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Payment and Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                            <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                                            {t('orders.paymentMethod')}
                                        </h3>
                                        <p className="text-gray-800">{selectedOrder.payment}</p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                            {getStatusIcon(selectedOrder.status)}
                                            <span className="ml-2">{t('orders.orderStatus')}</span>
                                        </h3>
                                        <Select
                                            defaultValue={selectedOrder.status}
                                            onValueChange={(val) => {
                                                updateStatus(selectedOrder.id, val);
                                                setSelectedOrder({ ...selectedOrder, status: val });
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t('orders.status')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="p">{t('orders.statuses.p')}</SelectItem>
                                                <SelectItem value="s">{t('orders.statuses.s')}</SelectItem>
                                                <SelectItem value="d">{t('orders.statuses.d')}</SelectItem>
                                                <SelectItem value="c">{t('orders.statuses.c')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end p-6 border-t">
                                <Button onClick={closeOrderModal}>{t('orders.close')}</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}