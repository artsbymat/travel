"use client";

import { useState } from "react";
import { UploadCloud, Loader2, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type VehicleImages = {
    front?: string | null;
    back?: string | null;
    left?: string | null;
    right?: string | null;
};

const SLOTS = [
    { key: "front" as const, label: "Tampak Depan", emoji: "🚗" },
    { key: "back" as const, label: "Tampak Belakang", emoji: "🔙" },
    { key: "left" as const, label: "Sisi Kiri", emoji: "◀️" },
    { key: "right" as const, label: "Sisi Kanan", emoji: "▶️" },
];

interface VehicleImageUploadProps {
    value: VehicleImages;
    onChange: (images: VehicleImages) => void;
}

export function VehicleImageUpload({ value, onChange }: VehicleImageUploadProps) {
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (slotKey: keyof VehicleImages, file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            setError("Ukuran foto maksimal 5MB.");
            return;
        }

        setUploading(slotKey);
        setError(null);

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            setError("Cloudinary configuration missing.");
            setUploading(null);
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

            if (!response.ok) throw new Error("Failed to upload");

            const data = await response.json();
            onChange({ ...value, [slotKey]: data.secure_url });
        } catch {
            setError("Gagal mengunggah foto. Silakan coba lagi.");
        } finally {
            setUploading(null);
        }
    };

    const handleRemove = (slotKey: keyof VehicleImages) => {
        onChange({ ...value, [slotKey]: null });
    };

    const filledCount = SLOTS.filter((s) => value[s.key]).length;

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
                {SLOTS.map((slot) => {
                    const imageUrl = value[slot.key];
                    const isUploading = uploading === slot.key;

                    return (
                        <div key={slot.key} className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                <span>{slot.emoji}</span> {slot.label}
                            </span>

                            {imageUrl ? (
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                                    <img src={imageUrl} alt={slot.label} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="rounded-full shadow-lg w-8 h-8"
                                            onClick={() => handleRemove(slot.key)}
                                        >
                                            <X size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <label className="relative aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center cursor-pointer group bg-white">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUpload(slot.key, file);
                                            e.target.value = "";
                                        }}
                                        disabled={isUploading}
                                    />
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-1 text-primary">
                                            <Loader2 className="animate-spin w-5 h-5" />
                                            <span className="text-[10px] font-medium">Upload...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-primary transition-colors">
                                            <UploadCloud className="w-5 h-5" />
                                            <span className="text-[10px] font-medium">Pilih Foto</span>
                                        </div>
                                    )}
                                </label>
                            )}
                        </div>
                    );
                })}
            </div>

            {error && <span className="text-xs font-medium text-red-500">{error}</span>}

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <ImageIcon size={12} />
                <span>{filledCount}/{SLOTS.length} foto terunggah • JPG, PNG (Maks 5MB)</span>
            </div>
        </div>
    );
}
