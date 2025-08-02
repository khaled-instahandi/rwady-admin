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
    Package,
    ShoppingBag,
    ShoppingCart,
    Truck,
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { apiService, type Promotion, type CreatePromotionData, type UpdatePromotionData, type Category, type Product } from "@/lib/api"

interface PromotionFormData {
    title: {
        ar: string
        en: string
    }
    type: "product" | "category" | "cart_total" | "shipping"
    discount_type: "percentage" | "fixed"
    discount_value: number
    start_at: Date | undefined
    end_at: Date | undefined
    status: "draft" | "active" | "inactive"
    products: number[]
    categories: number[]
    min_cart_total: number
}

const initialFormData: PromotionFormData = {
    title: {
        ar: "",
        en: "",
    },
    type: "product",
    discount_type: "percentage",
    discount_value: 0,
    start_at: undefined,
    end_at: undefined,
    status: "draft",
    products: [],
    categories: [],
    min_cart_total: 0,
}

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState<"all" | "product" | "category" | "cart_total" | "shipping">("all")
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "draft">("all")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null)
    const [formData, setFormData] = useState<PromotionFormData>(initialFormData)
    const [submitting, setSubmitting] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalPromotions, setTotalPromotions] = useState(0)

    // For category and product selection
    const [availableCategories, setAvailableCategories] = useState<Category[]>([])
    const [availableProducts, setAvailableProducts] = useState<Product[]>([])
    const [categorySearchTerm, setCategorySearchTerm] = useState("")
    const [productSearchTerm, setProductSearchTerm] = useState("")

    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        fetchPromotions()
        fetchCategories()
        fetchProducts()
    }, [currentPage, searchTerm, filterType, filterStatus])

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            if (searchTerm !== "") {
                setCurrentPage(1)
                fetchPromotions()
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchPromotions = async () => {
        try {
            setLoading(true)

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

            if (filterStatus !== "all") {
                params.status = filterStatus
            }

            const response = await apiService.getPromotions(params)

            if (response.success) {
                setPromotions(response.data)
                if (response.meta) {
                    setTotalPages(response.meta.last_page)
                    setTotalPromotions(response.meta.total)
                }
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load promotions",
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

    const fetchCategories = async () => {
        try {
            const response = await apiService.getCategories()
            if (response.success) {
                setAvailableCategories(response.data)
            }
        } catch (error) {
            console.error("Error fetching categories:", error)
        }
    }

    const fetchProducts = async () => {
        try {
            const response = await apiService.getProducts()
            if (response.success) {
                setAvailableProducts(response.data)
            }
        } catch (error) {
            console.error("Error fetching products:", error)
        }
    }

    const handleSearch = async () => {
        setCurrentPage(1)
        await fetchPromotions()
    }

    const handleFilterChange = () => {
        setCurrentPage(1)
        fetchPromotions()
    }

    const formatDate = (dateString: string) => {
        try {
            return format(parseISO(dateString), "dd/MM/yyyy", { locale: ar })
        } catch {
            return dateString
        }
    }

    const getPromotionStatus = (promotion: Promotion) => {
        if (promotion.status === "inactive") return "inactive"
        if (promotion.status === "draft") return "draft"

        if (promotion.start_at && promotion.end_at) {
            const now = new Date()
            const startDate = parseISO(promotion.start_at)
            const endDate = parseISO(promotion.end_at)

            if (isAfter(now, endDate)) return "expired"
            if (isBefore(now, startDate)) return "scheduled"
        }

        return "active"
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
            case "inactive":
                return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>
            case "draft":
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Draft</Badge>
            case "expired":
                return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>
            case "scheduled":
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>
            default:
                return <Badge>Unknown</Badge>
        }
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "product":
                return <Badge variant="outline" className="gap-1"><Package className="h-3 w-3" />Products</Badge>
            case "category":
                return <Badge variant="outline" className="gap-1"><ShoppingBag className="h-3 w-3" />Categories</Badge>
            case "cart_total":
                return <Badge variant="outline" className="gap-1"><ShoppingCart className="h-3 w-3" />Cart Total</Badge>
            case "shipping":
                return <Badge variant="outline" className="gap-1"><Truck className="h-3 w-3" />Shipping</Badge>
            default:
                return <Badge variant="outline">{type}</Badge>
        }
    }

    const getDiscountTypeBadge = (type: string) => {
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

    const filteredPromotions = promotions.filter((promotion) => {
        const matchesSearch = promotion.title.ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
            promotion.title.en.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filterType === "all" || promotion.type === filterType
        const status = getPromotionStatus(promotion)
        const matchesStatus = filterStatus === "all" || status === filterStatus || promotion.status === filterStatus

        return matchesSearch && matchesType && matchesStatus
    })

    const handleCreatePromotion = async () => {
        if (!formData.title.ar || formData.discount_value <= 0) {
            toast({
                title: "Error",
                description: "Please fill all required fields",
                variant: "destructive",
            })
            return
        }

        try {
            setSubmitting(true)

            const promotionData: CreatePromotionData = {
                title: formData.title,
                type: formData.type,
                discount_type: formData.discount_type,
                discount_value: formData.discount_value,
                status: formData.status,
            }

            if (formData.start_at) {
                promotionData.start_at = format(formData.start_at, "yyyy-MM-dd HH:mm")
            }

            if (formData.end_at) {
                promotionData.end_at = format(formData.end_at, "yyyy-MM-dd HH:mm")
            }

            if (formData.type === "product" && formData.products.length > 0) {
                promotionData.products = formData.products
            }

            if (formData.type === "category" && formData.categories.length > 0) {
                promotionData.categories = formData.categories
            }

            if (formData.type === "cart_total" && formData.min_cart_total > 0) {
                promotionData.min_cart_total = formData.min_cart_total
            }

            const response = await apiService.createPromotion(promotionData)

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Promotion created successfully",
                })
                setIsCreateDialogOpen(false)
                setFormData(initialFormData)
                await fetchPromotions()
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to create promotion",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while creating promotion",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditPromotion = async () => {
        if (!editingPromotion || !formData.title.ar || formData.discount_value <= 0) {
            toast({
                title: "Error",
                description: "Please fill all required fields",
                variant: "destructive",
            })
            return
        }

        try {
            setSubmitting(true)

            const updateData: UpdatePromotionData = {
                title: formData.title,
                type: formData.type,
                discount_type: formData.discount_type,
                discount_value: formData.discount_value,
                status: formData.status,
            }

            if (formData.start_at) {
                updateData.start_at = format(formData.start_at, "yyyy-MM-dd HH:mm")
            }

            if (formData.end_at) {
                updateData.end_at = format(formData.end_at, "yyyy-MM-dd HH:mm")
            }

            if (formData.type === "product") {
                updateData.products = formData.products
            }

            if (formData.type === "category") {
                updateData.categories = formData.categories
            }

            if (formData.type === "cart_total") {
                updateData.min_cart_total = formData.min_cart_total
            }

            const response = await apiService.updatePromotion(editingPromotion.id, updateData)

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Promotion updated successfully",
                })
                setIsEditDialogOpen(false)
                setEditingPromotion(null)
                setFormData(initialFormData)
                await fetchPromotions()
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to update promotion",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while updating promotion",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeletePromotion = async () => {
        if (!promotionToDelete) return

        try {
            const response = await apiService.deletePromotion(promotionToDelete.id)

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Promotion deleted successfully",
                })
                setDeleteDialogOpen(false)
                setPromotionToDelete(null)
                await fetchPromotions()
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to delete promotion",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while deleting promotion",
                variant: "destructive",
            })
        }
    }

    const openEditDialog = (promotion: Promotion) => {
        setEditingPromotion(promotion)
        setFormData({
            title: promotion.title,
            type: promotion.type,
            discount_type: promotion.discount_type,
            discount_value: promotion.discount_value,
            status: promotion.status,
            start_at: promotion.start_at ? parseISO(promotion.start_at) : undefined,
            end_at: promotion.end_at ? parseISO(promotion.end_at) : undefined,
            products: promotion.products || [],
            categories: promotion.categories || [],
            min_cart_total: promotion.min_cart_total || 0,
        })
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (promotion: Promotion) => {
        setPromotionToDelete(promotion)
        setDeleteDialogOpen(true)
    }

    // Statistics
    const activePromotions = promotions.filter(p => getPromotionStatus(p) === "active").length
    const draftPromotions = promotions.filter(p => p.status === "draft").length
    const productPromotions = promotions.filter(p => p.type === "product").length
    const categoryPromotions = promotions.filter(p => p.type === "category").length

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Promotions Management</h1>
                    <p className="text-gray-600 mt-1">Manage and track promotional campaigns</p>
                </div>
                <Button className="gap-2" onClick={() => {
                    router.push("/promotions/add")
                }}>
                    <Plus className="h-4 w-4" />
                    Create Promotion
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
                        <CardTitle className="text-sm font-medium">Total Promotions</CardTitle>
                        <Tag className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{totalPromotions}</div>
                        <p className="text-xs text-muted-foreground">All promotional campaigns</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activePromotions}</div>
                        <p className="text-xs text-muted-foreground">Currently running</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Draft Promotions</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{draftPromotions}</div>
                        <p className="text-xs text-muted-foreground">Waiting to be launched</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Product Promotions</CardTitle>
                        <Package className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{productPromotions}</div>
                        <p className="text-xs text-muted-foreground">Product-based campaigns</p>
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
                            placeholder="Search promotions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                </div>
                <Select value={filterType} onValueChange={(value: any) => {
                    setFilterType(value)
                    handleFilterChange()
                }}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="cart_total">Cart Total</SelectItem>
                        <SelectItem value="shipping">Shipping</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value: any) => {
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
                        <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Promotions Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Promotions List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-gray-600">Loading...</p>
                            </div>
                        ) : filteredPromotions.length === 0 ? (
                            <div className="text-center py-8">
                                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Promotions Found</h3>
                                <p className="text-gray-600">No promotions match your search criteria</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Discount</TableHead>
                                                <TableHead>Value</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Start Date</TableHead>
                                                <TableHead>End Date</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <AnimatePresence>
                                                {filteredPromotions.map((promotion, index) => (
                                                    <motion.tr
                                                        key={promotion.id}
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
                                                                    <div className="font-medium">{promotion.title.ar}</div>
                                                                    <div className="text-sm text-gray-500">{promotion.title.en}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getTypeBadge(promotion.type)}</TableCell>
                                                        <TableCell>{getDiscountTypeBadge(promotion.discount_type)}</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">
                                                                {promotion.discount_type === "percentage"
                                                                    ? `${promotion.discount_value}%`
                                                                    : `${promotion.discount_value} IQD`}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(getPromotionStatus(promotion))}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                                {promotion.start_at ? formatDate(promotion.start_at) : "Not set"}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                                {promotion.end_at ? formatDate(promotion.end_at) : "Not set"}
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
                                                                    <DropdownMenuItem onClick={() => openEditDialog(promotion)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => openDeleteDialog(promotion)}
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
                                            Showing page {currentPage} of {totalPages} ({totalPromotions} total promotions)
                                        </div>
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                    />
                                                </PaginationItem>

                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    let page: number

                                                    if (totalPages <= 5) {
                                                        page = i + 1
                                                    } else {
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
                                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                if (open === false) return
                setIsCreateDialogOpen(open)
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Create Promotion</DialogTitle>
                        <DialogDescription>Create a new promotional campaign</DialogDescription>
                    </DialogHeader>
                    <PromotionForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleCreatePromotion}
                        submitting={submitting}
                        isEdit={false}
                        onCancel={() => {
                            setIsCreateDialogOpen(false)
                            setFormData(initialFormData)
                        }}
                        availableCategories={availableCategories}
                        availableProducts={availableProducts}
                        categorySearchTerm={categorySearchTerm}
                        setCategorySearchTerm={setCategorySearchTerm}
                        productSearchTerm={productSearchTerm}
                        setProductSearchTerm={setProductSearchTerm}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Promotion</DialogTitle>
                        <DialogDescription>Update promotion information</DialogDescription>
                    </DialogHeader>
                    <PromotionForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleEditPromotion}
                        submitting={submitting}
                        isEdit={true}
                        onCancel={() => {
                            setIsEditDialogOpen(false)
                            setEditingPromotion(null)
                            setFormData(initialFormData)
                        }}
                        availableCategories={availableCategories}
                        availableProducts={availableProducts}
                        categorySearchTerm={categorySearchTerm}
                        setCategorySearchTerm={setCategorySearchTerm}
                        productSearchTerm={productSearchTerm}
                        setProductSearchTerm={setProductSearchTerm}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the promotion "{promotionToDelete?.title.ar}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePromotion} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// Promotion Form Component
interface PromotionFormProps {
    formData: PromotionFormData
    setFormData: (data: PromotionFormData) => void
    onSubmit: () => void
    submitting: boolean
    isEdit: boolean
    onCancel?: () => void
    availableCategories: Category[]
    availableProducts: Product[]
    categorySearchTerm: string
    setCategorySearchTerm: (term: string) => void
    productSearchTerm: string
    setProductSearchTerm: (term: string) => void
}

function PromotionForm({
    formData,
    setFormData,
    onSubmit,
    submitting,
    isEdit,
    onCancel,
    availableCategories,
    availableProducts,
    categorySearchTerm,
    setCategorySearchTerm,
    productSearchTerm,
    setProductSearchTerm
}: PromotionFormProps) {

    const filteredCategories = availableCategories.filter(cat =>
        cat.name.ar.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
        cat.name.en?.toLowerCase().includes(categorySearchTerm.toLowerCase())
    )

    const filteredProducts = availableProducts.filter(product =>
        product.name.ar.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.name.en?.toLowerCase().includes(productSearchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Step 1: Choose the type of promotion */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 1. Choose the type of promotion</h3>
                <p className="text-sm text-gray-600">Specify what promotion you want to offer to your customers.</p>

                <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center space-x-3">
                        <input
                            type="radio"
                            id="product"
                            name="promotionType"
                            value="product"
                            checked={formData.type === "product"}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor="product" className="flex-1">
                            <div className="font-medium">Discount on specific products</div>
                            <div className="text-sm text-gray-500">Set for one or several products to encourage customers to make specific purchases.</div>
                        </label>
                    </div>

                    <div className="flex items-center space-x-3">
                        <input
                            type="radio"
                            id="category"
                            name="promotionType"
                            value="category"
                            checked={formData.type === "category"}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor="category" className="flex-1">
                            <div className="font-medium">Discount on products from specific categories</div>
                            <div className="text-sm text-gray-500">Set for specific categories. You can exclude unnecessary products from the promotion.</div>
                        </label>
                    </div>

                    <div className="flex items-center space-x-3">
                        <input
                            type="radio"
                            id="cart_total"
                            name="promotionType"
                            value="cart_total"
                            checked={formData.type === "cart_total"}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor="cart_total" className="flex-1">
                            <div className="font-medium">Discount based on cart total</div>
                            <div className="text-sm text-gray-500">Applied when a cart total reaches a specific amount.</div>
                        </label>
                    </div>

                    <div className="flex items-center space-x-3">
                        <input
                            type="radio"
                            id="shipping"
                            name="promotionType"
                            value="shipping"
                            checked={formData.type === "shipping"}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor="shipping" className="flex-1">
                            <div className="font-medium">Free shipping for specific shipping methods</div>
                            <div className="text-sm text-gray-500">Offer free shipping for one or more shipping methods or set up special discount values to encourage customers to buy more and increase sales.</div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Step 2: Set discount values */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 2. Set discount values</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="title_ar">Title (Arabic) *</Label>
                        <Input
                            id="title_ar"
                            placeholder="Enter Arabic title"
                            value={formData.title.ar}
                            onChange={(e) => setFormData({ ...formData, title: { ...formData.title, ar: e.target.value } })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title_en">Title (English)</Label>
                        <Input
                            id="title_en"
                            placeholder="Enter English title"
                            value={formData.title.en}
                            onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="discount_type">Discount Type *</Label>
                        <Select
                            value={formData.discount_type}
                            onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, discount_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                <SelectItem value="fixed">Fixed Amount (IQD)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="discount_value">
                            Discount Value * {formData.discount_type === "percentage" ? "(%)" : "(IQD)"}
                        </Label>
                        <Input
                            id="discount_value"
                            type="number"
                            placeholder={formData.discount_type === "percentage" ? "e.g: 10" : "e.g: 5000"}
                            value={formData.discount_value || ""}
                            onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                            min="0"
                            max={formData.discount_type === "percentage" ? "100" : undefined}
                        />
                    </div>
                </div>

                {/* Product selection for product type */}
                {formData.type === "product" && (
                    <div className="space-y-2">
                        <Label>Products with discount</Label>
                        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                            <Input
                                placeholder="Search products..."
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.target.value)}
                                className="mb-3"
                            />
                            <div className="space-y-2">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`product-${product.id}`}
                                            checked={formData.products.includes(product.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setFormData({
                                                        ...formData,
                                                        products: [...formData.products, product.id]
                                                    })
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        products: formData.products.filter(id => id !== product.id)
                                                    })
                                                }
                                            }}
                                        />
                                        <label htmlFor={`product-${product.id}`} className="text-sm">
                                            {product.name.ar} {product.name.en && `(${product.name.en})`}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">{formData.products.length} products selected</p>
                    </div>
                )}

                {/* Category selection for category type */}
                {formData.type === "category" && (
                    <div className="space-y-2">
                        <Label>Categories with discount</Label>
                        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                            <Input
                                placeholder="Search categories..."
                                value={categorySearchTerm}
                                onChange={(e) => setCategorySearchTerm(e.target.value)}
                                className="mb-3"
                            />
                            <div className="space-y-2">
                                {filteredCategories.map((category) => (
                                    <div key={category.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`category-${category.id}`}
                                            checked={formData.categories.includes(category.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setFormData({
                                                        ...formData,
                                                        categories: [...formData.categories, category.id]
                                                    })
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        categories: formData.categories.filter(id => id !== category.id)
                                                    })
                                                }
                                            }}
                                        />
                                        <label htmlFor={`category-${category.id}`} className="text-sm">
                                            {category.name.ar} {category.name.en && `(${category.name.en})`}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">{formData.categories.length} categories selected</p>
                    </div>
                )}

                {/* Cart total input for cart_total type */}
                {formData.type === "cart_total" && (
                    <div className="space-y-2">
                        <Label htmlFor="min_cart_total">Minimum Cart Total (IQD)</Label>
                        <Input
                            id="min_cart_total"
                            type="number"
                            placeholder="e.g: 50000"
                            value={formData.min_cart_total || ""}
                            onChange={(e) => setFormData({ ...formData, min_cart_total: Number(e.target.value) })}
                            min="0"
                        />
                        <p className="text-sm text-gray-500">
                            Set the minimum cart total above zero and not too low relative to your product prices.
                            Otherwise, all your customers will get the discount.
                        </p>
                    </div>
                )}
            </div>

            {/* Step 3: Specify discount limitations */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 3. Specify discount limitations</h3>
                <p className="text-sm text-gray-600">Set up under what conditions your discount is available.</p>

                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value: "draft" | "active" | "inactive") => setFormData({ ...formData, status: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="start_at">Start Date</Label>
                        <Input
                            id="start_at"
                            type="datetime-local"
                            value={formData.start_at ? format(formData.start_at, "yyyy-MM-dd'T'HH:mm") : ""}
                            onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined
                                setFormData({ ...formData, start_at: date })
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="end_at">End Date</Label>
                        <Input
                            id="end_at"
                            type="datetime-local"
                            value={formData.end_at ? format(formData.end_at, "yyyy-MM-dd'T'HH:mm") : ""}
                            onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined
                                setFormData({ ...formData, end_at: date })
                            }}
                            min={formData.start_at ? format(formData.start_at, "yyyy-MM-dd'T'HH:mm") : undefined}
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
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
                    {submitting ? "Saving..." : isEdit ? "Update Promotion" : "Create and Launch"}
                </Button>
            </div>
        </div>
    )
}
