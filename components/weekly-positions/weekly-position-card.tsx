"use client";

import { useEffect, useState } from "react";
import { getYoutubeEmbedUrl } from "@/lib/youtube";
import type { WeeklyPositionDetail } from "@/modules/weekly-positions/positions";

export function WeeklyPositionCard({ position }: { position: WeeklyPositionDetail }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const embedUrl = position.youtubeUrl ? getYoutubeEmbedUrl(position.youtubeUrl) : null;

  useEffect(() => {
    if (!videoOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setVideoOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [videoOpen]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={position.imageUrl}
        alt={position.title}
        className="h-40 w-full object-cover sm:h-48"
      />
      <div className="flex flex-col gap-2 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          🥋 Posição da Semana
        </p>
        <p className="font-heading font-semibold">{position.title}</p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{position.description}</p>
        <button
          type="button"
          onClick={() => setVideoOpen(true)}
          className="mt-1 self-start text-sm font-bold text-primary underline-offset-2 hover:underline"
        >
          Saiba mais
        </button>
      </div>

      {videoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg border border-border bg-card p-4 text-foreground shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-heading font-semibold">{position.title}</p>
              <button
                type="button"
                onClick={() => setVideoOpen(false)}
                aria-label="Fechar"
                className="shrink-0 text-lg text-muted-foreground"
              >
                ✕
              </button>
            </div>

            {embedUrl && (
              <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg">
                <iframe
                  src={embedUrl}
                  title={position.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
              {position.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
