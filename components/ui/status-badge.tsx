import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  ativo: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20",
  active: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20",
  pago: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20",
  paid: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20",
  agendada: "bg-sky-500/10 text-sky-700 ring-sky-600/20",
  realizada: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20",
  pendente: "bg-amber-500/10 text-amber-700 ring-amber-600/20",
  pending: "bg-amber-500/10 text-amber-700 ring-amber-600/20",
  partially_paid: "bg-amber-500/10 text-amber-700 ring-amber-600/20",
  inadimplente: "bg-red-500/10 text-red-700 ring-red-600/20",
  overdue: "bg-red-500/10 text-red-700 ring-red-600/20",
  cancelado: "bg-red-500/10 text-red-700 ring-red-600/20",
  canceled: "bg-red-500/10 text-red-700 ring-red-600/20",
  inactive: "bg-muted text-muted-foreground ring-border",
  inativo: "bg-muted text-muted-foreground ring-border",
  pausado: "bg-slate-500/10 text-slate-700 ring-slate-600/20",
  paused: "bg-slate-500/10 text-slate-700 ring-slate-600/20",
  trancado: "bg-slate-500/10 text-slate-700 ring-slate-600/20",
};

export function StatusBadge({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset",
        STATUS_STYLES[value] ?? "bg-secondary text-secondary-foreground ring-border",
        className,
      )}
    >
      {label}
    </span>
  );
}
