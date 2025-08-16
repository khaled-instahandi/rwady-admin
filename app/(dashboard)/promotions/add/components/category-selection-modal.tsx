"use client"

import { useState, useEffect } from "react"
import { Check, ShoppingBag, Search, X, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { apiService, type Category } from "@/lib/api"

interface CategorySelectionModalProps {
    isOpen: boolean
    onClose: () => void
    onCategoriesSelected: (categories: Category[]) => void
    selectedCategoryIds: number[]
}

export function CategorySelectionModal({
    isOpen,
    onClose,
    onCategoriesSelected,
    selectedCategoryIds,
}: CategorySelectionModalProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedCategoryIds)
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

    useEffect(() => {
        setLocalSelectedIds(selectedCategoryIds)
    }, [selectedCategoryIds])

    useEffect(() => {
        if (isOpen) {
            loadCategories()
        }
    }, [isOpen])

    const loadCategories = async () => {
        setLoading(true)
        try {
            const response = await apiService.getCategories({ page: 1, limit: 500 })
            if (response.success && response.data) {
                console.log("Loaded categories:", response.data)
                // API already returns categories in tree structure
                setCategories(response.data)
            }
        } catch (error) {
            console.error("Failed to load categories:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCategoryToggle = (categoryId: number) => {
        setLocalSelectedIds(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId)
            } else {
                return [...prev, categoryId]
            }
        })
    }

    const handleConfirm = () => {
        const allCategories = getAllCategoriesFlat(categories)
        const selectedCategories = allCategories.filter(c => localSelectedIds.includes(c.id))
        onCategoriesSelected(selectedCategories)
        onClose()
    }

    const getAllCategoriesFlat = (cats: Category[]): Category[] => {
        const result: Category[] = []
        for (const cat of cats) {
            result.push(cat)
            if (cat.children) {
                result.push(...getAllCategoriesFlat(cat.children))
            }
        }
        return result
    }

    const filterCategories = (cats: Category[], query: string): Category[] => {
        if (!query.trim()) return cats

        const result: Category[] = []
        
        for (const cat of cats) {
            const matchesSearch = 
                cat.name.ar.toLowerCase().includes(query.toLowerCase()) ||
                cat.name.en?.toLowerCase().includes(query.toLowerCase())
            
            const filteredChildren = cat.children ? filterCategories(cat.children, query) : []
            
            if (matchesSearch || filteredChildren.length > 0) {
                result.push({
                    ...cat,
                    children: filteredChildren
                })
            }
        }
        
        return result
    }

    const renderCategoryTree = (cats: Category[], level: number = 0): JSX.Element[] => {
        return cats.map(category => {
            const hasChildren = category.children && category.children.length > 0
            const isExpanded = expandedCategories.has(category.id)
            const isSelected = localSelectedIds.includes(category.id)

            return (
                <div key={category.id}>
                    <div 
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                        style={{ paddingLeft: `${level * 20 + 8}px` }}
                    >
                        {hasChildren ? (
                            <button
                                onClick={() => {
                                    const newExpanded = new Set(expandedCategories)
                                    if (isExpanded) {
                                        newExpanded.delete(category.id)
                                    } else {
                                        newExpanded.add(category.id)
                                    }
                                    setExpandedCategories(newExpanded)
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>
                        ) : (
                            <div className="w-6" />
                        )}
                        
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        
                        <span className="text-sm font-medium flex-1">
                            {category.name.ar}
                            {category.name.en && (
                                <span className="text-gray-500 ml-2">({category.name.en})</span>
                            )}
                        </span>
                        
                        {hasChildren && (
                            <Badge variant="outline" className="text-xs">
                                {category.children!.length}
                            </Badge>
                        )}
                        
                        <span className="text-xs text-gray-500">
                            {category.products_count} products
                        </span>
                    </div>
                    
                    {hasChildren && isExpanded && (
                        <div>
                            {renderCategoryTree(category.children!, level + 1)}
                        </div>
                    )}
                </div>
            )
        })
    }

    const filteredCategories = filterCategories(categories, searchQuery)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Select categories to assign to this promotion</DialogTitle>
                    <div className="text-sm text-gray-600">
                        {localSelectedIds.length > 0 && (
                            <span>{localSelectedIds.length} categories selected</span>
                        )}
                    </div>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Search input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search for a category by name"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                onClick={() => setSearchQuery("")}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    {/* Expand/Collapse buttons */}
                    {categories.length > 0 && !searchQuery && (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    // Expand all categories
                                    const allIds = new Set<number>()
                                    const collectIds = (cats: Category[]) => {
                                        cats.forEach(cat => {
                                            if (cat.children && cat.children.length > 0) {
                                                allIds.add(cat.id)
                                                collectIds(cat.children)
                                            }
                                        })
                                    }
                                    collectIds(categories)
                                    setExpandedCategories(allIds)
                                }}
                                className="text-xs"
                            >
                                Expand All
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedCategories(new Set())}
                                className="text-xs"
                            >
                                Collapse All
                            </Button>
                        </div>
                    )}

                    {/* Categories tree */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-center">
                                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-500">Loading categories...</p>
                                </div>
                            </div>
                        ) : filteredCategories.length > 0 ? (
                            <div className="space-y-1">
                                {renderCategoryTree(filteredCategories)}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-sm">
                                    {searchQuery ? "No categories found matching your search" : "No categories available"}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer with actions */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <span className="text-sm text-gray-600">
                            {localSelectedIds.length} categories selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleConfirm}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
