"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageUpload } from "@/components/ui/image-upload"
import { useToast } from "@/hooks/use-toast"
import { apiService, type Banner } from "@/lib/api"
import { Plus, Edit, Trash2, ExternalLink, Calendar, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
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

      const response = editingBanner
        ? await apiService.updateBanner(editingBanner.id, data)
        : await apiService.createBanner(data)

      if (response.success) {
        toast({
          title: "Success",
          description: `Banner ${editingBanner ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchBanners()
      } else {
        toast({
          title: "Error",
          description: response.message || `Failed to ${editingBanner ? "update" : "create"} banner`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingBanner ? "update" : "create"} banner`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    console.log("Editing banner:", banner);
    
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
      link: banner.link || "",
      start_date: banner.start_date || "",
      end_date: banner.end_date || "",
      availability: banner.availability,
    })
    setIsDialogOpen(true)
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
      end_date: "",
      availability: true,
    })
    setEditingBanner(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
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
        <Button onClick={() =>
          setIsDialogOpen(true)
        }>
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          {/* <DialogTrigger asChild>

          </DialogTrigger> */}
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
            </DialogHeader>
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
                  value={formData.image ? `https://rwady-backend.ahmed-albakor.com/storage/${formData.image}` : ""}
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
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editingBanner ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => (
          <Card key={banner.id} className="overflow-hidden">
            {banner.image_url && (
              <div className="h-48 overflow-hidden">
                <img
                  src={banner.image_url || "/placeholder.svg"}
                  alt={banner.title.ar}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg line-clamp-1">{banner.title.ar}</h3>
                  <div className="flex items-center gap-1">
                    {banner.availability ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {banner.title.en && <p className="text-sm text-muted-foreground line-clamp-1">{banner.title.en}</p>}
                {banner.description.ar && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{banner.description.ar}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {banner.is_popup && <Badge variant="secondary">Popup</Badge>}
                  {banner.link && <Badge variant="outline">Has Link</Badge>}
                  {banner.start_date && <Badge variant="outline">Scheduled</Badge>}
                </div>
                {banner.start_date && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(banner.start_date), "MMM dd, yyyy")}
                    {banner.end_date && ` - ${format(new Date(banner.end_date), "MMM dd, yyyy")}`}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(banner.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {banner.link && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={banner.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {banners.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No banners found</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first banner</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Banner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
