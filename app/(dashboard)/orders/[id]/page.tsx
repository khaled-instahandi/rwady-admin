"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    ArrowLeft,
    Package,
    Clock,
    CheckCircle,
    XCircle,
    CreditCard,
    User,
    Calendar,
    MapPin,
    Truck,
    DollarSign,
    Phone,
    Mail,
    Edit,
    Printer,
    Download,
    RefreshCw,
    Loader2
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { ordersApi, type Order, type OrderResponse } from "@/lib/api"

// Mock API service (للاختبار - سيتم استبداله بـ API الحقيقي)
const mockApiService = {
    async getOrder(id: string): Promise<OrderResponse> {
        // استخدام API الحقيقي
        const response = await ordersApi.getOrder(id)
        return response
    }
}

export default function OrderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const orderId = params.id as string

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true)
            try {
                const response = await mockApiService.getOrder(orderId)

                if (response.success) {
                    setOrder(response.data)
                }
            } catch (error) {
                console.error("Error fetching order:", error)
                toast({
                    title: "Error",
                    description: "An error occurred while loading order details",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()
    }, [orderId, toast])

    // Helper functions
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
            processing: { label: "Processing", variant: "default" as const, icon: Package },
            shipped: { label: "Shipped", variant: "outline" as const, icon: Truck },
            delivered: { label: "Delivered", variant: "default" as const, icon: CheckCircle },
            cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        )
    }

    const getPaymentStatusBadge = (paidStatus: Order['paid_status']) => {
        if (!paidStatus) {
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Unpaid
                </Badge>
            )
        }

        if (paidStatus.status === "paid") {
            return (
                <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Paid
                </Badge>
            )
        }

        return (
            <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {paidStatus.status}
            </Badge>
        )
    }

    const formatCurrency = (amount: number, currency: string = "IQD") => {
        return `${amount.toLocaleString()} ${currency}`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US")
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading order details...</span>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Order Not Found</h3>
                <p className="text-gray-500">The requested order could not be found</p>
                <Button className="mt-4" onClick={() => router.push('/orders')}>
                    Back to Orders
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/orders')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Order {order.code}</h1>
                        <p className="text-muted-foreground">
                            Created on {formatDate(order.created_at)}
                        </p>
                    </div>
                </div>
                {/* <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            طباعة
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            تعديل
          </Button>
        </div> */}
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Order Status</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {getStatusBadge(order.status)}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {getPaymentStatusBadge(order.paid_status)}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(order.total_amount, order.metadata.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Paid: {formatCurrency(order.total_amount_paid, order.metadata.currency)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products Count</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {order.order_products.reduce((sum: number, product: any) => sum + product.quantity, 0)}
                        </div>
                        {/* <p className="text-xs text-muted-foreground">
                            {order.order_products.length} different products
                        </p> */}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Information */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Customer Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {order.user && (
                            <>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={order.user.avatar || ""} />
                                        <AvatarFallback>{order.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-medium">{order.user.name}</h3>
                                        <p className="text-sm text-gray-500">Customer #{order.user.id}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm">{order.user.phone}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge variant={order.user.status === 'active' ? 'default' : 'secondary'}>
                                            {order.user.status === 'active' ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        Member since: {formatDate(order.user.created_at)}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Order Products */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Order Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">Product</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.order_products.map((orderProduct: any) => (
                                    <TableRow key={orderProduct.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {orderProduct.product?.name?.en || orderProduct.product?.name?.ar || 'Unknown Product'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    SKU: {orderProduct.product?.sku || 'Not specified'}
                                                </div>
                                                {orderProduct.product?.ribbon_text?.en && (
                                                    <Badge variant="secondary" className="mt-1 text-xs">
                                                        {orderProduct.product.ribbon_text.en || orderProduct.product.ribbon_text.ar}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-center font-medium">
                                                {orderProduct.quantity}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-right">
                                                {orderProduct.product?.price_after_discount &&
                                                    orderProduct.product.price_after_discount !== orderProduct.product.price ? (
                                                    <div>
                                                        <div className="font-medium">
                                                            {formatCurrency(orderProduct.product.price_after_discount)}
                                                        </div>
                                                        <div className="text-sm text-gray-500 line-through">
                                                            {formatCurrency(orderProduct.product.price)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="font-medium">
                                                        {formatCurrency(orderProduct.price)}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-right font-medium">
                                                {formatCurrency(orderProduct.price * orderProduct.quantity)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="border-t p-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(order.total_amount, order.metadata.currency)}</span>
                                </div>
                                {order.payment_fees && (
                                    <div className="flex justify-between">
                                        <span>Payment Fees:</span>
                                        <span>{formatCurrency(order.payment_fees, order.metadata.currency)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total:</span>
                                    <span>{formatCurrency(order.total_amount, order.metadata.currency)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Payment Method</label>
                            <div className="mt-1 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-gray-400" />
                                <span className="capitalize">{order.payment_method}</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500">Session ID</label>
                            <div className="mt-1 font-mono text-sm">
                                {order.payment_session_id}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500">Payment ID</label>
                            <div className="mt-1 font-mono text-sm">
                                {order.metadata.paymentId}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500">Payment Created</label>
                            <div className="mt-1 text-sm">
                                {formatDate(order.metadata.creationDate)}
                            </div>
                        </div>
                    </div>

                    {order.payments.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Payment History</h4>
                            <div className="space-y-3">
                                {order.payments.map((payment: any) => (
                                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${payment.status === 'completed' ? 'bg-green-500' :
                                                    payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                                                }`} />
                                            <div>
                                                <div className="font-medium">Payment #{payment.id}</div>
                                                <div className="text-sm text-gray-500">
                                                    {formatDate(payment.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">
                                                {formatCurrency(payment.amount, order.metadata.currency)}
                                            </div>
                                            <div className="text-sm">
                                                <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                                                    {payment.status === 'completed' ? 'Completed' : payment.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Order Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                            <div>
                                <div className="font-medium">Order Created</div>
                                <div className="text-sm text-gray-500">{formatDate(order.created_at)}</div>
                            </div>
                        </div>

                        {order.paid_status && (
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                                <div>
                                    <div className="font-medium">Payment Confirmed</div>
                                    <div className="text-sm text-gray-500">{formatDate(order.paid_status.created_at)}</div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-4">
                            <div className="w-2 h-2 bg-gray-300 rounded-full mt-2" />
                            <div>
                                <div className="font-medium text-gray-500">Last Updated</div>
                                <div className="text-sm text-gray-500">{formatDate(order.updated_at)}</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notes Section */}
            {order.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Order Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{order.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
