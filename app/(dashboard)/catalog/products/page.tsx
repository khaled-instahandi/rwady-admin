"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page')
    return pageParam ? parseInt(pageParam, 10) : 1
  })
  const [totalPages, setTotalPages] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
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
    sort_by: string
    sort_direction: "asc" | "desc"
    requires_shipping?: boolean
    shipping_type?: string
  }>({
    status: "any",
    category_id: "any",
    brand_id: "any",
    price_min: "",
    price_max: "",
    stock_status: "any",
    sort_by: "NAME: A TO Z",
    sort_direction: "asc",
  })

  // Apply debounce to search input
  const debouncedSearch = useDebounce(searchInput, 500)

  // Function to update URL parameters
  const updateUrlParams = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page > 1) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  // Function to update current page and URL
  const updateCurrentPage = useCallback((page: number) => {
    setCurrentPage(page)
    updateUrlParams(page)
  }, [updateUrlParams])

  // Sync currentPage with URL parameter changes
  useEffect(() => {
    const pageParam = searchParams.get('page')
    const urlPage = pageParam ? parseInt(pageParam, 10) : 1
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage)
    }
  }, [searchParams, currentPage])

  // Fetch categories for the filter dropdown
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingFilters(true)
      const response = await apiService.getCategories()
      if (response.success) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoadingFilters(false)
    }
  }, [])

  // Fetch brands for the filter dropdown
  const fetchBrands = useCallback(async () => {
    try {
      setLoadingFilters(true)
      const response = await apiService.getBrands()
      if (response.success) {
        setBrands(response.data)
      }
    } catch (error) {
      console.error("Error fetching brands:", error)
    } finally {
      setLoadingFilters(false)
    }
  }, [])
  useEffect(() => {
    fetchCategories()
    fetchBrands()
  }, [fetchCategories, fetchBrands])

  // Format the sort selection for API parameters
  const getSortParams = useCallback(() => {
    switch (filters.sort_by) {
      case "NAME: A TO Z":
        return { sort_by: "name", sort_direction: "asc" as const }
      case "NAME: Z TO A":
        return { sort_by: "name", sort_direction: "desc" as const }
      case "PRICE: LOW TO HIGH":
        return { sort_by: "price", sort_direction: "asc" as const }
      case "PRICE: HIGH TO LOW":
        return { sort_by: "price", sort_direction: "desc" as const }
      default:
        return { sort_by: "name", sort_direction: "asc" as const }
    }
  }, [filters.sort_by])

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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)

      const sortParams = getSortParams()

      // Build filter parameters
      const filterParams: Record<string, any> = {}
      if (filters.status && filters.status !== "any") filterParams.availability = filters.status === "enabled" ? 1 : 0
      if (filters.category_id && filters.category_id !== "any") filterParams.category_id = filters.category_id
      if (filters.brand_id && filters.brand_id !== "any") filterParams.brand_id = filters.brand_id
      if (filters.price_min) filterParams.price_min = filters.price_min
      if (filters.price_max) filterParams.price_max = filters.price_max
      if (filters.stock_status && filters.stock_status !== "any") {
        if (filters.stock_status === "in_stock") filterParams.stock_status = "in_stock"
        if (filters.stock_status === "out_of_stock") filterParams.stock_status = "out_of_stock"
        if (filters.stock_status === "unlimited") filterParams.stock_unlimited = true
        if (filters.stock_status === "preorder") filterParams.out_of_stock = "show_and_allow_pre_order"
      }

      if (filters.requires_shipping !== undefined) {
        filterParams.requires_shipping = filters.requires_shipping
      }

      if (filters.shipping_type && filters.shipping_type !== "any") {
        filterParams.shipping_type = filters.shipping_type
      }

      const response = await apiService.getProducts({
        page: currentPage,
        limit: 20,
        search: debouncedSearch,
        sort_by: sortParams.sort_by,
        sort_direction: sortParams.sort_direction,
        ...filterParams,
      })

      if (response.success) {
        setProducts(response.data)
        if (response.meta) {
          setTotalPages(response.meta.last_page)
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
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters, getSortParams, toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearch = (query: string) => {
    setSearchInput(query)
    updateCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    updateCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      status: "any",
      category_id: "any",
      brand_id: "any",
      price_min: "",
      price_max: "",
      stock_status: "any",
      sort_by: "NAME: A TO Z",
      sort_direction: "asc",
      shipping_type: "any"
    })
    updateCurrentPage(1)
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
          <Link href="/catalog/products/bulk-edit">
            <Button variant="outline">Bulk Edit All</Button>
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

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterDialogOpen(true)}
            className={activeFilters > 0 ? "border-blue-500 text-blue-600" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {activeFilters > 0 && (
              <span className="ml-2 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by product name, SKU, UPC..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedProducts.length === products.length && products.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange("sort_by", value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="NAME: A TO Z">NAME: A TO Z</SelectItem>
                <SelectItem value="NAME: Z TO A">NAME: Z TO A</SelectItem>
                <SelectItem value="PRICE: LOW TO HIGH">PRICE: LOW TO HIGH</SelectItem>
                <SelectItem value="PRICE: HIGH TO LOW">PRICE: HIGH TO LOW</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchProducts}
              className="text-blue-600 hover:text-blue-700"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-1">
        {products.length === 0 ? (
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
                        <div
                          className={`w-2 h-2 rounded-full ${product.availability ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        <span className={`text-sm ${product.availability ? "text-green-600" : "text-gray-500"}`}>
                          {product.availability ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${product.stock > 0 || product.stock_unlimited ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <span className="text-sm text-gray-600">
                          {product.stock_unlimited ? "In stock" : product.stock > 0 ? "In stock" : "Out of stock"}
                        </span>
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
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-sm text-orange-600">Pre-order enabled</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{formatPrice(product.price)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Edit Product
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
                                // Test manual navigation
                                // e.preventDefault();
                                // window.location.href = `/catalog/products/${product.id}`;
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {/* <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem> */}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => updateCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => updateCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

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

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        modal={true}
        onOpenChange={(open) => {
          setFilterDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
          // Prevent interaction outside while dialog is open
          e.preventDefault();
        }} onEscapeKeyDown={(e) => {
          // Allow Escape key to close the dialog without causing focus issues
          e.preventDefault();
          setFilterDialogOpen(false);
        }}>
          <DialogHeader>
            <DialogTitle>Filter Products</DialogTitle>
            <DialogDescription>
              Select criteria to filter the products list.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              // className="col-span-3"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="any">Any status</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">Category</label>
              <Select
                value={filters.category_id}
                onValueChange={(value) => handleFilterChange("category_id", value)}
              // className="col-span-3"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any category" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="any">Any category</SelectItem>
                  {categories.length === 0 && (
                    <SelectItem value="loading" disabled>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Loading categories...
                    </SelectItem>
                  )}
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">Brand</label>
              <Select
                value={filters.brand_id}
                onValueChange={(value) => handleFilterChange("brand_id", value)}
              // className="col-span-3"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any brand" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="any">Any brand</SelectItem>
                  {brands.length === 0 && (
                    <SelectItem value="loading" disabled>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Loading brands...
                    </SelectItem>
                  )}
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">Price</label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.price_min}
                  onChange={(e) => handleFilterChange("price_min", e.target.value)}
                  className="flex-1"
                />
                <span>to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.price_max}
                  onChange={(e) => handleFilterChange("price_max", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">Stock</label>
              <Select
                value={filters.stock_status}
                onValueChange={(value) => handleFilterChange("stock_status", value)}
              // className="col-span-3"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any stock status" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="any">Any stock status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="unlimited">Unlimited Stock</SelectItem>
                  <SelectItem value="preorder">Pre-order Enabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">Shipping</label>
              <Select
                value={filters.requires_shipping !== undefined ? (filters.requires_shipping ? "true" : "false") : "any"}
                onValueChange={(value) => {
                  if (value === "true") {
                    setFilters(prev => ({ ...prev, requires_shipping: true }));
                  } else if (value === "false") {
                    setFilters(prev => ({ ...prev, requires_shipping: false }));
                  } else {
                    setFilters(prev => {
                      const newFilters = { ...prev };
                      delete newFilters.requires_shipping;
                      return newFilters;
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Shipping requirement" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="any">Any shipping status</SelectItem>
                  <SelectItem value="true">Requires shipping</SelectItem>
                  <SelectItem value="false">No shipping required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">Shipping Type</label>
              <Select
                value={filters.shipping_type || "any"}
                onValueChange={(value) => handleFilterChange("shipping_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any shipping type" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="any">Any shipping type</SelectItem>
                  <SelectItem value="default">Default shipping</SelectItem>
                  <SelectItem value="fixed_shipping">Fixed shipping</SelectItem>
                  <SelectItem value="free_shipping">Free shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button onClick={() => {
              fetchProducts()
              setFilterDialogOpen(false)
            }}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
