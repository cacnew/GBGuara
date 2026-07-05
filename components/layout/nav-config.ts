import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserPlus,
  GraduationCap,
  Layers,
  Tags,
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
  { label: "Turmas do dia", href: "/today", icon: CalendarDays },
  {
    label: "Alunos",
    href: "/students",
    icon: Users,
    collapsible: true,
    children: [{ label: "Aniversariantes", href: "/students/birthdays" }],
  },
  { label: "Leads", href: "/leads", icon: UserPlus },
  {
    label: "Professores",
    href: "/teachers",
    icon: GraduationCap,
    collapsible: true,
    children: [{ label: "Cadastrar login de professor", href: "/teachers/login/new" }],
  },
  {
    label: "Turmas",
    href: "/classes",
    icon: Layers,
    collapsible: true,
    children: [{ label: "Sessões futuras", href: "/classes/sessions" }],
  },
  { label: "Faixas", href: "/belts", icon: Tags },
  { label: "Modalidades", href: "/modalities", icon: Tags },
  {
    label: "Financeiro",
    icon: Wallet,
    collapsible: true,
    children: [
      { label: "Dashboard financeiro", href: "/finance/dashboard" },
      { label: "Tabelas de preço", href: "/finance/price-tables" },
      { label: "Planos", href: "/finance/plans" },
      { label: "Parcelas", href: "/finance/installments" },
      { label: "Inadimplentes", href: "/finance/overdue" },
      { label: "Receita por período", href: "/finance/reports" },
    ],
  },
];

export const TEACHER_NAV: NavGroup[] = [
  { label: "Dashboard", href: "/professor", icon: LayoutDashboard },
];
