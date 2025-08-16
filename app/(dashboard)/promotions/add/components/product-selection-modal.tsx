"use client"

import { useState, useEffect } from "react"
import { Check, Package, Search, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { apiService, type Product } from "@/lib/api"
import { useDialogPointerEventsFix } from "@/hooks/use-dialog-fix"

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
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedProductIds)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [totalProducts, setTotalProducts] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    // Fix for dialog pointer-events issue
    useDialogPointerEventsFix(isOpen)

    useEffect(() => {
        setLocalSelectedIds(selectedProductIds)
    }, [selectedProductIds])

    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1)
            setSearchQuery("")
            loadProducts()
        }
    }, [isOpen])

    // Load products when page or items per page changes
    useEffect(() => {
        if (isOpen) {
            loadProducts()
        }
    }, [currentPage, itemsPerPage, isOpen])

    // Debounced search effect
    useEffect(() => {
        if (!isOpen) return
        
        const timer = setTimeout(() => {
            setCurrentPage(1) // Reset to first page when searching
            loadProducts()
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery, isOpen])

    // Load products from backend with server-side pagination and filtering
    const loadProducts = async () => {
        setLoading(true)
        try {
            const response = await apiService.getProducts({ 
                page: currentPage, 
                limit: itemsPerPage,
                search: searchQuery,
            })
            if (response.success && response.data) {
                setProducts(response.data)
                
                // Extract pagination data from meta object
                const meta = (response as any).meta
                if (meta) {
                    // Use backend pagination data
                    setTotalProducts(meta.total || 0)
                    setTotalPages(meta.last_page || 1)
                } else {
                    // Fallback to local calculation
                    const total = response.data.length
                    setTotalProducts(total)
                    setTotalPages(Math.ceil(total / itemsPerPage))
                }
                
                console.log('Pagination Debug:', {
                    meta,
                    total: meta?.total,
                    totalPages: meta?.last_page,
                    currentPage: meta?.current_page,
                    perPage: meta?.per_page,
                    responseDataLength: response.data?.length,
                    itemsPerPage
                })
            } else {
                setProducts([])
                setTotalProducts(0)
                setTotalPages(0)
            }
        } catch (error) {
            console.error("Failed to load products:", error)
            setProducts([])
            setTotalProducts(0)
            setTotalPages(0)
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
        // Get all visible products on current page
        const currentPageProductIds = products.map((p: Product) => p.id)
        
        // Check if all current page products are selected
        const allCurrentPageSelected = currentPageProductIds.every(id => localSelectedIds.includes(id))
        
        if (allCurrentPageSelected) {
            // Deselect all products from current page
            setLocalSelectedIds(prev => prev.filter(id => !currentPageProductIds.includes(id)))
        } else {
            // Add all current page products to selection (without removing previously selected from other pages)
            setLocalSelectedIds(prev => {
                const newIds = currentPageProductIds.filter(id => !prev.includes(id))
                return [...prev, ...newIds]
            })
        }
    }

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage)
        }
    }

    const handleItemsPerPageChange = (newLimit: number) => {
        setItemsPerPage(newLimit)
        setCurrentPage(1) // Reset to first page when changing items per page
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
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
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
                    {products.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="select-all"
                                checked={products.length > 0 && products.every(p => localSelectedIds.includes(p.id))}
                                onCheckedChange={handleSelectAll}
                            />
                            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                Select All ({products.length} products on this page)
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
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Package className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
                            <p className="text-sm text-gray-500">
                                {searchQuery ? "Try adjusting your search terms" : "No products available"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {products.map((product) => (
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

                {/* Pagination */}
                {(totalProducts > 0 || loading) && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex flex-1 justify-between items-center">
                            <div className="flex items-center text-sm text-gray-700">
                                {loading ? (
                                    <div className="flex items-center space-x-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Loading products...</span>
                                    </div>
                                ) : (
                                    <span>
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} products
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                {/* Items per page selector */}
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-700">Show:</label>
                                    <select 
                                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        value={itemsPerPage.toString()}
                                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                    >
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                    </select>
                                    <span className="text-sm text-gray-700">per page</span>
                                </div>
                                
                                {/* Pagination controls - Always show if there are products */}
                                <nav className="flex items-center space-x-1" aria-label="Pagination">
                                    {/* Previous button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1 || loading}
                                        className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Previous
                                    </button>
                                    
                                    {/* Page numbers - Only show if more than 1 page */}
                                    {totalPages > 1 && (
                                        <div className="hidden sm:flex">
                                            {(() => {
                                                const pages = [];
                                                const maxVisiblePages = 5;
                                                
                                                if (totalPages <= maxVisiblePages) {
                                                    // Show all pages if total pages is small
                                                    for (let i = 1; i <= totalPages; i++) {
                                                        pages.push(i);
                                                    }
                                                } else {
                                                    // Show smart pagination
                                                    if (currentPage <= 3) {
                                                        // Show first pages + ellipsis + last page
                                                        for (let i = 1; i <= 4; i++) pages.push(i);
                                                        if (totalPages > 5) pages.push('...');
                                                        pages.push(totalPages);
                                                    } else if (currentPage >= totalPages - 2) {
                                                        // Show first page + ellipsis + last pages
                                                        pages.push(1);
                                                        if (totalPages > 5) pages.push('...');
                                                        for (let i = totalPages - 3; i <= totalPages; i++) {
                                                            pages.push(i);
                                                        }
                                                    } else {
                                                        // Show first + ellipsis + current range + ellipsis + last
                                                        pages.push(1);
                                                        pages.push('...');
                                                        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                                                            pages.push(i);
                                                        }
                                                        pages.push('...');
                                                        pages.push(totalPages);
                                                    }
                                                }
                                                
                                                return pages.map((page, index) => {
                                                    if (page === '...') {
                                                        return (
                                                            <span
                                                                key={`ellipsis-${index}`}
                                                                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300"
                                                            >
                                                                ...
                                                            </span>
                                                        );
                                                    }
                                                    
                                                    const pageNum = page as number;
                                                    const isCurrentPage = pageNum === currentPage;
                                                    
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            disabled={loading}
                                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border transition-colors disabled:opacity-50 ${
                                                                isCurrentPage
                                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                    
                                    {/* Mobile page info - Show when no page numbers */}
                                    {totalPages <= 1 && (
                                        <div className="sm:hidden">
                                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                                                {currentPage} of {Math.max(totalPages, 1)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Next button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= totalPages || loading || totalPages <= 1}
                                        className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                                    >
                                        Next
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t">
                    <div className="text-sm text-gray-500">
                        {localSelectedIds.length} of {totalProducts} total products selected
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
