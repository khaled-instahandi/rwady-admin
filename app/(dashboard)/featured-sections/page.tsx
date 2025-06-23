"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Settings,
  X,
} from "lucide-react"
import { apiService, type FeaturedSection } from "@/lib/api"
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
  const [selectedSection, setSelectedSection] = useState<FeaturedSection | null>(null)
  const [isEditing, setIsEditing] = useState(false)
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

  const handleSave = async () => {
    // Check for required fields
    if (!formData.name.ar.trim() && !formData.name.en.trim()) {
      toast({
        title: "Error",
        description: "Section name is required in at least one language",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Prepare data for API - use image_name instead of image URL
      const dataToSend = {
        ...formData,
        image: formData.image_name, // Send image_name to API
      }

      const response = selectedSection
        ? await apiService.updateFeaturedSection(selectedSection.id, dataToSend)
        : await apiService.createFeaturedSection(dataToSend)

      if (response.success) {
        toast({
          title: "Success",
          description: `Featured section ${selectedSection ? "updated" : "created"} successfully`,
        })
        setSelectedSection(null)
        setIsEditing(false)
        resetForm()
        loadSections()
      } else {
        toast({
          title: "Error",
          description: response.message || `Failed to ${selectedSection ? "update" : "create"} featured section`,
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

  const handleEdit = (section: FeaturedSection) => {
    setSelectedSection(section)
    setIsEditing(true)
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

  const handleNew = () => {
    resetForm()
    setSelectedSection(null)
    setIsEditing(true)
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
    <div className="space-y-2">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Star className="w-8 h-8 mr-3 text-yellow-600" />
            Featured Sections Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage featured content sections for your website</p>
        </div>
        <Button
          onClick={handleNew}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Featured Section
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
        {/* Left Panel: Sections List */}
        <div className="lg:col-span-1">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-medium">Featured Sections</CardTitle>

              {/* Filters and Search */}
              <div className="space-y-2 mt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search sections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={loadSections}>
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-320px)]">
                {loading ? (
                  // Loading skeletons
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3 p-3">
                        <div className="w-12 h-12 bg-gray-200 animate-pulse rounded" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                          <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sections.length === 0 ? (
                  // Empty state
                  <div className="text-center py-12">
                    <Star className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">No sections found</h3>
                    <p className="text-gray-500 text-sm mb-4">Create your first featured section</p>
                  </div>
                ) : (
                  // Section list
                  <div className="divide-y divide-gray-100">
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedSection?.id === section.id ? 'bg-gray-50' : ''}`}
                        onClick={() => handleEdit(section)}
                      >
                        <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={section.image_url || "/placeholder.svg"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 truncate">
                              {section.name.ar || section.name.en || "Unnamed Section"}
                            </h3>
                            <span className={`text-xs ml-2 rounded-full px-2 py-0.5 ${section.availability
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                              }`}>
                              {section.availability ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {section.link && (
                            <div className="flex items-center text-xs text-blue-600 mt-1">
                              <ExternalLink onClick={() => section.link && window.open(section.link, "_blank")} className="w-3 h-3 mr-1" />
                              {/* <span className="truncate">{section.link}</span> */}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>{formatDate(section.start_date)}</span>
                            </div>
                            <span>ID: {section.id}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Form or Default Content */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200 shadow-sm h-full">
            {isEditing ? (
              <>
                <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-medium">
                    {selectedSection ? "Edit Featured Section" : "Create New Featured Section"}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => { setIsEditing(false); setSelectedSection(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
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
                </CardContent>
                <CardFooter className="border-t bg-gray-50 p-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { setIsEditing(false); setSelectedSection(null); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {selectedSection ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {selectedSection ? "Update Section" : "Create Section"}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </>
            ) : (
              // Default state when nothing is selected
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="text-center max-w-md">
                  <div className="bg-yellow-50 p-3 rounded-full inline-block mb-4">
                    <Settings className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Featured Sections Management</h2>
                  <p className="text-gray-500 mb-6">
                    Select a featured section from the list to edit its details, or create a new one to add to your website.
                  </p>
                  <Button onClick={handleNew} className="bg-yellow-600 hover:bg-yellow-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Section
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
