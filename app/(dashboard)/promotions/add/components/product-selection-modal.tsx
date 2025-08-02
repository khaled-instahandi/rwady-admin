"use client"

import { useState, useEffect } from "react"
import { Check, Package, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { apiService, type Product } from "@/lib/api"

interface ProductSelectionModalProps {
    isOpen: boolean
    onClose: () => void
    onProductsSelected: (products: Product[]) => void
    selectedProductIds: number[]
}

export function ProductSelectionModal({
    isOpen,
    onClose,
    onProductsSelected,
    selectedProductIds,
}: ProductSelectionModalProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedProductIds)

    useEffect(() => {
        setLocalSelectedIds(selectedProductIds)
    }, [selectedProductIds])

    useEffect(() => {
        if (isOpen) {
            loadProducts()
        }
    }, [isOpen])

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredProducts(products)
        } else {
            const filtered = products.filter(product =>
                product.name.ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.name.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            setFilteredProducts(filtered)
        }
    }, [searchQuery, products])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const response = await apiService.getProducts({ page: 1, limit: 1000 })
            if (response.success && response.data) {
                setProducts(response.data)
                setFilteredProducts(response.data)
            }
        } catch (error) {
            console.error("Failed to load products:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleProductToggle = (productId: number) => {
        setLocalSelectedIds(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId)
            } else {
                return [...prev, productId]
            }
        })
    }

    const handleSelectAll = () => {
        if (localSelectedIds.length === filteredProducts.length) {
            setLocalSelectedIds([])
        } else {
            setLocalSelectedIds(filteredProducts.map(p => p.id))
        }
    }

    const handleConfirm = () => {
        const selectedProducts = products.filter(p => localSelectedIds.includes(p.id))
        onProductsSelected(selectedProducts)
    }

    const handleCancel = () => {
        setLocalSelectedIds(selectedProductIds)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleCancel}>
            <DialogContent className="max-w-4xl max-h-[80vh] p-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="flex items-center space-x-2">
                        <Package className="h-5 w-5" />
                        <span>Select Products</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search products by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Select All */}
                    {filteredProducts.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="select-all"
                                checked={localSelectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                                onCheckedChange={handleSelectAll}
                            />
                            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                Select All ({filteredProducts.length} products)
                            </label>
                        </div>
                    )}
                </div>

                {/* Products List */}
                <ScrollArea className="h-[400px] px-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-sm text-gray-500">Loading products...</p>
                            </div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Package className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
                            <p className="text-sm text-gray-500">
                                {searchQuery ? "Try adjusting your search terms" : "No products available"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        localSelectedIds.includes(product.id)
                                            ? "border-blue-200 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                    onClick={() => handleProductToggle(product.id)}
                                >
                                    <Checkbox
                                        checked={localSelectedIds.includes(product.id)}
                                        onCheckedChange={() => handleProductToggle(product.id)}
                                    />
                                    
                                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name.ar}
                                                className="w-full h-full object-cover rounded"
                                            />
                                        ) : (
                                            <Package className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {product.name.ar}
                                                </h4>
                                                {product.name.en && (
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {product.name.en}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400">
                                                    SKU: {product.sku || "N/A"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {product.price?.toLocaleString()} IQD
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Stock: {product.stock || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t">
                    <div className="text-sm text-gray-500">
                        {localSelectedIds.length} of {filteredProducts.length} products selected
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
                            Confirm Selection
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
