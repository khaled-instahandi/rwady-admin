"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  Calendar,
  RefreshCw,
  Loader2,
  Save,
  ArrowUpDown,
} from "lucide-react"
import { apiService, type FeaturedSection } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface FeaturedSectionFormData {
  name: {
    ar: string
    en: string
  }
  image: string
  image_name: string
  link: string
  start_date: string
  end_date: string
  availability: boolean
}

export default function FeaturedSectionsPage() {
  const [sections, setSections] = useState<FeaturedSection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSection, setEditingSection] = useState<FeaturedSection | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<FeaturedSectionFormData>({
    name: { ar: "", en: "" },
    image: "",
    image_name: "",
    link: "",
    start_date: "",
    end_date: "",
    availability: true,
  })

  const loadSections = async () => {
    setLoading(true)
    try {
      const response = await apiService.getFeaturedSections({
        page: currentPage,
        per_page: itemsPerPage,
        search: searchTerm,
        sort_by: sortBy,
        sort_direction: sortDirection,
        availability: filterStatus === "all" ? undefined : filterStatus === "active" ? 1 : 0,
      })
      console.log("filterStatus", filterStatus);

      if (response.success && response.data) {
        setSections(response.data)
      }
    } catch (error) {
      console.error("Failed to load featured sections:", error)
      toast({
        title: "Error",
        description: "Failed to load featured sections",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSections()
  }, [currentPage, itemsPerPage, searchTerm, filterStatus, sortBy, sortDirection])

  const handleCreateSection = async () => {
    setSaving(true)
    try {
      // Prepare data for API - use image_name instead of image URL
      const dataToSend = {
        ...formData,
        image: formData.image_name, // Send image_name to API
      }

      const response = await apiService.createFeaturedSection(dataToSend)
      if (response.success) {
        toast({
          title: "Success",
          description: "Featured section created successfully",
        })
        setShowCreateModal(false)
        resetForm()
        loadSections()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create featured section",
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
      // Prepare data for API - use image_name instead of image URL
      const dataToSend = {
        ...formData,
        image: formData.image_name, // Send image_name to API
      }

      const response = await apiService.updateFeaturedSection(editingSection.id, dataToSend)
      if (response.success) {
        toast({
          title: "Success",
          description: "Featured section updated successfully",
        })
        setEditingSection(null)
        resetForm()
        loadSections()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update featured section",
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
    if (!confirm("Are you sure you want to delete this featured section?")) return

    try {
      const response = await apiService.deleteFeaturedSection(id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Featured section deleted successfully",
        })
        loadSections()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete featured section",
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

  const handleToggleAvailability = async (section: FeaturedSection) => {
    try {
      const response = await apiService.updateFeaturedSection(section.id, {
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

  const handleImageChange = (imageUrl: string, imageName: string) => {
    setFormData((prev) => ({
      ...prev,
      image: imageUrl,
      image_name: imageName,
    }))
  }

  const resetForm = () => {
    setFormData({
      name: { ar: "", en: "" },
      image: "",
      image_name: "",
      link: "",
      start_date: "",
      end_date: "",
      availability: true,
    })
  }

  const openEditModal = (section: FeaturedSection) => {
    setEditingSection(section)
    setFormData({
      name: {
        ar: section.name.ar || "",
        en: section.name.en || "",
      },
      image: section.image_url || "",
      image_name: section.image || "",
      link: section.link || "",
      start_date: section.start_date || "",
      end_date: section.end_date || "",
      availability: section.availability,
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date set"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Star className="w-8 h-8 mr-3 text-yellow-600" />
            Featured Sections Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage featured content sections for your website</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Featured Section
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search featured sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 per page</SelectItem>
                <SelectItem value="24">24 per page</SelectItem>
                <SelectItem value="48">48 per page</SelectItem>
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

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="border-gray-200 shadow-sm">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gray-200 animate-pulse rounded-t-lg" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 animate-pulse rounded" />
                    <div className="h-3 bg-gray-200 animate-pulse rounded w-2/3" />
                    <div className="flex justify-between">
                      <div className="h-6 bg-gray-200 animate-pulse rounded w-16" />
                      <div className="h-6 bg-gray-200 animate-pulse rounded w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : sections.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No featured sections found</h3>
              <p className="text-gray-500 mb-4">Create your first featured section to showcase content</p>
              <Button
                onClick={() => {
                  resetForm()
                  setShowCreateModal(true)
                }}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Section
              </Button>
            </div>
          ) : (
            sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                  <CardContent className="p-0">
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={section.image_url || "/placeholder.svg?height=200&width=300"}
                        alt={section.name.ar || section.name.en || "Featured Section"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <Badge variant={section.availability ? "default" : "secondary"} className="text-xs">
                          {section.availability ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEditModal(section)}
                            className="bg-white/90 hover:bg-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleToggleAvailability(section)}
                            className="bg-white/90 hover:bg-white"
                          >
                            {section.availability ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDeleteSection(section.id)}
                            className="bg-white/90 hover:bg-white text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 truncate">
                        {section.name.ar || section.name.en || "Unnamed Section"}
                      </h3>
                      {section.link && (
                        <div className="flex items-center text-sm text-blue-600 mb-2">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          <span className="truncate">{section.link}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{formatDate(section.start_date)}</span>
                        </div>
                        <span>ID: {section.id}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

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
              <Star className="w-5 h-5 mr-2 text-yellow-600" />
              {editingSection ? "Edit Featured Section" : "Create New Featured Section"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name-ar">Name (Arabic)</Label>
                <Input
                  id="name-ar"
                  value={formData.name.ar}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: { ...prev.name, ar: e.target.value },
                    }))
                  }
                  placeholder="اسم القسم المميز"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name-en">Name (English)</Label>
                <Input
                  id="name-en"
                  value={formData.name.en}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: { ...prev.name, en: e.target.value },
                    }))
                  }
                  placeholder="Featured Section Name"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Featured Image</Label>
              <ImageUpload
                value={formData.image}
                imageName={formData.image_name}
                onChange={handleImageChange}
                // uploadFunction={(file) => apiService.uploadImage(file, "featured-sections")}
                folder="products"
                className="mt-2"
              />
            </div>

            {/* Link */}
            <div className="space-y-2">
              <Label htmlFor="link">Link URL</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                placeholder="https://example.com"
                type="url"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => {
                    if (e.target.value) {
                      // Format date as Y-m-d H:i:s
                      const date = new Date(e.target.value);
                      const formattedDate = date.toISOString().slice(0, 19).replace("T", " ");
                      setFormData((prev) => ({ ...prev, start_date: formattedDate }));
                    } else {
                      setFormData((prev) => ({ ...prev, start_date: "" }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => {
                    if (e.target.value) {
                      // Format date as Y-m-d H:i:s
                      const date = new Date(e.target.value);
                      const formattedDate = date.toISOString().slice(0, 19).replace("T", " ");
                      setFormData((prev) => ({ ...prev, end_date: formattedDate }));
                    } else {
                      setFormData((prev) => ({ ...prev, end_date: "" }));
                    }
                  }}
                />
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Availability</Label>
                <p className="text-sm text-gray-500">Enable or disable this featured section</p>
              </div>
              <Switch
                checked={formData.availability}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, availability: checked }))}
              />
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
              className="bg-yellow-600 hover:bg-yellow-700"
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
