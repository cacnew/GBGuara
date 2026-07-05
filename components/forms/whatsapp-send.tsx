"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function WhatsAppSend({
  phone,
  onSend,
}: {
  phone: string | null;
  onSend: (message: string) => Promise<{ error?: string }>;
}) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!phone) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem telefone cadastrado para envio de WhatsApp.
      </p>
    );
  }

  async function handleSend() {
    setIsSending(true);
    const result = await onSend(message);
    setIsSending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Mensagem enviada.");
    setMessage("");
  }

  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-card p-3">
      <Label htmlFor="whatsapp-message">Enviar WhatsApp ({phone})</Label>
      <textarea
        id="whatsapp-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
        placeholder="Digite a mensagem..."
      />
      <Button
        type="button"
        size="sm"
        disabled={isSending || !message.trim()}
        onClick={handleSend}
      >
        {isSending ? "Enviando..." : "Enviar"}
      </Button>
    </div>
  );
}
