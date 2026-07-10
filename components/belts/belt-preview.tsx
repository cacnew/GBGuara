import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type BeltVisual = {
  background: string;
  stripe?: string;
  rankBar: string;
  border?: string;
};

const BELT_VISUALS: Record<string, BeltVisual> = {
  branca: {
    background: "#f8fafc",
    rankBar: "#111827",
    border: "#cbd5e1",
  },
  azul: {
    background: "#2563eb",
    rankBar: "#111827",
  },
  roxa: {
    background: "#7c3aed",
    rankBar: "#111827",
  },
  marrom: {
    background: "#78350f",
    rankBar: "#111827",
  },
  preta: {
    background: "#111827",
    rankBar: "#dc2626",
  },
  "vermelha e preta": {
    background:
      "repeating-linear-gradient(90deg, #991b1b 0 18px, #111827 18px 36px)",
    rankBar: "#f8fafc",
  },
  "vermelha e branca": {
    background:
      "repeating-linear-gradient(90deg, #dc2626 0 18px, #f8fafc 18px 36px)",
    rankBar: "#e5e7eb",
    border: "#cbd5e1",
  },
  vermelha: {
    background: "#dc2626",
    rankBar: "#f8fafc",
  },
  "cinza e branca": {
    background: "#9ca3af",
    stripe: "#f8fafc",
    rankBar: "#111827",
  },
  cinza: {
    background: "#9ca3af",
    rankBar: "#111827",
  },
  "cinza e preta": {
    background: "#9ca3af",
    stripe: "#111827",
    rankBar: "#111827",
  },
  "amarela e branca": {
    background: "#facc15",
    stripe: "#f8fafc",
    rankBar: "#111827",
  },
  amarela: {
    background: "#facc15",
    rankBar: "#111827",
  },
  "amarela e preta": {
    background: "#facc15",
    stripe: "#111827",
    rankBar: "#111827",
  },
  "laranja e branca": {
    background: "#f97316",
    stripe: "#f8fafc",
    rankBar: "#111827",
  },
  laranja: {
    background: "#f97316",
    rankBar: "#111827",
  },
  "laranja e preta": {
    background: "#f97316",
    stripe: "#111827",
    rankBar: "#111827",
  },
  "verde e branca": {
    background: "#16a34a",
    stripe: "#f8fafc",
    rankBar: "#111827",
  },
  verde: {
    background: "#16a34a",
    rankBar: "#111827",
  },
  "verde e preta": {
    background: "#16a34a",
    stripe: "#111827",
    rankBar: "#111827",
  },
};

function normalizeBeltName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getBeltVisual(name: string): BeltVisual {
  return (
    BELT_VISUALS[normalizeBeltName(name)] ?? {
      background: "#64748b",
      rankBar: "#111827",
    }
  );
}

export function BeltPreview({
  name,
  degree,
  className,
}: {
  name: string;
  degree?: number | null;
  className?: string;
}) {
  const visual = getBeltVisual(name);
  const normalizedDegree = Math.max(0, Math.min(10, degree ?? 0));
  const beltStyle: CSSProperties = {
    background: visual.background,
    borderColor: visual.border ?? "rgba(15, 23, 42, 0.22)",
  };

  return (
    <span
      aria-label={`Faixa ${name}`}
      className={cn(
        "relative inline-flex h-5 w-20 shrink-0 overflow-hidden rounded-[3px] border shadow-sm",
        className,
      )}
      style={beltStyle}
      title={name}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/20" />
      {visual.stripe && (
        <span
          className="pointer-events-none absolute inset-x-2 top-1/2 h-[5px] -translate-y-1/2 rounded-full"
          style={{ backgroundColor: visual.stripe }}
        />
      )}
      <span
        className="pointer-events-none absolute right-2 top-0 flex h-full w-7 items-center justify-center gap-[2px] border-x border-white/45 px-[2px]"
        style={{ backgroundColor: visual.rankBar }}
      >
        {Array.from({ length: normalizedDegree }).map((_, index) => (
          <span
            key={index}
            className="h-3 w-[2px] rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.18)]"
          />
        ))}
      </span>
    </span>
  );
}

export function BeltWithPreview({
  name,
  degree,
  className,
}: {
  name: string;
  degree?: number | null;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BeltPreview name={name} degree={degree} />
      <span>
        {name}
        {degree !== undefined && degree !== null ? ` - grau ${degree}` : ""}
      </span>
    </span>
  );
}
