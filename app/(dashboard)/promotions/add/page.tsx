"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Package, ShoppingBag, ShoppingCart, Truck, Percent, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { apiService, type CreatePromotionData, type Category, type Product } from "@/lib/api"
import { ProductSelectionModal } from "./components/product-selection-modal"
import { CategorySelectionModal } from "./components/category-selection-modal"

interface PromotionFormData {
    title: {
        ar: string
        en: string
    }
    type: "product" | "category" | "cart_total" | "shipping"
    discount_type: "percentage" | "fixed"
    discount_value: number
    start_at: Date | undefined
    end_at: Date | undefined
    status: "draft" | "active" | "inactive"
    products: number[]
    categories: number[]
    min_cart_total: number
}

const initialFormData: PromotionFormData = {
    title: {
        ar: "",
        en: "",
    },
    type: "product",
    discount_type: "percentage",
    discount_value: 0,
    start_at: undefined,
    end_at: undefined,
    status: "draft",
    products: [],
    categories: [],
    min_cart_total: 0,
}

export default function AddPromotionPage() {
    const [formData, setFormData] = useState<PromotionFormData>(initialFormData)
    const [submitting, setSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)

    // For modals
    const [showProductModal, setShowProductModal] = useState(false)
    const [showCategoryModal, setShowCategoryModal] = useState(false)

    // For product and category data
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([])

    const { toast } = useToast()
    const router = useRouter()

    const handleCreatePromotion = async () => {
        if (!formData.title.ar || formData.discount_value <= 0) {
            toast({
                title: "Error",
                description: "Please fill all required fields",
                variant: "destructive",
            })
            return
        }

        try {
            setSubmitting(true)

            const promotionData: CreatePromotionData = {
                title: formData.title,
                type: formData.type,
                discount_type: formData.discount_type,
                discount_value: formData.discount_value,
                status: formData.status,
            }

            if (formData.start_at) {
                promotionData.start_at = format(formData.start_at, "yyyy-MM-dd HH:mm")
            }

            if (formData.end_at) {
                promotionData.end_at = format(formData.end_at, "yyyy-MM-dd HH:mm")
            }

            if (formData.type === "product" && formData.products.length > 0) {
                promotionData.products = formData.products
            }

            if (formData.type === "category" && formData.categories.length > 0) {
                promotionData.categories = formData.categories
            }

            if (formData.type === "cart_total" && formData.min_cart_total > 0) {
                promotionData.min_cart_total = formData.min_cart_total
            }

            const response = await apiService.createPromotion(promotionData)

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Promotion created successfully",
                })
                router.push("/promotions")
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to create promotion",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while creating promotion",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleProductsSelected = (products: Product[]) => {
        setSelectedProducts(products)
        setFormData({ ...formData, products: products.map(p => p.id) })
        setShowProductModal(false)
    }

    const handleCategoriesSelected = (categories: Category[]) => {
        setSelectedCategories(categories)
        setFormData({ ...formData, categories: categories.map(c => c.id) })
        setShowCategoryModal(false)
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "product":
                return <Package className="h-5 w-5" />
            case "category":
                return <ShoppingBag className="h-5 w-5" />
            case "cart_total":
                return <ShoppingCart className="h-5 w-5" />
            case "shipping":
                return <Truck className="h-5 w-5" />
            default:
                return <Package className="h-5 w-5" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "product":
                return "Discount on specific products"
            case "category":
                return "Discount on products from specific categories"
            case "cart_total":
                return "Discount based on cart total"
            case "shipping":
                return "Free shipping for specific shipping methods"
            default:
                return type
        }
    }

    const getTypeDescription = (type: string) => {
        switch (type) {
            case "product":
                return "Set for one or several products to encourage customers to make specific purchases."
            case "category":
                return "Set for specific categories. You can exclude unnecessary products from the promotion."
            case "cart_total":
                return "Applied when a cart total reaches a specific amount."
            case "shipping":
                return "Offer free shipping for one or more shipping methods or set up special discount values to encourage customers to buy more and increase sales."
            default:
                return ""
        }
    }

    const canProceedToNextStep = () => {
        switch (currentStep) {
            case 1:
                return true // Type is always selected (has default value)
            case 2:
                return formData.title.ar && formData.discount_value > 0 &&
                    ((formData.type === "product" && formData.products.length > 0) ||
                        (formData.type === "category" && formData.categories.length > 0) ||
                        (formData.type === "cart_total" && formData.min_cart_total > 0) ||
                        formData.type === "shipping")
            case 3:
                return true
            default:
                return false
        }
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/promotions")}
                        className="p-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Create Promotion</h1>
                        <p className="text-gray-600 mt-1">Create a new promotional campaign</p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center space-x-8 py-6">
                {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${step === currentStep
                                ? "bg-blue-600 text-white"
                                : step < currentStep
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-200 text-gray-600"
                            }`}>
                            {step}
                        </div>
                        <div className="ml-3 text-sm">
                            {step === 1 && "Choose Type"}
                            {step === 2 && "Set Values"}
                            {step === 3 && "Limitations"}
                        </div>
                        {step < 3 && <div className="w-16 h-px bg-gray-300 ml-4" />}
                    </div>
                ))}
            </div>

            <Card>
                <CardContent className="p-8">
                    {/* Step 1: Choose the type of promotion */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Step 1. Choose the type of promotion</h2>
                                <p className="text-gray-600 mb-6">Specify what promotion you want to offer to your customers.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {(["product", "category", "cart_total", "shipping"] as const).map((type) => (
                                    <div
                                        key={type}
                                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${formData.type === type
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        onClick={() => setFormData({ ...formData, type })}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <input
                                                type="radio"
                                                name="promotionType"
                                                value={type}
                                                checked={formData.type === type}
                                                onChange={() => setFormData({ ...formData, type })}
                                                className="mt-1 h-4 w-4 text-blue-600"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    {getTypeIcon(type)}
                                                    <h3 className="font-medium text-gray-900">{getTypeLabel(type)}</h3>
                                                </div>
                                                <p className="text-sm text-gray-600">{getTypeDescription(type)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button
                                    onClick={() => setCurrentStep(2)}
                                    disabled={!canProceedToNextStep()}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Next Step
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Set discount values and add items */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Step 2. Set discount values and add {formData.type === "product" ? "products" : formData.type === "category" ? "categories" : "settings"}</h2>
                                <p className="text-gray-600 mb-6">Choose between percentage and fixed-amount discounts and add {formData.type === "product" ? "products" : formData.type === "category" ? "categories" : "configuration"}.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title_ar">Title (Arabic) *</Label>
                                    <Input
                                        id="title_ar"
                                        placeholder="Enter Arabic title"
                                        value={formData.title.ar}
                                        onChange={(e) => setFormData({ ...formData, title: { ...formData.title, ar: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="title_en">Title (English)</Label>
                                    <Input
                                        id="title_en"
                                        placeholder="Enter English title"
                                        value={formData.title.en}
                                        onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="discount_type">Discount Type *</Label>
                                    <Select
                                        value={formData.discount_type}
                                        onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, discount_type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">
                                                <div className="flex items-center space-x-2">
                                                    <Percent className="h-4 w-4" />
                                                    <span>Percentage (%)</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="fixed">
                                                <div className="flex items-center space-x-2">
                                                    <DollarSign className="h-4 w-4" />
                                                    <span>Fixed Amount (IQD)</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discount_value">
                                        Discount Value * {formData.discount_type === "percentage" ? "(%)" : "(IQD)"}
                                    </Label>
                                    <Input
                                        id="discount_value"
                                        type="number"
                                        placeholder={formData.discount_type === "percentage" ? "e.g: 10" : "e.g: 5000"}
                                        value={formData.discount_value || ""}
                                        onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                        min="0"
                                        max={formData.discount_type === "percentage" ? "100" : undefined}
                                    />
                                </div>
                            </div>

                            {/* Type-specific sections */}
                            {formData.type === "product" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Products with discount</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowProductModal(true)}
                                            className="flex items-center space-x-2"
                                        >
                                            <Package className="h-4 w-4" />
                                            <span>Select Products</span>
                                        </Button>
                                    </div>

                                    {selectedProducts.length > 0 && (
                                        <div className="border rounded-lg p-4 bg-gray-50">
                                            <h4 className="font-medium mb-3">Selected Products ({selectedProducts.length})</h4>
                                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                                {selectedProducts.map((product) => (
                                                    <div key={product.id} className="flex items-center space-x-3 text-sm">
                                                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium">{product.name.ar}</div>
                                                            {product.name.en && <div className="text-gray-500">{product.name.en}</div>}
                                                        </div>
                                                        <div className="text-gray-500">SKU: {product.sku}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.type === "category" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Categories with discount</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowCategoryModal(true)}
                                            className="flex items-center space-x-2"
                                        >
                                            <ShoppingBag className="h-4 w-4" />
                                            <span>Select Categories</span>
                                        </Button>
                                    </div>

                                    {selectedCategories.length > 0 && (
                                        <div className="border rounded-lg p-4 bg-gray-50">
                                            <h4 className="font-medium mb-3">Selected Categories ({selectedCategories.length})</h4>
                                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                                {selectedCategories.map((category) => (
                                                    <div key={category.id} className="flex items-center space-x-3 text-sm">
                                                        <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                                                            <ShoppingBag className="h-4 w-4 text-green-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium">{category.name.ar}</div>
                                                            {category.name.en && <div className="text-gray-500">{category.name.en}</div>}
                                                        </div>
                                                        <div className="text-gray-500">{category.products_count} products</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.type === "cart_total" && (
                                <div className="space-y-2">
                                    <Label htmlFor="min_cart_total">Minimum Cart Total (IQD) *</Label>
                                    <Input
                                        id="min_cart_total"
                                        type="number"
                                        placeholder="e.g: 50000"
                                        value={formData.min_cart_total || ""}
                                        onChange={(e) => setFormData({ ...formData, min_cart_total: Number(e.target.value) })}
                                        min="0"
                                    />
                                    <p className="text-sm text-gray-500">
                                        Set the minimum cart total above zero and not too low relative to your product prices.
                                        Otherwise, all your customers will get the discount.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep(1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => setCurrentStep(3)}
                                    disabled={!canProceedToNextStep()}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Next Step
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Specify discount limitations */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Step 3. Specify discount limitations</h2>
                                <p className="text-gray-600 mb-6">Set up under what conditions your discount is available.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: "draft" | "active" | "inactive") => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="start_at">Start Date</Label>
                                    <Input
                                        id="start_at"
                                        type="datetime-local"
                                        value={formData.start_at ? format(formData.start_at, "yyyy-MM-dd'T'HH:mm") : ""}
                                        onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value) : undefined
                                            setFormData({ ...formData, start_at: date })
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_at">End Date</Label>
                                    <Input
                                        id="end_at"
                                        type="datetime-local"
                                        value={formData.end_at ? format(formData.end_at, "yyyy-MM-dd'T'HH:mm") : ""}
                                        onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value) : undefined
                                            setFormData({ ...formData, end_at: date })
                                        }}
                                        min={formData.start_at ? format(formData.start_at, "yyyy-MM-dd'T'HH:mm") : undefined}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep(2)}
                                >
                                    Previous
                                </Button>
                                <div className="flex space-x-3">
                                    {/* <Button
                                        variant="outline"
                                        onClick={() => {
                                            setFormData({ ...formData, status: "draft" })
                                            handleCreatePromotion()
                                        }}
                                        disabled={submitting}
                                    >
                                        Create without Launch
                                    </Button> */}
                                    <Button
                                        onClick={() => {
                                            setFormData({ ...formData, status: "active" })
                                            handleCreatePromotion()
                                        }}
                                        disabled={submitting}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {submitting ? "Creating..." : "Create and Launch"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <ProductSelectionModal
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                onProductsSelected={handleProductsSelected}
                selectedProductIds={formData.products}
            />

            <CategorySelectionModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onCategoriesSelected={handleCategoriesSelected}
                selectedCategoryIds={formData.categories}
            />
        </div>
    )
}
