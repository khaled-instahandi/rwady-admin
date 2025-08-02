"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { format, parseISO, isAfter, isBefore } from "date-fns"
import { ar } from "date-fns/locale"
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Percent,
    DollarSign,
    Tag,
    TrendingUp,
    TrendingDown,
    Activity,
    Clock,
    CheckCircle,
    XCircle,
    BarChart3,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { apiService, type Coupon, type CreateCouponData, type UpdateCouponData } from "@/lib/api"

interface CouponFormData {
    code: string
    type: "percentage" | "fixed"
    amount: number
    is_active: boolean
    start_date: Date | undefined
    end_date: Date | undefined
}

const initialFormData: CouponFormData = {
    code: "",
    type: "percentage",
    amount: 0,
    is_active: true,
    start_date: undefined,
    end_date: undefined,
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState<"all" | "percentage" | "fixed">("all")
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "expired">("all")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
    const [formData, setFormData] = useState<CouponFormData>(initialFormData)
    const [submitting, setSubmitting] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCoupons, setTotalCoupons] = useState(0)

    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        fetchCoupons()
    }, [currentPage, searchTerm, filterType, filterStatus])

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            if (searchTerm !== "") {
                setCurrentPage(1)
                fetchCoupons()
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchCoupons = async () => {
        try {
            setLoading(true)

            // Build filters for API
            const params: any = {
                page: currentPage,
                limit: 20,
            }

            if (searchTerm) {
                params.search = searchTerm
            }

            if (filterType !== "all") {
                params.type = filterType
            }

            // For status filter, we'll handle it client-side since backend might not support it
            // But we can pass is_active filter to backend
            if (filterStatus === "active") {
                params.is_active = true
            } else if (filterStatus === "inactive") {
                params.is_active = false
            }

            const response = await apiService.getCoupons(params)

            if (response.success) {
                setCoupons(response.data)
                if (response.meta) {
                    setTotalPages(response.meta.last_page)
                    setTotalCoupons(response.meta.total)
                }
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load coupons",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while loading data",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async () => {
        setCurrentPage(1)
        await fetchCoupons()
    }

    const handleFilterChange = () => {
        setCurrentPage(1)
        fetchCoupons()
    }

    const formatDate = (dateString: string) => {
        try {
            return format(parseISO(dateString), "dd/MM/yyyy", { locale: ar })
        } catch {
            return dateString
        }
    }

    const getCouponStatus = (coupon: Coupon) => {
        const now = new Date()
        const startDate = parseISO(coupon.start_date)
        const endDate = parseISO(coupon.end_date)

        if (!coupon.is_active) return "inactive"
        if (isAfter(now, endDate)) return "expired"
        if (isBefore(now, startDate)) return "pending"
        return "active"
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
            case "inactive":
                return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>
            case "expired":
                return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
            default:
                return <Badge>Unknown</Badge>
        }
    }

    const getTypeBadge = (type: string) => {
        return type === "percentage" ? (
            <Badge variant="outline" className="gap-1">
                <Percent className="h-3 w-3" />
                Percentage
            </Badge>
        ) : (
            <Badge variant="outline" className="gap-1">
                <DollarSign className="h-3 w-3" />
                Fixed Amount
            </Badge>
        )
    }

    const filteredCoupons = coupons.filter((coupon) => {
        const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filterType === "all" || coupon.type === filterType
        const status = getCouponStatus(coupon)
        const matchesStatus = filterStatus === "all" || status === filterStatus

        return matchesSearch && matchesType && matchesStatus
    })

    const handleCreateCoupon = async () => {
        if (!formData.code || !formData.start_date || !formData.end_date || formData.amount <= 0) {
            toast({
                title: "Error",
                description: "Please fill all required fields",
                variant: "destructive",
            })
            return
        }

        try {
            setSubmitting(true)

            const couponData: CreateCouponData = {
                code: formData.code,
                type: formData.type,
                amount: formData.amount,
                is_active: formData.is_active,
                start_date: format(formData.start_date, "yyyy-MM-dd"),
                end_date: format(formData.end_date, "yyyy-MM-dd"),
            }

            const response = await apiService.createCoupon(couponData)

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Coupon created successfully",
                })
                setIsCreateDialogOpen(false)
                setFormData(initialFormData)
                await fetchCoupons()
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to create coupon",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while creating coupon",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditCoupon = async () => {
        if (!editingCoupon || !formData.code || !formData.start_date || !formData.end_date || formData.amount <= 0) {
            toast({
                title: "Error",
                description: "Please fill all required fields",
                variant: "destructive",
            })
            return
        }

        try {
            setSubmitting(true)

            const updateData: UpdateCouponData = {
                code: formData.code,
                type: formData.type,
                amount: formData.amount,
                is_active: formData.is_active,
                start_date: format(formData.start_date, "yyyy-MM-dd"),
                end_date: format(formData.end_date, "yyyy-MM-dd"),
            }

            const response = await apiService.updateCoupon(editingCoupon.id, updateData)

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Coupon updated successfully",
                })
                setIsEditDialogOpen(false)
                setEditingCoupon(null)
                setFormData(initialFormData)
                await fetchCoupons()
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to update coupon",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while updating coupon",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteCoupon = async () => {
        if (!couponToDelete) return

        try {
            const response = await apiService.deleteCoupon(couponToDelete.id)

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Coupon deleted successfully",
                })
                setDeleteDialogOpen(false)
                setCouponToDelete(null)
                await fetchCoupons()
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to delete coupon",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while deleting coupon",
                variant: "destructive",
            })
        }
    }

    const openEditDialog = (coupon: Coupon) => {
        setEditingCoupon(coupon)
        setFormData({
            code: coupon.code,
            type: coupon.type,
            amount: coupon.amount,
            is_active: coupon.is_active,
            start_date: parseISO(coupon.start_date),
            end_date: parseISO(coupon.end_date),
        })
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (coupon: Coupon) => {
        setCouponToDelete(coupon)
        setDeleteDialogOpen(true)
    }

    // Statistics
    const activeCoupons = coupons.filter(c => getCouponStatus(c) === "active").length
    const expiredCoupons = coupons.filter(c => getCouponStatus(c) === "expired").length
    const percentageCoupons = coupons.filter(c => c.type === "percentage").length
    const fixedCoupons = coupons.filter(c => c.type === "fixed").length

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Coupons Management</h1>
                    <p className="text-gray-600 mt-1">Manage and track discount coupons</p>
                </div>
                <Button className="gap-2" onClick={() => {
                    setFormData(initialFormData)
                    setIsCreateDialogOpen(true)
                }}>
                    <Plus className="h-4 w-4" />
                    Add New Coupon
                </Button>
            </motion.div>

            {/* Statistics Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
                        <Tag className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{totalCoupons}</div>
                        <p className="text-xs text-muted-foreground">All available coupons</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeCoupons}</div>
                        <p className="text-xs text-muted-foreground">Valid for use</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expired Coupons</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{expiredCoupons}</div>
                        <p className="text-xs text-muted-foreground">Expired coupons</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Percentage Discount</CardTitle>
                        <Percent className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{percentageCoupons}</div>
                        <p className="text-xs text-muted-foreground">Percentage coupons</p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filters and Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search coupons..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                </div>
                <Select value={filterType} onValueChange={(value: "all" | "percentage" | "fixed") => {
                    setFilterType(value)
                    handleFilterChange()
                }}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value: "all" | "active" | "inactive" | "expired") => {
                    setFilterStatus(value)
                    handleFilterChange()
                }}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Coupons Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Coupons List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-gray-600">Loading...</p>
                            </div>
                        ) : filteredCoupons.length === 0 ? (
                            <div className="text-center py-8">
                                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Coupons Found</h3>
                                <p className="text-gray-600">No coupons match your search criteria</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Coupon Code</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Value</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Start Date</TableHead>
                                                <TableHead>End Date</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <AnimatePresence>
                                                {filteredCoupons.map((coupon, index) => (
                                                    <motion.tr
                                                        key={coupon.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                                    <Tag className="h-4 w-4 text-blue-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium">{coupon.code}</div>
                                                                    <div className="text-sm text-gray-500">#{coupon.id}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getTypeBadge(coupon.type)}</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">
                                                                {coupon.type === "percentage" ? `${coupon.amount}%` : `${coupon.amount} KWD`}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(getCouponStatus(coupon))}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                                {formatDate(coupon.start_date)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                                {formatDate(coupon.end_date)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => openEditDialog(coupon)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => openDeleteDialog(coupon)}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <div className="text-sm text-gray-700">
                                            Showing page {currentPage} of {totalPages} ({totalCoupons} total coupons)
                                        </div>
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        className={currentPage === 1 ? "  opacity-50" : "cursor-pointer"}
                                                    />
                                                </PaginationItem>

                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    let page: number

                                                    if (totalPages <= 5) {
                                                        page = i + 1
                                                    } else {
                                                        // Smart pagination for many pages
                                                        const start = Math.max(1, currentPage - 2)
                                                        const end = Math.min(totalPages, start + 4)
                                                        page = start + i

                                                        if (page > end) return null
                                                    }

                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                onClick={() => setCurrentPage(page)}
                                                                isActive={currentPage === page}
                                                                className="cursor-pointer"
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    )
                                                })}

                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                        className={currentPage === totalPages ? "  opacity-50" : "cursor-pointer"}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Coupon</DialogTitle>
                        <DialogDescription>Update coupon information</DialogDescription>
                    </DialogHeader>
                    <CouponForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleEditCoupon}
                        submitting={submitting}
                        isEdit={true}
                        onCancel={() => {
                            setIsEditDialogOpen(false)
                            setEditingCoupon(null)
                            setFormData(initialFormData)
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the coupon "{couponToDelete?.code}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCoupon} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                // Prevent closing dialog by clicking outside
                if (open === false) return
                setIsCreateDialogOpen(open)
            }}>
                <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Add New Coupon</DialogTitle>
                        <DialogDescription>Create a new discount coupon for customers</DialogDescription>
                    </DialogHeader>
                    <CouponForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleCreateCoupon}
                        submitting={submitting}
                        isEdit={false}
                        onCancel={() => {
                            setIsCreateDialogOpen(false)
                            setFormData(initialFormData)
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Coupon Form Component
interface CouponFormProps {
    formData: CouponFormData
    setFormData: (data: CouponFormData) => void
    onSubmit: () => void
    submitting: boolean
    isEdit: boolean
    onCancel?: () => void
}

function CouponForm({ formData, setFormData, onSubmit, submitting, isEdit, onCancel }: CouponFormProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                    id="code"
                    placeholder="Enter coupon code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Discount Type *</Label>
                <Select
                    value={formData.type}
                    onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, type: value })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="amount">
                    Value * {formData.type === "percentage" ? "(%)" : "(KWD)"}
                </Label>
                <Input
                    id="amount"
                    type="number"
                    placeholder={formData.type === "percentage" ? "e.g: 10" : "e.g: 50"}
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    min="0"
                    max={formData.type === "percentage" ? "100" : undefined}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date ? format(formData.start_date, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined
                            console.log("Start date selected:", date)
                            setFormData({ ...formData, start_date: date })
                        }}
                        min={!isEdit ? format(new Date(), "yyyy-MM-dd") : undefined}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date ? format(formData.end_date, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined
                            console.log("End date selected:", date)
                            setFormData({ ...formData, end_date: date })
                        }}
                        min={!isEdit ? 
                            (formData.start_date ? format(formData.start_date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")) :
                            (formData.start_date ? format(formData.start_date, "yyyy-MM-dd") : undefined)
                        }
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Coupon is active</Label>
            </div>

            <div className="flex gap-2 pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={submitting}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                )}
                <Button onClick={onSubmit} disabled={submitting} className="flex-1">
                    {submitting ? "Saving..." : isEdit ? "Update Coupon" : "Create Coupon"}
                </Button>
            </div>
        </div>
    )
}
