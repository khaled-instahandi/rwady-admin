"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CategoryTree } from "@/components/categories/category-tree"
import { ImageUpload } from "@/components/ui/image-upload"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Plus,
  Trash2,
  Search,
  Save,
  AlertCircle,
  RefreshCw,
  FolderPlus,
  FolderTree,
  CheckCircle2,
  X,
  Loader2,
  Filter,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { apiService, type Category, mockCategories, type Product, } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CategorySkeleton } from "@/components/categories/category-skeleton"
import { ProductAssignmentModal } from "@/components/products/product-assignment-modal"

interface CategoryFormData {
  name: {
    ar: string
    en: string
  }
  description: {
    ar: string
    en: string
  }
  parent_id: number | null
  availability: boolean
  image: string
  image_name: string
  image_url?: string
  seo: {
    meta_title: string
    meta_description: string
    keywords: string
    image: string
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set())
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  const [showFilters, setShowFilters] = useState(false)
  const [filterAvailability, setFilterAvailability] = useState<"all" | "enabled" | "disabled">("all")
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const [formData, setFormData] = useState<CategoryFormData>({
    name: { ar: "", en: "" },
    description: { ar: "", en: "" },
    parent_id: null,
    availability: true,
    image_url: "",
    image: "",
    image_name: "",
    seo: {
      meta_title: "",
      meta_description: "",
      keywords: "",
      image: "",
    },
  })

  const loadCategories = useCallback(async () => {
    setRefreshing(true)
    try {
      // Use the tree endpoint to get hierarchical data
      const response = await apiService.getCategoryTree()
      if (response.success && response.data && response.data.length > 0) {
        setCategories(response.data)
      } else {
        // Fallback to flat list if tree endpoint is not available
        const flatResponse = await apiService.getCategories()
        if (flatResponse.success && flatResponse.data && flatResponse.data.length > 0) {
          setCategories(flatResponse.data)
        } else {
          // If both fail, use mock data
          console.log("Using mock data as fallback")
          setCategories(mockCategories)
        }
      }
    } catch (error) {
      console.error("Failed to load categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories. Using sample data instead.",
        variant: "destructive",
      })
      // Use mock data as fallback
      setCategories(mockCategories)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const loadCategoryProducts = useCallback(async (categoryId: number) => {
    setLoadingProducts(true)
    try {
      const response = await apiService.getCategoryProducts(categoryId)
      if (response.success && response.data) {
        setCategoryProducts(response.data)
      } else {
        // Use mock data filtered by category
        // const mockCategoryProducts = mockProducts.filter((p) => p.category_ids.includes(categoryId))
        // setCategoryProducts(mockCategoryProducts)
        console.log("Using mock products as fallback")
      }
    } catch (error) {
      console.error("Failed to load category products:", error)
      // const mockCategoryProducts = mockProducts.filter((p) => p.category_ids.includes(categoryId))
      // setCategoryProducts(mockCategoryProducts)
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      // Reset form data completely when a new category is selected to clear any stale data
      setFormData({
        name: {
          ar: selectedCategory.name.ar || "",
          en: selectedCategory.name.en || "",
        },
        description: {
          ar: selectedCategory.description.ar || "",
          en: selectedCategory.description.en || "",
        },
        image_url: selectedCategory.image_url || "",
        parent_id: selectedCategory.parent_id,
        availability: Boolean(selectedCategory.availability),
        image: selectedCategory.image_url || "",
        image_name: selectedCategory.image || "",
        seo: {
          meta_title: "",
          meta_description: "",
          keywords: "",
          image: "",
        },
      })
      setUnsavedChanges(false)
      loadCategoryProducts(selectedCategory.id)
    }
  }, [selectedCategory, loadCategoryProducts])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save with Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && selectedCategory && unsavedChanges && !saving) {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedCategory, unsavedChanges, saving])

  const handleCategorySelect = (category: Category) => {
    if (unsavedChanges) {
      if (!confirm("You have unsaved changes. Do you want to continue?")) {
        return
      }
    }
    // First clear the current selection to force a complete re-render
    setSelectedCategory(null)
    
    // Then set the new selection in the next render cycle
    setTimeout(() => {
      setSelectedCategory(category)
    }, 0)
  }

  const handleToggleCollapse = (categoryId: number) => {
    const newCollapsedIds = new Set(collapsedIds)
    if (newCollapsedIds.has(categoryId)) {
      newCollapsedIds.delete(categoryId)
    } else {
      newCollapsedIds.add(categoryId)
    }
    setCollapsedIds(newCollapsedIds)
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setUnsavedChanges(true)
  }

  const handleNestedFormChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof CategoryFormData] as Record<string, any>),
        [field]: value,
      },
    }))
    setUnsavedChanges(true)
  }

  const handleImageChange = (imageUrl: string, imageName: string) => {
    setFormData((prev) => ({
      ...prev,
      image: imageUrl,
      image_name: imageName,
    }))
    setUnsavedChanges(true)
  }

  const handleSave = async () => {
    if (!selectedCategory) return

    setSaving(true)
    try {
      // Prepare data for API - use image_name instead of image URL
      const dataToSend = {
        ...formData,
        image: formData.image_name, // Send image_name to API
      }
      console.log("Saving category data:", dataToSend);
      

      const response = await apiService.updateCategory(selectedCategory.id, dataToSend)
      if (response.success) {
        setUnsavedChanges(false)
        toast({
          title: "Success",
          description: "Category updated successfully",
          variant: "default",
        })
        setFormData({
          name: { ar: "", en: "" },
          description: { ar: "", en: "" },
          parent_id: null,
          availability: true,
          image: "",
          image_name: "",
          image_url: "",
          seo: {
            meta_title: "",
            meta_description: "",
            keywords: "",
            image: "",
          },
        })
        await loadCategories()
        // Update selected category with the latest data
        setSelectedCategory(response.data)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update category",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to save category:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRootCategory = async () => {
    const newCategoryData = {
      name: { ar: "فئة جديدة", en: "New Category" },
      description: { ar: "", en: "" },
      parent_id: null,
      availability: true,
      image: "",
      seo: {
        meta_title: "",
        meta_description: "",
        keywords: "",
        image: "",
      },
    }

    try {
      const response = await apiService.createCategory(newCategoryData)
      if (response.success) {
        toast({
          title: "Success",
          description: "Root category created successfully",
          variant: "default",
        })
        await loadCategories()
        setSelectedCategory(response.data)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create category",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create category:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleCreateSubcategory = async () => {
    if (!selectedCategory) return

    const newCategoryData = {
      name: { ar: "فئة فرعية جديدة", en: "New Subcategory" },
      description: { ar: "", en: "" },
      parent_id: selectedCategory.id,
      availability: true,
      image: "",
      seo: {
        meta_title: "",
        meta_description: "",
        keywords: "",
        image: "",
      },
    }

    try {
      const response = await apiService.createCategory(newCategoryData)
      if (response.success) {
        toast({
          title: "Success",
          description: "Subcategory created successfully",
          variant: "default",
        })
        await loadCategories()
        setSelectedCategory(response.data)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create subcategory",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create subcategory:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return

    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const response = await apiService.deleteCategory(selectedCategory.id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
          variant: "default",
        })
        await loadCategories()
        setSelectedCategory(null)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete category",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Filter categories based on search term and availability
  const filteredCategories = categories.filter((category) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      category.name.ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.name.en && category.name.en.toLowerCase().includes(searchTerm.toLowerCase()))

    // Availability filter
    const matchesAvailability =
      filterAvailability === "all" ||
      (filterAvailability === "enabled" && category.availability === 1) ||
      (filterAvailability === "disabled" && category.availability === 0)

    return matchesSearch && matchesAvailability
  })

  if (loading) {
    return <CategorySkeleton />
  }

  return (
    <div className="space-y-2 flex  h-screen">
      <Toaster />

      {/* Left Sidebar - Categories Tree */}
      <div className="w-80 border-r border-gray-200 bg-white shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>

          {/* Action Buttons */}
          <div className="space-y-2 mb-4">
            <Button
              onClick={handleCreateRootCategory}
              className="w-full justify-start bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Add Root Category
            </Button>
            <Button
              onClick={handleCreateSubcategory}
              variant="outline"
              className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
              size="sm"
              disabled={!selectedCategory}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subcategory
            </Button>
            <Button
              onClick={handleDeleteCategory}
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              size="sm"
              disabled={!selectedCategory}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Category
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:bg-blue-50 flex items-center"
              >
                <Filter className="w-4 h-4 mr-1" />
                Filters
                {showFilters ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronRight className="w-3 h-3 ml-1" />}
              </Button>

              <Button variant="ghost" size="sm" onClick={loadCategories} disabled={refreshing} className="h-8 w-8 p-0">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-50 p-3 rounded-md border border-gray-200"
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Availability</Label>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={filterAvailability === "all" ? "default" : "outline"}
                        onClick={() => setFilterAvailability("all")}
                        className={filterAvailability === "all" ? "bg-blue-600" : ""}
                      >
                        All
                      </Button>
                      <Button
                        size="sm"
                        variant={filterAvailability === "enabled" ? "default" : "outline"}
                        onClick={() => setFilterAvailability("enabled")}
                        className={filterAvailability === "enabled" ? "bg-green-600" : ""}
                      >
                        Enabled
                      </Button>
                      <Button
                        size="sm"
                        variant={filterAvailability === "disabled" ? "default" : "outline"}
                        onClick={() => setFilterAvailability("disabled")}
                        className={filterAvailability === "disabled" ? "bg-red-600" : ""}
                      >
                        Disabled
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse/Expand Controls */}
          <div className="flex justify-between text-sm">
            <button
              onClick={() => setCollapsedIds(new Set())}
              className="text-blue-600 hover:underline flex items-center"
            >
              <FolderTree className="w-4 h-4 mr-1" />
              Expand All
            </button>
            <button
              onClick={() => setCollapsedIds(new Set(categories.map((c) => c.id)))}
              className="text-blue-600 hover:underline flex items-center"
            >
              <FolderPlus className="w-4 h-4 mr-1" />
              Collapse All
            </button>
          </div>
        </div>

        {/* Categories Tree */}
        <div className="p-4 overflow-auto max-h-[calc(100vh-220px)]">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">{filteredCategories.length} categories</div>
          </div>

          <CategoryTree
            categories={filteredCategories}
            selectedId={selectedCategory?.id}
            onSelect={handleCategorySelect}
            onToggleCollapse={handleToggleCollapse}
            collapsedIds={collapsedIds}
            loading={refreshing}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        <AnimatePresence mode="wait">
          {selectedCategory ? (
            <motion.div
              key="category-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    "{selectedCategory.name.ar || selectedCategory.name.en || "Unnamed Category"}"
                  </h1>
                  <p className="text-gray-500">ID: {selectedCategory.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {unsavedChanges && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center text-orange-600 text-sm bg-orange-50 px-3 py-1 rounded-md"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Unsaved changes
                    </motion.div>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={saving || !unsavedChanges}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes (Ctrl+S)
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Notification */}
              <AnimatePresence>
                {notification && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`mb-4 p-4 rounded-md flex items-center justify-between ${notification.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                      }`}
                  >
                    <div className="flex items-center">
                      {notification.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                      ) : (
                        <AlertCircle className="w-5 h-5 mr-2" />
                      )}
                      {notification.message}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setNotification(null)} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabs */}
              <Tabs key={selectedCategory?.id || 'no-selection'} defaultValue="general" className="space-y-6">
                <TabsList className="bg-white border border-gray-200 p-1">
                  <TabsTrigger
                    value="general"
                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                  >
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="products"
                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                  >
                    Category products
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                    SEO
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-6 space-y-6">
                      {/* Name */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name-ar" className="text-gray-700">
                            Name (Arabic)
                          </Label>
                          <Input
                            id="name-ar"
                            value={formData.name.ar}
                            onChange={(e) => handleNestedFormChange("name", "ar", e.target.value)}
                            placeholder="Category name in Arabic"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name-en" className="text-gray-700">
                            Name (English)
                          </Label>
                          <Input
                            id="name-en"
                            value={formData.name.en || ""}
                            onChange={(e) => handleNestedFormChange("name", "en", e.target.value)}
                            placeholder="Category name in English"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Availability */}
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <Label className="text-gray-700 font-medium">Availability</Label>
                          <p className="text-sm text-gray-500">Enable or disable this category</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.availability}
                            onCheckedChange={(checked) => handleFormChange("availability", checked)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                          <span
                            className={`text-sm font-medium ${formData.availability ? "text-green-600" : "text-red-600"
                              }`}
                          >
                            {formData.availability ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </motion.div>

                      {/* Category Image */}
                      <div className="space-y-2">
                        <Label className="text-gray-700">Category Image</Label>
                        <ImageUpload
                          value={formData.image_url || ""}
                          imageName={formData.image_name}
                          onChange={handleImageChange}
                          folder="categories"
                          className="mt-2"
                        />
                      </div>

                      {/* Description */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-700">Description (Arabic)</Label>
                          <RichTextEditor
                            key={`desc-ar-${selectedCategory?.id || 'new'}`}
                            value={formData.description.ar}
                            onChange={(value) => handleNestedFormChange("description", "ar", value)}
                            placeholder="وصف الفئة بالعربية..."
                            className="min-h-[200px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700">Description (English)</Label>
                          <RichTextEditor
                            key={`desc-en-${selectedCategory?.id || 'new'}`}
                            value={formData.description.en || ""}
                            onChange={(value) => handleNestedFormChange("description", "en", value)}
                            placeholder="Category description in English..."
                            className="min-h-[200px]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="products" className="space-y-6">
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      {loadingProducts ? (
                        <div className="text-center py-12">
                          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
                          <p className="text-gray-600">Loading products...</p>
                        </div>
                      ) : categoryProducts.length === 0 ? (
                        <div className="text-center py-12">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
                          >
                            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                          </motion.div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            There are no products in this category
                          </h3>
                          <div className="space-x-2">
                            <Button onClick={() => setShowAssignModal(true)} className="bg-blue-600 hover:bg-blue-700">
                              Assign Products to Category
                            </Button>
                            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                              Create New Product
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">Category Products</h3>
                              <p className="text-sm text-gray-600">
                                Showing {categoryProducts.length} product{categoryProducts.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => setShowAssignModal(true)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Assign Products to Category
                              </Button>
                              <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                                Unassign All
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {categoryProducts.map((product, index) => (
                              <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="cursor-move text-gray-400 hover:text-gray-600">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                                    </svg>
                                  </div>
                                  <img
                                    src={product.image_url || "/placeholder.svg?height=60&width=60"}
                                    alt={product.name.ar || product.name.en || "Product"}
                                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                  />
                                  <div>
                                    <h4 className="font-medium text-gray-900">{product.name.ar || product.name.en}</h4>
                                    <p className="text-sm text-gray-500">{product.sku}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            ))}
                          </div>

                          <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
                            <span>
                              SHOWING 1 - {categoryProducts.length} OF {categoryProducts.length} PRODUCTS
                            </span>
                            <div className="flex items-center space-x-2">
                              <span>PRODUCTS ON PAGE:</span>
                              <select className="border border-gray-300 rounded px-2 py-1">
                                <option>100</option>
                                <option>50</option>
                                <option>25</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="seo" className="space-y-6">
                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="bg-gray-50 border-b border-gray-200">
                      <CardTitle className="text-lg font-medium">Search Engine Optimization</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Google Preview */}
                      <motion.div
                        whileHover={{
                          y: -2,
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        }}
                        className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                      >
                        <div className="text-blue-600 text-lg font-medium mb-1">
                          {formData.seo.meta_title ||
                            `${selectedCategory.name.ar || selectedCategory.name.en} - Rwady Store`}
                        </div>
                        <div className="text-green-600 text-sm">
                          https://www.rwady-store.com/categories/{selectedCategory.id}
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          {formData.seo.meta_description || formData.description.ar || "Category description"}
                        </div>
                      </motion.div>

                      <div className="text-blue-600 text-sm cursor-pointer hover:underline flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M11 4H4V20H20V13"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15 4H20V9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M20 4L9 15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Customize category URL →
                      </div>

                      <div className="space-y-4">
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className="p-4 bg-blue-50 rounded-lg border border-blue-100"
                        >
                          <Label className="text-blue-800 font-medium">Category URL</Label>
                          <p className="text-sm text-blue-700 mt-1">
                            Create a URL that will be easy to share and remember. You can also add relevant keywords
                            that accurately describe the category's content for better search engine ranking.
                          </p>
                        </motion.div>

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <Label className="text-gray-700 font-medium">Page title and meta description</Label>
                          <p className="text-sm text-gray-600 mt-1">
                            Search engines display a limited number of characters, so you may want to re-write the page
                            title and meta description. Use the fields below to fine-tune your category's metadata.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="meta-title" className="text-gray-700">
                              Page title{" "}
                              <span className="text-gray-500 text-sm">(25 of 60 max recommended characters)</span>
                            </Label>
                            <Input
                              id="meta-title"
                              value={formData.seo.meta_title}
                              onChange={(e) => handleNestedFormChange("seo", "meta_title", e.target.value)}
                              placeholder={`${selectedCategory.name.ar || selectedCategory.name.en} - Rwady Store`}
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <div className="text-xs text-gray-500 mt-1 flex justify-end">
                              {formData.seo.meta_title.length}/60 characters
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="meta-description" className="text-gray-700">
                              Meta description
                            </Label>
                            <textarea
                              id="meta-description"
                              value={formData.seo.meta_description}
                              onChange={(e) => handleNestedFormChange("seo", "meta_description", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={4}
                              placeholder="Describe what customers will find in this category..."
                            />
                            <div className="text-xs text-gray-500 mt-1 flex justify-end">
                              {formData.seo.meta_description.length}/160 characters
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="keywords" className="text-gray-700">
                              Keywords
                            </Label>
                            <Input
                              id="keywords"
                              value={formData.seo.keywords}
                              onChange={(e) => handleNestedFormChange("seo", "keywords", e.target.value)}
                              placeholder="Comma-separated keywords"
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              Separate keywords with commas (e.g., clothing, fashion, dresses)
                            </div>
                          </div>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className="p-4 bg-yellow-50 rounded-lg border border-yellow-100"
                        >
                          <div className="flex items-center text-yellow-800 font-medium">
                            <svg
                              className="w-5 h-5 mr-2"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            SEO Tips
                          </div>
                          <p className="text-sm text-yellow-700 mt-1">
                            Try to keep the title under 60 characters and the description under 160 characters, so
                            they're not cut off on search results pages. Use relevant keywords that accurately describe
                            your category.
                          </p>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center max-w-md p-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center"
                >
                  <FolderPlus className="w-12 h-12 text-blue-600" />
                </motion.div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select or Create a Category</h3>
                <p className="text-gray-500 mb-6">
                  Choose a category from the left sidebar to view and edit its details, or create a new category to get
                  started.
                </p>
                <Button onClick={handleCreateRootCategory} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Category
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Product Assignment Modal */}
      {selectedCategory && (
        <ProductAssignmentModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name.ar || selectedCategory.name.en || ""}
          assignedProductIds={categoryProducts.map((p) => p.id)}
          onProductsAssigned={() => {
            loadCategoryProducts(selectedCategory.id)
            loadCategories()
          }}
        />
      )}
    </div>
  )
}
