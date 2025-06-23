"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import { useToast } from "@/components/ui/use-toast"
import { apiService, type Brand } from "@/lib/api"
import { Plus, Edit, Trash2, Package, Eye, EyeOff, Settings } from "lucide-react"

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [isEditing, setIsEditing] = useState(false)
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

      const response = selectedBrand
        ? await apiService.updateBrand(selectedBrand.id, data)
        : await apiService.createBrand(data)

      if (response.success) {
        toast({
          title: "Success",
          description: `Brand ${selectedBrand ? "updated" : "created"} successfully`,
        })
        resetForm()
        fetchBrands()
      } else {
        toast({
          title: "Error",
          description: response.message || `Failed to ${selectedBrand ? "update" : "create"} brand`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${selectedBrand ? "update" : "create"} brand`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsEditing(true)
    setFormData({
      name_ar: brand.name.ar,
      name_en: brand.name.en || "",
      image: brand.image || "",
      image_name: brand.image || "",
      availability: brand.availability,
    })
  }

  const handleAddNew = () => {
    resetForm()
    setSelectedBrand(null)
    setIsEditing(true)
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
    setSelectedBrand(null)
    setIsEditing(false)
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
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Brands List */}
        <div className="col-span-4">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Brands</h3>
                {/* <p className="text-sm text-muted-foreground">Drag and drop items to sort</p>
                <div className="flex gap-2 text-sm text-muted-foreground mt-2">
                  <button className="text-blue-600">Collapse All</button>
                  <span>|</span>
                  <button className="text-blue-600">Expand All</button>
                </div> */}
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {brands.map((brand) => (
                  <div 
                    key={brand.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedBrand?.id === brand.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleEdit(brand)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-sm">{brand.name.ar}</span>
                        </div>
                        {brand.name.en && (
                          <p className="text-xs text-muted-foreground mt-1 ml-6">{brand.name.en}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 ml-6">
                          <div className="flex items-center gap-1">
                            {brand.availability ? (
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
                          <Badge variant="outline" className="text-xs">
                            {brand.products_count || 0} Products
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(brand.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {brands.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No brands found</p>
                    <p className="text-sm mt-1">Click "Add Brand" to create your first brand</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Edit Form */}
        <div className="col-span-8">
          <Card>
            <CardContent className="p-6">
              {/* Default State - No Brand Selected */}
              {!isEditing && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Plus className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Select or Create a Brand
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Choose a brand from the left sidebar to view and edit its details, or create a new brand to get started.
                  </p>
                  <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Brand
                  </Button>
                </div>
              )}

              {/* Edit/Create Form */}
              {isEditing && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {selectedBrand ? `"${selectedBrand.name.ar}" brand` : 'New Brand'}
                    </h3>
                    {selectedBrand && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span>Availability</span>
                          <div className="flex items-center gap-1">
                            {selectedBrand.availability ? (
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
                        <Badge variant="outline" className="text-xs">
                          {selectedBrand.products_count || 0} Products
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* General Tab Content */}
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
                        <Button variant="outline" onClick={resetForm}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                          {saving ? "Saving..." : selectedBrand ? "Update" : "Create"}
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
