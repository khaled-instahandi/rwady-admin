"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Loader2, Package } from "lucide-react"
import { apiService, type Product } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"

interface ProductAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  categoryId: number
  categoryName: string
  assignedProductIds: number[]
  onProductsAssigned: () => void
}

export function ProductAssignmentModal({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  assignedProductIds,
  onProductsAssigned,
}: ProductAssignmentModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [skuFilter, setSkuFilter] = useState("")
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)
  const { toast } = useToast()

  const loadProducts = async () => {
    setLoading(true)
    try {
      const response = await apiService.getProducts({
        page: currentPage,
        per_page: 100, // Load more products for better filtering
        search: searchTerm,
      })

      if (response.success && response.data) {
        setProducts(response.data)
      } else {
        // Use mock data as fallback
        // setProducts(mockProducts)
      }
    } catch (error) {
      console.error("Failed to load products:", error)
      // setProducts(mockProducts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadProducts()
      setSelectedProductIds([])
      setSearchTerm("")
      setSkuFilter("")
      setCurrentPage(1)
    }
  }, [isOpen, currentPage])

  const filteredProducts = products.filter((product) => {
    // Exclude already assigned products
    if (assignedProductIds.includes(product.id)) return false

    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      product.name.ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.name.en && product.name.en.toLowerCase().includes(searchTerm.toLowerCase()))

    // SKU filter
    const matchesSku = skuFilter === "" || product.sku.toLowerCase().includes(skuFilter.toLowerCase())

    return matchesSearch && matchesSku
  })

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

  const handleProductSelect = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProductIds((prev) => [...prev, productId])
    } else {
      setSelectedProductIds((prev) => prev.filter((id) => id !== productId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(paginatedProducts.map((p) => p.id))
    } else {
      setSelectedProductIds([])
    }
  }

  const handleAssignProducts = async () => {
    if (selectedProductIds.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product to assign.",
        variant: "destructive",
      })
      return
    }

    setAssigning(true)
    try {
      const response = await apiService.assignProductsToCategory(categoryId, selectedProductIds)
      if (response.success) {
        toast({
          title: "Success",
          description: `${selectedProductIds.length} products assigned to category successfully.`,
          variant: "default",
        })
        onProductsAssigned()
        onClose()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to assign products",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to assign products:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setAssigning(false)
    }
  }

  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 7

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Add Products</DialogTitle>
          <p className="text-sm text-gray-600">Assign products to "{categoryName}" category</p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="flex gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <Input placeholder="Filter by SKU..." value={skuFilter} onChange={(e) => setSkuFilter(e.target.value)} />
            </div>
          </div>

          {/* Products Table */}
          <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="w-12 p-3 text-left">
                    <Checkbox
                      checked={
                        paginatedProducts.length > 0 &&
                        paginatedProducts.every((p) => selectedProductIds.includes(p.id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-3 text-left font-medium text-gray-700">SKU</th>
                  <th className="p-3 text-left font-medium text-gray-700">Name</th>
                  <th className="w-12 p-3 text-center font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                          <span className="text-gray-600">Loading products...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <div className="flex flex-col items-center">
                          <Package className="h-12 w-12 text-gray-400 mb-2" />
                          <span className="text-gray-600">No products found</span>
                          <span className="text-sm text-gray-500">Try adjusting your filters</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product, index) => (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={selectedProductIds.includes(product.id)}
                            onCheckedChange={(checked) => handleProductSelect(product.id, checked as boolean)}
                          />
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm text-gray-700">{product.sku}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={product.image_url || "/placeholder.svg?height=40&width=40"}
                              alt={product.name.ar || product.name.en || "Product"}
                              className="w-10 h-10 rounded-md object-cover border border-gray-200"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{product.name.ar || product.name.en}</div>
                              <div className="text-sm text-gray-500">
                                Stock: {product.stock_quantity} • ${product.price}
                                {product.sale_price && (
                                  <Badge variant="secondary" className="ml-2">
                                    Sale: ${product.sale_price}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleProductSelect(product.id, !selectedProductIds.includes(product.id))}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredProducts.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Items: {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProducts.length)} of{" "}
                  {filteredProducts.length}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Items per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={8}>8</option>
                    <option value={16}>16</option>
                    <option value={24}>24</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                {generatePageNumbers().map((page, index) => (
                  <Button
                    key={index}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => typeof page === "number" && setCurrentPage(page)}
                    disabled={page === "..."}
                    className={page === currentPage ? "bg-blue-600" : ""}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedProductIds.length} product{selectedProductIds.length !== 1 ? "s" : ""} selected
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignProducts}
              disabled={assigning || selectedProductIds.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Add Products (${selectedProductIds.length})`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
