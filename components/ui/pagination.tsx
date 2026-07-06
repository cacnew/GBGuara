import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * Paginação server-rendered (só links com query string) — não precisa de
 * client component porque a única interação é navegar para `?page=N`,
 * preservando os demais filtros já presentes na URL.
 */
export function Pagination({
  page,
  pageSize,
  totalCount,
  basePath,
  searchParams = {},
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
      <span>
        {rangeStart}–{rangeEnd} de {totalCount}
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(page - 1)}
          aria-disabled={!hasPrev}
          tabIndex={hasPrev ? undefined : -1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            !hasPrev && "pointer-events-none opacity-50",
          )}
        >
          Anterior
        </Link>
        <span className="whitespace-nowrap">
          Página {page} de {totalPages}
        </span>
        <Link
          href={hrefFor(page + 1)}
          aria-disabled={!hasNext}
          tabIndex={hasNext ? undefined : -1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            !hasNext && "pointer-events-none opacity-50",
          )}
        >
          Próxima
        </Link>
      </div>
    </div>
  );
}
