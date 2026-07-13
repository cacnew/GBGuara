"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDateOnly } from "@/lib/dates/format";
import {
  markAllNotificationsRead,
  type StudentNotification,
} from "@/modules/students/notifications";

const TITLE_BY_TYPE: Record<string, string> = {
  presence_confirmed: "Instrutor confirmou sua presença",
  added_to_class: "Instrutor adicionou você à aula",
};

function formatTimestamp(iso: string): string {
  const [datePart, timePart] = iso.split("T");
  return `${formatDateOnly(datePart)} ${timePart.slice(0, 5)}`;
}

export function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: StudentNotification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsRead();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
      toast.success("Todas as notificações marcadas como lidas.");
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 text-foreground md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Notificações</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            {isPending ? "Marcando..." : "Marcar todas como lidas"}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={cn(
              "rounded-lg border border-border p-3 text-sm",
              n.readAt ? "bg-card" : "bg-primary/5",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{TITLE_BY_TYPE[n.type] ?? n.type}</p>
              {!n.readAt && <span className="size-2 shrink-0 rounded-full bg-primary" />}
            </div>
            <p className="text-muted-foreground">
              {n.payload.className}
              {n.payload.date ? ` · ${formatDateOnly(n.payload.date)}` : ""}
              {n.payload.startTime ? ` às ${n.payload.startTime.slice(0, 5)}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{formatTimestamp(n.createdAt)}</p>
          </div>
        ))}
        {!notifications.length && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            Nenhuma notificação ainda.
          </p>
        )}
      </div>
    </div>
  );
}
