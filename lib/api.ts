const API_BASE_URL = "https://rwady-backend.ahmed-albakor.com/api"

export interface Category {
  id: number
  name: {
    ar: string
    en: string | null
  }
  description: {
    ar: string
    en: string | null
  }
  parent_id: number | null
  image: string | null
  image_url: string | null
  availability: number
  orders?: number
  products_count: number | null
  created_at: string
  updated_at: string
  children?: Category[]
}

export interface Product {
  id: number
  name: {
    ar: string
    en: string
  }
  description: {
    ar: string
    en: string
  }

  sku: string | null
  price: number
  sort_orders?: number
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
  image_url?: string
  width?: number | null
  height?: number | null
  shipping_type: "default" | "fixed_shipping" | "free_shipping"
  shipping_rate_single?: number
  shipping_rate_multi?: number
  is_recommended: boolean
  ribbon_text?: {
    ar: string
    en: string | null
  }
  ribbon_color?: string
  related_category_id?: number | null
  related_category_limit?: number
  position?: number
  orders?: number
  categories?: Category[]
  colors: ProductColor[]
  related_products: Product[]
  media: ProductMedia[]
  created_at: string
  updated_at: string
}

export interface ProductColor {
  id: number
  product_id: number
  color: string
  name: {
    ar: string
    en: string | null
  }
  code: string | null
  created_at: string
  updated_at: string
}

export interface ProductMedia {
  id: number
  path: string
  url: string
  type: "image" | "video"
  source: "file" | "link"
  orders: number
  product_id: number
  product_color_id?: number
  created_at: string
  updated_at: string
}

export interface HomeSection {
  id: number
  title: {
    ar: string
    en: string | null
  }
  show_title: boolean
  type: string
  item_id: number | null
  status: string
  limit: number | null
  can_show_more: boolean
  show_more_path: string | null
  orders: number
  availability: boolean
  created_at: string
  updated_at: string
}

export interface FeaturedSection {
  id: number
  name: {
    ar: string
    en: string | null
  }
  image: string | null
  image_url: string | null
  link: string | null
  start_date: string | null
  end_date: string | null
  availability: boolean
  created_at: string
  updated_at: string
}

export interface Banner {
  id: number
  title: {
    ar: string
    en: string | null
  }
  description: {
    ar: string
    en: string | null
  }
  button_text: {
    ar: string
    en: string | null
  }
  image: string | null
  image_url: string | null
  is_popup: boolean
  link: string | null
  start_date: string | null
  end_date: string | null
  availability: boolean
  created_at: string
  updated_at: string
}

export interface Brand {
  id: number
  name: {
    ar: string
    en: string | null
  }
  image: string | null
  image_url: string | null
  availability: boolean
  products_count: number | null
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    current_page: number
    last_page: number
    limit: number
    total: number
  }
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sort_by?: string
  category_id?: number
  sort_direction?: "asc" | "desc"
  availability?: any
  type?: any,

}

export interface ImageUploadResponse {
  image_name: string
  image_url: string
}

class ApiService {
  private getAuthHeaders() {
    let token = null
    if (typeof window !== "undefined") {
      token = localStorage.getItem("auth_token")
    }

    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private getFormDataHeaders() {
    let token = null
    if (typeof window !== "undefined") {
      token = localStorage.getItem("auth_token")
    }

    return {
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private buildQueryString(params: PaginationParams): string {
    if (!params) return ""

    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.search) queryParams.append("search", params.search)
    if (params.sort_by) queryParams.append("sort_by", params.sort_by)
    if (params.sort_direction) queryParams.append("sort_direction", params.sort_direction)
    if (params.availability !== undefined && params.availability !== null) queryParams.append("availability", params.availability.toString())

    // if (params.filters) {
    //   Object.entries(params.filters).forEach(([key, value]) => {
    //     if (value !== undefined && value !== null) {
    //       queryParams.append(`filter[${key}]`, value.toString())
    //     }
    //   })
    // }
    if (params.category_id !== undefined && params.category_id !== null) {
      queryParams.append("category_id", params.category_id.toString())
    }
    if (params.type !== undefined && params.type !== null) {
      queryParams.append("type", params.type.toString())
    }
    const queryString = queryParams.toString()
    return queryString ? `?${queryString}` : ""
  }

  async get<T>(endpoint: string, params?: PaginationParams): Promise<ApiResponse<T>> {
    try {
      const queryString = params ? this.buildQueryString(params) : ""
      const response = await fetch(`${API_BASE_URL}${endpoint}${queryString}`, {
        headers: this.getAuthHeaders(),
      })
      return response.json()
    } catch (error) {
      console.error(`API Error (GET ${endpoint}):`, error)
      return {
        success: false,
        data: [] as any,
        message: "Network error. Please check your connection.",
      }
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })
      return response.json()
    } catch (error) {
      console.error(`API Error (POST ${endpoint}):`, error)
      return {
        success: false,
        data: {} as any,
        message: "Network error. Please check your connection.",
      }
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })
      return response.json()
    } catch (error) {
      console.error(`API Error (PUT ${endpoint}):`, error)
      return {
        success: false,
        data: {} as any,
        message: "Network error. Please check your connection.",
      }
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })
      return response.json()
    } catch (error) {
      console.error(`API Error (DELETE ${endpoint}):`, error)
      return {
        success: false,
        data: {} as any,
        message: "Network error. Please check your connection.",
      }
    }
  }

  async uploadImage(file: File, folder: string): Promise<ApiResponse<ImageUploadResponse>> {
    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("folder", folder)

      const response = await fetch(`${API_BASE_URL}/general/images/upload`, {
        method: "POST",
        headers: this.getFormDataHeaders(),
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        return {
          success: true,
          data: {
            image_name: result.data.image_name,
            image_url: result.data.image_url,
          },
          message: result.message,
        }
      } else {
        return {
          success: false,
          data: { image_name: "", image_url: "" },
          message: result.message || "Failed to upload image",
        }
      }
    } catch (error) {
      console.error(`API Error (Upload Image):`, error)
      return {
        success: false,
        data: { image_name: "", image_url: "" },
        message: "Network error. Please check your connection.",
      }
    }
  }

  // Categories API methods
  async getCategories(params?: PaginationParams): Promise<ApiResponse<Category[]>> {
    return this.get("/admin/categories", params)
  }

  async getCategoryTree(): Promise<ApiResponse<Category[]>> {
    return this.get("/admin/categories")
  }

  async getCategory(id: number): Promise<ApiResponse<Category>> {
    return this.get(`/admin/categories/${id}`)
  }

  async createCategory(data: any): Promise<ApiResponse<Category>> {
    return this.post("/admin/categories", data)
  }


  async updateCategory(id: number, data: any): Promise<ApiResponse<Category>> {
    return this.put(`/admin/categories/${id}`, data)
  }

  async deleteCategory(id: number): Promise<ApiResponse<any>> {
    return this.delete(`/admin/categories/${id}`)
  }

  async updateCategoryOrder(data: { categories: { id: number; order: number }[] }): Promise<ApiResponse<any>> {
    return this.post("/admin/categories/reorder", data)
  }

  // Products API methods
  async getProducts(params?: PaginationParams): Promise<ApiResponse<Product[]>> {
    return this.get("/admin/products", params)
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.get(`/admin/products/${id}`)
  }

  async createProduct(data: any): Promise<ApiResponse<Product>> {
    return this.post("/admin/products", data)
  }

  async updateProduct(id: number, data: any): Promise<ApiResponse<Product>> {
    return this.put(`/admin/products/${id}`, data)
  }

  async deleteProduct(id: number): Promise<ApiResponse<any>> {
    return this.delete(`/admin/products/${id}`)
  }

  async bulkUpdateProducts(data: any): Promise<ApiResponse<any>> {
    return this.post("/admin/products/bulk-update", data)
  }

  async getCategoryProducts(categoryId: number, params?: PaginationParams): Promise<ApiResponse<Product[]>> {
    return this.get(`/admin/products`, {

      ...params,
      // filters: {
      category_id: categoryId,
      // },
    })
  }

  async assignProductsToCategory(categoryId: number, productIds: number[]): Promise<ApiResponse<any>> {
    return this.post(`/admin/categories/${categoryId}/assign-products`, { product_ids: productIds })
  }

  async unassignProductFromCategory(categoryId: number, productId: number): Promise<ApiResponse<any>> {
    return this.post(`/admin/categories/${categoryId}/unassign-products`, { product_ids: [productId] })
  }

  async unassignProductsFromCategory(categoryId: number, productIds: number[]): Promise<ApiResponse<any>> {
    return this.post(`/admin/categories/${categoryId}/unassign-products`, { product_ids: productIds })
  }

  async reorderProduct(productId: number, order: number): Promise<ApiResponse<any>> {
    return this.put(`/admin/products/${productId}/reorder`, { orders: order })
  }

  async reorderCategoryProduct(
    productId: number,
    order: number
  ): Promise<ApiResponse<any>> {
    // Send only the order value in the body as requested
    return this.put(`/admin/products/${productId}/reorder`, { sort_orders: order })
  }

  async updateCategoryProductOrder(
    categoryId: number,
    data: { products: { id: number; order: number }[] },
  ): Promise<ApiResponse<any>> {
    return this.post(`/admin/categories/${categoryId}/products/reorder`, data)
  }

  // Home Sections API methods
  async getHomeSections(params?: PaginationParams): Promise<ApiResponse<HomeSection[]>> {
    return this.get("/admin/home-sections", params)
  }

  async getHomeSection(id: number): Promise<ApiResponse<HomeSection>> {
    return this.get(`/admin/home-sections/${id}`)
  }

  async createHomeSection(data: any): Promise<ApiResponse<HomeSection>> {
    return this.post("/admin/home-sections", data)
  }

  async updateHomeSection(id: number, data: any): Promise<ApiResponse<HomeSection>> {
    return this.put(`/admin/home-sections/${id}`, data)
  }

  async deleteHomeSection(id: number): Promise<ApiResponse<any>> {
    return this.delete(`/admin/home-sections/${id}`)
  }

  async updateHomeSectionOrder(data: { id: number, orders: number }): Promise<ApiResponse<any>> {
    return this.put(`/admin/home-sections/${data.id}/reorder`, { orders: data.orders })
  }

  // Featured Sections API methods
  async getFeaturedSections(params?: PaginationParams): Promise<ApiResponse<FeaturedSection[]>> {
    return this.get("/admin/featured-sections", params)
  }

  async getFeaturedSection(id: number): Promise<ApiResponse<FeaturedSection>> {
    return this.get(`/admin/featured-sections/${id}`)
  }

  async createFeaturedSection(data: any): Promise<ApiResponse<FeaturedSection>> {
    return this.post("/admin/featured-sections", data)
  }

  async updateFeaturedSection(id: number, data: any): Promise<ApiResponse<FeaturedSection>> {
    return this.put(`/admin/featured-sections/${id}`, data)
  }

  async deleteFeaturedSection(id: number): Promise<ApiResponse<any>> {
    return this.delete(`/admin/featured-sections/${id}`)
  }

  // Banners API methods
  async getBanners(params?: PaginationParams): Promise<ApiResponse<Banner[]>> {
    return this.get("/admin/banners", params)
  }

  async getBanner(id: number): Promise<ApiResponse<Banner>> {
    return this.get(`/admin/banners/${id}`)
  }

  async createBanner(data: any): Promise<ApiResponse<Banner>> {
    return this.post("/admin/banners", data)
  }

  async updateBanner(id: number, data: any): Promise<ApiResponse<Banner>> {
    return this.put(`/admin/banners/${id}`, data)
  }

  async deleteBanner(id: number): Promise<ApiResponse<any>> {
    return this.delete(`/admin/banners/${id}`)
  }

  // Brands API methods
  async getBrands(params?: PaginationParams): Promise<ApiResponse<Brand[]>> {
    return this.get("/admin/brands", params)
  }

  async getBrand(id: number): Promise<ApiResponse<Brand>> {
    return this.get(`/admin/brands/${id}`)
  }

  async createBrand(data: any): Promise<ApiResponse<Brand>> {
    return this.post("/admin/brands", data)
  }

  async updateBrand(id: number, data: any): Promise<ApiResponse<Brand>> {
    return this.put(`/admin/brands/${id}`, data)
  }

  async deleteBrand(id: number): Promise<ApiResponse<any>> {
    return this.delete(`/admin/brands/${id}`)
  }

  // get colors 
  async getProductColors(): Promise<ApiResponse<ProductColor[]>> {
    return this.get(`/general/colors`)
  }

  // Reorder media
  async reorderMedia(productId: number, mediaId: number, orders: number): Promise<ApiResponse<any>> {
    try {
      const url = `${API_BASE_URL}/admin/products/${productId}/media/${mediaId}/reorder`;
      console.log("Reorder API URL:", url);
      console.log("Reorder payload:", { orders });
      console.log("Headers:", this.getAuthHeaders());

      const response = await fetch(url, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ orders }),
      })

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Network error occurred" }))
        console.error("API Error:", errorData);
        return {
          success: false,
          message: errorData.message || `HTTP error! status: ${response.status}`,
          data: null,
        }
      }

      const data = await response.json()
      console.log("API Response data:", data);
      return {
        success: true,
        message: data.message || "Media reordered successfully",
        data: data.data || data,
      }
    } catch (error) {
      console.error("Error reordering media:", error)
      return {
        success: false,
        message: "Failed to reorder media. Please check your connection and try again.",
        data: null,
      }
    }
  }
}

export const apiService = new ApiService()

// Mock data for development/testing
export const mockCategories: Category[] = [
  {
    id: 1,
    name: { ar: "الملابس", en: "Clothing" },
    description: { ar: "جميع أنواع الملابس", en: "All types of clothing" },
    parent_id: null,
    image: null,
    image_url: null,
    availability: 1,
    products_count: 24,
    created_at: "2025-06-16 22:27:03",
    updated_at: "2025-06-16 22:27:03",
    children: [
      {
        id: 2,
        name: { ar: "ملابس رجالية", en: "Men's Clothing" },
        description: { ar: "ملابس للرجال", en: "Clothing for men" },
        parent_id: 1,
        image: null,
        image_url: null,
        availability: 1,
        products_count: 12,
        created_at: "2025-06-16 22:27:03",
        updated_at: "2025-06-16 22:27:03",
      },
      {
        id: 3,
        name: { ar: "ملابس نسائية", en: "Women's Clothing" },
        description: { ar: "ملابس للنساء", en: "Clothing for women" },
        parent_id: 1,
        image: null,
        image_url: null,
        availability: 1,
        products_count: 12,
        created_at: "2025-06-16 22:27:03",
        updated_at: "2025-06-16 22:27:03",
      },
    ],
  },
  {
    id: 4,
    name: { ar: "الإلكترونيات", en: "Electronics" },
    description: { ar: "أجهزة إلكترونية", en: "Electronic devices" },
    parent_id: null,
    image: null,
    image_url: null,
    availability: 1,
    products_count: 18,
    created_at: "2025-06-16 22:27:03",
    updated_at: "2025-06-16 22:27:03",
    children: [
      {
        id: 5,
        name: { ar: "هواتف ذكية", en: "Smartphones" },
        description: { ar: "هواتف ذكية وملحقاتها", en: "Smartphones and accessories" },
        parent_id: 4,
        image: null,
        image_url: null,
        availability: 1,
        products_count: 8,
        created_at: "2025-06-16 22:27:03",
        updated_at: "2025-06-16 22:27:03",
      },
      {
        id: 6,
        name: { ar: "أجهزة كمبيوتر", en: "Computers" },
        description: { ar: "أجهزة كمبيوتر وملحقاتها", en: "Computers and accessories" },
        parent_id: 4,
        image: null,
        image_url: null,
        availability: 1,
        products_count: 10,
        created_at: "2025-06-16 22:27:03",
        updated_at: "2025-06-16 22:27:03",
      },
    ],
  },
]

// export const mockProducts: Product[] = [
//   {
//     id: 1,
//     sku: "AEC01",
//     name: { ar: "صانع الثلج AEC01", en: "AEC ICE MAKER AEC01" },
//     description: { ar: "صانع ثلج عالي الجودة", en: "High quality ice maker" },
//     price: 299.99,
//     price_after_discount: 249.99,
//     availability: true,
//     stock: 15,
//     stock_unlimited: false,
//     minimum_purchase: 1,
//     maximum_purchase: 999,
//     requires_shipping: true,
//     is_recommended: false,
//     colors: [],
//     related_products: [],
//     media: [],
//     created_at: "2025-06-16 22:27:03",
//     updated_at: "2025-06-16 22:27:03",
//   },
//   {
//     id: 2,
//     sku: "AEC02",
//     name: { ar: "مبرد المياه وصانع الثلج AEC02", en: "AEC WATER COOLER & ICE MAKER AEC02" },
//     description: { ar: "مبرد مياه مع صانع ثلج", en: "Water cooler with ice maker" },
//     price: 499.99,
//     availability: true,
//     stock: 8,
//     stock_unlimited: false,
//     minimum_purchase: 1,
//     maximum_purchase: 999,
//     requires_shipping: true,
//     is_recommended: true,
//     colors: [],
//     related_products: [],
//     media: [],
//     created_at: "2025-06-16 22:27:03",
//     updated_at: "2025-06-16 22:27:03",
//   },

// ]
