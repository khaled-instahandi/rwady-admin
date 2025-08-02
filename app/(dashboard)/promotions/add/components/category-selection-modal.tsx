"use client"

import { useState, useEffect } from "react"
import { Check, ShoppingBag, Search, X, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { apiService, type Category } from "@/lib/api"

interface CategorySelectionModalProps {
    isOpen: boolean
    onClose: () => void
    onCategoriesSelected: (categories: Category[]) => void
    selectedCategoryIds: number[]
}

interface CategoryNode extends Category {
    children?: CategoryNode[]
    expanded?: boolean
}

export function CategorySelectionModal({
    isOpen,
    onClose,
    onCategoriesSelected,
    selectedCategoryIds,
}: CategorySelectionModalProps) {
    const [categories, setCategories] = useState<CategoryNode[]>([])
    const [filteredCategories, setFilteredCategories] = useState<CategoryNode[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedCategoryIds)

    useEffect(() => {
        setLocalSelectedIds(selectedCategoryIds)
    }, [selectedCategoryIds])

    useEffect(() => {
        if (isOpen) {
            loadCategories()
        }
    }, [isOpen])

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredCategories(categories)
        } else {
            const filtered = filterCategoriesBySearch(categories, searchQuery)
            setFilteredCategories(filtered)
        }
    }, [searchQuery, categories])

    const filterCategoriesBySearch = (cats: CategoryNode[], query: string): CategoryNode[] => {
        const result: CategoryNode[] = []
        
        for (const cat of cats) {
            const matchesSearch = 
                cat.name.ar.toLowerCase().includes(query.toLowerCase()) ||
                cat.name.en?.toLowerCase().includes(query.toLowerCase())
            
            const filteredChildren = cat.children ? filterCategoriesBySearch(cat.children, query) : []
            
            if (matchesSearch || filteredChildren.length > 0) {
                result.push({
                    ...cat,
                    children: filteredChildren,
                    expanded: filteredChildren.length > 0 ? true : cat.expanded
                })
            }
        }
        
        return result
    }

    const buildCategoryTree = (allCategories: Category[]): CategoryNode[] => {
        const categoryMap: { [key: number]: CategoryNode } = {}
        const rootCategories: CategoryNode[] = []

        // Create category nodes
        allCategories.forEach(cat => {
            categoryMap[cat.id] = {
                ...cat,
                children: [],
                expanded: false
            }
        })

        // Build tree structure
        allCategories.forEach(cat => {
            if (cat.parent_id && categoryMap[cat.parent_id]) {
                categoryMap[cat.parent_id].children!.push(categoryMap[cat.id])
            } else {
                rootCategories.push(categoryMap[cat.id])
            }
        })

        return rootCategories
    }

    const loadCategories = async () => {
        setLoading(true)
        try {
            const response = await apiService.getCategories({ page: 1, limit: 1000 })
            if (response.success && response.data) {
                const categoryTree = buildCategoryTree(response.data)
                setCategories(categoryTree)
                setFilteredCategories(categoryTree)
            }
        } catch (error) {
            console.error("Failed to load categories:", error)
        } finally {
            setLoading(false)
        }
    }

    const toggleCategoryExpansion = (categoryId: number) => {
        const updateExpansion = (cats: CategoryNode[]): CategoryNode[] => {
            return cats.map(cat => {
                if (cat.id === categoryId) {
                    return { ...cat, expanded: !cat.expanded }
                }
                if (cat.children) {
                    return { ...cat, children: updateExpansion(cat.children) }
                }
                return cat
            })
        }

        setCategories(updateExpansion(categories))
        setFilteredCategories(updateExpansion(filteredCategories))
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

    const getAllCategoryIds = (cats: CategoryNode[]): number[] => {
        const ids: number[] = []
        for (const cat of cats) {
            ids.push(cat.id)
            if (cat.children) {
                ids.push(...getAllCategoryIds(cat.children))
            }
        }
        return ids
    }

    const handleSelectAll = () => {
        const allIds = getAllCategoryIds(filteredCategories)
        if (localSelectedIds.length === allIds.length) {
            setLocalSelectedIds([])
        } else {
            setLocalSelectedIds(allIds)
        }
    }

    const handleConfirm = () => {
        const allCategories = getAllCategoriesFlat(categories)
        const selectedCategories = allCategories.filter(c => localSelectedIds.includes(c.id))
        onCategoriesSelected(selectedCategories)
    }

    const getAllCategoriesFlat = (cats: CategoryNode[]): Category[] => {
        const result: Category[] = []
        for (const cat of cats) {
            result.push(cat)
            if (cat.children) {
                result.push(...getAllCategoriesFlat(cat.children))
            }
        }
        return result
    }

    const handleCancel = () => {
        setLocalSelectedIds(selectedCategoryIds)
        onClose()
    }

    const renderCategoryNode = (category: CategoryNode, level: number = 0) => {
        const hasChildren = category.children && category.children.length > 0
        const isSelected = localSelectedIds.includes(category.id)

        return (
            <div key={category.id}>
                <div
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                    }`}
                    style={{ paddingLeft: `${(level * 20) + 8}px` }}
                >
                    <div className="flex items-center space-x-2 flex-1">
                        {hasChildren && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleCategoryExpansion(category.id)
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                            >
                                {category.expanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>
                        )}
                        {!hasChildren && <div className="w-6" />}
                        
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        
                        <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="h-4 w-4 text-green-600" />
                        </div>
                        
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{category.name.ar}</h4>
                            {category.name.en && (
                                <p className="text-sm text-gray-500">{category.name.en}</p>
                            )}
                        </div>
                        
                        <div className="text-sm text-gray-500">
                            {category.products_count} products
                        </div>
                    </div>
                </div>
                
                {hasChildren && category.expanded && (
                    <div>
                        {category.children!.map(child => renderCategoryNode(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    const allCategories = getAllCategoriesFlat(filteredCategories)

    return (
        <Dialog open={isOpen} onOpenChange={handleCancel}>
            <DialogContent className="max-w-4xl max-h-[80vh] p-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="flex items-center space-x-2">
                        <ShoppingBag className="h-5 w-5" />
                        <span>Select Categories</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search categories by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Select All */}
                    {allCategories.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="select-all"
                                checked={localSelectedIds.length === allCategories.length && allCategories.length > 0}
                                onCheckedChange={handleSelectAll}
                            />
                            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                Select All ({allCategories.length} categories)
                            </label>
                        </div>
                    )}
                </div>

                {/* Categories Tree */}
                <ScrollArea className="h-[400px] px-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-sm text-gray-500">Loading categories...</p>
                            </div>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No categories found</p>
                            <p className="text-sm text-gray-500">
                                {searchQuery ? "Try adjusting your search terms" : "No categories available"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredCategories.map(category => renderCategoryNode(category))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t">
                    <div className="text-sm text-gray-500">
                        {localSelectedIds.length} of {allCategories.length} categories selected
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
