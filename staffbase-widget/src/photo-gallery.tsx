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
import { Heart, X, Upload, ImagePlus, Trash2, Pencil, Check } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  caption: string;
  likes: number;
  liked: boolean;
}

export interface PhotoGalleryProps extends BlockAttributes {
  title?: string;
}

export const PhotoGallery = ({ title = "Photo Gallery" }: PhotoGalleryProps): ReactElement => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState(title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedPhotos = localStorage.getItem("staffbase-gallery-photos");
    if (savedPhotos) {
      setPhotos(JSON.parse(savedPhotos));
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
      newPhotos.push({ id: `${Date.now()}-${i}`, url, caption: "", likes: 0, liked: false });
    }
    savePhotos([...photos, ...newPhotos]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleLike = (photoId: string) => {
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    );
    savePhotos(updated);
    if (selectedPhoto?.id === photoId) setSelectedPhoto(updated.find((p) => p.id === photoId) || null);
  };

  const updateCaption = (photoId: string, caption: string) => {
    const trimmed = caption.split(/\s+/).slice(0, 10).join(" ");
    const updated = photos.map((p) => (p.id === photoId ? { ...p, caption: trimmed } : p));
    savePhotos(updated);
    if (selectedPhoto?.id === photoId) setSelectedPhoto(updated.find((p) => p.id === photoId) || null);
  };

  const deletePhoto = (photoId: string) => {
    const updated = photos.filter((p) => p.id !== photoId);
    savePhotos(updated);
    if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
  };

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", padding: "16px", background: "#f9fafb", minHeight: "100%" }}>
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isEditingTitle ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input ref={titleInputRef} type="text" value={editingTitleValue} onChange={(e) => setEditingTitleValue(e.target.value)} onKeyDown={handleTitleKeyDown} onBlur={saveTitle} maxLength={40} style={{ fontSize: "18px", fontWeight: 600, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
              <button onClick={saveTitle} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><Check size={16} /></button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "#111827" }}>{galleryTitle}</h1>
              <button onClick={startEditingTitle} title="Edit title" style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><Pencil size={16} /></button>
            </div>
          )}
        </div>
        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: isUploading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 500, opacity: isUploading ? 0.7 : 1 }}>
          <Upload size={16} />{isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {photos.length === 0 ? (
        <div onClick={() => fileInputRef.current?.click()} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", border: "2px dashed #d1d5db", borderRadius: "12px", background: "white", cursor: "pointer" }}>
          <ImagePlus size={48} style={{ color: "#9ca3af", marginBottom: "12px" }} />
          <p style={{ color: "#6b7280", margin: "0 0 4px", fontSize: "14px", fontWeight: 500 }}>Click to upload photos</p>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: "12px" }}>or drag and drop</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          {photos.map((photo) => (
            <div key={photo.id} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <img src={photo.url} alt={photo.caption || "Photo"} onClick={() => setSelectedPhoto(photo)} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", cursor: "pointer", display: "block" }} />
              <div style={{ padding: "8px" }}>
                <input type="text" placeholder="Add caption..." value={photo.caption} onChange={(e) => updateCaption(photo.id, e.target.value)} maxLength={60} style={{ width: "100%", fontSize: "11px", border: "none", background: "transparent", color: "#374151", outline: "none", padding: 0, marginBottom: "6px" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button onClick={() => toggleLike(photo.id)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: 0, color: photo.liked ? "#ef4444" : "#9ca3af" }}>
                    <Heart size={14} fill={photo.liked ? "#ef4444" : "none"} /><span style={{ fontSize: "12px" }}>{photo.likes}</span>
                  </button>
                  <button onClick={() => deletePhoto(photo.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#9ca3af" }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedPhoto && (
        <div onClick={() => setSelectedPhoto(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "12px", overflow: "hidden", maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px" }}>
              <button onClick={() => setSelectedPhoto(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#6b7280" }}><X size={20} /></button>
            </div>
            <img src={selectedPhoto.url} alt={selectedPhoto.caption || "Photo"} style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />
            <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
              <input type="text" placeholder="Add caption..." value={selectedPhoto.caption} onChange={(e) => updateCaption(selectedPhoto.id, e.target.value)} maxLength={60} style={{ width: "100%", fontSize: "14px", border: "none", outline: "none", marginBottom: "8px", color: "#374151" }} />
              <button onClick={() => toggleLike(selectedPhoto.id)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", padding: 0, color: selectedPhoto.liked ? "#ef4444" : "#6b7280" }}>
                <Heart size={18} fill={selectedPhoto.liked ? "#ef4444" : "none"} /><span style={{ fontSize: "14px" }}>{selectedPhoto.likes} likes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
