"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Upload do anexo opcional do "Fale Conosco" (Fase 17.2), mesmo padrão de
 * `AvatarUpload` (Fase 8.1/10.4) — upload direto client-side, path
 * `{schoolId}/feedback/{studentId}-{timestamp}.{ext}`, URL pública
 * repassada ao formulário via callback. Diferente do avatar, aceita
 * qualquer tipo de arquivo (bucket `feedback-attachments`, sem
 * `allowed_mime_types`) e não mostra preview de imagem, só o nome do
 * arquivo.
 */
export function AttachmentUpload({
  schoolId,
  studentId,
  onUploaded,
}: {
  schoolId: string;
  studentId: string;
  onUploaded: (url: string) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${schoolId}/feedback/${studentId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("feedback-attachments")
      .upload(path, file);

    setIsUploading(false);

    if (uploadError) {
      setError("Não foi possível enviar o anexo.");
      return;
    }

    const { data } = supabase.storage.from("feedback-attachments").getPublicUrl(path);
    setFileName(file.name);
    onUploaded(data.publicUrl);
  }

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? "Enviando..." : fileName ? "Trocar anexo" : "Anexar arquivo (opcional)"}
      </Button>
      <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      {fileName && <p className="text-xs text-muted-foreground">Anexado: {fileName}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
