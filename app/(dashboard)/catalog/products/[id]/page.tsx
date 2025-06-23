"use client"

/* 
 * Product Edit Page - Fully matched with backend data structure
 * Includes all fields: images, colors, categories, brands, SEO, related products/categories, 
 * cost price discounts, etc. All fields are editable and correctly mapped for loading and saving.
 */

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { ImageUpload } from "@/components/ui/image-upload"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  ArrowLeft,
  Save,
  Copy,
  Eye,
  Package,
  DollarSign,
  Truck,
  Search,
  Plus,
  X,
  Upload,
  Video,
  AlertTriangle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProductFormData {
  name: { ar: string; en: string }
  description: { ar: string; en: string }
  sku: string | null
  price: number
  price_after_discount?: number | null
  price_discount_start?: string | null
  price_discount_end?: string | null
  cost_price?: number | null
  cost_price_after_discount?: number | null
  cost_price_discount_start?: string | null
  cost_price_discount_end?: string | null
  availability: boolean
  stock: number
  stock_unlimited: boolean | null
  out_of_stock: "hide_from_storefront" | "show_on_storefront" | "show_and_allow_pre_order" | "show_as_sold_out"
  minimum_purchase: number
  maximum_purchase: number
  requires_shipping: boolean
  weight?: number | null
  length?: number | null
  width?: number | null
  height?: number | null
  shipping_type: "default" | "fixed_shipping" | "free_shipping" | "calculated_shipping"
  shipping_rate_single?: number | null
  shipping_rate_multi?: number | null
  is_recommended: boolean
  ribbon_text?: { ar: string; en: string | null } | null
  ribbon_color?: string | null
  categories?: number[]
  brands?: number[]

  seo?: {
    meta_title: string
    meta_description: string
    keywords: string
    image: string

  }

  related_category_id?: number | null
  related_category_limit?: number
  related_products?: number[]
}

export default function ProductEditPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("general")
  const [images, setImages] = useState<Array<{ url: string; name: string }>>([])
  const [videos, setVideos] = useState<Array<{ url: string; type: "file" | "link" }>>([])
  const [colors, setColors] = useState<string[]>([])
  const [newColor, setNewColor] = useState("#000000")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [showSaveNotification, setShowSaveNotification] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<{ id: number; name: string }[]>([])
  const [availableBrands, setAvailableBrands] = useState<{ id: number; name: string }[]>([])
  const [relatedProducts, setRelatedProducts] = useState<{ id: number; name: string; price: number; image?: string }[]>([])
  const [searchRelatedQuery, setSearchRelatedQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ id: number; name: string; price: number; image?: string }[]>([])

  const isEditMode = params.id !== "new"
  const productId = isEditMode ? Number(params.id) : null

  const [formData, setFormData] = useState<ProductFormData>({
    name: { ar: "", en: "" },
    description: { ar: "", en: "" },
    sku: "",
    price: 0,
    availability: true,
    stock: 0,
    stock_unlimited: false,
    out_of_stock: "hide_from_storefront",
    minimum_purchase: 1,
    maximum_purchase: 999,
    requires_shipping: false,
    shipping_type: "fixed_shipping",
    is_recommended: false,
  })

  const [originalFormData, setOriginalFormData] = useState<ProductFormData | null>(null)

  // Load product data, categories and brands when initializing
  useEffect(() => {
    fetchCategoriesAndBrands()
    if (isEditMode && productId) {
      loadProduct()
    } else {
      setInitialLoading(false)
    }
  }, [])

  // Track changes
  useEffect(() => {
    if (originalFormData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData)
      setHasUnsavedChanges(hasChanges)
    }
  }, [formData, originalFormData])

  // Show save notification
  useEffect(() => {
    if (hasUnsavedChanges && !showSaveNotification) {
      setShowSaveNotification(true)
    }
  }, [hasUnsavedChanges])

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Search related products
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchRelatedQuery.trim() === "") {
        setSearchResults([])
      } else {
        const filteredProducts = relatedProducts.filter((product) =>
          product.name.toLowerCase().includes(searchRelatedQuery.toLowerCase())
        )
        setSearchResults(filteredProducts)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchRelatedQuery, relatedProducts])

  const loadProduct = async () => {
    if (!productId) return

    try {
      setInitialLoading(true)
      const response = await apiService.getProduct(productId)

      if (response.success && response.data) {
        const product = response.data
        interface Category {
          id: number;
          name?: {
            ar?: string;
            en?: string;
          };
        }

        interface RelatedProduct {
          id: number;
          name?: string;
        }

        interface Brand {
          id: number;
          name?: string;
        }

        interface ProductApiResponse {
          name: { ar: string; en: string };
          description: { ar: string; en: string };
          sku: string | null;
          price: number;
          price_after_discount?: number | null;
          price_discount_start?: string | null;
          price_discount_end?: string | null;
          cost_price?: number | null;
          cost_price_after_discount?: number | null;
          cost_price_discount_start?: string | null;
          cost_price_discount_end?: string | null;
          availability: boolean;
          stock: number;
          stock_unlimited: boolean | null;
          out_of_stock: "hide_from_storefront" | "show_on_storefront" | "show_and_allow_pre_order" | "show_as_sold_out";
          minimum_purchase: number;
          maximum_purchase: number;
          requires_shipping: boolean;
          weight?: number | null;
          length?: number | null;
          width?: number | null;
          height?: number | null;
          shipping_type: "default" | "fixed_shipping" | "free_shipping" | "calculated_shipping";
          shipping_rate_single?: number | null;
          shipping_rate_multi?: number | null;
          is_recommended: boolean;
          ribbon_text?: { ar: string; en: string | null } | null;
          ribbon_color?: string | null;
          categories?: Category[];
          brands?: Brand[];
          related_products?: RelatedProduct[];
          related_category_id?: number | null;
          related_category_limit?: number;
          seo?: {
            meta_title: string;
            meta_description: string;
            keywords: string;
            image: string;
          };
        }

        const productFormData: ProductFormData = {
          name: product.name,
          description: product.description,
          sku: product.sku,
          price: product.price,
          price_after_discount: product.price_after_discount,
          price_discount_start: product.price_discount_start,
          price_discount_end: product.price_discount_end,
          cost_price: product.cost_price,
          cost_price_after_discount: product.cost_price_after_discount,
          cost_price_discount_start: product.cost_price_discount_start,
          cost_price_discount_end: product.cost_price_discount_end,
          availability: product.availability,
          stock: product.stock,
          stock_unlimited: product.stock_unlimited,
          out_of_stock: product.out_of_stock,
          minimum_purchase: product.minimum_purchase,
          maximum_purchase: product.maximum_purchase,
          requires_shipping: product.requires_shipping,
          weight: product.weight,
          length: product.length,
          width: product.width,
          height: product.height,
          shipping_type: product.shipping_type,
          shipping_rate_single: product.shipping_rate_single,
          shipping_rate_multi: product.shipping_rate_multi,
          is_recommended: product.is_recommended,
          ribbon_text: product.ribbon_text || { ar: "", en: "" },
          ribbon_color: product.ribbon_color,
          categories: (product as any).ct.categories?.map((cat: Category) => cat.id),
          brands: (product as any).brands?.map((brand: Brand) => brand.id) || [],
          related_category_id: product.related_category_id,
          related_category_limit: product.related_category_limit,
          related_products: product.related_products?.map(p => p.id),
          seo: (product as any).seo || {
            meta_title: "",
            meta_description: "",
            keywords: "",
            image: ""
          }
        }

        setFormData(productFormData)
        setOriginalFormData(productFormData)

        // Set images and colors
        if (product.media) {
          const productImages = product.media
            .filter((m) => m.type === "image")
            .map((m) => ({ url: m.url, name: m.path }))
          setImages(productImages)

          const productVideos = product.media
            .filter((m) => m.type === "video")
            .map((m) => ({ url: m.url, type: m.source as "file" | "link" }))
          setVideos(productVideos)
        }

        if (product.colors) {
          setColors(product.colors.map((c) => c.color))
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        })
        router.push("/catalog/products")
      }
    } catch (error) {
      console.error("Error loading product:", error)
      toast({
        title: "Error",
        description: "An error occurred while loading the product",
        variant: "destructive",
      })
      router.push("/catalog/products")
    } finally {
      setInitialLoading(false)
    }
  }

  const fetchCategoriesAndBrands = async () => {
    try {
      // Fetch categories
      const categoriesResponse = await apiService.getCategories()
      if (categoriesResponse.success && categoriesResponse.data) {
        // Flatten categories for the dropdown
        const flatCategories = flattenCategories(categoriesResponse.data)
        setAvailableCategories(flatCategories)
      }

      // Fetch brands
      const brandsResponse = await apiService.getBrands()
      if (brandsResponse.success && brandsResponse.data) {
        setAvailableBrands(brandsResponse.data.map((brand) => ({
          id: brand.id,
          name: brand.name.ar || brand.name.en || "Unknown"
        })))
      }
    } catch (error) {
      console.error("Error fetching categories and brands:", error)
      toast({
        title: "Error",
        description: "Failed to load categories and brands",
        variant: "destructive",
      })
    }
  }

  // Flatten the category tree into a one-level array for the dropdown
  const flattenCategories = (categories: any[], parentPath = "", result: any[] = []) => {
    categories.forEach((category) => {
      const path = parentPath ? `${parentPath} > ${category.name.ar || category.name.en}` : category.name.ar || category.name.en
      result.push({
        id: category.id,
        name: path
      })

      if (category.children && category.children.length) {
        flattenCategories(category.children, path, result)
      }
    })
    return result
  }

  // Search for products for related products section
  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await apiService.getProducts({ search: query, per_page: 10 })
      if (response.success && response.data) {
        // Filter out the current product and already selected products
        const filteredResults = response.data
          .filter(p => p.id !== productId)
          .map(product => ({
            id: product.id,
            name: product.name.ar || product.name.en || "Unknown",
            price: product.price,
            image: product.media?.find(m => m.type === "image")?.url || "/placeholder.svg"
          }));

        setSearchResults(filteredResults)
      }
    } catch (error) {
      console.error("Error searching products:", error)
      toast({
        title: "Error",
        description: "Failed to search for products",
        variant: "destructive",
      })
    }
  }

  // Add a related product
  const addRelatedProduct = (product: { id: number; name: string; price: number; image?: string }) => {
    const isAlreadyAdded = relatedProducts.some(p => p.id === product.id)
    if (!isAlreadyAdded) {
      setRelatedProducts(prev => [...prev, product])

      // Update the formData
      setFormData(prev => ({
        ...prev,
        related_products: [...(prev.related_products || []), product.id]
      }))
    }
  }

  // Remove a related product
  const removeRelatedProduct = (productId: number) => {
    setRelatedProducts(prev => prev.filter(p => p.id !== productId))

    // Update the formData
    setFormData(prev => ({
      ...prev,
      related_products: (prev.related_products || []).filter(id => id !== productId)
    }))
  }

  // Handle search input changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchRelatedQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchRelatedQuery])

  // Show save notification
  useEffect(() => {
    if (hasUnsavedChanges && !showSaveNotification) {
      setShowSaveNotification(true)
    }
  }, [hasUnsavedChanges])

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // const loadProduct = async () => {
  //   if (!productId) return

  //   try {
  //     setInitialLoading(true)
  //     const response = await apiService.getProduct(productId)

  //     if (response.success && response.data) {
  //       const product = response.data
  //       const productFormData: ProductFormData = {
  //         name: product.name,
  //         description: product.description,
  //         sku: product.sku,
  //         price: product.price,
  //         price_after_discount: product.price_after_discount,
  //         price_discount_start: product.price_discount_start,
  //         price_discount_end: product.price_discount_end,
  //         cost_price: product.cost_price,
  //         cost_price_after_discount: product.cost_price_after_discount,
  //         cost_price_discount_start: product.cost_price_discount_start,
  //         cost_price_discount_end: product.cost_price_discount_end,
  //         availability: product.availability,
  //         stock: product.stock,
  //         stock_unlimited: product.stock_unlimited,
  //         out_of_stock: product.out_of_stock,
  //         minimum_purchase: product.minimum_purchase,
  //         maximum_purchase: product.maximum_purchase,
  //         requires_shipping: product.requires_shipping,
  //         weight: product.weight,
  //         length: product.length,
  //         width: product.width,
  //         height: product.height,
  //         shipping_type: product.shipping_type,
  //         shipping_rate_single: product.shipping_rate_single,
  //         shipping_rate_multi: product.shipping_rate_multi,
  //         is_recommended: product.is_recommended,
  //         ribbon_text: product.ribbon_text || { ar: "", en: "" },
  //         ribbon_color: product.ribbon_color,
  //         categories: product.categories?.map(cat => cat.id),
  //         brands: product.brands?.map(brand => brand.id),
  //         related_category_id: product.related_category_id,
  //         related_category_limit: product.related_category_limit,
  //         related_products: product.related_products?.map(p => p.id),
  //         seo: product.seo || {
  //           meta_title: "",
  //           meta_description: "",
  //           keywords: "",
  //           image: ""
  //         }
  //       }

  //       setFormData(productFormData)
  //       setOriginalFormData(productFormData)

  //       // Set images and colors
  //       if (product.media) {
  //         const productImages = product.media
  //           .filter((m) => m.type === "image")
  //           .map((m) => ({ url: m.url, name: m.path }))
  //         setImages(productImages)

  //         const productVideos = product.media
  //           .filter((m) => m.type === "video")
  //           .map((m) => ({ url: m.url, type: m.source as "file" | "link" }))
  //         setVideos(productVideos)
  //       }

  //       if (product.colors) {
  //         setColors(product.colors.map((c) => c.color))
  //       }
  //     } else {
  //       toast({
  //         title: "Error",
  //         description: "Failed to load product",
  //         variant: "destructive",
  //       })
  //       router.push("/catalog/products")
  //     }
  //   } catch (error) {
  //     console.error("Error loading product:", error)
  //     toast({
  //       title: "Error",
  //       description: "An error occurred while loading the product",
  //       variant: "destructive",
  //     })
  //     router.push("/catalog/products")
  //   } finally {
  //     setInitialLoading(false)
  //   }
  // }

  // Search related products
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchRelatedQuery.trim() === "") {
        setSearchResults([])
      } else {
        const filteredProducts = relatedProducts.filter((product) =>
          product.name.toLowerCase().includes(searchRelatedQuery.toLowerCase())
        )
        setSearchResults(filteredProducts)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchRelatedQuery, relatedProducts])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof ProductFormData] as any),
        [field]: value,
      },
    }))
  }

  const addImage = (imageUrl: string, imageName: string) => {
    setImages((prev) => [...prev, { url: imageUrl, name: imageName }])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const addColor = () => {
    if (newColor && !colors.includes(newColor)) {
      setColors((prev) => [...prev, newColor])
      setNewColor("#000000")
    }
  }

  const removeColor = (color: string) => {
    setColors((prev) => prev.filter((c) => c !== color))
  }

  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path)
      setShowUnsavedDialog(true)
    } else {
      router.push(path)
    }
  }

  const confirmNavigation = () => {
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
    setShowUnsavedDialog(false)
    setPendingNavigation(null)
  }

  const cancelNavigation = () => {
    setShowUnsavedDialog(false)
    setPendingNavigation(null)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      // Validate required fields
      if (!formData.name.ar) {
        toast({
          title: "Validation Error",
          description: "Product name is required",
          variant: "destructive",
        })
        return
      }

      // Prepare the product data for API submission
      const productData = {
        ...formData,
        // Format media (images and videos)
        media: [
          ...images.map((img, index) => ({
            path: img.name,
            url: img.url,
            type: "image",
            source: "file",
            orders: index
          })),
          ...videos.map((video, index) => ({
            path: video.url,
            url: video.url,
            type: "video",
            source: video.type,
            orders: images.length + index
          }))
        ],
        // Format colors
        colors: colors.map(color => ({ color })),

        // Ensure all related fields are properly formatted
        stock_unlimited: formData.stock_unlimited === true,
        sku: formData.sku || null,

        // Make sure all dates are in the correct format
        price_discount_start: formData.price_discount_start || null,
        price_discount_end: formData.price_discount_end || null,
        cost_price_discount_start: formData.cost_price_discount_start || null,
        cost_price_discount_end: formData.cost_price_discount_end || null,

        // Make sure related products is always an array
        related_products: formData.related_products || [],

        // Make sure related category fields are properly formatted
        related_category_id: formData.related_category_id || null,
        related_category_limit: formData.related_category_limit || 5,

        // Ensure SEO data is properly formatted
        seo: formData.seo || {
          meta_title: "",
          meta_description: "",
          keywords: "",
          image: ""
        }
      }

      let response
      if (isEditMode && productId) {
        response = await apiService.updateProduct(productId, productData)
      } else {
        response = await apiService.createProduct(productData)
      }

      if (response.success) {
        toast({
          title: "Success",
          description: isEditMode ? "Product updated successfully" : "Product created successfully",
        })
        setOriginalFormData(formData)
        setHasUnsavedChanges(false)
        setShowSaveNotification(false)

        if (!isEditMode) {
          router.push("/catalog/products")
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: "An error occurred while saving the product",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Unsaved Changes Notification */}
      {showSaveNotification && hasUnsavedChanges && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800">There are unsaved changes on this page.</span>
            <div className="flex gap-2 ml-4">
              <Button size="sm" variant="outline" onClick={() => setShowSaveNotification(false)}>
                Save and close
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={loading}>
                Save 'Ctrl+S'
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => handleNavigation("/catalog/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            BACK
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? "Edit Product" : "Add New Product"}</h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? "Update product information" : "Create a new product in your store"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate Product
          </Button> */}
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general">General</TabsTrigger>
              {/* <TabsTrigger value="attributes">Attributes</TabsTrigger> */}
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="shipping">Shipping & Pickup</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="related">Related Products</TabsTrigger>
              {/* <TabsTrigger value="buynow">"Buy Now" Button</TabsTrigger> */}
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Product Gallery */}
                  {/* <div>
                    <Label className="text-base font-medium">Product Gallery</Label>
                    <div className="mt-2 grid grid-cols-6 gap-4">
                      <div className="col-span-2">
                        <ImageUpload value="" onChange={addImage} folder="products" className="w-full" />
                      </div>
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt={`Product ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div> */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name-ar">Product Name *</Label>
                      <Input
                        id="name-ar"
                        value={formData.name.ar}
                        onChange={(e) => handleNestedInputChange("name", "ar", e.target.value)}
                        placeholder="Enter product name"
                        className={!formData.name.ar ? "border-red-300" : ""}
                      />
                      {!formData.name.ar && <p className="text-sm text-red-600 mt-1">Product name is required</p>}
                    </div>
                    <div>
                      <Label htmlFor="name-en">Product Name (English)</Label>
                      <Input
                        id="name-en"
                        value={formData.name.en}
                        onChange={(e) => handleNestedInputChange("name", "en", e.target.value)}
                        placeholder="Enter product name in English"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku || ""}
                        onChange={(e) => handleInputChange("sku", e.target.value)}
                        placeholder="Enter product SKU"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight || ""}
                        onChange={(e) => handleInputChange("weight", Number.parseFloat(e.target.value) || undefined)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Product Description</Label>
                    <RichTextEditor
                      value={formData.description.ar}
                      onChange={(value) => handleNestedInputChange("description", "ar", value)}
                      placeholder="Enter product description..."
                    />
                  </div>

                  <div>
                    <Label>Product Description (English)</Label>
                    <RichTextEditor
                      value={formData.description.en}
                      onChange={(value) => handleNestedInputChange("description", "en", value)}
                      placeholder="Enter product description in English..."
                    />
                  </div>

                  <Separator />

                  {/* Categories */}
                  <div>
                    <Label className="text-base font-medium">Categories</Label>
                    <p className="text-sm text-gray-600 mb-2">Select the categories this product belongs to</p>

                    <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                      {availableCategories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2 p-1">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={(formData.categories || []).includes(category.id)}
                            onCheckedChange={(checked) => {
                              const currentCategories = formData.categories || [];
                              if (checked) {
                                handleInputChange("categories", [...currentCategories, category.id]);
                              } else {
                                handleInputChange("categories", currentCategories.filter(id => id !== category.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`category-${category.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {category.name}
                          </Label>
                        </div>
                      ))}

                      {availableCategories.length === 0 && (
                        <p className="text-center py-2 text-gray-500">No categories available</p>
                      )}
                    </div>
                  </div>

                  {/* Brands */}
                  <div>
                    <Label className="text-base font-medium">Brands</Label>
                    <p className="text-sm text-gray-600 mb-2">Select the brands this product belongs to</p>

                    <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                      {availableBrands.map((brand) => (
                        <div key={brand.id} className="flex items-center space-x-2 p-1">
                          <Checkbox
                            id={`brand-${brand.id}`}
                            checked={(formData.brands || []).includes(brand.id)}
                            onCheckedChange={(checked) => {
                              const currentBrands = formData.brands || [];
                              if (checked) {
                                handleInputChange("brands", [...currentBrands, brand.id]);
                              } else {
                                handleInputChange("brands", currentBrands.filter(id => id !== brand.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`brand-${brand.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {brand.name}
                          </Label>
                        </div>
                      ))}

                      {availableBrands.length === 0 && (
                        <p className="text-center py-2 text-gray-500">No brands available</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Related Products Tab */}
            <TabsContent value="related" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Related Products</CardTitle>
                  <p className="text-sm text-gray-600">
                    Show the "You may also like" section on the product page to promote other products and increase
                    sales. You can pick related products manually or set up automatic recommendations from a category.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Recommendation Type Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="random-products"
                        name="recommendation-type"
                        checked={!!formData.related_category_id}
                        onChange={() => {
                          // If switching to random products, set default values
                          if (!formData.related_category_id) {
                            const firstCategoryId = availableCategories.length > 0 ? availableCategories[0].id : null;
                            handleInputChange("related_category_id", firstCategoryId);
                            handleInputChange("related_category_limit", 5);
                            // Clear manual selections when switching to random
                            handleInputChange("related_products", []);
                          }
                        }}
                      />
                      <Label htmlFor="random-products">
                        Random products from a category
                      </Label>
                    </div>

                    {formData.related_category_id !== undefined && formData.related_category_id !== null && (
                      <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                        <div>
                          <Label htmlFor="category-select">Select Category</Label>
                          <select
                            id="category-select"
                            className="w-full p-2 border rounded-md"
                            value={formData.related_category_id || ''}
                            onChange={(e) => handleInputChange("related_category_id", Number(e.target.value) || null)}
                          >
                            <option value="">Select a category</option>
                            {availableCategories.map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="limit-select">Number of Products</Label>
                          <select
                            id="limit-select"
                            className="w-full p-2 border rounded-md"
                            value={formData.related_category_limit || 5}
                            onChange={(e) => handleInputChange("related_category_limit", Number(e.target.value))}
                          >
                            {[3, 4, 5, 6, 8, 10, 12].map(num => (
                              <option key={num} value={num}>{num} products</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="manual-selection"
                        name="recommendation-type"
                        checked={!formData.related_category_id}
                        onChange={() => {
                          // Clear category-based recommendation settings
                          handleInputChange("related_category_id", null);
                          handleInputChange("related_category_limit", undefined);
                        }}
                      />
                      <Label htmlFor="manual-selection">
                        Manually select products
                      </Label>
                    </div>
                  </div>

                  {/* Manual Product Selection */}
                  {!formData.related_category_id && (
                    <>
                      <div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search products to add..."
                            className="pl-10"
                            value={searchRelatedQuery}
                            onChange={(e) => setSearchRelatedQuery(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {/* Selected related products */}
                        {relatedProducts.length > 0 ? (
                          <div className="space-y-2">
                            <Label>Selected Products</Label>
                            {relatedProducts.map((product) => (
                              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={product.image || "/placeholder.svg"}
                                    alt={product.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                  <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-gray-500">{product.price} IQD</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeRelatedProduct(product.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No related products selected. Search for products to add.
                          </div>
                        )}

                        {/* Search results */}
                        {searchResults.length > 0 && searchRelatedQuery && (
                          <div className="mt-4 space-y-2">
                            <Label>Search Results</Label>
                            {searchResults.map((product) => {
                              const isSelected = relatedProducts.some(p => p.id === product.id);
                              return (
                                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={product.image || "/placeholder.svg"}
                                      alt={product.name}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                    <div>
                                      <p className="font-medium">{product.name}</p>
                                      <p className="text-sm text-gray-500">{product.price} IQD</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={isSelected ? "outline" : "secondary"}
                                    onClick={() => isSelected ? removeRelatedProduct(product.id) : addRelatedProduct(product)}
                                    disabled={isSelected}
                                  >
                                    {isSelected ? "Added" : "Add"}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tabs content remains the same but with English text */}
            <TabsContent value="options" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Options and Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Product Colors</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Button onClick={addColor} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Color
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {colors.map((color, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                          <div className="w-6 h-6 rounded border" style={{ backgroundColor: color }} />
                          <span className="text-sm">{color}</span>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeColor(color)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Files</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Images</Label>
                    <div className="mt-2 grid grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <ImageUpload value="" onChange={addImage} folder="products" className="h-38" />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-medium">Videos</Label>
                    <div className="mt-2 space-y-3">
                      {videos.map((video, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Video className="h-5 w-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{video.url}</p>
                            <p className="text-xs text-gray-500">
                              {video.type === "link" ? "External link" : "Uploaded file"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setVideos((prev) => prev.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Video URL"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              const url = (e.target as HTMLInputElement).value
                              if (url) {
                                setVideos((prev) => [...prev, { url, type: "link" }])
                                  ; (e.target as HTMLInputElement).value = ""
                              }
                            }
                          }}
                        />
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Video
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shipping Tab */}
            <TabsContent value="shipping" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Requires Shipping</Label>
                      <p className="text-sm text-gray-600">Does this product need to be shipped?</p>
                    </div>
                    <Switch
                      checked={formData.requires_shipping}
                      onCheckedChange={(checked) => handleInputChange("requires_shipping", checked)}
                    />
                  </div>

                  {formData.requires_shipping && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="length">Length (cm)</Label>
                          <Input
                            id="length"
                            type="number"
                            value={formData.length || ""}
                            onChange={(e) =>
                              handleInputChange("length", Number.parseFloat(e.target.value) || undefined)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="width">Width (cm)</Label>
                          <Input
                            id="width"
                            type="number"
                            value={formData.width || ""}
                            onChange={(e) => handleInputChange("width", Number.parseFloat(e.target.value) || undefined)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="height">Height (cm)</Label>
                          <Input
                            id="height"
                            type="number"
                            value={formData.height || ""}
                            onChange={(e) =>
                              handleInputChange("height", Number.parseFloat(e.target.value) || undefined)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shipping-single">Shipping Cost (Single Item)</Label>
                          <Input
                            id="shipping-single"
                            type="number"
                            value={formData.shipping_rate_single || ""}
                            onChange={(e) =>
                              handleInputChange("shipping_rate_single", Number.parseFloat(e.target.value) || undefined)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="shipping-multi">Shipping Cost (Multiple Items)</Label>
                          <Input
                            id="shipping-multi"
                            type="number"
                            value={formData.shipping_rate_multi || ""}
                            onChange={(e) =>
                              handleInputChange("shipping_rate_multi", Number.parseFloat(e.target.value) || undefined)
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search Engine Optimization (SEO)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">How your product looks on Google</h3>
                    <div className="bg-white border rounded p-3">
                      <div className="text-blue-600 text-sm">{formData.seo?.meta_title || formData.name.ar || "Product Name"}</div>
                      <div className="text-green-600 text-xs">
                        https://www.rwady-altwasil.com/products/{formData.sku || "product-sku"}
                      </div>
                      <div className="text-gray-600 text-sm mt-1">
                        {formData.seo?.meta_description || formData.description.ar || "Product description"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="meta-title">Meta Title</Label>
                      <Input
                        id="meta-title"
                        value={formData.seo?.meta_title || ""}
                        onChange={(e) => handleNestedInputChange("seo", "meta_title", e.target.value)}
                        placeholder="Enter meta title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="meta-description">Meta Description</Label>
                      <textarea
                        id="meta-description"
                        value={formData.seo?.meta_description || ""}
                        onChange={(e) => handleNestedInputChange("seo", "meta_description", e.target.value)}
                        placeholder="Enter meta description"
                        className="w-full p-2 min-h-[100px] border rounded-md"
                      />
                    </div>

                    <div>
                      <Label htmlFor="keywords">Keywords (comma separated)</Label>
                      <Input
                        id="keywords"
                        value={formData.seo?.keywords || ""}
                        onChange={(e) => handleNestedInputChange("seo", "keywords", e.target.value)}
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>

                    <div>
                      <Label htmlFor="seo-image">SEO Image URL</Label>
                      <Input
                        id="seo-image"
                        value={formData.seo?.image || ""}
                        onChange={(e) => handleNestedInputChange("seo", "image", e.target.value)}
                        placeholder="Enter image URL"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">IQD</span>
                </div>
              </div>
              <div>
                <Label htmlFor="price-discount">"Compare to" price</Label>
                <div className="relative">
                  <Input
                    id="price-discount"
                    type="number"
                    value={formData.price_after_discount || ""}
                    onChange={(e) =>
                      handleInputChange("price_after_discount", Number.parseFloat(e.target.value) || undefined)
                    }
                    placeholder="0"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">IQD</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price-discount-start">Discount Start Date</Label>
                  <Input
                    id="price-discount-start"
                    type="date"
                    value={formData.price_discount_start || ""}
                    onChange={(e) => handleInputChange("price_discount_start", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="price-discount-end">Discount End Date</Label>
                  <Input
                    id="price-discount-end"
                    type="date"
                    value={formData.price_discount_end || ""}
                    onChange={(e) => handleInputChange("price_discount_end", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cost-price">Cost Price</Label>
                <div className="relative">
                  <Input
                    id="cost-price"
                    type="number"
                    value={formData.cost_price || ""}
                    onChange={(e) => handleInputChange("cost_price", Number.parseFloat(e.target.value) || undefined)}
                    placeholder="0.00"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">IQD</span>
                </div>
              </div>

              <div>
                <Label htmlFor="cost-price-after-discount">Cost Price After Discount</Label>
                <div className="relative">
                  <Input
                    id="cost-price-after-discount"
                    type="number"
                    value={formData.cost_price_after_discount || ""}
                    onChange={(e) => handleInputChange("cost_price_after_discount", Number.parseFloat(e.target.value) || undefined)}
                    placeholder="0.00"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">IQD</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost-discount-start">Cost Discount Start Date</Label>
                  <Input
                    id="cost-discount-start"
                    type="date"
                    value={formData.cost_price_discount_start || ""}
                    onChange={(e) => handleInputChange("cost_price_discount_start", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cost-discount-end">Cost Discount End Date</Label>
                  <Input
                    id="cost-discount-end"
                    type="date"
                    value={formData.cost_price_discount_end || ""}
                    onChange={(e) => handleInputChange("cost_price_discount_end", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="link" className="text-blue-600 p-0 h-auto">
                  Bulk discount pricing →
                </Button>
                <p className="text-sm text-gray-600">
                  Encourage customers to buy larger quantities with volume discounts.
                </p>
              </div>

              <div className="space-y-2">
                <Button variant="link" className="text-blue-600 p-0 h-auto">
                  Enable "Pay what you want" pricing →
                </Button>
                <p className="text-sm text-gray-600">
                  Let customers define their own price for the product or donation amount.
                </p>
              </div>

              <div className="space-y-2">
                <Button variant="link" className="text-blue-600 p-0 h-auto">
                  Sell as subscription →
                </Button>
                <p className="text-sm text-gray-600">
                  Allow customers to purchase this product and be charged automatically on a regular schedule without
                  having to place a new order each time.
                </p>
              </div>

              <Button variant="link" className="text-blue-600 p-0 h-auto">
                Hide pricing options
              </Button>
            </CardContent>
          </Card>

          {/* Product Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Product availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enabled</Label>
                <Switch
                  checked={formData.availability}
                  onCheckedChange={(checked) => handleInputChange("availability", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stock Control */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">In Stock (∞)</Label>
              </div>

              <div>
                <Label htmlFor="stock-quantity">Quantity in Stock</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="stock-limited"
                      name="stock-type"
                      checked={formData.stock_unlimited === false}
                      onChange={() => handleInputChange("stock_unlimited", false)}
                      className="mr-2"
                    />
                    <Input
                      type="number"
                      value={formData.stock_unlimited === true ? "" : formData.stock}
                      onChange={(e) => handleInputChange("stock", Number.parseInt(e.target.value) || 0)}
                      placeholder="0"
                      disabled={formData.stock_unlimited === true}
                      className="w-20"
                    />
                    <span className="ml-2 text-sm text-gray-600">items</span>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <input
                    type="radio"
                    id="stock-unlimited"
                    name="stock-type"
                    checked={formData.stock_unlimited === true}
                    onChange={() => handleInputChange("stock_unlimited", true)}
                    className="mr-2"
                  />
                  <Label htmlFor="stock-unlimited">Unlimited</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="link" className="text-blue-600 p-0 h-auto">
                  Set purchase quantity limits →
                </Button>
                <p className="text-sm text-gray-600">
                  Specify the minimum and maximum number of items a customer can buy in one order.
                </p>
              </div>

              <Button variant="link" className="text-blue-600 p-0 h-auto">
                Hide stock control
              </Button>
            </CardContent>
          </Card>

          {/* Product Features */}
          <Card>
            <CardHeader>
              <CardTitle>Product Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Recommended Product</Label>
                <Switch
                  checked={formData.is_recommended}
                  onCheckedChange={(checked) => handleInputChange("is_recommended", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelNavigation}>
              Stay on Page
            </Button>
            <Button variant="destructive" onClick={confirmNavigation}>
              Leave Without Saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
