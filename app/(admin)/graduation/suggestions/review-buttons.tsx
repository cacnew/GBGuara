"use client";

import { useState } from "react";
import { toast } from "sonner";
import { reviewGraduationSuggestion } from "./actions";

export function ReviewButtons({ suggestionId }: { suggestionId: string }) {
  const [saving, setSaving] = useState<"approved" | "rejected" | null>(null);

  async function handleReview(status: "approved" | "rejected") {
    setSaving(status);
    const result = await reviewGraduationSuggestion(suggestionId, status);
    setSaving(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(status === "approved" ? "Sugestao aprovada." : "Sugestao rejeitada.");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => handleReview("approved")}
        disabled={Boolean(saving)}
        className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
      >
        {saving === "approved" ? "Aprovando..." : "Aprovar"}
      </button>
      <button
        type="button"
        onClick={() => handleReview("rejected")}
        disabled={Boolean(saving)}
        className="rounded-full border border-border px-3 py-1.5 text-xs font-bold disabled:opacity-60"
      >
        {saving === "rejected" ? "Rejeitando..." : "Rejeitar"}
      </button>
    </div>
  );
}
