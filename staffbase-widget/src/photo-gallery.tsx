/*!
 * Copyright 2026, Staffbase SE and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect, useRef, useCallback, ReactElement } from "react";
import { BlockAttributes } from "widget-sdk";
import { Heart, X, Upload, ImagePlus, Trash2, MessageCircle, Send } from "lucide-react";

// API base URL - your Vercel deployment
const API_BASE = "https://v0-staffbase-image-gallery.vercel.app/api";

interface Comment {
  id: number;
  userName: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface Photo {
  id: number;
  url: string;
  caption: string;
  created_at: string;
  like_count: number;
  comments: Comment[];
}

export interface PhotoGalleryProps extends BlockAttributes {
  title?: string;
  userEmail?: string | null;
  userName?: string | null;
  isEditor?: boolean;
}

export const PhotoGallery = ({ 
  userEmail = null,
  userName = "Anonymous",
  isEditor = false 
}: PhotoGalleryProps): ReactElement => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [likedPhotos, setLikedPhotos] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch photos from API
  const fetchPhotos = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/photos`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error("Failed to fetch photos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditor) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("caption", "");
        
        const response = await fetch(`${API_BASE}/photos`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error("Upload failed");
        }
      } catch (error) {
        console.error("Failed to upload photo:", error);
      }
    }
    
    // Refresh photos after upload
    await fetchPhotos();
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleLike = async (photoId: number) => {
    if (!userEmail) return;
    
    const hasLiked = likedPhotos.has(photoId);
    
    try {
      const response = await fetch(`${API_BASE}/photos/likes`, {
        method: hasLiked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, userId: userEmail }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setLikedPhotos(prev => {
          const newSet = new Set(prev);
          if (hasLiked) {
            newSet.delete(photoId);
          } else {
            newSet.add(photoId);
          }
          return newSet;
        });
        
        // Update photo like count
        setPhotos(prev => prev.map(p => 
          p.id === photoId ? { ...p, like_count: data.likeCount } : p
        ));
        
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(prev => prev ? { ...prev, like_count: data.likeCount } : null);
        }
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const updateCaption = async (photoId: number, caption: string) => {
    if (!isEditor) return;
    const trimmed = caption.split(/\s+/).slice(0, 10).join(" ");
    
    try {
      const response = await fetch(`${API_BASE}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photoId, caption: trimmed }),
      });
      
      if (response.ok) {
        setPhotos(prev => prev.map(p => 
          p.id === photoId ? { ...p, caption: trimmed } : p
        ));
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(prev => prev ? { ...prev, caption: trimmed } : null);
        }
      }
    } catch (error) {
      console.error("Failed to update caption:", error);
    }
  };

  const deletePhoto = async (photoId: number, url: string) => {
    if (!isEditor) return;
    
    try {
      const response = await fetch(`${API_BASE}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photoId, url }),
      });
      
      if (response.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
      }
    } catch (error) {
      console.error("Failed to delete photo:", error);
    }
  };

  const addComment = async (photoId: number) => {
    if (!userEmail || !newComment.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE}/photos/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId,
          userId: userEmail,
          userName: userName || "Anonymous",
          content: newComment.trim(),
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newCommentObj = data.comment;
        
        setPhotos(prev => prev.map(p => {
          if (p.id !== photoId) return p;
          return { ...p, comments: [...p.comments, newCommentObj] };
        }));
        
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(prev => prev ? { 
            ...prev, 
            comments: [...prev.comments, newCommentObj] 
          } : null);
        }
        
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const hasLiked = (photo: Photo) => likedPhotos.has(photo.id);

  if (isLoading) {
    return (
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", padding: "16px", background: "#f9fafb", minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6b7280" }}>Loading photos...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", padding: "16px", background: "#f9fafb", minHeight: "100%" }}>
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "#111827" }}>Varsity Social Wall</h1>
        </div>
        {isEditor && (
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: isUploading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 500, opacity: isUploading ? 0.7 : 1 }}>
            <Upload size={16} />{isUploading ? "Uploading..." : "Upload"}
          </button>
        )}
      </div>

      {/* Empty State */}
      {photos.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", border: "2px dashed #d1d5db", borderRadius: "12px", background: "white" }}>
          <ImagePlus size={48} style={{ color: "#9ca3af", marginBottom: "12px" }} />
          <p style={{ color: "#6b7280", margin: "0 0 4px", fontSize: "14px", fontWeight: 500 }}>
            {isEditor ? "Click upload to add photos" : "No photos yet"}
          </p>
          {isEditor && (
            <button onClick={() => fileInputRef.current?.click()} style={{ marginTop: "12px", padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
              Upload Photos
            </button>
          )}
        </div>
      ) : (
        /* Photo Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          {photos.map((photo) => (
            <div key={photo.id} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <img src={photo.url} alt={photo.caption || "Photo"} onClick={() => setSelectedPhoto(photo)} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", cursor: "pointer", display: "block" }} />
              <div style={{ padding: "8px" }}>
                {isEditor ? (
                  <input type="text" placeholder="Add caption..." value={photo.caption || ""} onChange={(e) => updateCaption(photo.id, e.target.value)} maxLength={60} style={{ width: "100%", fontSize: "11px", border: "none", background: "transparent", color: "#374151", outline: "none", padding: 0, marginBottom: "6px" }} />
                ) : (
                  <p style={{ fontSize: "11px", color: "#374151", margin: "0 0 6px", minHeight: "14px" }}>{photo.caption}</p>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={() => toggleLike(photo.id)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: 0, color: hasLiked(photo) ? "#ef4444" : "#9ca3af" }}>
                      <Heart size={14} fill={hasLiked(photo) ? "#ef4444" : "none"} /><span style={{ fontSize: "12px" }}>{photo.like_count}</span>
                    </button>
                    <button onClick={() => setSelectedPhoto(photo)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9ca3af" }}>
                      <MessageCircle size={14} /><span style={{ fontSize: "12px" }}>{photo.comments?.length || 0}</span>
                    </button>
                  </div>
                  {isEditor && (
                    <button onClick={() => deletePhoto(photo.id, photo.url)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#9ca3af" }}><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedPhoto && (
        <div onClick={() => setSelectedPhoto(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "12px", overflow: "hidden", maxWidth: "90vw", maxHeight: "90vh", width: "500px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px" }}>
              <button onClick={() => setSelectedPhoto(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#6b7280" }}><X size={20} /></button>
            </div>
            <img src={selectedPhoto.url} alt={selectedPhoto.caption || "Photo"} style={{ width: "100%", maxHeight: "50vh", objectFit: "contain" }} />
            <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
              {isEditor ? (
                <input type="text" placeholder="Add caption..." value={selectedPhoto.caption || ""} onChange={(e) => updateCaption(selectedPhoto.id, e.target.value)} maxLength={60} style={{ width: "100%", fontSize: "14px", border: "none", outline: "none", marginBottom: "8px", color: "#374151" }} />
              ) : (
                <p style={{ fontSize: "14px", color: "#374151", margin: "0 0 8px" }}>{selectedPhoto.caption || "No caption"}</p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                <button onClick={() => toggleLike(selectedPhoto.id)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", padding: 0, color: hasLiked(selectedPhoto) ? "#ef4444" : "#6b7280" }}>
                  <Heart size={18} fill={hasLiked(selectedPhoto) ? "#ef4444" : "none"} /><span style={{ fontSize: "14px" }}>{selectedPhoto.like_count} likes</span>
                </button>
                <span style={{ fontSize: "14px", color: "#6b7280" }}>{selectedPhoto.comments?.length || 0} comments</span>
              </div>
              
              {/* Comments Section */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px", maxHeight: "150px", overflowY: "auto" }}>
                {(!selectedPhoto.comments || selectedPhoto.comments.length === 0) ? (
                  <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", margin: "8px 0" }}>No comments yet</p>
                ) : (
                  selectedPhoto.comments.map((comment) => (
                    <div key={comment.id} style={{ marginBottom: "8px", padding: "8px", background: "#f3f4f6", borderRadius: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{comment.userName}</span>
                        <span style={{ fontSize: "10px", color: "#9ca3af" }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#4b5563", margin: 0 }}>{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
              
              {/* Add Comment */}
              {userEmail && (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addComment(selectedPhoto.id)}
                    style={{ flex: 1, fontSize: "13px", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} 
                  />
                  <button onClick={() => addComment(selectedPhoto.id)} disabled={!newComment.trim()} style={{ padding: "8px 12px", background: newComment.trim() ? "#2563eb" : "#d1d5db", color: "white", border: "none", borderRadius: "6px", cursor: newComment.trim() ? "pointer" : "not-allowed" }}>
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
