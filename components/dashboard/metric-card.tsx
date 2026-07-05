import Link from "next/link";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  href,
  variant = "default",
}: {
  label: string;
  value: string | number;
  href?: string;
  variant?: "default" | "destructive";
}) {
  const content = (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        href && "transition-colors hover:bg-muted/50",
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-heading text-2xl font-semibold",
          variant === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
