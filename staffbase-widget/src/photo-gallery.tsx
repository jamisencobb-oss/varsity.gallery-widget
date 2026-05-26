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
import { Heart, X, Upload, ImagePlus, Trash2, Pencil, Check, MessageCircle, Send } from "lucide-react";

interface Comment {
  id: string;
  userName: string;
  userEmail: string;
  text: string;
  timestamp: number;
}

interface Photo {
  id: string;
  url: string;
  caption: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
}

export interface PhotoGalleryProps extends BlockAttributes {
  title?: string;
  userEmail?: string | null;
  userName?: string | null;
  isEditor?: boolean;
}

export const PhotoGallery = ({ 
  title = "Photo Gallery", 
  userEmail = null,
  userName = "Anonymous",
  isEditor = false 
}: PhotoGalleryProps): ReactElement => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState(title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [newComment, setNewComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedPhotos = localStorage.getItem("staffbase-gallery-photos");
    if (savedPhotos) {
      const parsed = JSON.parse(savedPhotos);
      // Migrate old format to new format with likedBy and comments
      const migrated = parsed.map((p: any) => ({
        ...p,
        likedBy: p.likedBy || (p.liked ? ['legacy'] : []),
        comments: p.comments || [],
      }));
      setPhotos(migrated);
    }
    const savedTitle = localStorage.getItem("staffbase-gallery-title");
    if (savedTitle) {
      setGalleryTitle(savedTitle);
    }
  }, []);

  const savePhotos = useCallback((newPhotos: Photo[]) => {
    setPhotos(newPhotos);
    localStorage.setItem("staffbase-gallery-photos", JSON.stringify(newPhotos));
  }, []);

  const startEditingTitle = () => {
    if (!isEditor) return;
    setEditingTitleValue(galleryTitle);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveTitle = () => {
    const newTitle = editingTitleValue.trim() || "Photo Gallery";
    setGalleryTitle(newTitle);
    localStorage.setItem("staffbase-gallery-title", newTitle);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveTitle();
    else if (e.key === "Escape") setIsEditingTitle(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditor) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const newPhotos: Photo[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newPhotos.push({ 
        id: `${Date.now()}-${i}`, 
        url, 
        caption: "", 
        likes: 0, 
        likedBy: [],
        comments: [] 
      });
    }
    savePhotos([...photos, ...newPhotos]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleLike = (photoId: string) => {
    if (!userEmail) return;
    const updated = photos.map((p) => {
      if (p.id !== photoId) return p;
      const hasLiked = p.likedBy.includes(userEmail);
      return {
        ...p,
        likedBy: hasLiked 
          ? p.likedBy.filter(e => e !== userEmail)
          : [...p.likedBy, userEmail],
        likes: hasLiked ? p.likes - 1 : p.likes + 1
      };
    });
    savePhotos(updated);
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(updated.find((p) => p.id === photoId) || null);
    }
  };

  const updateCaption = (photoId: string, caption: string) => {
    if (!isEditor) return;
    const trimmed = caption.split(/\s+/).slice(0, 10).join(" ");
    const updated = photos.map((p) => (p.id === photoId ? { ...p, caption: trimmed } : p));
    savePhotos(updated);
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(updated.find((p) => p.id === photoId) || null);
    }
  };

  const deletePhoto = (photoId: string) => {
    if (!isEditor) return;
    const updated = photos.filter((p) => p.id !== photoId);
    savePhotos(updated);
    if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
  };

  const addComment = (photoId: string) => {
    if (!userEmail || !newComment.trim()) return;
    const comment: Comment = {
      id: `${Date.now()}`,
      userName: userName || 'Anonymous',
      userEmail: userEmail,
      text: newComment.trim(),
      timestamp: Date.now(),
    };
    const updated = photos.map((p) => {
      if (p.id !== photoId) return p;
      return { ...p, comments: [...p.comments, comment] };
    });
    savePhotos(updated);
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(updated.find((p) => p.id === photoId) || null);
    }
    setNewComment("");
  };

  const hasLiked = (photo: Photo) => userEmail ? photo.likedBy.includes(userEmail) : false;

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", padding: "16px", background: "#f9fafb", minHeight: "100%" }}>
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isEditingTitle && isEditor ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input ref={titleInputRef} type="text" value={editingTitleValue} onChange={(e) => setEditingTitleValue(e.target.value)} onKeyDown={handleTitleKeyDown} onBlur={saveTitle} maxLength={40} style={{ fontSize: "18px", fontWeight: 600, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
              <button onClick={saveTitle} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><Check size={16} /></button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "#111827" }}>{galleryTitle}</h1>
              {isEditor && (
                <button onClick={startEditingTitle} title="Edit title" style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><Pencil size={16} /></button>
              )}
            </div>
          )}
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
                  <input type="text" placeholder="Add caption..." value={photo.caption} onChange={(e) => updateCaption(photo.id, e.target.value)} maxLength={60} style={{ width: "100%", fontSize: "11px", border: "none", background: "transparent", color: "#374151", outline: "none", padding: 0, marginBottom: "6px" }} />
                ) : (
                  <p style={{ fontSize: "11px", color: "#374151", margin: "0 0 6px", minHeight: "14px" }}>{photo.caption}</p>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={() => toggleLike(photo.id)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: 0, color: hasLiked(photo) ? "#ef4444" : "#9ca3af" }}>
                      <Heart size={14} fill={hasLiked(photo) ? "#ef4444" : "none"} /><span style={{ fontSize: "12px" }}>{photo.likes}</span>
                    </button>
                    <button onClick={() => setSelectedPhoto(photo)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9ca3af" }}>
                      <MessageCircle size={14} /><span style={{ fontSize: "12px" }}>{photo.comments.length}</span>
                    </button>
                  </div>
                  {isEditor && (
                    <button onClick={() => deletePhoto(photo.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#9ca3af" }}><Trash2 size={14} /></button>
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
                <input type="text" placeholder="Add caption..." value={selectedPhoto.caption} onChange={(e) => updateCaption(selectedPhoto.id, e.target.value)} maxLength={60} style={{ width: "100%", fontSize: "14px", border: "none", outline: "none", marginBottom: "8px", color: "#374151" }} />
              ) : (
                <p style={{ fontSize: "14px", color: "#374151", margin: "0 0 8px" }}>{selectedPhoto.caption || "No caption"}</p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                <button onClick={() => toggleLike(selectedPhoto.id)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", padding: 0, color: hasLiked(selectedPhoto) ? "#ef4444" : "#6b7280" }}>
                  <Heart size={18} fill={hasLiked(selectedPhoto) ? "#ef4444" : "none"} /><span style={{ fontSize: "14px" }}>{selectedPhoto.likes} likes</span>
                </button>
                <span style={{ fontSize: "14px", color: "#6b7280" }}>{selectedPhoto.comments.length} comments</span>
              </div>
              
              {/* Comments Section */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px", maxHeight: "150px", overflowY: "auto" }}>
                {selectedPhoto.comments.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", margin: "8px 0" }}>No comments yet</p>
                ) : (
                  selectedPhoto.comments.map((comment) => (
                    <div key={comment.id} style={{ marginBottom: "8px", padding: "8px", background: "#f3f4f6", borderRadius: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{comment.userName}</span>
                        <span style={{ fontSize: "10px", color: "#9ca3af" }}>{new Date(comment.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#4b5563", margin: 0 }}>{comment.text}</p>
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
