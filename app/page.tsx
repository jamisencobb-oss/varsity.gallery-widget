"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Heart, X, Upload, ImagePlus, Trash2, Pencil, Check, MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Comment {
  id: string
  text: string
  timestamp: number
}

interface Photo {
  id: string
  src: string
  caption: string
  likes: number
  comments: Comment[]
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [galleryTitle, setGalleryTitle] = useState("Photo Gallery")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitleValue, setEditingTitleValue] = useState("")
  const [newComment, setNewComment] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Load photos and likes from localStorage
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

  // Save photos to localStorage
  const savePhotos = useCallback((newPhotos: Photo[]) => {
    setPhotos(newPhotos)
    localStorage.setItem("gallery-photos", JSON.stringify(newPhotos))
  }, [])

  const startEditingTitle = () => {
    setEditingTitleValue(galleryTitle)
    setIsEditingTitle(true)
    setTimeout(() => titleInputRef.current?.focus(), 0)
  }

  const saveTitle = () => {
    const newTitle = editingTitleValue.trim() || "Photo Gallery"
    setGalleryTitle(newTitle)
    localStorage.setItem("gallery-title", newTitle)
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveTitle()
    } else if (e.key === "Escape") {
      setIsEditingTitle(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsUploading(true)

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newPhoto: Photo = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          src: event.target?.result as string,
          caption: "",
          likes: 0,
          comments: [],
        }
        setPhotos((prev) => {
          const updated = [...prev, newPhoto]
          localStorage.setItem("gallery-photos", JSON.stringify(updated))
          return updated
        })
      }
      reader.readAsDataURL(file)
    })

    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleLike = (photoId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, likes: p.likes + 1 } : p
    )
    savePhotos(updated)
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto({ ...selectedPhoto, likes: selectedPhoto.likes + 1 })
    }
  }

  const handleCaptionChange = (photoId: string, caption: string) => {
    // Limit to ~10 words (roughly 60 characters)
    const truncated = caption.slice(0, 60)
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, caption: truncated } : p
    )
    savePhotos(updated)
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto({ ...selectedPhoto, caption: truncated })
    }
  }

  const handleDelete = (photoId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const updated = photos.filter((p) => p.id !== photoId)
    savePhotos(updated)
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null)
    }
  }

  const handleAddComment = (photoId: string) => {
    if (!newComment.trim()) return
    const comment: Comment = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newComment.trim().slice(0, 150),
      timestamp: Date.now(),
    }
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, comments: [...(p.comments || []), comment] } : p
    )
    savePhotos(updated)
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto({ ...selectedPhoto, comments: [...(selectedPhoto.comments || []), comment] })
    }
    setNewComment("")
  }

  const handleDeleteComment = (photoId: string, commentId: string) => {
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, comments: (p.comments || []).filter((c) => c.id !== commentId) } : p
    )
    savePhotos(updated)
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto({ ...selectedPhoto, comments: (selectedPhoto.comments || []).filter((c) => c.id !== commentId) })
    }
  }

  const truncateCaption = (caption: string, maxLength: number = 40) => {
    if (caption.length <= maxLength) return caption
    return caption.slice(0, maxLength) + "..."
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header with Upload */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                ref={titleInputRef}
                type="text"
                value={editingTitleValue}
                onChange={(e) => setEditingTitleValue(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={saveTitle}
                className="rounded-md border border-input bg-transparent px-2 py-1 text-xl font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={40}
              />
              <button
                onClick={saveTitle}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{galleryTitle}</h1>
              <button
                onClick={startEditingTitle}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Edit title"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          size="sm"
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Gallery Grid */}
      {photos.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-16 transition-colors hover:border-muted-foreground/50"
        >
          <ImagePlus className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Click to upload photos
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
                  {photo.caption ? truncateCaption(photo.caption) : "No caption"}
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
            <div className="max-h-[60vh] overflow-hidden">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.caption || "Photo preview"}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Details */}
            <div className="p-4">
              {/* Caption input */}
              <input
                type="text"
                value={selectedPhoto.caption}
                onChange={(e) =>
                  handleCaptionChange(selectedPhoto.id, e.target.value)
                }
                placeholder="Add a caption (up to 10 words)..."
                className="mb-4 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={60}
              />

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleLike(selectedPhoto.id)}
                  className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  <Heart
                    className={`h-5 w-5 ${selectedPhoto.likes > 0 ? "fill-red-500 text-red-500" : ""}`}
                  />
                  <span className="font-medium">{selectedPhoto.likes} likes</span>
                </button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => handleDelete(selectedPhoto.id, e)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>

              {/* Comments Section */}
              <div className="mt-4 border-t border-border pt-4">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>{(selectedPhoto.comments || []).length} comments</span>
                </div>

                {/* Comments List */}
                {(selectedPhoto.comments || []).length > 0 && (
                  <div className="mb-3 max-h-32 space-y-2 overflow-y-auto">
                    {(selectedPhoto.comments || []).map((comment) => (
                      <div
                        key={comment.id}
                        className="group flex items-start justify-between rounded-md bg-muted p-2"
                      >
                        <p className="text-sm text-foreground">{comment.text}</p>
                        <button
                          onClick={() => handleDeleteComment(selectedPhoto.id, comment.id)}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment(selectedPhoto.id)
                      }
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={150}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddComment(selectedPhoto.id)}
                    disabled={!newComment.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
