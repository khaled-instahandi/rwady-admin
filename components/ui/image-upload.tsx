"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { apiService } from "@/lib/api"
import { motion } from "framer-motion"

interface ImageUploadProps {
  value?: string
  imageName?: string
  onChange: (imageUrl: string, imageName: string) => void
  folder: string
  className?: string
}

export function ImageUpload({ value, imageName, onChange, folder, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || "")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update preview when value prop changes
  useEffect(() => {
    setPreview(value || "")
  }, [value])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const response = await apiService.uploadImage(file, folder)
      if (response.success) {
        const imageUrl = response.data.image_url
        const imageName = response.data.image_name
        setPreview(imageUrl)
        onChange(imageUrl, imageName)
      } else {
        console.error("Upload failed:", response.message)
        alert(`Upload failed: ${response.message}`)
      }
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Upload failed: Network error")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview("")
    onChange("", "")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className={className}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" multiple />

      {/* {preview ? (
        <motion.div
          className="relative inline-block"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <img
            src={preview || "/placeholder.svg"}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-md"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </motion.div>
      ) :  */}

      {/* ( */}
      <div
        className={`w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="text-center">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto mb-2" />
            <span className="text-xs text-gray-500">Uploading...</span>
          </div>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500 text-center">
              {dragActive ? "Drop image here" : "Click or drag to upload"}
            </span>
          </>
        )}
      </div>
      {/* )} */}

      <div className="mt-2" style={{ display: "flex", justifyContent: "center" }}>
        {/* <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-blue-600 hover:bg-blue-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="" />
              {preview ? "Change image" : "Upload image"}
            </>
          )}
        </Button> */}
      </div>

      {imageName && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-medium">File:</span> {imageName}
        </div>
      )}
    </div>
  )
}
