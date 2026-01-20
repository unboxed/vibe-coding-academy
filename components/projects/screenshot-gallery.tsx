"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ProjectScreenshot } from "@/types/database"

interface ScreenshotGalleryProps {
  screenshots: ProjectScreenshot[]
  className?: string
}

export function ScreenshotGallery({
  screenshots,
  className,
}: ScreenshotGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goToPrevious = React.useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex(
        lightboxIndex === 0 ? screenshots.length - 1 : lightboxIndex - 1
      )
    }
  }, [lightboxIndex, screenshots.length])

  const goToNext = React.useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex(
        lightboxIndex === screenshots.length - 1 ? 0 : lightboxIndex + 1
      )
    }
  }, [lightboxIndex, screenshots.length])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return

      switch (e.key) {
        case "Escape":
          closeLightbox()
          break
        case "ArrowLeft":
          goToPrevious()
          break
        case "ArrowRight":
          goToNext()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxIndex, goToPrevious, goToNext])

  // Prevent body scroll when lightbox is open
  React.useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [lightboxIndex])

  if (screenshots.length === 0) return null

  return (
    <>
      {/* Thumbnail Grid */}
      <div className={cn("grid gap-3", className)}>
        {/* Main image (first screenshot) */}
        <button
          type="button"
          className="relative aspect-video overflow-hidden rounded-lg bg-muted"
          onClick={() => openLightbox(0)}
        >
          <img
            src={screenshots[0].url}
            alt={screenshots[0].caption || "Screenshot 1"}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
          {screenshots[0].caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-sm text-white">{screenshots[0].caption}</p>
            </div>
          )}
        </button>

        {/* Additional thumbnails */}
        {screenshots.length > 1 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {screenshots.slice(1).map((screenshot, index) => (
              <button
                key={screenshot.url}
                type="button"
                className="relative aspect-video overflow-hidden rounded-lg bg-muted"
                onClick={() => openLightbox(index + 1)}
              >
                <img
                  src={screenshot.url}
                  alt={screenshot.caption || `Screenshot ${index + 2}`}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-white/20"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation buttons */}
          {screenshots.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image container */}
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={screenshots[lightboxIndex].url}
              alt={
                screenshots[lightboxIndex].caption ||
                `Screenshot ${lightboxIndex + 1}`
              }
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />

            {/* Caption */}
            {screenshots[lightboxIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/60 p-4">
                <p className="text-center text-white">
                  {screenshots[lightboxIndex].caption}
                </p>
              </div>
            )}

            {/* Counter */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm text-white/70">
              {lightboxIndex + 1} / {screenshots.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
