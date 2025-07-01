"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageIcon, Upload, X, GripVertical, Film, Loader2, Edit3 } from "lucide-react"
import { apiService, type ProductMedia } from "@/lib/api"

interface ProductImagesEditorProps {
  productId: number
  images: ProductMedia[]
  onUpdate: (images: ProductMedia[]) => void
}

export function ProductImagesEditor({ productId, images, onUpdate }: ProductImagesEditorProps) {
  const [localImages, setLocalImages] = useState<ProductMedia[]>(images)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList) => {
    if (!files.length) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const response = await apiService.uploadImage(file, 'products')
        
        if (response.success) {
          const newImage: ProductMedia = {
            id: Date.now() + i, // Temporary ID
            path: response.data.image_name,
            url: response.data.image_url,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            source: 'file',
            orders: localImages.length + i + 1,
            product_id: productId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          setLocalImages(prev => [...prev, newImage])
        }
      }
      
      // Update parent component
      onUpdate(localImages)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (imageId: number) => {
    const newImages = localImages.filter(img => img.id !== imageId)
    setLocalImages(newImages)
    onUpdate(newImages)
  }

  const handleReorder = (newOrder: ProductMedia[]) => {
    const reorderedImages = newOrder.map((img, index) => ({
      ...img,
      orders: index + 1
    }))
    setLocalImages(reorderedImages)
    onUpdate(reorderedImages)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-blue-50"
        >
          <Edit3 className="h-4 w-4 text-blue-600" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product Images</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
            />
            
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
                <p className="text-sm text-gray-600">Uploading images...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Images
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Drag and drop images here, or click to select files
                </p>
              </div>
            )}
          </div>

          {/* Images Grid */}
          {localImages.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Product Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {localImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative group cursor-move border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-lg p-2 transition-colors"
                  >
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
                      {image.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="h-8 w-8 text-gray-500" />
                        </div>
                      ) : (
                        <img
                          src={image.url}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Drag handle */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/80 rounded p-1">
                          <GripVertical className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                      
                      {/* Remove button */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(image.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      {/* Order number */}
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Move buttons */}
                    <div className="flex justify-between mt-2 gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => {
                          if (index > 0) {
                            const newImages = [...localImages]
                            const temp = newImages[index]
                            newImages[index] = newImages[index - 1]
                            newImages[index - 1] = temp
                            handleReorder(newImages)
                          }
                        }}
                        disabled={index === 0}
                      >
                        ←
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => {
                          if (index < localImages.length - 1) {
                            const newImages = [...localImages]
                            const temp = newImages[index]
                            newImages[index] = newImages[index + 1]
                            newImages[index + 1] = temp
                            handleReorder(newImages)
                          }
                        }}
                        disabled={index === localImages.length - 1}
                      >
                        →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {localImages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No images uploaded yet
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
