"use client"

import * as React from "react"
import { Plus, X, Loader2, GripVertical, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ProjectScreenshot } from "@/types/database"

interface MultiImageUploadProps {
  value: ProjectScreenshot[]
  onChange: (screenshots: ProjectScreenshot[]) => void
  onUpload: (file: File, order: number) => Promise<string>
  onDelete?: (url: string) => Promise<void>
  maxImages?: number
  disabled?: boolean
  className?: string
}

interface UploadingImage {
  id: string
  progress: number
}

export function MultiImageUpload({
  value = [],
  onChange,
  onUpload,
  onDelete,
  maxImages = 10,
  disabled = false,
  className,
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [uploading, setUploading] = React.useState<UploadingImage[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const canAddMore = value.length + uploading.length < maxImages

  const handleDragOver = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled && canAddMore) {
        setIsDragging(true)
      }
    },
    [disabled, canAddMore]
  )

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      )
      await uploadFiles(files)
    },
    [disabled, value.length]
  )

  const handleFileSelect = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        await uploadFiles(files)
      }
      e.target.value = ""
    },
    [value.length]
  )

  const uploadFiles = async (files: File[]) => {
    setError(null)

    const remainingSlots = maxImages - value.length - uploading.length
    const filesToUpload = files.slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    const uploadIds = filesToUpload.map(() => crypto.randomUUID())
    setUploading((prev) => [
      ...prev,
      ...uploadIds.map((id) => ({ id, progress: 0 })),
    ])

    const newScreenshots: ProjectScreenshot[] = []
    const failedUploads: string[] = []

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]
      const uploadId = uploadIds[i]
      const order = value.length + newScreenshots.length

      try {
        const url = await onUpload(file, order)
        newScreenshots.push({
          url,
          order,
          uploaded_at: new Date().toISOString(),
        })
      } catch (err) {
        failedUploads.push(file.name)
      } finally {
        setUploading((prev) => prev.filter((u) => u.id !== uploadId))
      }
    }

    if (newScreenshots.length > 0) {
      onChange([...value, ...newScreenshots])
    }

    if (failedUploads.length > 0) {
      setError(`Failed to upload: ${failedUploads.join(", ")}`)
    }
  }

  const handleRemove = React.useCallback(
    async (index: number) => {
      const screenshot = value[index]

      if (onDelete) {
        try {
          await onDelete(screenshot.url)
        } catch (err) {
          // Continue with removal even if delete fails
          console.error("Failed to delete image:", err)
        }
      }

      const newValue = value.filter((_, i) => i !== index)
      // Reorder remaining screenshots
      const reordered = newValue.map((s, i) => ({ ...s, order: i }))
      onChange(reordered)
    },
    [value, onChange, onDelete]
  )

  const handleCaptionChange = React.useCallback(
    (index: number, caption: string) => {
      const newValue = [...value]
      newValue[index] = { ...newValue[index], caption }
      onChange(newValue)
    },
    [value, onChange]
  )

  const handleClick = React.useCallback(() => {
    if (!disabled && canAddMore) {
      inputRef.current?.click()
    }
  }, [disabled, canAddMore])

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || !canAddMore}
      />

      {/* Image Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {value.map((screenshot, index) => (
          <div
            key={screenshot.url}
            className="group relative overflow-hidden rounded-lg border bg-muted"
          >
            <div className="aspect-video">
              <img
                src={screenshot.url}
                alt={screenshot.caption || `Screenshot ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Overlay with actions */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRemove(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Order badge */}
            <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-medium text-white">
              {index + 1}
            </div>

            {/* Caption input */}
            <div className="p-2">
              <Input
                type="text"
                placeholder="Add caption..."
                value={screenshot.caption || ""}
                onChange={(e) => handleCaptionChange(index, e.target.value)}
                className="h-8 text-xs"
                disabled={disabled}
              />
            </div>
          </div>
        ))}

        {/* Uploading placeholders */}
        {uploading.map((u) => (
          <div
            key={u.id}
            className="flex aspect-video items-center justify-center rounded-lg border bg-muted"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ))}

        {/* Add more button */}
        {canAddMore && (
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
              "aspect-video",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Plus className="h-6 w-6" />
              <span className="text-xs">Add image</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {value.length} of {maxImages} images
        </span>
        <span>JPEG, PNG, WebP, GIF (max 5MB each)</span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
