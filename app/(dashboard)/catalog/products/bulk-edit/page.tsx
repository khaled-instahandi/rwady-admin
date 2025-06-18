"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { apiService, type Product } from "@/lib/api"
import { ArrowLeft, ChevronDown, Package, DollarSign, ImageIcon } from "lucide-react"

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

  const [columns, setColumns] = useState({
    productGallery: true,
    name: true,
    sku: true,
    availability: true,
    description: false,
    categories: false,
    productSubtitle: false,
    ribbon: false,
    featuredOnHomepage: false,
    customUrlSlug: false,
    price: true,
    compareToPrice: false,
    set: false,
    costPrice: false,
    stock: true,
    outOfStockBehavior: false,
    lowStockNotification: false,
    minimumPurchaseQuantity: false,
    maximumPurchaseQuantity: false,
    requiresShippingOrPickup: false,
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await apiService.getProducts({ per_page: 100 })

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
              <span className="text-blue-600 cursor-pointer">Products</span> and open that product for individual
              editing.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-80 space-y-4">
          {/* Columns Filter */}
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Package className="h-4 w-4 mr-2" />
                  Columns
                </Button>
                <span className="text-sm text-gray-500">(9)</span>
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Product gallery</span>
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Name</span>
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SKU</span>
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Availability</span>
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Description</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Categories</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Product subtitle</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Ribbon</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Featured on homepage</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Custom URL slug</span>
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Price</span>
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">"Compare to" price</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Set</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Cost price</span>
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Stock</span>
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Out of stock behavior</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Low stock notification</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Minimum purchase quantity</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Maximum purchase quantity</span>
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
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-sm">Requires shipping or pickup</span>
                  </div>
                </div>
              )}
            </div>
          </div>
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
                    <th className="p-3 text-left text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Name
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        SKU
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        Availability
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Price, $
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        Stock
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
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
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            {product.media.length > 0 && product.media[0].type === "image" ? (
                              <img
                                src={product.media[0].url || "/placeholder.svg?height=40&width=40"}
                                alt={product.name.en}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <Input
                            value={product.name.en}
                            className="border-0 p-0 h-auto focus-visible:ring-0"
                            readOnly
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <Input value={product.sku} className="border-0 p-0 h-auto focus-visible:ring-0" readOnly />
                      </td>
                      <td className="p-3">
                        <Checkbox checked={product.availability} />
                      </td>
                      <td className="p-3">
                        <Input
                          value={formatPrice(product.price)}
                          className="border-0 p-0 h-auto focus-visible:ring-0"
                          readOnly
                        />
                      </td>
                      <td className="p-3">
                        <Select value={product.stock_unlimited ? "always" : "limited"}>
                          <SelectTrigger className="border-0 p-0 h-auto focus-visible:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Always in stock</SelectItem>
                            <SelectItem value="limited">Limited stock</SelectItem>
                            <SelectItem value="out">Out of stock</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
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
