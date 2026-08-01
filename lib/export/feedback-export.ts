"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateOnly } from "@/lib/dates/format";
import {
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_TARGET_LABELS,
  FEEDBACK_TYPE_LABELS,
} from "@/modules/feedback/labels";
import type { StaffFeedbackListItem } from "@/modules/feedback/staff-actions";

const EXPORT_COLUMNS = ["Título", "Aluno", "Tipo", "Destino", "Professor", "Status", "Data"];

function toExportRows(items: StaffFeedbackListItem[]): string[][] {
  return items.map((item) => [
    item.title,
    item.studentName,
    FEEDBACK_TYPE_LABELS[item.type] ?? item.type,
    FEEDBACK_TARGET_LABELS[item.target] ?? item.target,
    item.teacherName ?? "-",
    FEEDBACK_STATUS_LABELS[item.status] ?? item.status,
    formatDateOnly(item.createdAt.slice(0, 10)),
  ]);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Delimitador `;` (não `,`) porque o Excel em locale pt-BR interpreta
 * vírgula como separador decimal, não de coluna — `,` quebraria a
 * abertura direta do CSV. BOM UTF-8 no início evita acentos corrompidos
 * ao abrir no Excel.
 */
export function exportFeedbackToCsv(items: StaffFeedbackListItem[]) {
  const rows = [EXPORT_COLUMNS, ...toExportRows(items)];
  const csv = rows.map((row) => row.map(csvEscape).join(";")).join("\n");
  const blob = new Blob([String.fromCharCode(0xfeff) + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `fale-conosco-${Date.now()}.csv`);
}

export function exportFeedbackToPdf(items: StaffFeedbackListItem[]) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Fale Conosco — Histórico", 14, 15);
  autoTable(doc, {
    startY: 20,
    head: [EXPORT_COLUMNS],
    body: toExportRows(items),
    styles: { fontSize: 8 },
  });
  doc.save(`fale-conosco-${Date.now()}.pdf`);
}
