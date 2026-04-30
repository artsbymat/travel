"use client";

import { useState } from "react";
import { UploadCloud, Loader2, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string) => void;
  onRemove: () => void;
  label?: string;
  aspectRatio?: "video" | "square";
}

export function ImageUpload({ value, onChange, onRemove, label = "Upload Foto", aspectRatio = "video" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError("Cloudinary configuration missing");
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      onChange(data.secure_url);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Gagal mengunggah foto. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {value ? (
        <div className={`relative w-full ${aspectRatio === "video" ? "aspect-video" : "aspect-square"} rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group`}>
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              className="rounded-full shadow-lg"
              onClick={onRemove}
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      ) : (
        <label className={`relative w-full ${aspectRatio === "video" ? "aspect-video" : "aspect-square"} p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center cursor-pointer group bg-white`}>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleUpload}
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-primary">
              <Loader2 className="animate-spin w-8 h-8" />
              <span className="text-sm font-medium text-center">Mengunggah...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-primary transition-colors text-center">
              <div className="p-3 bg-slate-100 rounded-full group-hover:bg-primary/10">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-sm font-medium leading-tight">Pilih Foto</span>
                <span className="text-xs text-slate-400">JPG, PNG (Maks 5MB)</span>
              </div>
            </div>
          )}
        </label>
      )}
      {error && <span className="text-xs font-medium text-red-500 mt-1">{error}</span>}
    </div>
  );
}
