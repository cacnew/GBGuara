"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function AvatarUpload({
  schoolId,
  entityType,
  entityId,
  currentUrl,
  hint,
  label = "Foto",
  shape = "circle",
  onUploaded,
}: {
  schoolId: string;
  entityType: "students" | "teachers" | "weekly_positions";
  entityId: string;
  currentUrl: string | null;
  hint?: string;
  label?: string;
  shape?: "circle" | "square";
  onUploaded: (url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    setPreview(URL.createObjectURL(file));

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${schoolId}/${entityType}/${entityId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    setIsUploading(false);

    if (uploadError) {
      setError("Não foi possível enviar a foto.");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setPreview(data.publicUrl);
    onUploaded(data.publicUrl);
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className={
            shape === "circle"
              ? "h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted"
              : "h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
          }
        >
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Enviando..." : `Trocar ${label.toLowerCase()}`}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
