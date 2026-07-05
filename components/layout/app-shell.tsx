"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NavItems } from "./nav-items";
import { ADMIN_NAV, TEACHER_NAV } from "./nav-config";
import { LogoutButton } from "./logout-button";

export function AppShell({
  role,
  userName,
  children,
}: {
  role: "admin" | "teacher";
  userName: string;
  children: React.ReactNode;
}) {
  const groups = role === "admin" ? ADMIN_NAV : TEACHER_NAV;
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setDrawerOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <span className="font-heading text-lg font-semibold">NexusDojo</span>
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setDrawerOpen(true)}
          className="rounded-md p-2 hover:bg-muted"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-4 overflow-y-auto bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="font-heading text-lg font-semibold">NexusDojo</span>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded-md p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavItems groups={groups} />
            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
              <span className="px-3 text-sm text-muted-foreground">{userName}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-4 md:flex">
        <span className="font-heading text-lg font-semibold">NexusDojo</span>
        <NavItems groups={groups} />
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
          <span className="px-3 text-sm text-muted-foreground">{userName}</span>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
