"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup } from "./nav-config";

function isGroupActive(pathname: string, group: NavGroup): boolean {
  if (group.href && pathname === group.href) return true;
  return (group.children ?? []).some((child) => pathname.startsWith(child.href));
}

function NavGroupItem({ group, pathname }: { group: NavGroup; pathname: string }) {
  const active = isGroupActive(pathname, group);
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  const Icon = group.icon;
  const hasChildren = (group.children?.length ?? 0) > 0;
  const linkClasses = cn(
    "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm",
    active
      ? "bg-secondary text-secondary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

  return (
    <div>
      <div className="flex items-center">
        {group.href ? (
          <Link href={group.href} className={linkClasses}>
            <Icon className="size-4" />
            {group.label}
          </Link>
        ) : (
          <button type="button" onClick={() => setOpen((o) => !o)} className={cn(linkClasses, "text-left")}>
            <Icon className="size-4" />
            {group.label}
          </button>
        )}
        {hasChildren && group.collapsible && (
          <button
            type="button"
            aria-label={open ? `Recolher ${group.label}` : `Expandir ${group.label}`}
            onClick={() => setOpen((o) => !o)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>
      {hasChildren && (!group.collapsible || open) && (
        <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-border pl-3">
          {group.children!.map((child) => {
            const childActive = pathname.startsWith(child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  childActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function NavItems({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {groups.map((group) => (
        <NavGroupItem key={group.label} group={group} pathname={pathname} />
      ))}
    </nav>
  );
}
