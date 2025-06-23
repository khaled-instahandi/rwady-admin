"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageUpload } from "@/components/ui/image-upload"
import { useToast } from "@/components/ui/use-toast"
import { apiService, type Brand } from "@/lib/api"
import { Plus, Edit, Trash2, Package, Eye, EyeOff } from "lucide-react"

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    image: "",
    image_name: "",
    availability: true,
  })

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    setLoading(true)
    try {
      const response = await apiService.getBrands()
      if (response.success) {
        setBrands(response.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch brands",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch brands",
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
    if (!formData.name_ar.trim()) {
      toast({
        title: "Error",
        description: "Arabic name is required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const data = {
        name: {
          ar: formData.name_ar,
          en: formData.name_en || null,
        },
        image: formData.image_name,
        availability: formData.availability,
      }

      const response = editingBrand
        ? await apiService.updateBrand(editingBrand.id, data)
        : await apiService.createBrand(data)

      if (response.success) {
        toast({
          title: "Success",
          description: `Brand ${editingBrand ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchBrands()
      } else {
        toast({
          title: "Error",
          description: response.message || `Failed to ${editingBrand ? "update" : "create"} brand`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingBrand ? "update" : "create"} brand`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({
      name_ar: brand.name.ar,
      name_en: brand.name.en || "",
      image: brand.image || "",
      image_name: brand.image || "",
      availability: brand.availability,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this brand?")) return

    try {
      const response = await apiService.deleteBrand(id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Brand deleted successfully",
        })
        fetchBrands()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete brand",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete brand",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name_ar: "",
      name_en: "",
      image: "",
      image_name: "",
      availability: true,
    })
    setEditingBrand(null)
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
            <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
            <p className="text-muted-foreground">Manage product brands and manufacturers</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-t-lg"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">Manage product brands and manufacturers</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          {/* <DialogTrigger asChild>

          </DialogTrigger> */}
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name_ar">Name (Arabic) *</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name_ar: e.target.value }))}
                  placeholder="Enter Arabic name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_en">Name (English)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name_en: e.target.value }))}
                  placeholder="Enter English name"
                />
              </div>

              <div className="space-y-2">
                <Label>Brand Logo</Label>
                <ImageUpload
                  value={formData.image ? `https://rwady-backend.ahmed-albakor.com/storage/${formData.image}` : ""}
                  imageName={formData.image_name}
                  onChange={handleImageChange}
                  folder="brands"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="availability"
                  checked={formData.availability}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, availability: checked }))}
                />
                <Label htmlFor="availability">Available</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editingBrand ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {brands.map((brand) => (
          <Card key={brand.id} className="overflow-hidden">
            {brand.image_url ? (
              <div className="h-32 overflow-hidden bg-gray-50 flex items-center justify-center">
                <img
                  src={brand.image_url || "/placeholder.svg"}
                  alt={brand.name.ar}
                  className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-200"
                />
              </div>
            ) : (
              <div className="h-32 bg-gray-100 flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg line-clamp-1">{brand.name.ar}</h3>
                  <div className="flex items-center gap-1">
                    {brand.availability ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {brand.name.en && <p className="text-sm text-muted-foreground line-clamp-1">{brand.name.en}</p>}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {brand.products_count || 0} Products
                  </Badge>
                  <Badge variant={brand.availability ? "default" : "secondary"}>
                    {brand.availability ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(brand)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(brand.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {brands.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No brands found</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first brand</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Brand
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
