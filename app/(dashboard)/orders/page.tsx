"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Search,
    Filter,
    Eye,
    Package,
    ChevronDown,
    Download,
    Loader2,
    CreditCard,
    Clock,
    CheckCircle,
    XCircle,
    DollarSign,
    User,
    Calendar,
    Truck
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { ordersApi, type Order, type OrdersResponse } from "@/lib/api"

// Debounce hook
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}    // Mock API service (for testing - will be replaced with real API)
    const mockApiService = {
        async getOrders(params: {
            page?: number
            search?: string
            status?: string
            payment_status?: string
            sort_by?: string
            sort_direction?: string
        }): Promise<OrdersResponse> {
            // Simulating data based on provided API
            const response = await ordersApi.getOrders(params)
            return response
        }
    }

export default function OrdersPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [searchInput, setSearchInput] = useState("")
    const [currentPage, setCurrentPage] = useState(() => {
        const pageParam = searchParams.get('page')
        return pageParam ? parseInt(pageParam, 10) : 1
    })
    const [totalPages, setTotalPages] = useState(1)
    const [totalOrders, setTotalOrders] = useState(0)
    const [perPage, setPerPage] = useState(20)

    // Filter states
    const [filters, setFilters] = useState({
        status: "all",
        payment_status: "all",
        sort_by: "created_at",
        sort_direction: "desc" as "asc" | "desc"
    })

    // Status update state
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)

    // Apply debounce to search input
    const debouncedSearch = useDebounce(searchInput, 500)

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        setLoading(true)
        try {
            const params = {
                page: currentPage,
                search: debouncedSearch || undefined,
                status: filters.status !== "all" ? filters.status : undefined,
                payment_status: filters.payment_status !== "all" ? filters.payment_status : undefined,
                sort_by: filters.sort_by,
                sort_direction: filters.sort_direction
            }

            const response = await mockApiService.getOrders(params)

            if (response.success) {
                setOrders(response.data)
                setTotalPages(response.meta.last_page)
                setTotalOrders(response.meta.total)
                setPerPage(response.meta.per_page)
            }
        } catch (error) {
            console.error("Error fetching orders:", error)
            toast({
                title: "Error",
                description: "An error occurred while loading orders",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }, [currentPage, debouncedSearch, filters, toast])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    // Helper functions
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
            in_progress: { label: "In Progress", variant: "default" as const, icon: Package },
            // processing: { label: "Processing", variant: "default" as const, icon: Package },
            shipping: { label: "Shipping", variant: "outline" as const, icon: Truck },
            // shipped: { label: "Shipped", variant: "outline" as const, icon: Truck },
            completed: { label: "Completed", variant: "default" as const, icon: CheckCircle, className: "bg-green-600" },
            // delivered: { label: "Delivered", variant: "default" as const, icon: CheckCircle },
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

    const getCurrency = (order: Order) => {
        return order.metadata?.currency || "IQD"
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US")
    }
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        const params = new URLSearchParams(searchParams)
        params.set('page', page.toString())
        router.push(`?${params.toString()}`)
    }

    const resetFilters = () => {
        setFilters({
            status: "all",
            payment_status: "all",
            sort_by: "created_at",
            sort_direction: "desc"
        })
        setSearchInput("")
        setCurrentPage(1)
    }

    // Handle status update
    const handleStatusUpdate = async (orderId: number, newStatus: string) => {
        setUpdatingOrderId(orderId)
        try {
            await ordersApi.updateOrderStatus(orderId, newStatus)
            
            // Update the order in local state
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order.id === orderId 
                        ? { ...order, status: newStatus }
                        : order
                )
            )

            toast({
                title: "Success",
                description: "Order status updated successfully",
                variant: "default",
            })
        } catch (error) {
            console.error("Error updating order status:", error)
            toast({
                title: "Error",
                description: "Failed to update order status",
                variant: "destructive",
            })
        } finally {
            setUpdatingOrderId(null)
        }
    }

    // Get available status options
    const getStatusOptions = () => [
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
        // { value: "processing", label: "Processing" },
        { value: "shipping", label: "Shipping" },
        // { value: "shipped", label: "Shipped" },
        { value: "completed", label: "Completed" },
        // { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">
                        Manage all orders and transactions
                    </p>
                </div>
                {/* <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div> */}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">All orders</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders.filter(order => order.status === 'pending').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Pending orders</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders.filter(order => order.paid_status?.status === 'paid').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Paid orders</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(orders.reduce((sum, order) => sum + order.total_amount_paid, 0))}
                        </div>
                        <p className="text-xs text-muted-foreground">Total amount</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by order number or customer ID..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Order Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="shipping">Shipping</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.payment_status} onValueChange={(value) => setFilters(prev => ({ ...prev, payment_status: value }))}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Payment Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Payment Statuses</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="pending">Pending Payment</SelectItem>
                                    <SelectItem value="failed">Payment Failed</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* <Select value={`${filters.sort_by}_${filters.sort_direction}`} onValueChange={(value) => {
                                const [sort_by, sort_direction] = value.split('_')
                                setFilters(prev => ({ ...prev, sort_by, sort_direction: sort_direction as "asc" | "desc" }))
                            }}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="created_at_desc">Newest First</SelectItem>
                                    <SelectItem value="created_at_asc">Oldest First</SelectItem>
                                    <SelectItem value="total_amount_desc">Amount (High to Low)</SelectItem>
                                    <SelectItem value="total_amount_asc">Amount (Low to High)</SelectItem>
                                </SelectContent>
                            </Select> */}

                            <Button variant="outline" onClick={resetFilters}>
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Loading orders...</span>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                            <p className="text-gray-500">No orders matching your search criteria were found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left">Order Number</TableHead>
                                    <TableHead className="text-left">Customer</TableHead>
                                    <TableHead className="text-left">Amount</TableHead>
                                    <TableHead className="text-left">Payment Method</TableHead>
                                    <TableHead className="text-left">Order Status</TableHead>
                                    <TableHead className="text-left">Payment Status</TableHead>
                                    <TableHead className="text-left">Order Date</TableHead>
                                    <TableHead className="text-left">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/orders/${order.id}`}
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {order.code}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <span>Customer #{order.user_id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-left">
                                                <div className="font-medium">
                                                    {formatCurrency(order.total_amount, getCurrency(order))}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Paid: {formatCurrency(order.total_amount_paid, getCurrency(order))}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-gray-400" />
                                                <span className="capitalize">{order.payment_method}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select 
                                                value={order.status} 
                                                onValueChange={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                                                disabled={updatingOrderId === order.id}
                                            >
                                                <SelectTrigger className="w-[140px] h-auto p-1">
                                                    <SelectValue>
                                                        {updatingOrderId === order.id ? (
                                                            <div className="flex items-center gap-2 px-2 py-1">
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                <span className="text-xs">Updating...</span>
                                                            </div>
                                                        ) : (
                                                            getStatusBadge(order.status)
                                                        )}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {getStatusOptions().map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{option.label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {getPaymentStatusBadge(order.paid_status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(order.created_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/orders/${order.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalOrders)} of {totalOrders} orders
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                            return (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </Button>
                            )
                        })}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
