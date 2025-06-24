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
import { useToast } from "@/components/ui/use-toast"
import { apiService } from "@/lib/api"
import { ImageUpload } from "@/components/ui/image-upload"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { SortableList } from "@/components/ui/sortable-list"
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
  GripVertical,
  MoreVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

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
  out_of_stock: "hide_from_storefront" | "show_on_storefront" | "show_and_allow_pre_order"
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
  // Add explicit support for images and videos according to API spec
  images?: string[]
  videos?: string[]

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
  const [images, setImages] = useState<Array<{ id?: number; url: string; name: string; orders?: number }>>([])
  const [videos, setVideos] = useState<Array<{ id?: number; url: string; type: "file" | "link"; orders?: number }>>([])
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [mediaReorderLoading, setMediaReorderLoading] = useState(false)
  const [colors, setColors] = useState<string[]>([])
  const [newColor, setNewColor] = useState("#000000")
  const [availableColors, setAvailableColors] = useState<Array<{ name: { ar: string; en: string }; code: string }>>([])
  const [colorSelectionType, setColorSelectionType] = useState<"predefined" | "custom">("predefined")
  const [selectedPredefinedColor, setSelectedPredefinedColor] = useState<string>("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [showSaveNotification, setShowSaveNotification] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<{ id: number; name: string }[]>([])
  const [availableBrands, setAvailableBrands] = useState<{ id: number; name: string }[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categorySearchQuery, setCategorySearchQuery] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [brandSearchQuery, setBrandSearchQuery] = useState("")
  const [relatedProducts, setRelatedProducts] = useState<{ id: number; name: string; price: number; image?: string }[]>([])
  const [searchRelatedQuery, setSearchRelatedQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{
    id: number; name: string; price: number; image?: string,


    //  add media array to search results
    media?: Array<{ url: string; type: "image" | "video" }>
  }[]>([])
  const [allAvailableProducts, setAllAvailableProducts] = useState<{ id: number; name: string; price: number; image?: string }[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

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
    shipping_type: "default",
    shipping_rate_single: 0,
    shipping_rate_multi: 0,
    is_recommended: false,
  })

  const [originalFormData, setOriginalFormData] = useState<ProductFormData | null>(null)

  // Load product data, categories and brands when initializing
  useEffect(() => {
    fetchCategoriesAndBrands()
    fetchAvailableColors()
    loadAllProducts() // Load all products for related products selection
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
          categories: (product as any).categories?.map((cat: Category) => cat.id),
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

        // Load related products if they exist
        if (product.related_products && product.related_products.length > 0) {
          const relatedProductsWithDetails = product.related_products.map((rp: any) => ({
            id: rp.id,
            name: rp.name?.ar || rp.name?.en || rp.name || "Unknown Product",
            price: rp.price || 0,
            image: rp.image || "/placeholder.svg"
          }));
          setRelatedProducts(relatedProductsWithDetails);
        }

        // Set images and videos from media array (API format with objects)
        if ((product as any).media && Array.isArray((product as any).media)) {
          const mediaArray = (product as any).media;
          const productImages: Array<{ id?: number; url: string; name: string; orders?: number }> = [];
          const productVideos: Array<{ id?: number; url: string; type: "file" | "link"; orders?: number }> = [];

          console.log("Raw API response media:", mediaArray);
          console.log("Media array type:", typeof mediaArray);
          console.log("Media array length:", mediaArray.length);

          mediaArray.forEach((item: any, index: number) => {
            console.log(`Processing media item ${index}:`, item);
            console.log(`Item type: ${typeof item}, has type property: ${item?.type}`);

            // Check if it's an object with type property (new API format)
            if (item && typeof item === 'object' && item.type) {
              console.log(`Processing object with type: ${item.type}`);
              if (item.type === 'image') {
                const imageUrl = item.url || (item.path ? (item.path.startsWith('http') ? item.path : `/${item.path}`) : '');
                console.log(`Adding image with URL: ${imageUrl}`);
                productImages.push({
                  id: item.id,
                  url: imageUrl,
                  name: item.path || item.url || `image-${index}`,
                  orders: item.orders || index + 1
                });
              } else if (item.type === 'video') {
                const videoUrl = item.url || item.path || '';
                console.log(`Adding video with URL: ${videoUrl}`);
                productVideos.push({
                  id: item.id,
                  url: videoUrl,
                  type: item.source === 'link' ? 'link' : 'file',
                  orders: item.orders || index + 1
                });
              }
            }
            // Fallback: if it's a string (old format)
            else if (typeof item === 'string') {
              console.log(`Processing string item: ${item}`);
              // Check if it's a video URL (contains common video platforms or video file extensions)
              if (item.includes('youtube.com') || item.includes('youtu.be') ||
                item.includes('vimeo.com') || item.includes('dailymotion.com') ||
                item.endsWith('.mp4') || item.endsWith('.avi') || item.endsWith('.mov') ||
                item.endsWith('.wmv') || item.endsWith('.flv') || item.endsWith('.webm')) {
                productVideos.push({
                  url: item,
                  type: item.startsWith('http') ? 'link' : 'file',
                  orders: index
                });
              } else {
                // Assume it's an image
                productImages.push({
                  url: item.startsWith('http') ? item : `/${item}`,
                  name: item,
                  orders: index
                });
              }
            }
          });

          // Sort by orders
          productImages.sort((a, b) => (a.orders || 0) - (b.orders || 0));
          productVideos.sort((a, b) => (a.orders || 0) - (b.orders || 0));

          console.log("Final processed images:", productImages);
          console.log("Final processed videos:", productVideos);

          setImages(productImages);
          setVideos(productVideos);
        }
        // Fallback to separate images/videos arrays (if API returns them separately)
        else {
          // Set images
          if ((product as any).images && Array.isArray((product as any).images)) {
            const productImages = (product as any).images.map((path: string) => ({
              url: path.startsWith('http') ? path : `/${path}`,
              name: path
            }));
            setImages(productImages);
          }

          // Set videos
          if ((product as any).videos && Array.isArray((product as any).videos)) {
            const productVideos = (product as any).videos.map((path: string) => ({
              url: path,
              type: path.startsWith('http') ? 'link' as const : 'file' as const
            }));
            setVideos(productVideos);
          }
        }

        // Set colors - in new format colors is a simple array of hex values
        if (product.colors) {
          if (Array.isArray((product as any).colors) && typeof (product as any).colors[0] === 'string') {
            setColors((product as any).colors);
          } else if (Array.isArray(product.colors)) {
            setColors(product.colors.map((c) => c.color));
          }
        }
      } else {
        console.log("Failed to load product data:", response.message);

        // router.push("/catalog/products")
      }
    } catch (error) {
      console.error("Error loading product:", error)
      toast({
        title: "Error",
        description: "An error occurred while loading the product",
        variant: "destructive",
      })
      // router.push("/catalog/products")
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

  const fetchAvailableColors = async () => {
    try {
      // Using fetch directly since apiService might not have this endpoint
      const response = await apiService.getProductColors()

      if (response.success && response.data) {
        // Map the API response data to match our expected state structure
        const formattedColors = response.data.map(color => ({
          name: {
            ar: color.name?.ar || "",
            en: color.name?.en || ""
          },
          code: color.color || color.code || ""
        }));
        setAvailableColors(formattedColors)
      }
    } catch (error) {
      console.error("Error fetching colors:", error)
      toast({
        title: "Error",
        description: "Failed to load available colors",
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
      // If no search query, show first 50 products from all available products
      setSearchResults(allAvailableProducts.slice(0, 50))
      return
    }

    try {
      // First, search locally in already loaded products
      const localResults = allAvailableProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
      )

      // If we have good local results, use them
      if (localResults.length >= 10) {
        setSearchResults(localResults.slice(0, 50))
      } else {
        // Otherwise, search via API for more comprehensive results
        const response = await apiService.getProducts({ search: query, limit: 50 })
        if (response.success && response.data) {
          // Filter out the current product
          const filteredResults = response.data
            .filter(p => p.id !== productId)
            .map(product => ({
              id: product.id,
              name: product.name.ar || product.name.en || "Unknown",
              price: product.price,
              image: product.media?.find((m: any) => m.type === "image")?.url || "/placeholder.svg"
            }));

          setSearchResults(filteredResults)
        }
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
      const newRelatedProducts = [...relatedProducts, product]
      setRelatedProducts(newRelatedProducts)

      // Update the formData
      setFormData(prev => ({
        ...prev,
        related_products: [...(prev.related_products || []), product.id]
      }))

      toast({
        title: "Success",
        description: `Added "${product.name}" to related products`,
      })
    }
  }

  // Remove a related product
  const removeRelatedProduct = (productId: number) => {
    const productToRemove = relatedProducts.find(p => p.id === productId)
    setRelatedProducts(prev => prev.filter(p => p.id !== productId))

    // Update the formData
    setFormData(prev => ({
      ...prev,
      related_products: (prev.related_products || []).filter(id => id !== productId)
    }))

    if (productToRemove) {
      toast({
        title: "Success",
        description: `Removed "${productToRemove.name}" from related products`,
      })
    }
  }

  // Handle search input changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchRelatedQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchRelatedQuery])

  // Load related products when loading a product
  useEffect(() => {
    if (isEditMode && formData.related_products && formData.related_products.length > 0) {
      // Load related products details
      loadRelatedProductsDetails()
    }
  }, [formData.related_products])

  const loadRelatedProductsDetails = async () => {
    if (!formData.related_products || formData.related_products.length === 0) return

    try {
      const productPromises = formData.related_products.map(async (productId) => {
        const response = await apiService.getProduct(productId)
        if (response.success && response.data) {
          return {
            id: response.data.id,
            name: response.data.name.ar || response.data.name.en || "Unknown",
            price: response.data.price,
            image: response.data.media?.find((m: any) => m.type === "image")?.url || "/placeholder.svg"
          }
        }
        return null
      })

      const products = (await Promise.all(productPromises)).filter(Boolean) as Array<{ id: number; name: string; price: number; image?: string }>
      setRelatedProducts(products)
    } catch (error) {
      console.error("Error loading related products:", error)
    }
  }

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

  const handleShippingTypeChange = (shippingType: string) => {
    const validShippingType = shippingType as "default" | "fixed_shipping" | "free_shipping" | "calculated_shipping";

    setFormData((prev) => {
      const newFormData = {
        ...prev,
        shipping_type: validShippingType,
      }

      // If switching to fixed_shipping and no rate is set, set a default
      if (validShippingType === "fixed_shipping" && (!prev.shipping_rate_single || prev.shipping_rate_single === 0)) {
        newFormData.shipping_rate_single = 5000 // Default 5000 IQD
      }

      return newFormData
    })
  }

  const addVideo = (url: string) => {
    if (url && url.trim()) {
      const trimmedUrl = url.trim()
      // Basic URL validation
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('www.')) {
        const newOrder = Math.max(...videos.map(video => video.orders || 0), 0) + 1;
        setVideos((prev) => [...prev, { url: trimmedUrl, type: "link", orders: newOrder }])
        return true
      } else {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL starting with http:// or https://",
          variant: "destructive",
        })
        return false
      }
    }
    return false
  }

  const getVideoThumbnail = (url: string) => {
    // YouTube thumbnail extraction
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    }

    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    }

    // Vimeo thumbnail extraction
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      return `https://vumbnail.com/${videoId}.jpg`
    }

    // Default video placeholder
    return "/placeholder.svg"
  }

  const handleAddVideoFromDialog = () => {
    if (videoUrl.trim() && addVideo(videoUrl.trim())) {
      setVideoUrl("")
      setShowVideoDialog(false)
    }
  }

  // Combined media handling for unified gallery
  const getAllMediaItems = () => {
    const mediaItems: Array<{
      id: string;
      type: 'image' | 'video';
      url: string;
      name?: string;
      orders: number;
      originalId?: number;
      data: any;
    }> = [];

    // Add images with type identifier
    images.forEach((image, index) => {
      mediaItems.push({
        id: image.id?.toString() || `image-${index}`,
        type: 'image',
        url: image.url,
        name: image.name,
        orders: image.orders || index + 1,
        originalId: image.id,
        data: image
      });
    });

    // Add videos with type identifier
    videos.forEach((video, index) => {
      mediaItems.push({
        id: video.id?.toString() || `video-${index}`,
        type: 'video',
        url: video.url,
        orders: video.orders || index + 1,
        originalId: video.id,
        data: video
      });
    });

    // Sort by orders
    return mediaItems.sort((a, b) => (a.orders || 0) - (b.orders || 0));
  }

  const handleCombinedMediaReorder = async (reorderedItems: Array<{ [key: string]: any; id: string }>) => {
    console.log("=== Combined Media Reorder Started ===");
    console.log("Original items:", getAllMediaItems());
    console.log("Reordered items:", reorderedItems);

    // Find which items actually changed positions
    const originalItems = getAllMediaItems();
    const changedItems: Array<{ item: any; oldIndex: number; newIndex: number }> = [];

    reorderedItems.forEach((newItem, newIndex) => {
      const oldIndex = originalItems.findIndex(oldItem => oldItem.id === newItem.id);
      if (oldIndex !== -1 && oldIndex !== newIndex) {
        changedItems.push({
          item: newItem,
          oldIndex,
          newIndex
        });
      }
    });

    console.log("Items that changed position:", changedItems);

    // If no items changed position, return early
    if (changedItems.length === 0) {
      console.log("No position changes detected, skipping update");
      return;
    }

    const updatedImages: Array<{ id?: number; url: string; name: string; orders: number }> = [];
    const updatedVideos: Array<{ id?: number; url: string; type: "file" | "link"; orders: number }> = [];

    reorderedItems.forEach((item, index) => {
      const newOrder = index + 1;

      if (item.type === 'image') {
        updatedImages.push({
          id: item.id.startsWith('image-') ? undefined : item.originalId,
          url: item.url,
          name: item.name || item.data?.name || 'Untitled',
          orders: newOrder
        });
      } else if (item.type === 'video') {
        updatedVideos.push({
          id: item.id.startsWith('video-') ? undefined : item.originalId,
          url: item.url,
          type: item.data?.type || "link",
          orders: newOrder
        });
      }
    });

    // Update both states
    setImages(updatedImages);
    setVideos(updatedVideos);

    // Update only the items that changed in the backend
    setMediaReorderLoading(true);

    try {
      let updateCount = 0;

      for (const changedItem of changedItems) {
        const { item, newIndex } = changedItem;
        const newOrder = newIndex + 1;

        // Only update if the item has an ID (exists in backend)
        if (item.originalId) {
          console.log(`Updating ${item.type} ${item.originalId} to position ${newOrder}`);
          await reorderMedia(item.originalId, newOrder);
          updateCount++;
        }
      }

      // Show success message
      if (updateCount > 0) {
        // toast({
        //   title: "Success",
        //   description: `Updated position for ${updateCount} item(s)`,
        // });
      }

      console.log(`=== Combined Media Reorder Completed Successfully - Updated ${updateCount} items ===`);
    } catch (error) {
      console.error('Error updating media order:', error);
      // toast({
      //   title: "Error",
      //   description: "Failed to update media order",
      //   variant: "destructive",
      // });
    } finally {
      setMediaReorderLoading(false);
    }
  }

  const addImage = (imageUrl: string, imageName: string) => {
    // Validate that both URL and name are provided and not empty
    if (!imageUrl || !imageUrl.trim() || !imageName || !imageName.trim()) {
      console.warn('Attempted to add image with empty URL or name:', { imageUrl, imageName });
      return false;
    }

    const trimmedUrl = imageUrl.trim();
    const trimmedName = imageName.trim();

    // Check if image already exists to prevent duplicates
    const existingImage = images.find(img => img.url === trimmedUrl);
    if (existingImage) {
      console.warn('Image already exists:', trimmedUrl);
      return false;
    }

    const newOrder = Math.max(...images.map(img => img.orders || 0), 0) + 1;
    setImages((prev) => [...prev, { url: trimmedUrl, name: trimmedName, orders: newOrder }]);
    console.log('Successfully added image:', { url: trimmedUrl, name: trimmedName, order: newOrder });
    return true;
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Reorder media items - optimized for single item updates
  const reorderMedia = async (mediaId: number, newOrder: number) => {
    if (!productId) return;
    console.log(`Reordering media ${mediaId} to position ${newOrder}`);

    try {
      const result = await apiService.reorderMedia(productId, mediaId, newOrder);

      if (result.success) {
        console.log(`✓ Media ${mediaId} successfully moved to position ${newOrder}`);
      } else {
        console.error("Reorder failed:", result.message);
        throw new Error(result.message || 'Failed to reorder media');
      }
    } catch (error) {
      console.error('Error reordering media:', error);
      toast({
        title: "Error",
        description: `Failed to reorder media: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle image reorder
  const handleImageReorder = async (reorderedImages: Array<{ id?: number; url: string; name: string; orders?: number }>) => {
    console.log("Reordered images:", reorderedImages);

    // Filter images that have IDs and need reordering
    const imagesToUpdate = reorderedImages.filter(image => image.id !== undefined);
    console.log("Images with IDs to update:", imagesToUpdate);

    let updateCount = 0;
    let errorCount = 0;

    // Update orders for images with IDs (existing media) sequentially
    for (let index = 0; index < reorderedImages.length; index++) {
      const image = reorderedImages[index];
      const newOrder = index + 1;

      if (image.id) {
        console.log(`Processing image ${image.id}: current order ${image.orders}, new order ${newOrder}`);

        // Always update if the image has an ID, regardless of current order
        // This ensures the backend gets the correct new order
        try {
          console.log(`Updating image ${image.id} to position ${newOrder}`);
          await reorderMedia(image.id, newOrder);
          updateCount++;
        } catch (error) {
          console.error(`Failed to reorder image ${image.id}:`, error);
          errorCount++;
          break; // Stop if any update fails
        }
      } else {
        console.log(`Image at index ${index} has no ID (new image):`, image);
      }
    }

    // Update local state after successful API calls
    const updatedImages = reorderedImages.map((image, index) => ({
      ...image,
      orders: index + 1
    }));
    setImages(updatedImages);

    // Show summary message
    if (updateCount > 0 && errorCount === 0) {
      toast({
        title: "Success",
        description: `Updated order for ${updateCount} image(s)`,
      });
    }
  };

  // Handle video reorder
  const handleVideoReorder = async (reorderedVideos: Array<{ id?: number; url: string; type: "file" | "link"; orders?: number }>) => {
    console.log("Reordered videos:", reorderedVideos);

    // Filter videos that have IDs and need reordering
    const videosToUpdate = reorderedVideos.filter(video => video.id !== undefined);
    console.log("Videos with IDs to update:", videosToUpdate);

    let updateCount = 0;
    let errorCount = 0;

    // Update orders for videos with IDs (existing media) sequentially
    for (let index = 0; index < reorderedVideos.length; index++) {
      const video = reorderedVideos[index];
      const newOrder = index + 1;

      if (video.id) {
        console.log(`Processing video ${video.id}: current order ${video.orders}, new order ${newOrder}`);

        // Always update if the video has an ID, regardless of current order
        try {
          console.log(`Updating video ${video.id} to position ${newOrder}`);
          await reorderMedia(video.id, newOrder);
          updateCount++;
        } catch (error) {
          console.error(`Failed to reorder video ${video.id}:`, error);
          errorCount++;
          break; // Stop if any update fails
        }
      } else {
        console.log(`Video at index ${index} has no ID (new video):`, video);
      }
    }

    // Update local state after successful API calls
    const updatedVideos = reorderedVideos.map((video, index) => ({
      ...video,
      orders: index + 1
    }));
    setVideos(updatedVideos);

    // Show summary message
    if (updateCount > 0 && errorCount === 0) {
      toast({
        title: "Success",
        description: `Updated order for ${updateCount} video(s)`,
      });
    }
  };

  const addColor = () => {
    let colorToAdd = ""

    if (colorSelectionType === "predefined" && selectedPredefinedColor) {
      colorToAdd = selectedPredefinedColor
    } else if (colorSelectionType === "custom" && newColor) {
      colorToAdd = newColor
    }

    if (colorToAdd && !colors.includes(colorToAdd)) {
      setColors((prev) => [...prev, colorToAdd])

      // Reset the inputs
      if (colorSelectionType === "predefined") {
        setSelectedPredefinedColor("")
      } else {
        setNewColor("#000000")
      }
    }
  }

  const addPredefinedColor = (colorCode: string) => {
    if (colorCode && !colors.includes(colorCode)) {
      setColors((prev) => [...prev, colorCode])
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

      // Validate shipping settings
      if (formData.requires_shipping && formData.shipping_type === "fixed_shipping" && (!formData.shipping_rate_single || formData.shipping_rate_single <= 0)) {
        toast({
          title: "Validation Error",
          description: "Shipping rate is required when using fixed shipping",
          variant: "destructive",
        })
        setActiveTab("shipping") // Switch to shipping tab to show the error
        return
      }

      // Prepare the product data for API submission
      console.log("Images:", images.map(img => img.name));
      console.log("Videos:", videos.map(video => video.url));
      console.log("Final media array:", [
        ...images.map(img => img.name),
        ...videos.map(video => video.url),
      ]);

      const productData = {
        ...formData,
        // Format images and videos together as media array
        media: [
          ...images.map(img => img.name),
          ...videos.map(video => video.url),
        ],

        // Format colors as an array of hex values
        colors: colors,

        // Ensure all related fields are properly formatted
        // Ensure proper format for all fields
        sku: formData.sku || null,

        // Required fields with proper formatting
        name: formData.name,
        description: formData.description,
        ribbon_text: formData.ribbon_text || { ar: "", en: "" },
        ribbon_color: formData.ribbon_color || "#ffffff",
        is_recommended: formData.is_recommended || false,

        // Price information
        price: formData.price,
        price_after_discount: formData.price_after_discount || null,
        price_discount_start: formData.price_discount_start || null,
        price_discount_end: formData.price_discount_end || null,
        cost_price: formData.cost_price || formData.price,
        cost_price_after_discount: formData.cost_price_after_discount || null,
        cost_price_discount_start: formData.cost_price_discount_start || null,
        cost_price_discount_end: formData.cost_price_discount_end || null,

        // Stock information
        availability: formData.availability,
        stock: formData.stock || 0,
        stock_unlimited: formData.stock_unlimited || null,
        out_of_stock: formData.out_of_stock || "hide_from_storefront", // options: show_on_storefront, hide_from_storefront, show_and_allow_pre_order
        minimum_purchase: formData.minimum_purchase || 1,
        maximum_purchase: formData.maximum_purchase || 5,

        // Shipping information
        requires_shipping: formData.requires_shipping || false,
        weight: formData.weight || null,
        length: formData.length || null,
        width: formData.width || null,
        height: formData.height || null,
        shipping_type: formData.shipping_type || "fixed_shipping", // options: default, fixed_shipping, free_shipping
        shipping_rate_single: formData.shipping_type === "fixed_shipping" ? (formData.shipping_rate_single || 0) : (formData.shipping_rate_single || null),
        shipping_rate_multi: formData.shipping_rate_multi || null,

        // Categories and related products
        categories: formData.categories || [],
        brands: formData.brands || [],
        related_category_id: formData.related_category_id === undefined ? null : formData.related_category_id, // 0 for all categories, null for none
        related_category_limit: formData.related_category_limit || 5, // Default is 5
        related_products: formData.related_products || [],

        // SEO data
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

  const loadAllProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await apiService.getProducts({ limit: 1000 }) // Load many products
      if (response.success && response.data) {
        // Filter out the current product and format the data
        const formattedProducts = response.data
          .filter(p => p.id !== productId)
          .map(product => ({
            id: product.id,
            name: product.name.ar || product.name.en || "Unknown",
            price: product.price,
            image: product.media?.find((m: any) => m.type === "image")?.url || "/placeholder.svg"
          }));

        setAllAvailableProducts(formattedProducts)

        // If no search query, show first 50 products as initial results
        if (!searchRelatedQuery) {
          setSearchResults(formattedProducts.slice(0, 50))
        }

        console.log(`Loaded ${formattedProducts.length} products from API`)
      }
    } catch (error) {
      console.error("Error loading all products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setLoadingProducts(false)
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              {/* <TabsTrigger value="attributes">Attributes</TabsTrigger> */}
              <TabsTrigger value="options">Options</TabsTrigger>
              {/* <TabsTrigger value="files">Files</TabsTrigger> */}
              <TabsTrigger value="shipping">Shipping & Pickup</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="related">Related Products</TabsTrigger>
              {/* <TabsTrigger value="buynow">"Buy Now" Button</TabsTrigger> */}
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader className="space-y-2 flex flex-row items-center justify-between">
                  <CardTitle>Product Gallery</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-4"
                    onClick={() => setShowVideoDialog(true)}
                    disabled={mediaReorderLoading}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Add Video
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    {/* <Label className="text-base font-medium">Product Gallery</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Images: {images.length} • Videos: {videos.length}
                    </p> */}
                    {/* btn for open add video  */}


                    {/* Combined Media Gallery Grid */}
                    <div className="grid grid-cols-6 gap-4">
                      {/* Combined Media Items with Drag and Drop */}
                      <SortableList
                        items={getAllMediaItems()}
                        onReorder={handleCombinedMediaReorder}
                        renderItem={(item, index) => (
                          <div className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all duration-50">
                              {item.type === 'image' ? (
                                <img
                                  src={item.url || "/placeholder.svg"}
                                  alt={`Product ${index + 1}`}
                                  className="w-full h-full object-cover pointer-events-none"
                                  onError={(e) => {
                                    console.error(`Failed to load image ${index}:`, item.url);
                                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                                  }}
                                />
                              ) : (
                                <>
                                  <img
                                    src={getVideoThumbnail(item.url)}
                                    alt={`Video ${index + 1}`}
                                    className="w-full h-full object-cover pointer-events-none"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                                    }}
                                  />
                                  {/* Play icon overlay for videos */}
                                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all pointer-events-none">
                                    <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                      <Video className="w-6 h-6 text-gray-700" />
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Delete button */}
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto hover:scale-110 drag-ignore"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (item.type === 'image') {
                                    const imageIndex = images.findIndex(img =>
                                      img.id ? img.id === item.originalId : img.url === item.url
                                    );
                                    if (imageIndex !== -1) {
                                      removeImage(imageIndex);
                                    }
                                  } else {
                                    const videoIndex = videos.findIndex(v =>
                                      v.id ? v.id === item.originalId : v.url === item.url
                                    );
                                    if (videoIndex !== -1) {
                                      setVideos((prev) => prev.filter((_, i) => i !== videoIndex));
                                    }
                                  }
                                }}
                                disabled={mediaReorderLoading}
                              >
                                <X className="h-3 w-3" />
                              </Button>

                              {/* Order number */}
                              <div className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="bg-blue-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg">
                                  {item.orders || index + 1}
                                </div>
                              </div>

                              {/* Media type badge */}
                              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className={`text-white text-xs px-2 py-1 rounded flex items-center gap-1 shadow-lg ${item.type === 'image' ? 'bg-green-500' : 'bg-blue-500'
                                  }`}>
                                  {item.type === 'image' ? (
                                    <>
                                      <Upload className="w-3 h-3" />
                                      Image
                                    </>
                                  ) : (
                                    <>
                                      <Video className="w-3 h-3" />
                                      {item.url.includes('youtube.com') || item.url.includes('youtu.be') ? 'YouTube' :
                                        item.url.includes('vimeo.com') ? 'Vimeo' : 'Video'}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        className="contents"
                      />

                      {/* Upload Images Area */}
                      <ImageUpload
                        value=""
                        onChange={(url, name) => {
                          // Only add image if both URL and name are valid and not empty
                          if (url && url.trim() && name && name.trim()) {
                            addImage(url.trim(), name.trim());
                          }
                        }}
                        folder="products"
                        className="w-full h-full"
                      />

                    </div>

                    {/* Reorder loading indicator */}
                    {mediaReorderLoading && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 mt-4">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        Updating media order...
                      </div>
                    )}




                  </div>
                </CardContent>
              </Card>
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
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label className="text-base font-medium">Categories</Label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCategoryModal(true)}
                      >
                        Manage Categories
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {/* Selected Categories */}
                      {(formData.categories || []).map((categoryId) => {
                        const category = availableCategories.find(c => c.id === categoryId)
                        if (!category) return null
                        
                        return (
                          <div key={categoryId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sm">{category.name}</span>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                Unsaved
                              </Badge>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  // Make this category default - implement if needed
                                }}>
                                  Make default
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowCategoryModal(true)}>
                                  Edit category
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    const currentCategories = formData.categories || [];
                                    handleInputChange("categories", currentCategories.filter(id => id !== categoryId));
                                  }}
                                >
                                  Unassign category
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )
                      })}

                      {/* Empty state */}
                      {(!formData.categories || formData.categories.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No categories assigned</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setShowCategoryModal(true)}
                          >
                            Add Category
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Brands */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label className="text-base font-medium">Brands</Label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBrandModal(true)}
                      >
                        Manage Brands
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {/* Selected Brands */}
                      {(formData.brands || []).map((brandId) => {
                        const brand = availableBrands.find(b => b.id === brandId)
                        if (!brand) return null
                        
                        return (
                          <div key={brandId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sm">{brand.name}</span>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                Unsaved
                              </Badge>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  // Make this brand default - implement if needed
                                }}>
                                  Make default
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowBrandModal(true)}>
                                  Edit brand
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    const currentBrands = formData.brands || [];
                                    handleInputChange("brands", currentBrands.filter(id => id !== brandId));
                                  }}
                                >
                                  Unassign brand
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )
                      })}

                      {/* Empty state */}
                      {(!formData.brands || formData.brands.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No brands assigned</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setShowBrandModal(true)}
                          >
                            Add Brand
                          </Button>
                        </div>
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
                            className="pl-10 pr-10"
                            value={searchRelatedQuery}
                            onChange={(e) => setSearchRelatedQuery(e.target.value)}
                          />
                          {searchRelatedQuery && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                              onClick={() => {
                                setSearchRelatedQuery("")
                                setSearchResults(allAvailableProducts.slice(0, 50))
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSearchRelatedQuery("")
                              setSearchResults(allAvailableProducts.slice(0, 50))
                            }}
                            disabled={loadingProducts}
                          >
                            Show All Products
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              loadAllProducts()
                            }}
                            disabled={loadingProducts}
                          >
                            {loadingProducts ? "Loading..." : "Refresh"}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Display all available products with checkboxes */}
                        <div className="max-h-64 overflow-y-auto border rounded-lg">
                          <div className="p-3 border-b bg-gray-50">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">Available Products</Label>
                              <span className="text-sm text-gray-500">
                                {loadingProducts ? (
                                  "Loading..."
                                ) : (
                                  `Showing ${searchResults.length} of ${allAvailableProducts.length} products`
                                )}
                              </span>
                            </div>
                          </div>

                          {loadingProducts ? (
                            <div className="text-center py-8 text-gray-500">
                              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                              <p>Loading products...</p>
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((product) => {
                              const isSelected = relatedProducts.some(p => p.id === product.id);
                              return (
                                <div key={product.id} className="flex items-center p-3 border-b hover:bg-gray-50">
                                  <input
                                    type="checkbox"
                                    id={`product-${product.id}`}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        addRelatedProduct(product);
                                      } else {
                                        removeRelatedProduct(product.id);
                                      }
                                    }}
                                    className="mr-3"
                                  />
                                  <img
                                    src={product.media?.[0]?.url}
                                    alt={product.name}
                                    className="w-10 h-10 rounded object-cover mr-3"
                                  />
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={`product-${product.id}`}
                                      className="font-medium cursor-pointer"
                                    >
                                      {product.name}
                                    </Label>
                                    <p className="text-sm text-gray-500">{product.price} IQD</p>
                                    <p className="text-xs text-gray-400">ID: {product.id}</p>
                                  </div>
                                </div>
                              );
                            })
                          ) : searchRelatedQuery ? (
                            <div className="text-center py-4 text-gray-500">
                              <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p>No products found for "{searchRelatedQuery}"</p>
                              <p className="text-xs">Try searching with different keywords</p>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Search className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p className="font-medium">Ready to browse products</p>
                              <p className="text-sm">Click "Show All Products" to see available products</p>
                              <p className="text-sm">or search for specific products by name</p>
                              {allAvailableProducts.length > 0 && (
                                <p className="text-xs mt-2 text-blue-600">{allAvailableProducts.length} products loaded from API</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Selected products summary */}
                        {relatedProducts.length > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-medium text-blue-900">
                                Selected Related Products ({relatedProducts.length})
                              </Label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRelatedProducts([]);
                                  setFormData(prev => ({
                                    ...prev,
                                    related_products: []
                                  }));
                                  toast({
                                    title: "Success",
                                    description: "Cleared all related products",
                                  });
                                }}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                Clear All
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {relatedProducts.map((product) => (
                                <div key={product.id} className="flex items-center gap-2 bg-white border rounded-full px-3 py-1 text-sm">
                                  <span>{product.name}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-4 w-4 p-0 hover:bg-red-100"
                                    onClick={() => removeRelatedProduct(product.id)}
                                  >
                                    <X className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
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

                    {/* Color Selection Type */}
                    <div className="mt-3 space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="predefined-colors"
                            name="color-selection"
                            checked={colorSelectionType === "predefined"}
                            onChange={() => setColorSelectionType("predefined")}
                          />
                          <Label htmlFor="predefined-colors">Choose from available colors</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="custom-colors"
                            name="color-selection"
                            checked={colorSelectionType === "custom"}
                            onChange={() => setColorSelectionType("custom")}
                          />
                          <Label htmlFor="custom-colors">Custom color</Label>
                        </div>
                      </div>

                      {/* Predefined Colors Section */}
                      {colorSelectionType === "predefined" && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Available Colors</Label>
                          <div className="grid grid-cols-6 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                            {availableColors.map((color, index) => (
                              <div
                                key={index}
                                className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer hover:bg-gray-50 ${colors.includes(color.code) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                  }`}
                                onClick={() => addPredefinedColor(color.code)}
                              >
                                <div
                                  className="w-8 h-8 rounded-full border-2 border-gray-300 mb-1"
                                  style={{ backgroundColor: color.code }}
                                />
                                <span className="text-xs text-center">{color.name.ar}</span>
                                <span className="text-xs text-gray-500">{color.code}</span>
                              </div>
                            ))}
                          </div>
                          {availableColors.length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                              No colors available
                            </div>
                          )}
                        </div>
                      )}

                      {/* Custom Color Section */}
                      {colorSelectionType === "custom" && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            type="text"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            placeholder="#000000"
                            className="w-24"
                          />
                          <Button onClick={addColor} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Color
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Selected Colors Display */}
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Selected Colors</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {colors.map((color, index) => {
                          const colorName = availableColors.find(c => c.code === color)?.name.ar || color;
                          return (
                            <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                              <div className="w-6 h-6 rounded border" style={{ backgroundColor: color }} />
                              <span className="text-sm">{colorName}</span>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeColor(color)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                        {colors.length === 0 && (
                          <div className="text-center py-4 text-gray-500 w-full">
                            No colors selected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files Tab */}
            {/* <TabsContent value="files" className="space-y-6">

            </TabsContent> */}

            {/* Shipping Tab */}
            <TabsContent value="shipping" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Inventory & Shipping Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stock Management */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Stock Management</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={formData.stock || 0}
                          onChange={(e) => handleInputChange("stock", Number.parseInt(e.target.value) || 0)}
                          disabled={formData.stock_unlimited === true}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.stock_unlimited === true}
                          onCheckedChange={(checked) => handleInputChange("stock_unlimited", checked ? true : null)}
                        />
                        <Label>Unlimited Stock</Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="out-of-stock">When Out of Stock</Label>
                      <select
                        id="out-of-stock"
                        value={formData.out_of_stock || "hide_from_storefront"}
                        onChange={(e) => handleInputChange("out_of_stock", e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="hide_from_storefront">Hide from storefront</option>
                        <option value="show_on_storefront">Show on storefront</option>
                        <option value="show_and_allow_pre_order">Show and allow pre-order</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minimum-purchase">Minimum Purchase Quantity</Label>
                        <Input
                          id="minimum-purchase"
                          type="number"
                          value={formData.minimum_purchase || 1}
                          onChange={(e) => handleInputChange("minimum_purchase", Number.parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maximum-purchase">Maximum Purchase Quantity</Label>
                        <Input
                          id="maximum-purchase"
                          type="number"
                          value={formData.maximum_purchase || 5}
                          onChange={(e) => handleInputChange("maximum_purchase", Number.parseInt(e.target.value) || 5)}
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Shipping Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Shipping Settings</h3>

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
                        <div>
                          <Label htmlFor="shipping-type">Shipping Type</Label>
                          <select
                            id="shipping-type"
                            value={formData.shipping_type || "fixed_shipping"}
                            onChange={(e) => handleShippingTypeChange(e.target.value)}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="default">Default</option>
                            <option value="fixed_shipping">Fixed Shipping</option>
                            <option value="free_shipping">Free Shipping</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                            id="weight"
                            type="number"
                            step="0.01"
                            value={formData.weight || ""}
                            onChange={(e) =>
                              handleInputChange("weight", Number.parseFloat(e.target.value) || null)
                            }
                            placeholder="0.00"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="length">Length (cm)</Label>
                            <Input
                              id="length"
                              type="number"
                              step="0.01"
                              value={formData.length || ""}
                              onChange={(e) =>
                                handleInputChange("length", Number.parseFloat(e.target.value) || null)
                              }
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="width">Width (cm)</Label>
                            <Input
                              id="width"
                              type="number"
                              step="0.01"
                              value={formData.width || ""}
                              onChange={(e) => handleInputChange("width", Number.parseFloat(e.target.value) || null)}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="height">Height (cm)</Label>
                            <Input
                              id="height"
                              type="number"
                              step="0.01"
                              value={formData.height || ""}
                              onChange={(e) =>
                                handleInputChange("height", Number.parseFloat(e.target.value) || null)
                              }
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {formData.shipping_type === "fixed_shipping" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="shipping-single">Shipping Cost (Single Item) *</Label>
                              <Input
                                id="shipping-single"
                                type="number"
                                step="0.01"
                                value={formData.shipping_rate_single || ""}
                                onChange={(e) =>
                                  handleInputChange("shipping_rate_single", Number.parseFloat(e.target.value) || 0)
                                }
                                placeholder="0.00"
                                className={formData.shipping_type === "fixed_shipping" && !formData.shipping_rate_single ? "border-red-300" : ""}
                              />
                              {formData.shipping_type === "fixed_shipping" && !formData.shipping_rate_single && (
                                <p className="text-sm text-red-600 mt-1">Shipping rate is required for fixed shipping</p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="shipping-multi">Shipping Cost (Multiple Items)</Label>
                              <Input
                                id="shipping-multi"
                                type="number"
                                step="0.01"
                                value={formData.shipping_rate_multi || ""}
                                onChange={(e) =>
                                  handleInputChange("shipping_rate_multi", Number.parseFloat(e.target.value) || null)
                                }
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
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
          {/* <Card>
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
          </Card> */}

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

      {/* Add Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add video to the gallery</DialogTitle>
            <DialogDescription>
              Upload your video to YouTube or open it if it's already published. Check privacy settings and make sure the video is
              publicly available. Click Share, copy the link, and paste it into the field below. You can also copy the link from the
              address bar when using a browser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Link to your video, e.g., https://www.youtube.com/watch?v=exa..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddVideoFromDialog()
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                Be mindful of copyright — make sure you either own the video or are authorized to use it.
              </p>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">Your video will appear here</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVideoDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVideoFromDialog} disabled={!videoUrl.trim()}>
              Continue to Add Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Category Selection Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select categories to assign to this product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for a category by name"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="pl-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setCategorySearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Categories list */}
            <div className="max-h-96 overflow-y-auto space-y-1">
              {availableCategories
                .filter(category => 
                  !categorySearchQuery || 
                  category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                )
                .map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      {/* Expandable icon placeholder - you can implement hierarchy later */}
                      {/* <div className="w-4 h-4 flex items-center justify-center">
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                      </div> */}
                      <Label
                        htmlFor={`modal-category-${category.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {category.name}
                      </Label>
                    </div>
                    <Checkbox
                      id={`modal-category-${category.id}`}
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
                  </div>
                ))}

              {availableCategories.filter(category => 
                !categorySearchQuery || 
                category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">
                    {categorySearchQuery ? "No categories found matching your search" : "No categories available"}
                  </p>
                </div>
              )}
            </div>

            {/* Footer with store info */}
           
          </div>
        </DialogContent>
      </Dialog>

      {/* Brand Selection Modal */}
      <Dialog open={showBrandModal} onOpenChange={setShowBrandModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select brands to assign to this product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for a brand by name"
                value={brandSearchQuery}
                onChange={(e) => setBrandSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setBrandSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Brands list */}
            <div className="max-h-96 overflow-y-auto space-y-1">
              {availableBrands
                .filter(brand => 
                  !brandSearchQuery || 
                  brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
                )
                .map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      {/* <div className="w-4 h-4 flex items-center justify-center">
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                      </div> */}
                      <Label
                        htmlFor={`modal-brand-${brand.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {brand.name}
                      </Label>
                    </div>
                    <Checkbox
                      id={`modal-brand-${brand.id}`}
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
                  </div>
                ))}

              {availableBrands.filter(brand => 
                !brandSearchQuery || 
                brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">
                    {brandSearchQuery ? "No brands found matching your search" : "No brands available"}
                  </p>
                </div>
              )}
            </div>

            {/* Footer with store info */}
          
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
