import Link from "next/link";

export type SummaryListItem = {
  id: string;
  primary: string;
  secondary?: string;
  trailing?: string;
  href?: string;
};

export function SummaryList({
  title,
  items,
  emptyMessage,
  viewAllHref,
}: {
  title: string;
  items: SummaryListItem[];
  emptyMessage?: string;
  viewAllHref?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs text-primary hover:underline">
            Ver todos
          </Link>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const row = (
            <div className="flex items-center justify-between text-sm">
              <div>
                <p>{item.primary}</p>
                {item.secondary && (
                  <p className="text-xs text-muted-foreground">{item.secondary}</p>
                )}
              </div>
              {item.trailing && (
                <p className="text-xs text-muted-foreground">{item.trailing}</p>
              )}
            </div>
          );

          return item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-md px-2 py-1.5 -mx-2 hover:bg-muted/50"
            >
              {row}
            </Link>
          ) : (
            <div key={item.id} className="px-2 py-1.5">
              {row}
            </div>
          );
        })}
        {!items.length && (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            {emptyMessage ?? "Nenhum item encontrado."}
          </p>
        )}
      </div>
    </div>
  );
}
