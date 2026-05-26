"use client"

import { useState, useEffect } from "react"
import { Heart, X } from "lucide-react"

interface Photo {
  id: string
  src: string
  caption: string
  likes: number
}

export default function EmbedGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [galleryTitle, setGalleryTitle] = useState("Photo Gallery")

  // Load photos from localStorage
  useEffect(() => {
    const savedPhotos = localStorage.getItem("gallery-photos")
    if (savedPhotos) {
      setPhotos(JSON.parse(savedPhotos))
    }
    const savedTitle = localStorage.getItem("gallery-title")
    if (savedTitle) {
      setGalleryTitle(savedTitle)
    }
  }, [])

  const handleLike = (photoId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, likes: p.likes + 1 } : p
    )
    setPhotos(updated)
    localStorage.setItem("gallery-photos", JSON.stringify(updated))
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto({ ...selectedPhoto, likes: selectedPhoto.likes + 1 })
    }
  }

  const truncateCaption = (caption: string, maxLength: number = 40) => {
    if (caption.length <= maxLength) return caption
    return caption.slice(0, maxLength) + "..."
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-foreground">{galleryTitle}</h1>
      </div>

      {/* Gallery Grid */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative cursor-pointer overflow-hidden rounded-lg bg-muted"
            >
              <div className="aspect-square">
                <img
                  src={photo.src}
                  alt={photo.caption || "Gallery photo"}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>

              {/* Caption Preview */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                <p className="text-xs text-white/90 line-clamp-1">
                  {photo.caption ? truncateCaption(photo.caption) : ""}
                </p>
              </div>

              {/* Like button overlay */}
              <button
                onClick={(e) => handleLike(photo.id, e)}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
              >
                <Heart
                  className={`h-3.5 w-3.5 ${photo.likes > 0 ? "fill-red-500 text-red-500" : ""}`}
                />
                <span className="text-xs font-medium">{photo.likes}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Preview */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            <div className="max-h-[70vh] overflow-hidden">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.caption || "Photo preview"}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Details */}
            <div className="p-4">
              {selectedPhoto.caption && (
                <p className="mb-3 text-sm text-foreground">{selectedPhoto.caption}</p>
              )}
              <button
                onClick={() => handleLike(selectedPhoto.id)}
                className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                <Heart
                  className={`h-5 w-5 ${selectedPhoto.likes > 0 ? "fill-red-500 text-red-500" : ""}`}
                />
                <span className="font-medium">{selectedPhoto.likes} likes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
