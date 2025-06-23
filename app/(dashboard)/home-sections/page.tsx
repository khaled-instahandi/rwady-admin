"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SortableList } from "@/components/ui/sortable-list"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Home,
  Settings,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  Save,
} from "lucide-react"
import { apiService, type HomeSection } from "@/lib/api"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface HomeSectionFormData {
  title: {
    ar: string
    en: string
  }
  show_title: boolean
  type: string
  item_id: number | null
  status: string
  limit: number | null
  can_show_more: boolean
  show_more_path: string
  orders: number
  availability: boolean
}

const sectionTypes = [
  // { value: "banner", label: "Banner", ar: "الشريط الإعلاني" },
  // { value: "category_list", label: "Category List", ar: "قائمة الفئات" },
  // { value: "most_sold_products", label: "Most Sold Products", ar: "الأكثر مبيعا" },
  // { value: "video", label: "Video", ar: "الفيديو" },
  // { value: "recommended_products", label: "Recommended Products", ar: "الموصى به" },
  // { value: "new_products", label: "New Products", ar: "المنتجات الجديدة" },
  // { value: "featured_sections", label: "Featured Sections", ar: "المميز" },
  // { value: "brand_list", label: "Brand List", ar: "الماركات" },
  { value: "category_products", label: "Category Products", ar: "منتجات القسم" },
  { value: "brand_products", label: "Brand Products", ar: "منتجات الماركة" },
]

export default function HomeSectionsPage() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<string>("orders")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null)
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)
  const { toast } = useToast()
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingBrands, setLoadingBrands] = useState(false)

  const [formData, setFormData] = useState<HomeSectionFormData>({
    title: { ar: "", en: "" },
    show_title: true,
    type: "banner",
    item_id: null,
    status: "static",
    limit: null,
    can_show_more: false,
    show_more_path: "",
    orders: 1,
    availability: true,
  })

  const loadSections = async () => {
    setLoading(true)
    try {
      const response = await apiService.getHomeSections({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        // sort_by: sortBy,
        // sort_direction: sortDirection,
        // type: filterType !== "all" ? filterType : undefined,
        // availability: filterStatus !== "all" ? (filterStatus === "active" ? 1 : 0) : undefined,

      })

      if (response.success && response.data) {
        setSections(response.data)
      }
    } catch (error) {
      console.error("Failed to load home sections:", error)
      toast({
        title: "Error",
        description: "Failed to load home sections",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSections()
  }, [currentPage, itemsPerPage, searchTerm, filterType, filterStatus, sortBy, sortDirection])

  // Load categories and brands when the create/edit modal is opened with relevant section type
  useEffect(() => {
    if (showCreateModal || editingSection) {
      if ((formData.type === "category_products" && categories.length === 0) ||
        (editingSection?.type === "category_products" && categories.length === 0)) {
        loadCategories();
      }
      if ((formData.type === "brand_products" && brands.length === 0) ||
        (editingSection?.type === "brand_products" && brands.length === 0)) {
        loadBrands();
      }
    }
  }, [showCreateModal, editingSection])

  const handleCreateSection = async () => {
    setSaving(true)
    try {
      // Create a copy of formData and modify it
      const dataToSend = {
        ...formData,
        // Convert boolean to number (1 or 0)
        availability: formData.availability ? 1 : 0,
      };

      // Make sure item_id is set when the type is category_products or brand_products
      if ((dataToSend.type === "category_products" || dataToSend.type === "brand_products") && !dataToSend.item_id) {
        toast({
          title: "Error",
          description: `Please select a ${dataToSend.type === "category_products" ? "category" : "brand"}`,
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const response = await apiService.createHomeSection(dataToSend)
      if (response.success) {
        toast({
          title: "Success",
          description: "Home section created successfully",
        })
        setShowCreateModal(false)
        resetForm()
        loadSections()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create home section",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSection = async () => {
    if (!editingSection) return

    setSaving(true)
    try {
      // Create a copy of formData and modify it
      const dataToSend = {
        ...formData,
        // Convert boolean to number (1 or 0)
        availability: formData.availability ? 1 : 0,
      };

      // Make sure item_id is set when the type is category_products or brand_products
      if ((dataToSend.type === "category_products" || dataToSend.type === "brand_products") && !dataToSend.item_id) {
        toast({
          title: "Error",
          description: `Please select a ${dataToSend.type === "category_products" ? "category" : "brand"}`,
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const response = await apiService.updateHomeSection(editingSection.id, dataToSend)
      if (response.success) {
        toast({
          title: "Success",
          description: "Home section updated successfully",
        })
        setEditingSection(null)
        resetForm()
        loadSections()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update home section",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSection = async (id: number) => {
    if (!confirm("Are you sure you want to delete this home section?")) return

    try {
      const response = await apiService.deleteHomeSection(id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Home section deleted successfully",
        })
        loadSections()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete home section",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleToggleAvailability = async (section: HomeSection) => {
    try {
      const response = await apiService.updateHomeSection(section.id, {
        ...section,
        availability: !section.availability,
      })
      if (response.success) {
        toast({
          title: "Success",
          description: `Section ${!section.availability ? "enabled" : "disabled"} successfully`,
        })
        loadSections()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update section status",
        variant: "destructive",
      })
    }
  }

  const handleReorder = async (reorderedItems: HomeSection[]) => {
    setReordering(true)
    try {
      // Find the item that was moved (dragged)
      let movedItemId = null;
      let targetPosition = 0;

      // Compare original positions with new positions to identify the moved item
      const currentOrderMap = new Map(sections.map(section => [section.id, section.orders]));

      for (let i = 0; i < reorderedItems.length; i++) {
        const item = reorderedItems[i];
        const newOrder = i + 1;
        const originalOrder = currentOrderMap.get(item.id) || 0;

        if (originalOrder !== newOrder) {
          // This item has been moved
          movedItemId = item.id;
          targetPosition = newOrder;
          break;
        }
      }

      if (movedItemId) {
        // Send a single request for the moved item with its new target position
        const response = await apiService.updateHomeSectionOrder({
          id: movedItemId,
          orders: targetPosition
        });

        // Check if the update was successful
        if (response.success) {
          // Update local state with the new order
          setSections(
            reorderedItems.map((section, index) => ({
              ...section,
              orders: index + 1,
            })),
          )
          toast({
            title: "Success",
            description: "Section order updated successfully",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to update section order",
            variant: "destructive",
          })
          loadSections() // Reload to revert changes
        }
      } else {
        // No items were moved
        toast({
          title: "Info",
          description: "No changes to section order detected",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update section order",
        variant: "destructive",
      })
      loadSections() // Reload to revert changes
    } finally {
      setReordering(false)
    }
  }

  const loadCategories = async () => {
    setLoadingCategories(true)
    try {
      const response = await apiService.getCategories()
      if (response.success && response.data) {
        setCategories(response.data)
        console.log("Categories loaded:", response.data);

      }
    } catch (error) {
      console.error("Failed to load categories:", error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadBrands = async () => {
    setLoadingBrands(true)
    try {
      const response = await apiService.getBrands()
      if (response.success && response.data) {
        setBrands(response.data)
      }
    } catch (error) {
      console.error("Failed to load brands:", error)
    } finally {
      setLoadingBrands(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: { ar: "", en: "" },
      show_title: true,
      type: "banner",
      item_id: null,
      status: "static",
      limit: null,
      can_show_more: false,
      show_more_path: "",
      orders: sections.length + 1,
      availability: true,
    })
  }

  const openEditModal = (section: HomeSection) => {
    setEditingSection(section)
    setFormData({
      title: {
        ar: section.title.ar || "",
        en: section.title.en || "",
      },
      show_title: section.show_title,
      type: section.type,
      item_id: section.item_id,
      status: section.status,
      limit: section.limit,
      can_show_more: section.can_show_more,
      show_more_path: section.show_more_path || "",
      orders: section.orders,
      availability: section.availability,
    })
  }

  const getSectionTypeLabel = (type: string) => {
    const sectionType = sectionTypes.find((t) => t.value === type)
    return sectionType ? sectionType.ar : type
  }

  const renderSectionItem = (section: HomeSection, index: number) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="p-6 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900">{section.title.ar || section.title.en}</h3>
            <Badge variant="outline" className="text-xs">
              {getSectionTypeLabel(section.type)}
            </Badge>
            <Badge variant={section.availability ? "default" : "secondary"} className="text-xs">
              {section.availability ? "Active" : "Inactive"}
            </Badge>
            {section.show_title && (
              <Badge variant="outline" className="text-xs text-blue-600">
                Show Title
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Order: {section.orders}</span>
            {section.limit && <span>Limit: {section.limit}</span>}
            {section.can_show_more && <span>Show More: ✓</span>}
            <span>Status: {section.status}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleAvailability(section)}
            className={section.availability ? "text-green-600 hover:bg-green-50" : "text-gray-400"}
          >
            {section.availability ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(section)}
            className="text-blue-600 hover:bg-blue-50"
          >
            <Edit className="w-4 h-4" />
          </Button>
          {section.status === "dynamic" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteSection(section.id)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="p-6 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Home className="w-8 h-8 mr-3 text-blue-600" />
            Home Sections Management
          </h1>
          <p className="text-gray-600 mt-1">Manage and organize your website's home page sections</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Section
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {sectionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={loadSections} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                }}
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections List */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Home Sections ({sections.length})</span>
            <div className="flex items-center space-x-4">
              {reordering && (
                <div className="flex items-center text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating order...
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Items per page:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sections found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first home section</p>
              <Button
                onClick={() => {
                  resetForm()
                  setShowCreateModal(true)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Section
              </Button>
            </div>
          ) : (
            <SortableList
              items={sections.map((section) => ({ ...section, id: section.id.toString() }))}
              onReorder={(reorderedItems) => {
                const reorderedSections = reorderedItems.map((item) => ({
                  ...item,
                  id: Number(item.id),
                })) as HomeSection[]
                handleReorder(reorderedSections)
              }}
              renderItem={renderSectionItem}
              className="divide-y divide-gray-200"
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={showCreateModal || !!editingSection}
        onOpenChange={() => {
          setShowCreateModal(false)
          setEditingSection(null)
          resetForm()
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              {editingSection ? "Edit Home Section" : "Create New Home Section"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title-ar">Title (Arabic)</Label>
                <Input
                  id="title-ar"
                  value={formData.title.ar}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: { ...prev.title, ar: e.target.value },
                    }))
                  }
                  placeholder="العنوان بالعربية"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title-en">Title (English)</Label>
                <Input
                  id="title-en"
                  value={formData.title.en}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: { ...prev.title, en: e.target.value },
                    }))
                  }
                  placeholder="Title in English"
                />
              </div>
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, type: value, item_id: null }));
                    // Load related data when selecting specific types
                    if (value === "category_products" && categories.length === 0) {
                      loadCategories();
                    } else if (value === "brand_products" && brands.length === 0) {
                      loadBrands();
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.ar} ({type.label})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category or Brand Selection based on section type */}
            {(formData.type === "category_products" || formData.type === "brand_products") && (
              <div className="space-y-2">
                <Label>
                  {formData.type === "category_products" ? "Select Category" : "Select Brand"}
                </Label>
                <Select
                  value={formData.item_id?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, item_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      formData.type === "category_products"
                        ? (loadingCategories ? "Loading categories..." : "Select a category")
                        : (loadingBrands ? "Loading brands..." : "Select a brand")
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type === "category_products" ? (
                      categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name.ar} ({category.name.en || ""})
                          </SelectItem>
                        ))
                      ) : loadingCategories ? (
                        <SelectItem disabled value="">Loading categories...</SelectItem>
                      ) : (
                        <SelectItem disabled value="">No categories found</SelectItem>
                      )
                    ) : (
                      brands.length > 0 ? (
                        brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name.ar} ({brand.name.en || ""})
                          </SelectItem>
                        ))
                      ) : loadingBrands ? (
                        <SelectItem disabled value="">Loading brands...</SelectItem>
                      ) : (
                        <SelectItem disabled value="">No brands found</SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Order and Limit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orders">Display Order</Label>
                <Input
                  id="orders"
                  type="number"
                  value={formData.orders}
                  onChange={(e) => setFormData((prev) => ({ ...prev, orders: Number(e.target.value) }))}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Item Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  value={formData.limit || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, limit: e.target.value ? Number(e.target.value) : null }))
                  }
                  placeholder="No limit"
                />
              </div>
            </div>

            {/* Show More Path */}
            <div className="space-y-2">
              <Label htmlFor="show-more-path">Show More Path</Label>
              <Input
                id="show-more-path"
                value={formData.show_more_path}
                onChange={(e) => setFormData((prev) => ({ ...prev, show_more_path: e.target.value }))}
                placeholder="e.g., products?category=electronics"
              />
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-medium">Show Title</Label>
                  <p className="text-sm text-gray-500">Display the section title on the website</p>
                </div>
                <Switch
                  checked={formData.show_title}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, show_title: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-medium">Can Show More</Label>
                  <p className="text-sm text-gray-500">Enable "Show More" button for this section</p>
                </div>
                <Switch
                  checked={formData.can_show_more}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, can_show_more: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-medium">Availability</Label>
                  <p className="text-sm text-gray-500">Enable or disable this section</p>
                </div>
                <Switch
                  checked={formData.availability}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, availability: checked }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setEditingSection(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingSection ? handleUpdateSection : handleCreateSection}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingSection ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingSection ? "Update Section" : "Create Section"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
