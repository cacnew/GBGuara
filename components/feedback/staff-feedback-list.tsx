"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateOnly } from "@/lib/dates/format";
import {
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_TARGET_LABELS,
  FEEDBACK_TYPE_LABELS,
} from "@/modules/feedback/labels";
import type { StaffFeedbackListItem } from "@/modules/feedback/staff-actions";

/**
 * Fila de gestão do staff (17.3) — filtros aplicados no client, mesmo
 * padrão de `ApprovalQueue` (Fase 12.5): volume de feedback por escola é
 * pequeno, não justifica filtro via query/URL params. O filtro de
 * "Professor" só aparece quando há mais de um professor distinto nos
 * itens recebidos — para o professor logado (RLS só devolve os próprios
 * direcionados), isso o esconde sozinho, sem precisar checar `role`.
 */
export function StaffFeedbackList({
  items,
  basePath,
}: {
  items: StaffFeedbackListItem[];
  basePath: string;
}) {
  const [studentSearch, setStudentSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const teachers = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (item.teacherId) map.set(item.teacherId, item.teacherName ?? "");
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  const filtered = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    return items.filter((item) => {
      if (term && !item.studentName.toLowerCase().includes(term)) return false;
      if (status && item.status !== status) return false;
      if (type && item.type !== type) return false;
      if (teacherId && item.teacherId !== teacherId) return false;
      return true;
    });
  }, [items, studentSearch, status, type, teacherId]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por aluno..."
          value={studentSearch}
          onChange={(event) => setStudentSearch(event.target.value)}
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.entries(FEEDBACK_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(FEEDBACK_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {teachers.length > 1 && (
          <select
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
          >
            <option value="">Todos os professores</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-2">
        {filtered.map((item) => (
          <Link
            key={item.id}
            href={`${basePath}/${item.id}`}
            className="block rounded-lg border border-border bg-card p-3 text-sm hover:bg-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.studentName} · {FEEDBACK_TYPE_LABELS[item.type]} ·{" "}
                  {FEEDBACK_TARGET_LABELS[item.target]}
                  {item.teacherName ? ` (${item.teacherName})` : ""} ·{" "}
                  {formatDateOnly(item.createdAt.slice(0, 10))}
                </p>
              </div>
              <StatusBadge value={item.status} label={FEEDBACK_STATUS_LABELS[item.status]} />
            </div>
          </Link>
        ))}
        {!filtered.length && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            Nenhum feedback encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
