"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItems } from "./nav-items";
import { ADMIN_NAV, TEACHER_NAV } from "./nav-config";
import { LogoutButton } from "./logout-button";

const SIDEBAR_COLLAPSED_KEY = "nexusdojo-sidebar-collapsed";

function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeSidebarCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
  } catch {
    // localStorage indisponível (modo privado, etc.) — segue sem persistir.
  }
}

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setDrawerOpen(false);
  }

  // Lê o estado persistido só depois do mount (não durante o render), para
  // o primeiro render no cliente bater com o HTML do servidor (que nunca
  // sabe o valor do localStorage) e evitar erro de hydration mismatch.
  useEffect(() => {
    if (readSidebarCollapsed()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratação de localStorage após o mount, não sincronização de prop
      setSidebarCollapsed(true);
    }
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      writeSidebarCollapsed(next);
      return next;
    });
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:hidden">
        <span className="font-heading text-lg font-bold text-primary">NexusDojo</span>
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setDrawerOpen(true)}
          className="rounded-full p-2 hover:bg-card"
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
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-4 overflow-y-auto bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="font-heading text-lg font-bold text-primary">NexusDojo</span>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-2 hover:bg-card"
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

      <aside
        className={cn(
          "hidden min-h-0 shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-border bg-background transition-all duration-200 md:flex",
          sidebarCollapsed ? "md:w-0 md:border-r-0 md:p-0" : "w-64 gap-4 p-4",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="font-heading text-lg font-bold text-primary whitespace-nowrap">NexusDojo</span>
          <button
            type="button"
            aria-label="Recolher menu"
            onClick={toggleSidebar}
            className="rounded-full p-2 text-muted-foreground hover:bg-card"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>
        <NavItems groups={groups} />
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
          <span className="px-3 text-sm text-muted-foreground">{userName}</span>
          <LogoutButton />
        </div>
      </aside>

      {sidebarCollapsed && (
        <button
          type="button"
          aria-label="Expandir menu"
          onClick={toggleSidebar}
          className="fixed left-3 top-3 z-40 hidden rounded-full border border-border bg-background p-2 text-muted-foreground hover:bg-card md:flex"
        >
          <PanelLeftOpen className="size-4" />
        </button>
      )}

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
