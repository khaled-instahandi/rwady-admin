"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { apiService, type Product } from "@/lib/api"
import { ProductImagesEditor } from "@/components/products/product-images-editor"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  ArrowLeft, ChevronDown, Package, DollarSign, ImageIcon, Save, Film, Calendar,
  Star, Tag, ShoppingCart, Truck, Scale, Box, Ruler, Palette
} from "lucide-react"

export default function BulkProductEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    pricing: false,
    inventory: false,
    shipping: false,
  })

  // Add state to track edited products
  const [editedProducts, setEditedProducts] = useState<Record<number, Partial<Product>>>({})
  const [isSaving, setIsSaving] = useState(false)

  const [columns, setColumns] = useState({
    productGallery: true,
    name: true,
    sku: true,
    availability: true,
    description: false,
    categories: false,
    productSubtitle: false,
    ribbon: false,
    ribbonColor: false,
    featuredOnHomepage: false,
    isRecommended: false,
    customUrlSlug: false,
    price: true,
    compareToPrice: true, // price_after_discount
    priceDiscountStart: false,
    priceDiscountEnd: false,
    costPrice: false,
    costPriceAfterDiscount: false,
    costPriceDiscountStart: false,
    costPriceDiscountEnd: false,
    set: false,
    stock: true,
    stockUnlimited: true,
    outOfStockBehavior: false,
    lowStockNotification: false,
    minimumPurchaseQuantity: false, // minimum_purchase
    maximumPurchaseQuantity: false, // maximum_purchase
    requiresShippingOrPickup: false, // requires_shipping
    weight: false,
    dimensions: false, // length, width, height
    shippingType: false,
    shippingRateSingle: false,
    shippingRateMulti: false,
    colors: false,
  })

  useEffect(() => {
    fetchProducts()
  }, [searchParams])

  const fetchProducts = async () => {
    try {
      setLoading(true)

      // Get filter parameters from URL
      const selectedProductIds = searchParams.get('selected')
      const search = searchParams.get('search')
      const status = searchParams.get('status')
      const categoryId = searchParams.get('category_id')
      const brandId = searchParams.get('brand_id')
      const priceMin = searchParams.get('price_min')
      const priceMax = searchParams.get('price_max')
      const stockStatus = searchParams.get('stock_status')
      const requiresShipping = searchParams.get('requires_shipping')
      const shippingType = searchParams.get('shipping_type')
      const sortField = searchParams.get('sort_field')
      const sortOrder = searchParams.get('sort_order')

      // Build API parameters
      const apiParams: any = { limit: 1000 } // Increased limit for bulk edit

      // Add search parameter
      if (search) {
        apiParams.search = search
      }

      // Add filter parameters
      if (status && status !== 'any') {
        apiParams.availability = status === 'enabled' ? 1 : 0
      }
      if (categoryId && categoryId !== 'any') {
        apiParams.category_id = categoryId
      }
      if (brandId && brandId !== 'any') {
        apiParams.brand_id = brandId
      }
      if (priceMin) {
        apiParams.price_min = priceMin
      }
      if (priceMax) {
        apiParams.price_max = priceMax
      }
      if (stockStatus && stockStatus !== 'any') {
        if (stockStatus === 'in_stock') {
          apiParams.stock_status = 'in_stock'
        } else if (stockStatus === 'out_of_stock') {
          apiParams.stock_status = 'out_of_stock'
        } else if (stockStatus === 'unlimited') {
          apiParams.stock_unlimited = true
        } else if (stockStatus === 'preorder') {
          apiParams.out_of_stock = 'show_and_allow_pre_order'
        }
      }
      if (requiresShipping !== null && requiresShipping !== undefined) {
        apiParams.requires_shipping = requiresShipping === 'true'
      }
      if (shippingType && shippingType !== 'any') {
        apiParams.shipping_type = shippingType
      }
      if (sortField) {
        apiParams.sort_field = sortField
      }
      if (sortOrder) {
        apiParams.sort_order = sortOrder
      }

      const response = await apiService.getProducts(apiParams)

      if (response.success) {
        let filteredProducts = response.data

        // If specific products were selected, filter to only those
        if (selectedProductIds) {
          const selectedIds = selectedProductIds.split(',').map(id => parseInt(id.trim()))
          filteredProducts = response.data.filter(product => selectedIds.includes(product.id))
          
          // Also pre-select these products in the bulk editor
          setSelectedProducts(selectedIds.filter(id => filteredProducts.some(p => p.id === id)))
        }

        setProducts(filteredProducts)
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
  }

  // Handle field change for a product
  const handleProductChange = (productId: number, field: keyof Product, value: any) => {
    setEditedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }))
  }

  // Save changes to the backend
  const saveChanges = async () => {
    if (Object.keys(editedProducts).length === 0) {
      toast({
        title: "No changes",
        description: "No changes to save",
      })
      return
    }

    setIsSaving(true)

    try {
      // Process each edited product individually
      const updatePromises = Object.entries(editedProducts).map(async ([productIdStr, changes]) => {
        const productId = parseInt(productIdStr)
        return await apiService.updateProduct(productId, changes)
      })

      // Wait for all updates to complete
      const results = await Promise.all(updatePromises)

      // Check if all updates were successful
      const allSuccessful = results.every(result => result.success)

      if (allSuccessful) {
        toast({
          title: "Success",
          description: "Products updated successfully",
        })

        // Refresh products list
        fetchProducts()

        // Clear edit tracking
        setEditedProducts({})
      } else {
        const failedCount = results.filter(result => !result.success).length
        toast({
          title: "Warning",
          description: `${failedCount} products failed to update`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating products:", error)
      toast({
        title: "Error",
        description: "An error occurred while saving changes",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const toggleColumn = (column: keyof typeof columns) => {
    setColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }

  // Count active columns
  const activeColumnsCount = Object.values(columns).filter(Boolean).length

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

  const formatPrice = (price: number) => {
    return price.toLocaleString()
  }

  // Function to get descriptive text about what products are being edited
  const getEditingDescription = () => {
    const selectedProductIds = searchParams.get('selected')
    const search = searchParams.get('search')
    const hasFilters = searchParams.get('status') || 
                      searchParams.get('category_id') || 
                      searchParams.get('brand_id') || 
                      searchParams.get('price_min') || 
                      searchParams.get('price_max') || 
                      searchParams.get('stock_status') || 
                      searchParams.get('requires_shipping') || 
                      searchParams.get('shipping_type')

    if (selectedProductIds) {
      const selectedIds = selectedProductIds.split(',').map(id => parseInt(id.trim()))
      return `Editing ${selectedIds.length} selected products`
    }

    if (search || hasFilters) {
      let description = "Editing filtered products"
      if (search) {
        description += ` (search: "${search}")`
      }
      if (hasFilters) {
        description += " with applied filters"
      }
      return description
    }

    return `Editing all products (${products.length} total)`
  }

  // This has been replaced by saveChanges, removing to avoid duplication

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-full space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/catalog/products")}
                className="hover:bg-blue-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2 text-blue-600" />
                <span className="text-blue-600 font-medium">BACK</span>
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Bulk Product Editor
                </h1>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Save time and effort with this spreadsheet-like interface. Edit properties of multiple products at once.
                  </p>
                  <p className="text-blue-600 font-medium text-sm">
                    {getEditingDescription()}
                  </p>
                  <p className="text-gray-600 text-sm">
                    <span className="text-blue-600 cursor-pointer hover:underline font-medium"
                      onClick={() => router.push("/catalog/products")}>
                      Switch to individual product editing →
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={saveChanges}
              disabled={isSaving || Object.keys(editedProducts).length === 0}
              variant="default"
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 px-6 py-3"
            >
              <Save className="h-5 w-5" />
              {isSaving ? "Saving..." : `Save Changes (${Object.keys(editedProducts).length})`}
            </Button>
          </div>
        </div>

        {/* No products message */}
        {products.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-8 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchParams.get('selected') 
                ? "The selected products could not be found or may have been deleted."
                : "No products match the current filters or search criteria."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.push("/catalog/products")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
              {!searchParams.get('selected') && (
                <Button
                  onClick={() => router.push("/catalog/products/bulk-edit")}
                  variant="outline"
                >
                  Edit All Products
                </Button>
              )}
            </div>
          </div>
        )}

        {products.length > 0 && (
        <div className="flex gap-6 h-[calc(100vh-240px)]">
          {/* Sidebar - Fixed width */}
          <div className="w-80 flex-shrink-0">
            {/* Columns Filter */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg overflow-hidden h-full flex flex-col">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Columns</h3>
                    <span className="text-sm text-gray-500">({activeColumnsCount} active)</span>
                  </div>
                </div>
              </div>

              {/* Scrollable sections container */}
              <div className="flex-1 overflow-y-auto">
                {/* General Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => toggleSection("general")}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium text-gray-900">General</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 text-blue-600 ${expandedSections.general ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  {expandedSections.general && (
                    <div className="px-4 pb-4 space-y-3 bg-gradient-to-r from-blue-25 to-indigo-25">{/* ...existing general options... */}
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("productGallery")}
                      >
                        <span className={`text-sm ${columns.productGallery ? "" : "text-gray-500"}`}>Product gallery</span>
                        <Checkbox checked={columns.productGallery} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("name")}
                      >
                        <span className={`text-sm ${columns.name ? "" : "text-gray-500"}`}>Name</span>
                        <Checkbox checked={columns.name} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("sku")}
                      >
                        <span className={`text-sm ${columns.sku ? "" : "text-gray-500"}`}>SKU</span>
                        <Checkbox checked={columns.sku} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("availability")}
                      >
                        <span className={`text-sm ${columns.availability ? "" : "text-gray-500"}`}>Availability</span>
                        <Checkbox checked={columns.availability} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("description")}
                      >
                        <span className={`text-sm ${columns.description ? "" : "text-gray-500"}`}>Description</span>
                        <Checkbox checked={columns.description} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("ribbon")}
                      >
                        <span className={`text-sm ${columns.ribbon ? "" : "text-gray-500"}`}>Ribbon</span>
                        <Checkbox checked={columns.ribbon} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("featuredOnHomepage")}
                      >
                        <span className={`text-sm ${columns.featuredOnHomepage ? "" : "text-gray-500"}`}>Featured on homepage</span>
                        <Checkbox checked={columns.featuredOnHomepage} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("isRecommended")}
                      >
                        <span className={`text-sm ${columns.isRecommended ? "" : "text-gray-500"}`}>Recommended</span>
                        <Checkbox checked={columns.isRecommended} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("ribbonColor")}
                      >
                        <span className={`text-sm ${columns.ribbonColor ? "" : "text-gray-500"}`}>Ribbon color</span>
                        <Checkbox checked={columns.ribbonColor} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing Section */}
                <div className="border-b">
                  <button
                    onClick={() => toggleSection("pricing")}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  >
                    <span className="font-medium">Pricing</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expandedSections.pricing ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expandedSections.pricing && (
                    <div className="px-4 pb-4 space-y-2">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("price")}
                      >
                        <span className={`text-sm ${columns.price ? "" : "text-gray-500"}`}>Price</span>
                        <Checkbox checked={columns.price} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("compareToPrice")}
                      >
                        <span className={`text-sm ${columns.compareToPrice ? "" : "text-gray-500"}`}>Discounted price</span>
                        <Checkbox checked={columns.compareToPrice} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("priceDiscountStart")}
                      >
                        <span className={`text-sm ${columns.priceDiscountStart ? "" : "text-gray-500"}`}>Discount start date</span>
                        <Checkbox checked={columns.priceDiscountStart} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("priceDiscountEnd")}
                      >
                        <span className={`text-sm ${columns.priceDiscountEnd ? "" : "text-gray-500"}`}>Discount end date</span>
                        <Checkbox checked={columns.priceDiscountEnd} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("costPrice")}
                      >
                        <span className={`text-sm ${columns.costPrice ? "" : "text-gray-500"}`}>Cost price</span>
                        <Checkbox checked={columns.costPrice} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Inventory Section */}
                <div className="border-b">
                  <button
                    onClick={() => toggleSection("inventory")}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  >
                    <span className="font-medium">Inventory</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expandedSections.inventory ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expandedSections.inventory && (
                    <div className="px-4 pb-4 space-y-2">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("stock")}
                      >
                        <span className={`text-sm ${columns.stock ? "" : "text-gray-500"}`}>Stock</span>
                        <Checkbox checked={columns.stock} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("stockUnlimited")}
                      >
                        <span className={`text-sm ${columns.stockUnlimited ? "" : "text-gray-500"}`}>Stock unlimited</span>
                        <Checkbox checked={columns.stockUnlimited} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("outOfStockBehavior")}
                      >
                        <span className={`text-sm ${columns.outOfStockBehavior ? "" : "text-gray-500"}`}>Out of stock behavior</span>
                        <Checkbox checked={columns.outOfStockBehavior} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("minimumPurchaseQuantity")}
                      >
                        <span className={`text-sm ${columns.minimumPurchaseQuantity ? "" : "text-gray-500"}`}>Minimum purchase quantity</span>
                        <Checkbox checked={columns.minimumPurchaseQuantity} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("maximumPurchaseQuantity")}
                      >
                        <span className={`text-sm ${columns.maximumPurchaseQuantity ? "" : "text-gray-500"}`}>Maximum purchase quantity</span>
                        <Checkbox checked={columns.maximumPurchaseQuantity} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping Section */}
                <div>
                  <button
                    onClick={() => toggleSection("shipping")}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  >
                    <span className="font-medium">Shipping</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expandedSections.shipping ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expandedSections.shipping && (
                    <div className="px-4 pb-4 space-y-2">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("requiresShippingOrPickup")}
                      >
                        <span className={`text-sm ${columns.requiresShippingOrPickup ? "" : "text-gray-500"}`}>Requires shipping or pickup</span>
                        <Checkbox checked={columns.requiresShippingOrPickup} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("weight")}
                      >
                        <span className={`text-sm ${columns.weight ? "" : "text-gray-500"}`}>Weight</span>
                        <Checkbox checked={columns.weight} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("dimensions")}
                      >
                        <span className={`text-sm ${columns.dimensions ? "" : "text-gray-500"}`}>Dimensions (L×W×H)</span>
                        <Checkbox checked={columns.dimensions} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("shippingType")}
                      >
                        <span className={`text-sm ${columns.shippingType ? "" : "text-gray-500"}`}>Shipping type</span>
                        <Checkbox checked={columns.shippingType} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("shippingRateSingle")}
                      >
                        <span className={`text-sm ${columns.shippingRateSingle ? "" : "text-gray-500"}`}>Shipping rate (single)</span>
                        <Checkbox checked={columns.shippingRateSingle} />
                      </div>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleColumn("shippingRateMulti")}
                      >
                        <span className={`text-sm ${columns.shippingRateMulti ? "" : "text-gray-500"}`}>Shipping rate (multi)</span>
                        <Checkbox checked={columns.shippingRateMulti} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Changes Button - Fixed at bottom */}
            <div className="p-4 border-t border-gray-100 bg-white/80 flex-shrink-0">
              <Button
                className="w-full"
                variant="default"
                onClick={saveChanges}
                disabled={isSaving || Object.keys(editedProducts).length === 0}
              >
                {isSaving ? (
                  <>
                    <Package className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes ({Object.keys(editedProducts).length})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Main Content - Scrollable table */}
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white border rounded-lg overflow-hidden h-full flex flex-col">
              {/* Table container with scroll */}
              <div className="flex-1 overflow-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="w-12 p-3">
                        <Checkbox
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      {columns.productGallery && (
                        <th className="p-3 w-20 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center justify-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            <span>Gallery</span>
                          </div>
                        </th>
                      )}
                      {columns.name && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            Name
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.sku && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            SKU
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.availability && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            Availability
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.description && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            Description
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.categories && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            Categories
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.productSubtitle && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            Subtitle
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.isRecommended && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Recommended
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.ribbon && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Ribbon
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.ribbonColor && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Ribbon Color
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.price && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Price
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.compareToPrice && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Discounted Price
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.priceDiscountStart && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Discount Start
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.priceDiscountEnd && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Discount End
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.costPrice && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Cost Price
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.stock && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Stock
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.stockUnlimited && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            Unlimited
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.outOfStockBehavior && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            Out of Stock
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.minimumPurchaseQuantity && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            Min Qty
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.maximumPurchaseQuantity && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            Max Qty
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.requiresShippingOrPickup && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Requires Shipping
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.weight && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            Weight
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.dimensions && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Dimensions
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.shippingType && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Shipping Type
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.shippingRateSingle && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Shipping Rate (Single)
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                      {columns.shippingRateMulti && (
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Shipping Rate (Multi)
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{index + 1}</span>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => handleSelectProduct(product.id)}
                            />
                          </div>
                        </td>

                        {/* Product Gallery/Image */}
                        {columns.productGallery && (
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {/* Main image preview */}
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden relative group">
                                {product.media.length > 0 && product.media.find(m => m.type === "image") ? (
                                  <img
                                    src={product.media.find(m => m.type === "image")?.url || "/placeholder.svg"}
                                    alt={product.name.en}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-400" />
                                )}

                                {/* Media count overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                    {product.media.filter(m => m.type === "image").length > 0 && (
                                      <div className="bg-white rounded-full p-1 text-xs font-medium">
                                        {product.media.filter(m => m.type === "image").length}
                                      </div>
                                    )}
                                    {product.media.filter(m => m.type === "video").length > 0 && (
                                      <div className="bg-white rounded-full p-1 text-xs font-medium">
                                        <Film className="h-3 w-3" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Edit images button */}
                              <ProductImagesEditor
                                productId={product.id}
                                images={product.media}
                                onUpdate={(updatedImages) => {
                                  handleProductChange(product.id, "media", updatedImages)
                                }}
                              />
                            </div>
                          </td>
                        )}

                        {/* Name */}
                        {columns.name && (
                          <td className="p-3">
                            <Input
                              value={
                                editedProducts[product.id]?.name?.en !== undefined
                                  ? editedProducts[product.id].name?.en
                                  : product.name.en
                              }
                              onChange={(e) =>
                                handleProductChange(product.id, "name", {
                                  ar: product.name.ar,
                                  en: e.target.value
                                })
                              }
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600"
                            />
                          </td>
                        )}

                        {/* SKU */}
                        {columns.sku && (
                          <td className="p-3">
                            <Input
                              disabled
                              value={
                                editedProducts[product.id]?.sku !== undefined
                                  ? editedProducts[product.id].sku || ""
                                  : product.sku || ""
                              }
                              onChange={(e) => handleProductChange(product.id, "sku", e.target.value)}
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600"
                            />
                          </td>
                        )}

                        {/* Availability */}
                        {columns.availability && (
                          <td className="p-3">
                            <Checkbox
                              checked={
                                editedProducts[product.id]?.availability !== undefined
                                  ? editedProducts[product.id].availability
                                  : product.availability
                              }
                              onCheckedChange={(checked) =>
                                handleProductChange(product.id, "availability", Boolean(checked))
                              }
                            />
                          </td>
                        )}

                        {/* Description */}
                        {columns.description && (
                          <td className="p-3">
                            <RichTextEditor
                              value={
                                editedProducts[product.id]?.description?.en !== undefined
                                  ? editedProducts[product.id].description?.en || ""
                                  : product.description.en || ""
                              }
                              onChange={(value) =>
                                handleProductChange(product.id, "description", {
                                  ar: product.description.ar,
                                  en: value
                                })
                              }
                              placeholder="Enter product description..."
                              className="min-h-[150px]"
                            />
                          </td>
                        )}

                        {/* Categories */}
                        {columns.categories && (
                          <td className="p-3">
                            <div className="flex gap-1 flex-wrap">
                              {product.categories && product.categories.length > 0 ? (
                                product.categories.map(category => (
                                  <span key={category.id} className="bg-gray-100 text-xs px-2 py-1 rounded">
                                    {category.name.en}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 text-xs">No categories</span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Product Subtitle */}
                        {columns.productSubtitle && (
                          <td className="p-3">
                            <Input
                              placeholder="Add subtitle"
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600"
                            />
                          </td>
                        )}

                        {/* Is Recommended */}
                        {columns.isRecommended && (
                          <td className="p-3">
                            <Checkbox
                              checked={
                                editedProducts[product.id]?.is_recommended !== undefined
                                  ? editedProducts[product.id].is_recommended
                                  : product.is_recommended
                              }
                              onCheckedChange={(checked) =>
                                handleProductChange(product.id, "is_recommended", Boolean(checked))
                              }
                            />
                          </td>
                        )}

                        {/* Ribbon */}
                        {columns.ribbon && (
                          <td className="p-3">
                            <Input
                              value={
                                editedProducts[product.id]?.ribbon_text?.en !== undefined
                                  ? String(editedProducts[product.id].ribbon_text?.en || "")
                                  : String(product.ribbon_text?.en || "")
                              }
                              onChange={(e) =>
                                handleProductChange(product.id, "ribbon_text", {
                                  ar: product.ribbon_text?.ar || "",
                                  en: e.target.value
                                })
                              }
                              placeholder="Ribbon text"
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600"
                            />
                          </td>
                        )}

                        {/* Ribbon Color */}
                        {columns.ribbonColor && (
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="color" value={
                                  editedProducts[product.id]?.ribbon_color !== undefined
                                    ? editedProducts[product.id].ribbon_color || "#ffffff"
                                    : product.ribbon_color || "#ffffff"
                                }
                                onChange={(e) => handleProductChange(product.id, "ribbon_color", e.target.value)}
                                className="w-8 h-8 p-0 border-0"
                              />
                              <Input
                                value={
                                  editedProducts[product.id]?.ribbon_color !== undefined
                                    ? editedProducts[product.id].ribbon_color
                                    : product.ribbon_color || ""
                                }
                                onChange={(e) => handleProductChange(product.id, "ribbon_color", e.target.value)}
                                placeholder="#FFFFFF"
                                className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600 w-20"
                              />
                            </div>
                          </td>
                        )}

                        {/* Price */}
                        {columns.price && (
                          <td className="p-3">
                            <Input
                              value={
                                editedProducts[product.id]?.price !== undefined
                                  ? editedProducts[product.id].price
                                  : product.price
                              }
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d.]/g, '');
                                handleProductChange(product.id, "price", parseFloat(value) || 0);
                              }}
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600"
                            />
                          </td>
                        )}

                        {/* Compare To Price / Price After Discount */}
                        {columns.compareToPrice && (
                          <td className="p-3">
                            <Input
                              value={
                                editedProducts[product.id]?.price_after_discount !== undefined
                                  ? editedProducts[product.id].price_after_discount || ""
                                  : product.price_after_discount || ""
                              }
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d.]/g, '');
                                handleProductChange(product.id, "price_after_discount", parseFloat(value) || 0);
                              }}
                              placeholder="Discounted price"
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600"
                            />
                          </td>
                        )}

                        {/* Price Discount Start */}
                        {columns.priceDiscountStart && (
                          <td className="p-3">
                            <Input
                              type="date"
                              value={
                                editedProducts[product.id]?.price_discount_start !== undefined
                                  ? String(editedProducts[product.id].price_discount_start || "").split('T')[0]
                                  : product.price_discount_start ? product.price_discount_start.split('T')[0] : ""
                              }
                              onChange={(e) => handleProductChange(product.id, "price_discount_start", e.target.value)}
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600"
                            />
                          </td>
                        )}

                        {/* Price Discount End */}
                        {columns.priceDiscountEnd && (
                          <td className="p-3">
                            <Input
                              type="date"
                              value={
                                editedProducts[product.id]?.price_discount_end !== undefined
                                  ? String(editedProducts[product.id].price_discount_end || "").split('T')[0]
                                  : product.price_discount_end ? product.price_discount_end.split('T')[0] : ""
                              }
                              onChange={(e) => handleProductChange(product.id, "price_discount_end", e.target.value)}
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600"
                            />
                          </td>
                        )}

                        {/* Cost Price */}
                        {columns.costPrice && (
                          <td className="p-3">
                            <Input
                              value={
                                editedProducts[product.id]?.cost_price !== undefined
                                  ? editedProducts[product.id].cost_price || ""
                                  : product.cost_price || ""
                              }
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d.]/g, '');
                                handleProductChange(product.id, "cost_price", parseFloat(value) || 0);
                              }}
                              placeholder="Cost price"
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600"
                            />
                          </td>
                        )}

                        {/* Stock */}
                        {columns.stock && (
                          <td className="p-3">
                            <Input
                              type="number"
                              value={
                                editedProducts[product.id]?.stock !== undefined
                                  ? editedProducts[product.id].stock
                                  : product.stock
                              }
                              onChange={(e) => handleProductChange(product.id, "stock", parseInt(e.target.value) || 0)}
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600"
                            />
                          </td>
                        )}

                        {/* Stock Unlimited */}
                        {columns.stockUnlimited && (
                          <td className="p-3">
                            <Checkbox
                              checked={
                                editedProducts[product.id]?.stock_unlimited !== undefined
                                  ? Boolean(editedProducts[product.id].stock_unlimited)
                                  : Boolean(product.stock_unlimited)
                              }
                              onCheckedChange={(checked) =>
                                handleProductChange(product.id, "stock_unlimited", Boolean(checked))
                              }
                            />
                          </td>
                        )}

                        {/* Out of Stock Behavior */}
                        {columns.outOfStockBehavior && (
                          <td className="p-3">
                            <Select
                              value={
                                editedProducts[product.id]?.out_of_stock !== undefined
                                  ? editedProducts[product.id].out_of_stock
                                  : product.out_of_stock
                              }
                              onValueChange={(value) => {
                                handleProductChange(product.id, "out_of_stock", value);
                              }}
                            >
                              <SelectTrigger className="border-0 p-0 h-auto focus-visible:ring-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hide_from_storefront">Hide from storefront</SelectItem>
                                <SelectItem value="show_as_sold_out">Show as sold out</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        )}

                        {/* Minimum Purchase */}
                        {columns.minimumPurchaseQuantity && (
                          <td className="p-3">
                            <Input
                              type="number"
                              value={
                                editedProducts[product.id]?.minimum_purchase !== undefined
                                  ? editedProducts[product.id].minimum_purchase
                                  : product.minimum_purchase || 1
                              }
                              onChange={(e) => handleProductChange(product.id, "minimum_purchase", parseInt(e.target.value) || 1)}
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600 w-16"
                            />
                          </td>
                        )}

                        {/* Maximum Purchase */}
                        {columns.maximumPurchaseQuantity && (
                          <td className="p-3">
                            <Input
                              type="number"
                              value={
                                editedProducts[product.id]?.maximum_purchase !== undefined
                                  ? editedProducts[product.id].maximum_purchase || ""
                                  : product.maximum_purchase || ""
                              }
                              onChange={(e) => handleProductChange(product.id, "maximum_purchase", parseInt(e.target.value) || 0)}
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600 w-16"
                            />
                          </td>
                        )}

                        {/* Requires Shipping */}
                        {columns.requiresShippingOrPickup && (
                          <td className="p-3">
                            <Checkbox
                              checked={
                                editedProducts[product.id]?.requires_shipping !== undefined
                                  ? Boolean(editedProducts[product.id].requires_shipping)
                                  : Boolean(product.requires_shipping)
                              }
                              onCheckedChange={(checked) =>
                                handleProductChange(product.id, "requires_shipping", Boolean(checked))
                              }
                            />
                          </td>
                        )}

                        {/* Weight */}
                        {columns.weight && (
                          <td className="p-3">
                            <Input
                              type="number"
                              step="0.01"
                              value={
                                editedProducts[product.id]?.weight !== undefined
                                  ? editedProducts[product.id].weight || ""
                                  : product.weight || ""
                              }
                              onChange={(e) => handleProductChange(product.id, "weight", parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600 w-20"
                            />
                          </td>
                        )}

                        {/* Dimensions */}
                        {columns.dimensions && (
                          <td className="p-3">
                            <div className="flex gap-1 text-xs">
                              <Input
                                type="number"
                                step="0.01"
                                value={
                                  editedProducts[product.id]?.length !== undefined
                                    ? editedProducts[product.id].length || ""
                                    : product.length || ""
                                }
                                onChange={(e) => handleProductChange(product.id, "length", parseFloat(e.target.value) || 0)}
                                placeholder="L"
                                className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600 w-12"
                              />
                              <span>×</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={
                                  editedProducts[product.id]?.width !== undefined
                                    ? editedProducts[product.id].width || ""
                                    : product.width || ""
                                }
                                onChange={(e) => handleProductChange(product.id, "width", parseFloat(e.target.value) || 0)}
                                placeholder="W"
                                className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600 w-12"
                              />
                              <span>×</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={
                                  editedProducts[product.id]?.height !== undefined
                                    ? editedProducts[product.id].height || ""
                                    : product.height || ""
                                }
                                onChange={(e) => handleProductChange(product.id, "height", parseFloat(e.target.value) || 0)}
                                placeholder="H"
                                className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600 w-12"
                              />
                            </div>
                          </td>
                        )}

                        {/* Shipping Type */}
                        {columns.shippingType && (
                          <td className="p-3">
                            <Select
                              value={
                                editedProducts[product.id]?.shipping_type !== undefined
                                  ? editedProducts[product.id].shipping_type || "default"
                                  : product.shipping_type || "default"
                              }
                              onValueChange={(value) => handleProductChange(product.id, "shipping_type", value)}
                            >
                              <SelectTrigger className="border-0 p-0 h-auto focus-visible:ring-0 w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="free_shipping">Free</SelectItem>
                                <SelectItem value="fixed_shipping">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        )}

                        {/* Shipping Rate Single */}
                        {columns.shippingRateSingle && (
                          <td className="p-3">
                            <Input
                              type="number"
                              step="0.01"
                              value={
                                editedProducts[product.id]?.shipping_rate_single !== undefined
                                  ? editedProducts[product.id].shipping_rate_single || ""
                                  : product.shipping_rate_single || ""
                              }
                              onChange={(e) => handleProductChange(product.id, "shipping_rate_single", parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600 w-20"
                            />
                          </td>
                        )}

                        {/* Shipping Rate Multi */}
                        {columns.shippingRateMulti && (
                          <td className="p-3">
                            <Input
                              type="number"
                              step="0.01"
                              value={
                                editedProducts[product.id]?.shipping_rate_multi !== undefined
                                  ? editedProducts[product.id].shipping_rate_multi || ""
                                  : product.shipping_rate_multi || ""
                              }
                              onChange={(e) => handleProductChange(product.id, "shipping_rate_multi", parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600 w-20"
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}