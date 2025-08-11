"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiService, type Product, type PaginationParams } from "@/lib/api"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Package,
  ChevronDown,
  Download,
  Upload,
  Copy,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

// Debounce function to optimize search input
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
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false) // Separate loading for table updates
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page')
    return pageParam ? parseInt(pageParam, 10) : 1
  })
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const limitParam = searchParams.get('limit')
    return limitParam ? parseInt(limitParam, 10) : 20
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [activeFilters, setActiveFilters] = useState(0)
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loadingFilters, setLoadingFilters] = useState(false)
  const { toast } = useToast()

  // Filter states
  const [filters, setFilters] = useState<{
    status: string
    category_id: string
    brand_id: string
    price_min: string
    price_max: string
    stock_status: string
    sort_field: string
    sort_order: "asc" | "desc"
    requires_shipping?: boolean
    shipping_type?: string
  }>(() => {
    // Initialize filters from URL params
    const status = searchParams.get('status') || 'any'
    const category_id = searchParams.get('category_id') || 'any'
    const brand_id = searchParams.get('brand_id') || 'any'
    const price_min = searchParams.get('price_min') || ''
    const price_max = searchParams.get('price_max') || ''
    const stock_status = searchParams.get('stock_status') || 'any'
    const sort_field = searchParams.get('sort_field') || 'name'
    const sort_order = (searchParams.get('sort_order') as "asc" | "desc") || 'asc'
    const shipping_type = searchParams.get('shipping_type') || 'any'
    const requires_shipping = searchParams.get('requires_shipping')

    return {
      status,
      category_id,
      brand_id,
      price_min,
      price_max,
      stock_status,
      sort_field,
      sort_order,
      shipping_type,
      ...(requires_shipping && { requires_shipping: requires_shipping === 'true' })
    }
  })

  // Apply debounce to search input
  const debouncedSearch = useDebounce(searchInput, 500)

  // Initialize search input from URL
  useEffect(() => {
    const searchParam = searchParams.get('search')
    if (searchParam && searchParam !== searchInput) {
      setSearchInput(searchParam)
    }
  }, [searchParams])

  // Function to update URL parameters
  const updateUrlParams = useCallback((newFilters?: any, page?: number, search?: string, limit?: number) => {
    const params = new URLSearchParams()

    const currentFilters = newFilters || filters
    const currentPage = page || 1
    const currentSearch = search !== undefined ? search : debouncedSearch
    const currentLimit = limit || itemsPerPage

    // Add search parameter
    if (currentSearch) {
      params.set('search', currentSearch)
    }

    // Add page parameter
    if (currentPage > 1) {
      params.set('page', currentPage.toString())
    }

    // Add limit parameter if different from default
    if (currentLimit !== 20) {
      params.set('limit', currentLimit.toString())
    }

    // Add filter parameters
    if (currentFilters.status && currentFilters.status !== 'any') {
      params.set('status', currentFilters.status)
    }
    if (currentFilters.category_id && currentFilters.category_id !== 'any') {
      params.set('category_id', currentFilters.category_id)
    }
    if (currentFilters.brand_id && currentFilters.brand_id !== 'any') {
      params.set('brand_id', currentFilters.brand_id)
    }
    if (currentFilters.price_min) {
      params.set('price_min', currentFilters.price_min)
    }
    if (currentFilters.price_max) {
      params.set('price_max', currentFilters.price_max)
    }
    if (currentFilters.stock_status && currentFilters.stock_status !== 'any') {
      params.set('stock_status', currentFilters.stock_status)
    }
    // Always add sort parameters
    if (currentFilters.sort_field) {
      params.set('sort_field', currentFilters.sort_field)
    }
    if (currentFilters.sort_order) {
      params.set('sort_order', currentFilters.sort_order)
    }
    if (currentFilters.requires_shipping !== undefined) {
      params.set('requires_shipping', currentFilters.requires_shipping.toString())
    }
    if (currentFilters.shipping_type && currentFilters.shipping_type !== 'any') {
      params.set('shipping_type', currentFilters.shipping_type)
    }

    router.push(`?${params.toString()}`, { scroll: false })
  }, [router, filters, debouncedSearch, itemsPerPage])

  // Function to update current page and URL
  const updateCurrentPage = useCallback((page: number) => {
    setCurrentPage(page)
    updateUrlParams(undefined, page)
  }, [updateUrlParams])

  // Function to update items per page
  const updateItemsPerPage = useCallback((limit: number) => {
    setItemsPerPage(limit)
    setCurrentPage(1) // Reset to first page when changing limit
    updateUrlParams(undefined, 1, undefined, limit)
  }, [updateUrlParams])

  // Sync currentPage with URL parameter changes
  useEffect(() => {
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const urlPage = pageParam ? parseInt(pageParam, 10) : 1
    const urlLimit = limitParam ? parseInt(limitParam, 10) : 20

    if (urlPage !== currentPage) {
      setCurrentPage(urlPage)
    }
    if (urlLimit !== itemsPerPage) {
      setItemsPerPage(urlLimit)
    }
  }, [searchParams, currentPage, itemsPerPage])

  // Fetch categories for the filter dropdown
  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiService.getCategories()
      if (response.success) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }, [])

  // Fetch brands for the filter dropdown
  const fetchBrands = useCallback(async () => {
    try {
      const response = await apiService.getBrands()
      if (response.success) {
        setBrands(response.data)
      }
    } catch (error) {
      console.error("Error fetching brands:", error)
    }
  }, [])
  useEffect(() => {
    setLoadingFilters(true)
    Promise.all([fetchCategories(), fetchBrands()])
      .finally(() => setLoadingFilters(false))
  }, [fetchCategories, fetchBrands])

  // Format the sort selection for API parameters
  const getSortParams = useCallback(() => {
    return {
      sort_field: filters.sort_field,
      sort_order: filters.sort_order
    }
  }, [filters.sort_field, filters.sort_order])

  // Count active filters to show on the filter button
  useEffect(() => {
    let count = 0
    if (filters.status && filters.status !== "any") count++
    if (filters.category_id && filters.category_id !== "any") count++
    if (filters.brand_id && filters.brand_id !== "any") count++
    if (filters.price_min || filters.price_max) count++
    if (filters.stock_status && filters.stock_status !== "any") count++
    if (filters.requires_shipping !== undefined) count++
    if (filters.shipping_type && filters.shipping_type !== "any") count++
    setActiveFilters(count)
  }, [filters])

  const fetchProducts = useCallback(async (updateTable = false) => {
    try {
      // Use tableLoading for filter/search updates, loading for initial load
      if (updateTable) {
        setTableLoading(true)
      } else {
        setLoading(true)
      }

      const sortParams = getSortParams()

      // Build filter parameters
      const filterParams: Record<string, any> = {}
      if (filters.status && filters.status !== "any") filterParams.availability = filters.status === "enabled" ? 1 : 0
      if (filters.category_id && filters.category_id !== "any") filterParams.category_id = filters.category_id
      if (filters.brand_id && filters.brand_id !== "any") filterParams.brand_id = filters.brand_id
      if (filters.price_min) filterParams.price_min = filters.price_min
      if (filters.price_max) filterParams.price_max = filters.price_max
      if (filters.stock_status && filters.stock_status !== "any") {
        if (filters.stock_status === "in_stock") {
          filterParams.stock_status = "in_stock"
        } else if (filters.stock_status === "out_of_stock") {
          filterParams.stock_status = "out_of_stock"
        } else if (filters.stock_status === "unlimited") {
          filterParams.stock_unlimited = true
        } else if (filters.stock_status === "preorder") {
          filterParams.out_of_stock = "show_and_allow_pre_order"
        }
      }

      if (filters.requires_shipping !== undefined) {
        filterParams.requires_shipping = filters.requires_shipping
      }

      if (filters.shipping_type && filters.shipping_type !== "any") {
        filterParams.shipping_type = filters.shipping_type
      }

      const response = await apiService.getProducts({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        sort_field: sortParams.sort_field,
        sort_order: sortParams.sort_order,
        ...filterParams,
      })

      if (response.success) {
        setProducts(response.data)
        if (response.meta) {
          setTotalPages(response.meta.last_page)
          setTotalItems(response.meta.total)
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "An error occurred while loading the products",
        variant: "destructive",
      })
    } finally {
      if (updateTable) {
        setTableLoading(false)
      } else {
        setLoading(false)
      }
    }
  }, [currentPage, debouncedSearch, filters, getSortParams, toast, itemsPerPage])

  // Track if this is the first load
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    // Initial load
    if (isInitialLoad) {
      fetchProducts()
      setIsInitialLoad(false)
    }
  }, [isInitialLoad])

  // Handle manual updates (search, filter, pagination changes)
  useEffect(() => {
    if (!isInitialLoad) {
      fetchProducts(true)
    }
  }, [currentPage, itemsPerPage, debouncedSearch, filters, isInitialLoad])

  const handleSearch = (query: string) => {
    setSearchInput(query)
    updateUrlParams(undefined, 1, query)
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateUrlParams(newFilters, 1)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    const newFilters = {
      status: "any",
      category_id: "any",
      brand_id: "any",
      price_min: "",
      price_max: "",
      stock_status: "any",
      sort_field: "name",
      sort_order: "asc" as const,
      shipping_type: "any"
    }
    setFilters(newFilters)
    updateUrlParams(newFilters, 1)
    setCurrentPage(1)
    setSearchInput("")
  }

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p) => p.id))
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      const response = await apiService.deleteProduct(productToDelete.id)

      if (response.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))

        // Close dialog and reset productToDelete before showing toast
        setDeleteDialogOpen(false)
        setProductToDelete(null)

        // Clean up selected products if the deleted product was selected
        setSelectedProducts((prev) => prev.filter(id => id !== productToDelete.id))

        // Show toast after state updates
        toast({
          title: "Deleted",
          description: response.message || "Product deleted successfully",
        })
      } else {
        // Close dialog first
        setDeleteDialogOpen(false)
        setProductToDelete(null)

        // Then show error toast
        toast({
          title: "Error",
          description: response.message || "Failed to delete product",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Close dialog first
      setDeleteDialogOpen(false)
      setProductToDelete(null)

      // Then show error toast
      toast({
        title: "Error",
        description: "An error occurred while deleting the product",
        variant: "destructive",
      })
    }
  }

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} IQD`
  }

  // Generate pagination page numbers
  const getPaginationPages = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning or end
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      // Add ellipsis if there's a gap
      if (startPage > 2) {
        pages.push('...')
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        pages.push('...')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  // Function to generate bulk edit URL with current filters and selected products
  const getBulkEditUrl = () => {
    const params = new URLSearchParams()

    // Add selected products if any
    if (selectedProducts.length > 0) {
      params.set('selected', selectedProducts.join(','))
    }

    // Add current search
    if (debouncedSearch) {
      params.set('search', debouncedSearch)
    }

    // Add current filters
    if (filters.status && filters.status !== 'any') {
      params.set('status', filters.status)
    }
    if (filters.category_id && filters.category_id !== 'any') {
      params.set('category_id', filters.category_id)
    }
    if (filters.brand_id && filters.brand_id !== 'any') {
      params.set('brand_id', filters.brand_id)
    }
    if (filters.price_min) {
      params.set('price_min', filters.price_min)
    }
    if (filters.price_max) {
      params.set('price_max', filters.price_max)
    }
    if (filters.stock_status && filters.stock_status !== 'any') {
      params.set('stock_status', filters.stock_status)
    }
    if (filters.requires_shipping !== undefined) {
      params.set('requires_shipping', filters.requires_shipping.toString())
    }
    if (filters.shipping_type && filters.shipping_type !== 'any') {
      params.set('shipping_type', filters.shipping_type)
    }
    if (filters.sort_field) {
      params.set('sort_field', filters.sort_field)
    }
    if (filters.sort_order) {
      params.set('sort_order', filters.sort_order)
    }

    const paramString = params.toString()
    return paramString ? `?${paramString}` : ''
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="space-y-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex gap-4">
                <div className="h-5 w-5 rounded bg-gray-200 animate-pulse" />
                <div className="h-16 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="flex gap-3">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/catalog/products/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </Link>
          <Link href={`/catalog/products/bulk-edit${getBulkEditUrl()}`}>
            <Button variant="outline">
              {selectedProducts.length > 0
                ? `Bulk Edit Selected (${selectedProducts.length})`
                : "Bulk Edit All"}
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Import or Export Products
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent forceMount>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Import Products
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Products
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className="w-80 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Filters</span>
                {activeFilters > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear ({activeFilters})
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchInput}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any status</SelectItem>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={filters.category_id}
                  onValueChange={(value) => handleFilterChange("category_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any category</SelectItem>
                    {loadingFilters ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Loading...
                      </SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name.en}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Brand</label>
                <Select
                  value={filters.brand_id}
                  onValueChange={(value) => handleFilterChange("brand_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any brand</SelectItem>
                    {loadingFilters ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Loading...
                      </SelectItem>
                    ) : (
                      brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name.en}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Price Range</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.price_min}
                    onChange={(e) => handleFilterChange("price_min", e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.price_max}
                    onChange={(e) => handleFilterChange("price_max", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Stock Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Stock Status</label>
                <Select
                  value={filters.stock_status}
                  onValueChange={(value) => handleFilterChange("stock_status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any stock status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any stock status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="unlimited">Unlimited Stock</SelectItem>
                    <SelectItem value="preorder">Pre-order Enabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Shipping Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Shipping</label>
                <Select
                  value={filters.requires_shipping !== undefined ? (filters.requires_shipping ? "true" : "false") : "any"}
                  onValueChange={(value) => {
                    if (value === "true") {
                      const newFilters = { ...filters, requires_shipping: true }
                      setFilters(newFilters)
                      updateUrlParams(newFilters, 1)
                      setCurrentPage(1)
                    } else if (value === "false") {
                      const newFilters = { ...filters, requires_shipping: false }
                      setFilters(newFilters)
                      updateUrlParams(newFilters, 1)
                      setCurrentPage(1)
                    } else {
                      const newFilters = { ...filters }
                      delete newFilters.requires_shipping
                      setFilters(newFilters)
                      updateUrlParams(newFilters, 1)
                      setCurrentPage(1)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any shipping status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any shipping status</SelectItem>
                    <SelectItem value="true">Requires shipping</SelectItem>
                    <SelectItem value="false">No shipping required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Shipping Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Shipping Type</label>
                <Select
                  value={filters.shipping_type || "any"}
                  onValueChange={(value) => handleFilterChange("shipping_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any shipping type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any shipping type</SelectItem>
                    <SelectItem value="default">Default shipping</SelectItem>
                    <SelectItem value="fixed_shipping">Fixed shipping</SelectItem>
                    <SelectItem value="free_shipping">Free shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Table Controls */}
          <div className="mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  {selectedProducts.length > 0 && (
                    <span className="text-sm text-blue-600 font-medium">
                      {selectedProducts.length} selected
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProducts([])}
                        className="ml-2 h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </Button>
                    </span>
                  )}
                </div>
                <Select
                  value={`${filters.sort_field}_${filters.sort_order}`}
                  onValueChange={(value) => {
                    // Handle special case for created_at
                    let field, order
                    if (value.startsWith('created_at_')) {
                      field = 'created_at'
                      order = value.replace('created_at_', '')
                    } else {
                      const lastUnderscoreIndex = value.lastIndexOf('_')
                      field = value.substring(0, lastUnderscoreIndex)
                      order = value.substring(lastUnderscoreIndex + 1)
                    }

                    const newFilters = {
                      ...filters,
                      sort_field: field,
                      sort_order: order as "asc" | "desc"
                    }
                    setFilters(newFilters)
                    updateUrlParams(newFilters, 1)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Name: A to Z</SelectItem>
                    <SelectItem value="name_desc">Name: Z to A</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="created_at_desc">Newest First</SelectItem>
                    <SelectItem value="created_at_asc">Oldest First</SelectItem>
                    {/* sku */}
                    <SelectItem value="sku_asc">SKU: A to Z</SelectItem>
                    <SelectItem value="sku_desc">SKU: Z to A</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchProducts(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Refresh
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Items per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => updateItemsPerPage(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="text-sm text-gray-600">
              {loading ? (
                "Loading..."
              ) : (
                `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} products`
              )}
            </div>
          </div>

          {/* Products List - This will be the only part that updates */}
          <div id="products-table" className="space-y-1 relative">
            {/* Loading overlay for table updates */}
            {tableLoading && (
              <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Updating...</span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {Array(itemsPerPage).fill(0).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex gap-4">
                      <div className="h-5 w-5 rounded bg-gray-200 animate-pulse" />
                      <div className="h-16 w-16 bg-gray-200 rounded animate-pulse" />
                      <div className="flex-1">
                        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                        <div className="flex gap-3">
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center border rounded-lg bg-gray-50">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="text-gray-600 mt-1">
                  {debouncedSearch || activeFilters > 0
                    ? "Try changing your search or filter criteria"
                    : "Add your first product to get started"
                  }
                </p>
                {(debouncedSearch || activeFilters > 0) && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchInput("");
                      clearFilters();
                    }}
                  >
                    Clear Search & Filters
                  </Button>
                )}
              </div>
            ) : (
              products.map((product) => {
                console.log('Product ID for edit link:', product.id); // Debug log
                return (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => handleSelectProduct(product.id)}
                    />

                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.media.length > 0 && product.media[0].type === "image" ? (
                        <img
                          src={product.media[0].url || "/placeholder.svg?height=64&width=64"}
                          alt={product.name.en}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=64&width=64";
                          }}
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{product.name.en}</h3>
                          <p className="text-sm text-gray-500">{product.sku}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={product.availability ? "default" : "secondary"}>
                                {product.availability ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={product.stock > 0 || product.stock_unlimited ? "default" : "destructive"}>
                                {product.stock_unlimited ? "In stock" : product.stock > 0 ? "In stock" : "Out of stock"}
                              </Badge>
                            </div>
                            {product.requires_shipping && (
                              <div className="flex items-center gap-2">
                                <Package className="h-3 w-3 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {product.shipping_type === "free_shipping"
                                    ? "Free shipping"
                                    : product.shipping_type === "fixed_shipping"
                                      ? `Fixed shipping (${product.shipping_rate_single?.toLocaleString()} IQD)`
                                      : "Default shipping"}
                                </span>
                              </div>
                            )}
                            {product.out_of_stock === "show_and_allow_pre_order" && product.stock <= 0 && !product.stock_unlimited && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Pre-order enabled
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">{formatPrice(product.price)}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Actions
                                  <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" forceMount>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/catalog/products/${product.id}`}
                                    onClick={(e) => {
                                      console.log('Navigating to:', `/catalog/products/${product.id}`);
                                      console.log('Product ID:', product.id);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setProductToDelete(product)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && !loading && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} • {totalItems} total items
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-1" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPaginationPages().map((page, index) => (
                  <div key={index}>
                    {page === '...' ? (
                      <span className="px-3 py-1 text-gray-500">
                        <MoreHorizontal className="h-4 w-4" />
                      </span>
                    ) : (
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateCurrentPage(page as number)}
                        className="px-3"
                      >
                        {page}
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3"
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        modal={true}
        onOpenChange={(open) => {
          // Only update if it's being closed
          if (!open) {
            setDeleteDialogOpen(false);
            // Only reset productToDelete after dialog is closed with a small delay
            setTimeout(() => {
              setProductToDelete(null);
            }, 100);
          } else {
            setDeleteDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
          // Prevent interaction outside while dialog is open
          e.preventDefault();
        }} onEscapeKeyDown={(e) => {
          // Allow Escape key to close the dialog without causing focus issues
          e.preventDefault();
          setDeleteDialogOpen(false);
        }}>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the product "{productToDelete?.name.en}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false);
              // Don't reset productToDelete here, let the onOpenChange handler do it
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              handleDeleteProduct();
            }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
