"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { apiService } from "@/lib/api"
import { Loader2, Package, DollarSign, Truck } from "lucide-react"

interface BulkEditModalProps {
    isOpen: boolean
    onClose: () => void
    selectedProductIds: number[]
    onSuccess: () => void
}

export function BulkEditModal({ isOpen, onClose, selectedProductIds, onSuccess }: BulkEditModalProps) {
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("pricing")
    const { toast } = useToast()

    const [bulkData, setBulkData] = useState({
        // Pricing
        price_action: "set", // "set", "increase", "decrease"
        price_value: 0,
        price_type: "fixed", // "fixed", "percentage"

        // Availability
        availability_action: "enable", // "enable", "disable"

        // Stock
        stock_action: "set", // "set", "increase", "decrease"
        stock_value: 0,
        stock_unlimited: false,

        // Shipping
        requires_shipping: null as boolean | null,
        weight: null as number | null,

        // Categories
        category_action: "add", // "add", "remove", "replace"
        category_ids: [] as number[],
    })

    const handleBulkUpdate = async () => {
        try {
            setLoading(true)

            const updateData: any = {
                product_ids: selectedProductIds,
                updates: {},
            }

            // Pricing updates
            if (bulkData.price_action && bulkData.price_value > 0) {
                updateData.updates.pricing = {
                    action: bulkData.price_action,
                    value: bulkData.price_value,
                    type: bulkData.price_type,
                }
            }

            // Availability updates
            if (bulkData.availability_action) {
                updateData.updates.availability = bulkData.availability_action === "enable"
            }

            // Stock updates
            if (bulkData.stock_action) {
                updateData.updates.stock = {
                    action: bulkData.stock_action,
                    value: bulkData.stock_value,
                    unlimited: bulkData.stock_unlimited,
                }
            }

            // Shipping updates
            if (bulkData.requires_shipping !== null) {
                updateData.updates.requires_shipping = bulkData.requires_shipping
            }

            if (bulkData.weight !== null) {
                updateData.updates.weight = bulkData.weight
            }

            // Category updates
            if (bulkData.category_action && bulkData.category_ids.length > 0) {
                updateData.updates.categories = {
                    action: bulkData.category_action,
                    category_ids: bulkData.category_ids,
                }
            }

            const response = await apiService.bulkUpdateProducts(updateData)

            if (response.success) {
                toast({
                    title: "Success",
                    description: `${selectedProductIds.length} products updated successfully`,
                })
                onSuccess()
                onClose()
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to update products",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error updating products:", error)
            toast({
                title: "Error",
                description: "An error occurred while updating products",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const updateBulkData = (field: string, value: any) => {
        setBulkData((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Bulk Edit Products</DialogTitle>
                    <p className="text-sm text-gray-600">Edit {selectedProductIds.length} selected products</p>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="pricing">Pricing</TabsTrigger>
                            <TabsTrigger value="inventory">Inventory</TabsTrigger>
                            <TabsTrigger value="shipping">Shipping</TabsTrigger>
                            <TabsTrigger value="categories">Categories</TabsTrigger>
                        </TabsList>

                        <div className="mt-4 overflow-y-auto max-h-96">
                            <TabsContent value="pricing" className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-gray-400" />
                                    <h3 className="font-medium">Price Updates</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label>Action</Label>
                                        <Select
                                            value={bulkData.price_action}
                                            onValueChange={(value) => updateBulkData("price_action", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select action" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="set">Set price to</SelectItem>
                                                <SelectItem value="increase">Increase by</SelectItem>
                                                <SelectItem value="decrease">Decrease by</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Value</Label>
                                        <Input
                                            type="number"
                                            value={bulkData.price_value}
                                            onChange={(e) => updateBulkData("price_value", Number.parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                    </div>

                                    <div>
                                        <Label>Type</Label>
                                        <Select value={bulkData.price_type} onValueChange={(value) => updateBulkData("price_type", value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                <SelectItem value="percentage">Percentage</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="inventory" className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-gray-400" />
                                    <h3 className="font-medium">Inventory Updates</h3>
                                </div>

                                <div>
                                    <Label>Availability</Label>
                                    <Select
                                        value={bulkData.availability_action}
                                        onValueChange={(value) => updateBulkData("availability_action", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select availability action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="enable">Enable all products</SelectItem>
                                            <SelectItem value="disable">Disable all products</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Stock Action</Label>
                                        <Select
                                            value={bulkData.stock_action}
                                            onValueChange={(value) => updateBulkData("stock_action", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select action" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="set">Set stock to</SelectItem>
                                                <SelectItem value="increase">Increase by</SelectItem>
                                                <SelectItem value="decrease">Decrease by</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Stock Value</Label>
                                        <Input
                                            type="number"
                                            value={bulkData.stock_value}
                                            onChange={(e) => updateBulkData("stock_value", Number.parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label>Set as unlimited stock</Label>
                                    <Switch
                                        checked={bulkData.stock_unlimited}
                                        onCheckedChange={(checked) => updateBulkData("stock_unlimited", checked)}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="shipping" className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-gray-400" />
                                    <h3 className="font-medium">Shipping Updates</h3>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label>Requires Shipping</Label>
                                    <Select
                                        value={bulkData.requires_shipping === null ? "" : bulkData.requires_shipping.toString()}
                                        onValueChange={(value) =>
                                            updateBulkData("requires_shipping", value === "" ? null : value === "true")
                                        }
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">No change</SelectItem>
                                            <SelectItem value="true">Yes</SelectItem>
                                            <SelectItem value="false">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        value={bulkData.weight || ""}
                                        onChange={(e) => updateBulkData("weight", Number.parseFloat(e.target.value) || null)}
                                        placeholder="Leave empty for no change"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="categories" className="space-y-4">
                                <div>
                                    <Label>Category Action</Label>
                                    <Select
                                        value={bulkData.category_action}
                                        onValueChange={(value) => updateBulkData("category_action", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="add">Add to categories</SelectItem>
                                            <SelectItem value="remove">Remove from categories</SelectItem>
                                            <SelectItem value="replace">Replace categories</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Categories</Label>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Select categories to {bulkData.category_action || "modify"}
                                    </p>
                                    {/* Category selection would go here - simplified for now */}
                                    <div className="border rounded-lg p-4 text-center text-gray-500">
                                        Category selection interface would be implemented here
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleBulkUpdate} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            `Update ${selectedProductIds.length} Products`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
