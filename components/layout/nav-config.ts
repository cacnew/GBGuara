import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

export type NavLeaf = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  icon: LucideIcon;
  href?: string;
  collapsible?: boolean;
  children?: NavLeaf[];
};

export const ADMIN_NAV: NavGroup[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Operacao",
    icon: CalendarDays,
    collapsible: true,
    children: [
      { label: "Turmas do dia", href: "/today" },
      { label: "Historico de chamadas", href: "/classes/sessions" },
      { label: "Turmas e horarios", href: "/classes" },
    ],
  },
  {
    label: "Pessoas",
    icon: Users,
    collapsible: true,
    children: [
      { label: "Alunos", href: "/students" },
      { label: "Aniversariantes", href: "/students/birthdays" },
      { label: "Leads", href: "/leads" },
      { label: "Professores", href: "/teachers" },
    ],
  },
  {
    label: "Ensino",
    icon: GraduationCap,
    collapsible: true,
    children: [
      { label: "Modalidades", href: "/modalities" },
      { label: "Faixas e graduacao", href: "/belts" },
      { label: "Sugestoes de graduacao", href: "/graduation/suggestions" },
    ],
  },
  {
    label: "Financeiro",
    icon: Wallet,
    collapsible: true,
    children: [
      { label: "Dashboard financeiro", href: "/finance/dashboard" },
      { label: "Tabelas de preco", href: "/finance/price-tables" },
      { label: "Planos", href: "/finance/plans" },
      { label: "Parcelas", href: "/finance/installments" },
      { label: "Inadimplentes", href: "/finance/overdue" },
      { label: "Receita por periodo", href: "/finance/reports" },
    ],
  },
  {
    label: "Administracao",
    icon: ShieldCheck,
    collapsible: true,
    children: [
      { label: "Usuarios e permissoes", href: "/users" },
      { label: "Cadastrar login de professor", href: "/teachers/login/new" },
      { label: "Auditoria", href: "/audit" },
    ],
  },
];

export const TEACHER_NAV: NavGroup[] = [
  {
    label: "Aulas",
    icon: ClipboardList,
    collapsible: true,
    children: [
      { label: "Turmas do dia", href: "/professor" },
      { label: "Agenda", href: "/professor/schedule" },
      { label: "Historico de chamadas", href: "/professor/sessions" },
    ],
  },
];

// Módulo do aluno (Fase 9) — itens adicionados conforme cada subtarefa
// ganha tela própria (Agenda na 9.6, Painel na 9.8).
export const STUDENT_NAV: NavGroup[] = [
  { label: "Agenda", href: "/aluno", icon: CalendarCheck },
  { label: "Painel", href: "/aluno/painel", icon: LayoutDashboard },
];
