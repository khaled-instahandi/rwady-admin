"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import { useToast } from "@/components/ui/use-toast"
import { apiService, type Banner } from "@/lib/api"
import { Plus, Edit, Trash2, ExternalLink, Calendar, Eye, EyeOff, Settings, X } from "lucide-react"
import { format } from "date-fns"

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    button_text_ar: "",
    button_text_en: "",
    image: "",
    image_name: "",
    image_url: "",
    is_popup: false,
    link: "",
    start_date: "",
    end_date: "",
    availability: true,
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const response = await apiService.getBanners()
      if (response.success) {
        setBanners(response.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch banners",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch banners",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (imageUrl: string, imageName: string) => {
    setFormData((prev) => ({
      ...prev,
      image: imageName,
      image_name: imageName,
      image_url: imageUrl,
    }))
  }

  const handleSave = async () => {
    if (!formData.title_ar.trim()) {
      toast({
        title: "Error",
        description: "Arabic title is required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const data = {
        title: {
          ar: formData.title_ar,
          en: formData.title_en || null,
        },
        description: {
          ar: formData.description_ar,
          en: formData.description_en || null,
        },
        button_text: {
          ar: formData.button_text_ar,
          en: formData.button_text_en || null,
        },
        image: formData.image_name,
        is_popup: formData.is_popup,
        link: formData.link || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        availability: formData.availability,
      }

      const response = selectedBanner && isEditing
        ? await apiService.updateBanner(selectedBanner.id, data)
        : await apiService.createBanner(data)

      if (response.success) {
        toast({
          title: "Success",
          description: `Banner ${selectedBanner && isEditing ? "updated" : "created"} successfully`,
        })
        resetForm()
        fetchBanners()
      } else {
        toast({
          title: "Error",
          description: response.message || `Failed to ${selectedBanner && isEditing ? "update" : "create"} banner`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${selectedBanner && isEditing ? "update" : "create"} banner`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner)
    setIsEditing(true)
    console.log("Editing banner:", banner);

    // Ensure the image URL is fully formed
    const fullImageUrl = banner.image_url ||
      (banner.image ? `https://rwady-backend.ahmed-albakor.com/storage/${banner.image}` : "");

    setFormData({
      title_ar: banner.title.ar,
      title_en: banner.title.en || "",
      description_ar: banner.description.ar,
      description_en: banner.description.en || "",
      button_text_ar: banner.button_text.ar,
      button_text_en: banner.button_text.en || "",
      image: banner.image || "",
      image_name: banner.image || "",
      is_popup: banner.is_popup,
      image_url: fullImageUrl,
      link: banner.link || "",
      start_date: banner.start_date || "",
      end_date: banner.end_date || "",
      availability: banner.availability,
    })
  }

  const handleAddNew = () => {
    resetForm()
    setSelectedBanner(null)
    setIsEditing(true) // تم تغيير هذا لإظهار النموذج
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this banner?")) return

    try {
      const response = await apiService.deleteBanner(id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Banner deleted successfully",
        })
        fetchBanners()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete banner",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete banner",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title_ar: "",
      title_en: "",
      description_ar: "",
      description_en: "",
      button_text_ar: "",
      button_text_en: "",
      image: "",
      image_name: "",
      is_popup: false,
      link: "",
      start_date: "",
      image_url: "",
      end_date: "",
      availability: true,
    })
    setSelectedBanner(null)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
            <p className="text-muted-foreground">Manage website banners and promotional content</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded w-8"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground">Manage website banners and promotional content</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left Panel - Categories List */}
        <div className="col-span-4  h-full">
          <Card className="border-gray-200 shadow-sm h-full">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Banners</h3>
                {/* <p className="text-sm text-muted-foreground">Drag and drop items to sort</p>
                <div className="flex gap-2 text-sm text-muted-foreground mt-2">
                  <button className="text-blue-600">Collapse All</button>
                  <span>|</span>
                  <button className="text-blue-600">Expand All</button>
                </div> */}
              </div>
              <div className=" overflow-y-auto h-full">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedBanner?.id === banner.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    onClick={() => handleEdit(banner)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-sm">{banner.title.ar}</span>
                        </div>
                        {banner.title.en && (
                          <p className="text-xs text-muted-foreground mt-1 ml-6">{banner.title.en}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 ml-6">
                          <div className="flex items-center gap-1">
                            {banner.availability ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-green-600">Enabled</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-xs text-gray-500">Disabled</span>
                              </>
                            )}
                          </div>
                          {banner.is_popup && (
                            <Badge variant="secondary" className="text-xs">Popup</Badge>
                          )}
                          {banner.link && (
                            <Badge variant="outline" className="text-xs">Has Link</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(banner.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No banners found</p>
                    <p className="text-sm mt-1">Click "Add Banner" to create your first banner</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Edit Form */}
        <div className="col-span-8 " >
          <Card className="border-gray-200 shadow-sm h-full">
            <CardContent className="p-6">
              {/* Default State - No Banner Selected */}
              {!selectedBanner && !isEditing && (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Plus className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Select or Create a Banner
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Choose a banner from the left sidebar to view and edit its details, or create a new banner to get started.
                  </p>
                  <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Banner
                  </Button>
                </div>
              )}

              {/* Edit/Create Form */}
              {(selectedBanner || isEditing) && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {selectedBanner && isEditing ? `"${selectedBanner.title.ar}" banner` : 'New Banner'}
                    </h3>
                    {selectedBanner && isEditing && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span>Availability</span>
                          <div className="flex items-center gap-1">
                            {selectedBanner.availability ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-600">Enabled</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-gray-500">Disabled</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* General Tab Content */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title_ar">Title (Arabic) *</Label>
                          <Input
                            id="title_ar"
                            value={formData.title_ar}
                            onChange={(e) => setFormData((prev) => ({ ...prev, title_ar: e.target.value }))}
                            placeholder="Enter Arabic title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="title_en">Title (English)</Label>
                          <Input
                            id="title_en"
                            value={formData.title_en}
                            onChange={(e) => setFormData((prev) => ({ ...prev, title_en: e.target.value }))}
                            placeholder="Enter English title"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="description_ar">Description (Arabic)</Label>
                          <Textarea
                            id="description_ar"
                            value={formData.description_ar}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description_ar: e.target.value }))}
                            placeholder="Enter Arabic description"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description_en">Description (English)</Label>
                          <Textarea
                            id="description_en"
                            value={formData.description_en}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description_en: e.target.value }))}
                            placeholder="Enter English description"
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="button_text_ar">Button Text (Arabic)</Label>
                          <Input
                            id="button_text_ar"
                            value={formData.button_text_ar}
                            onChange={(e) => setFormData((prev) => ({ ...prev, button_text_ar: e.target.value }))}
                            placeholder="Enter Arabic button text"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="button_text_en">Button Text (English)</Label>
                          <Input
                            id="button_text_en"
                            value={formData.button_text_en}
                            onChange={(e) => setFormData((prev) => ({ ...prev, button_text_en: e.target.value }))}
                            placeholder="Enter English button text"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Banner Image</Label>
                        <ImageUpload
                          value={formData.image_url}
                          imageName={formData.image_name}
                          onChange={handleImageChange}
                          folder="banners"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="link">Link URL</Label>
                        <Input
                          id="link"
                          value={formData.link}
                          onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                          placeholder="https://example.com"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start_date">Start Date</Label>
                          <Input
                            id="start_date"
                            type="datetime-local"
                            value={
                              formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ""
                            }
                            onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end_date">End Date</Label>
                          <Input
                            id="end_date"
                            type="datetime-local"
                            value={
                              formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ""
                            }
                            onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_popup"
                            checked={formData.is_popup}
                            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_popup: checked }))}
                          />
                          <Label htmlFor="is_popup">Show as Popup</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="availability"
                            checked={formData.availability}
                            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, availability: checked }))}
                          />
                          <Label htmlFor="availability">Available</Label>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={resetForm}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                          {saving ? "Saving..." : selectedBanner && isEditing ? "Update" : "Create"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
