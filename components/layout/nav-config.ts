import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Globe2,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCircle,
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
      { label: "Cobrancas", href: "/finance/charges" },
      { label: "Inadimplentes", href: "/finance/overdue" },
      { label: "Receita por periodo", href: "/finance/reports" },
    ],
  },
  {
    label: "Medalhas",
    icon: Award,
    collapsible: true,
    children: [
      { label: "Eventos", href: "/medals/events" },
      { label: "Aprovacoes", href: "/medals/approvals" },
      { label: "Ranking", href: "/medals/ranking" },
      { label: "Pontuacao por nivel", href: "/medals/points" },
    ],
  },
  {
    label: "Conteudo",
    icon: BookOpen,
    collapsible: true,
    children: [{ label: "Posicao da Semana", href: "/content/weekly-positions" }],
  },
  {
    label: "Site publico",
    icon: Globe2,
    collapsible: true,
    children: [{ label: "Gestao da Landing Page", href: "/landing" }],
  },
  {
    label: "Configuracoes",
    icon: Settings,
    collapsible: true,
    children: [
      { label: "Graduacao", href: "/graduation/settings" },
      { label: "Mensagens Automaticas", href: "/settings/birthday-messages" },
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
  {
    label: "Medalhas",
    icon: Award,
    collapsible: true,
    children: [
      { label: "Eventos", href: "/professor/medals/events" },
      { label: "Aprovacoes", href: "/professor/medals/approvals" },
      { label: "Ranking", href: "/professor/medals/ranking" },
    ],
  },
  {
    label: "Conteudo",
    icon: BookOpen,
    collapsible: true,
    children: [{ label: "Posicao da Semana", href: "/professor/content/weekly-positions" }],
  },
];

// Módulo do aluno (Fase 9) — itens adicionados conforme cada subtarefa
// ganha tela própria (Agenda na 9.6, Painel na 9.8, Minha Academia na
// 9.9, Notificações/Perfil na 9.10).
export const STUDENT_NAV: NavGroup[] = [
  { label: "Agenda", href: "/aluno", icon: CalendarCheck },
  { label: "Painel", href: "/aluno/painel", icon: LayoutDashboard },
  { label: "Minhas Medalhas", href: "/aluno/medalhas", icon: Award },
  { label: "Ranking", href: "/aluno/ranking", icon: GraduationCap },
  { label: "Minha Academia", href: "/aluno/academia", icon: Users },
  { label: "Financeiro", href: "/aluno/financeiro", icon: Wallet },
  { label: "Notificações", href: "/aluno/notificacoes", icon: Bell },
  { label: "Perfil", href: "/aluno/perfil", icon: UserCircle },
];
