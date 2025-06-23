"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { apiService, type Product } from "@/lib/api"
import {
  ArrowLeft, ChevronDown, Package, DollarSign, ImageIcon, Save, Film, Calendar,
  Star, Tag, ShoppingCart, Truck, Scale, Box, Ruler, Palette
} from "lucide-react"

export default function BulkProductEditor() {
  const router = useRouter()
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
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await apiService.getProducts({ limit: 100 })

      if (response.success) {
        setProducts(response.data)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/catalog/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            BACK
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Product Editor</h1>
            <p className="text-gray-600 mt-1">
              Save time and effort with this spreadsheet-like interface. Edit properties of multiple products and their
              variations at once. Add or delete the properties as you wish by enabling or disabling them in the Columns
              filter. For convenience, you can use your keyboard (Tab, Enter, arrow keys) to navigate and edit the
              table. To edit more properties of a product, go to{" "}
              <span
                className="text-blue-600 cursor-pointer hover:underline"
                onClick={() => router.push("/catalog/products")}
              >
                Products
              </span> and open that product for individual
              editing.
            </p>
          </div>
        </div>
        <Button
          onClick={saveChanges}
          disabled={isSaving || Object.keys(editedProducts).length === 0}
          variant="default"
          size="sm"
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : `Save Changes (${Object.keys(editedProducts).length})`}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-80 space-y-4">            {/* Columns Filter */}
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Package className="h-4 w-4 mr-2" />
                  Columns
                </Button>
                <span className="text-sm text-gray-500">({activeColumnsCount})</span>
              </div>
            </div>

            {/* General Section */}
            <div className="border-b">
              <button
                onClick={() => toggleSection("general")}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <span className="font-medium">General</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${expandedSections.general ? "rotate-180" : ""}`}
                />
              </button>
              {expandedSections.general && (
                <div className="px-4 pb-4 space-y-2">
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
                    onClick={() => toggleColumn("categories")}
                  >
                    <span className={`text-sm ${columns.categories ? "" : "text-gray-500"}`}>Categories</span>
                    <Checkbox checked={columns.categories} />
                  </div>
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleColumn("productSubtitle")}
                  >
                    <span className={`text-sm ${columns.productSubtitle ? "" : "text-gray-500"}`}>Product subtitle</span>
                    <Checkbox checked={columns.productSubtitle} />
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
                    onClick={() => toggleColumn("ribbon")}
                  >
                    <span className={`text-sm ${columns.ribbon ? "" : "text-gray-500"}`}>Ribbon text</span>
                    <Checkbox checked={columns.ribbon} />
                  </div>
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleColumn("ribbonColor")}
                  >
                    <span className={`text-sm ${columns.ribbonColor ? "" : "text-gray-500"}`}>Ribbon color</span>
                    <Checkbox checked={columns.ribbonColor} />
                  </div>
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleColumn("customUrlSlug")}
                  >
                    <span className={`text-sm ${columns.customUrlSlug ? "" : "text-gray-500"}`}>Custom URL slug</span>
                    <Checkbox checked={columns.customUrlSlug} />
                  </div>
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleColumn("colors")}
                  >
                    <span className={`text-sm ${columns.colors ? "" : "text-gray-500"}`}>Colors</span>
                    <Checkbox checked={columns.colors} />
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
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleColumn("costPriceAfterDiscount")}
                  >
                    <span className={`text-sm ${columns.costPriceAfterDiscount ? "" : "text-gray-500"}`}>Cost price after discount</span>
                    <Checkbox checked={columns.costPriceAfterDiscount} />
                  </div>
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleColumn("set")}
                  >
                    <span className={`text-sm ${columns.set ? "" : "text-gray-500"}`}>Set</span>
                    <Checkbox checked={columns.set} />
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
                    onClick={() => toggleColumn("lowStockNotification")}
                  >
                    <span className={`text-sm ${columns.lowStockNotification ? "" : "text-gray-500"}`}>Low stock notification</span>
                    <Checkbox checked={columns.lowStockNotification} />
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

          {/* Save Changes Button */}
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

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-12 p-3">
                      <Checkbox
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    {columns.productGallery && (
                      <th className="p-3 w-16 text-left text-sm font-medium text-gray-900">
                        <div className="flex items-center justify-center gap-2">
                          <ImageIcon className="h-4 w-4" />
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
                    {columns.colors && (
                      <th className="p-3 text-left text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Colors
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
                            value={
                              editedProducts[product.id]?.sku !== undefined
                                ? editedProducts[product.id].sku
                                : product.sku
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
                          <Input
                            value={
                              editedProducts[product.id]?.description?.en !== undefined
                                ? editedProducts[product.id].description?.en
                                : product.description.en.substring(0, 30) + (product.description.en.length > 30 ? '...' : '')
                            }
                            onChange={(e) =>
                              handleProductChange(product.id, "description", {
                                ar: product.description.ar,
                                en: e.target.value
                              })
                            }
                            className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-600"
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
                                ? editedProducts[product.id].price_after_discount
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
                                ? editedProducts[product.id].cost_price
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
                                ? editedProducts[product.id].stock_unlimited
                                : product.stock_unlimited
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
                                ? editedProducts[product.id].maximum_purchase
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
                                ? editedProducts[product.id].requires_shipping
                                : product.requires_shipping
                            }
                            onCheckedChange={(checked) =>
                              handleProductChange(product.id, "requires_shipping", Boolean(checked))
                            }
                          />
                        </td>
                      )}

                      {/* Colors */}
                      {columns.colors && (
                        <td className="p-3">
                          <div className="flex gap-1 flex-wrap">
                            {product.colors && product.colors.length > 0 ? (
                              product.colors.map(color => (
                                <div
                                  key={color.id}
                                  className="w-6 h-6 rounded-full border"
                                  style={{ backgroundColor: color.color }}
                                  title={color.color}
                                />
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">No colors</span>
                            )}
                          </div>
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
    </div>
  )
}
