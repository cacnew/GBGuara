# Menu de Navegação Responsivo + Design System DESIGN-claude.md — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os tokens visuais do NexusDojo pelo design system do `DESIGN-claude.md` (canvas creme, coral, tipografia serifada, sem modo escuro) e construir um menu de navegação responsivo (sidebar fixa em desktop/tablet, drawer em mobile) para as áreas `(admin)` e `(teacher)`.

**Architecture:** Troca de CSS custom properties em `app/globals.css` (mesma arquitetura shadcn/ui já existente, só os valores mudam) + um componente `AppShell` novo que envolve os layouts autenticados e decide sidebar vs. drawer via breakpoint Tailwind (`md:`), sem JS de detecção de viewport. Itens do menu vêm de um array de configuração puro (`nav-config.ts`), consumido por um componente de renderização (`nav-items.tsx`) que calcula o item ativo via `usePathname()`.

**Tech Stack:** Next.js App Router, Tailwind CSS v4, `lucide-react` (ícones), `next/font/google` (Cormorant Garamond), TypeScript.

## Global Constraints

- Tema escuro é removido — canvas creme (`#faf9f5`) é o único tema, sem alternador.
- A rota `app/attendance/[sessionId]/page.tsx` **não** recebe o `AppShell` — continua com sua barra mínima já existente (decisão registrada em `docs/DECISIONS.md`).
- Nenhuma cor deve ser hardcoded fora de `app/globals.css` — todo componente novo usa as variáveis (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-primary`, etc.) para herdar o tema automaticamente.
- `npx tsc --noEmit` e `npx eslint <arquivos tocados>` devem rodar limpos a cada tarefa antes do commit.
- Cada tarefa termina com commit (mensagem em português, seguindo o padrão `feat: ...` / `fix: ...` já usado no repositório) — sem push automático; push acontece só quando o usuário pedir, ao final do plano.

---

### Task 1: Trocar tokens de cor para o design system DESIGN-claude.md

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: variáveis CSS (`--background`, `--foreground`, `--card`, `--primary`, `--border`, `--radius`, etc.) com os novos valores — consumidas por todo o app via as classes Tailwind já existentes (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-primary`, `text-primary`, `rounded-lg`, etc.). Nenhuma classe muda de nome, só o valor por trás.

- [ ] **Step 1: Substituir todo o conteúdo de `app/globals.css`**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-heading: var(--font-heading);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

/* Design system DESIGN-claude.md — canvas creme, coral, único tema (sem modo escuro) */
:root {
  --background: #faf9f5;
  --foreground: #141413;
  --card: #efe9de;
  --card-foreground: #141413;
  --popover: #faf9f5;
  --popover-foreground: #141413;
  --primary: #cc785c;
  --primary-foreground: #ffffff;
  --secondary: #e8e0d2;
  --secondary-foreground: #141413;
  --muted: #f5f0e8;
  --muted-foreground: #6c6a64;
  --accent: #efe9de;
  --accent-foreground: #141413;
  --destructive: #c64545;
  --border: #e6dfd8;
  --input: #e6dfd8;
  --ring: #cc785c;
  --chart-1: #cc785c;
  --chart-2: #5db8a6;
  --chart-3: #e8a55a;
  --chart-4: #8e8b82;
  --chart-5: #6c6a64;
  --radius: 0.75rem;
  --sidebar: #efe9de;
  --sidebar-foreground: #141413;
  --sidebar-primary: #cc785c;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #e8e0d2;
  --sidebar-accent-foreground: #141413;
  --sidebar-border: #e6dfd8;
  --sidebar-ring: #cc785c;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-heading;
  }
}
```

- [ ] **Step 2: Rodar o type-check (não deve ser afetado por CSS, mas confirma que nada mais quebrou)**

Run: `npx tsc --noEmit`
Expected: sem saída (sem erros)

- [ ] **Step 3: Subir o dev server (se não estiver rodando) e verificar visualmente**

Run: `npm run dev` (se já não estiver rodando em background)
Abrir `http://localhost:3000/login` no navegador e confirmar: fundo creme, não mais escuro; botão "Entrar" em coral.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: adota tokens de cor do design system DESIGN-claude.md (canvas creme + coral)"
```

---

### Task 2: Trocar fonte de título para serifada e remover alternador de tema

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Delete: `components/layout/theme-toggle.tsx`

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces: variável CSS `--font-heading` agora aponta para Cormorant Garamond (serifada); `<html>` não tem mais classe `dark` fixa nem script de leitura de tema.

- [ ] **Step 1: Substituir todo o conteúdo de `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NexusDojo",
  description: "Gestão de escolas de luta",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#faf9f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Substituir todo o conteúdo de `app/page.tsx`**

```tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <h1 className="text-4xl font-heading font-semibold tracking-tight">
        NexusDojo
      </h1>
      <p className="max-w-md text-muted-foreground">
        Plataforma de gestão para escolas de luta. Setup do projeto em
        andamento — ver <code>TASK.md</code> para o progresso por fase.
      </p>
      <Button variant="default">Ação primária</Button>
    </div>
  );
}
```

- [ ] **Step 3: Apagar o arquivo do alternador de tema**

```bash
rm "components/layout/theme-toggle.tsx"
```

- [ ] **Step 4: Confirmar que não sobrou nenhuma referência**

Run: `grep -rn "ThemeToggle\|nexusdojo-theme" app components --include=*.tsx --include=*.ts`
Expected: sem resultados

- [ ] **Step 5: Type-check e lint**

Run: `npx tsc --noEmit`
Expected: sem erros

Run: `npx eslint app/layout.tsx app/page.tsx`
Expected: sem erros

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx app/page.tsx
git rm components/layout/theme-toggle.tsx
git commit -m "feat: troca titulos para fonte serifada e remove alternador de tema"
```

---

### Task 3: Ajustar altura/padding de Button e Input para bater com o design system

**Files:**
- Modify: `components/ui/button.tsx`
- Modify: `components/ui/input.tsx`

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces: `Button` com variante `default`/`size="default"` em 40px de altura (`h-10`) e padding horizontal 20px (`px-5`); `Input` em 40px de altura (`h-10`). Nenhuma prop ou export muda de nome — só as classes internas.

- [ ] **Step 1: Editar `components/ui/button.tsx` — trocar a linha de `size: "default"`**

Trocar:
```
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
```
Por:
```
        default:
          "h-10 gap-1.5 px-5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
```

- [ ] **Step 2: Editar `components/ui/input.tsx` — trocar altura e padding horizontal**

Trocar (dentro da string de `className`):
```
"h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none ..."
```
Por (só a parte inicial muda, o restante da string permanece idêntico):
```
"h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3.5 py-1 text-base transition-colors outline-none ..."
```

- [ ] **Step 3: Type-check e lint**

Run: `npx tsc --noEmit`
Expected: sem erros

Run: `npx eslint components/ui/button.tsx components/ui/input.tsx`
Expected: sem erros

- [ ] **Step 4: Verificação visual rápida**

Abrir `http://localhost:3000/login` e confirmar que os campos de e-mail/senha e o botão "Entrar" ficaram visivelmente mais altos (40px) e com mais respiro horizontal.

- [ ] **Step 5: Commit**

```bash
git add components/ui/button.tsx components/ui/input.tsx
git commit -m "feat: ajusta altura e padding de Button/Input para o design system"
```

---

### Task 4: Criar a configuração de itens do menu

**Files:**
- Create: `components/layout/nav-config.ts`

**Interfaces:**
- Produces: tipos `NavLeaf`, `NavGroup` e as constantes `ADMIN_NAV: NavGroup[]`, `TEACHER_NAV: NavGroup[]` — consumidos pela Task 5 (`nav-items.tsx`) e Task 7 (`app-shell.tsx`).

- [ ] **Step 1: Criar `components/layout/nav-config.ts`**

```ts
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
    children: [{ label: "Aniversariantes", href: "/students/birthdays" }],
  },
  { label: "Leads", href: "/leads", icon: UserPlus },
  {
    label: "Professores",
    href: "/teachers",
    icon: GraduationCap,
    children: [{ label: "Cadastrar login de professor", href: "/teachers/login/new" }],
  },
  {
    label: "Turmas",
    href: "/classes",
    icon: Layers,
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros (arquivo ainda não é importado por ninguém, mas deve compilar isoladamente)

- [ ] **Step 3: Commit**

```bash
git add components/layout/nav-config.ts
git commit -m "feat: configuracao dos itens do menu de navegacao"
```

---

### Task 5: Criar o componente de renderização dos itens do menu

**Files:**
- Create: `components/layout/nav-items.tsx`

**Interfaces:**
- Consumes: `NavGroup` de `components/layout/nav-config.ts` (Task 4).
- Produces: componente `NavItems({ groups: NavGroup[] })` — consumido pela Task 7 (`app-shell.tsx`).

- [ ] **Step 1: Criar `components/layout/nav-items.tsx`**

```tsx
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
```

- [ ] **Step 2: Type-check e lint**

Run: `npx tsc --noEmit`
Expected: sem erros

Run: `npx eslint components/layout/nav-items.tsx`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add components/layout/nav-items.tsx
git commit -m "feat: componente de renderizacao dos itens do menu com estado ativo"
```

---

### Task 6: Criar o botão de logout

**Files:**
- Create: `components/layout/logout-button.tsx`

**Interfaces:**
- Consumes: `createClient` de `@/lib/supabase/client` (já existe, usado em `app/(auth)/login/page.tsx`).
- Produces: componente `LogoutButton` (sem props) — consumido pela Task 7 (`app-shell.tsx`).

- [ ] **Step 1: Criar `components/layout/logout-button.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <LogOut className="size-4" />
      Sair
    </button>
  );
}
```

- [ ] **Step 2: Type-check e lint**

Run: `npx tsc --noEmit`
Expected: sem erros

Run: `npx eslint components/layout/logout-button.tsx`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add components/layout/logout-button.tsx
git commit -m "feat: botao de logout para o menu de navegacao"
```

---

### Task 7: Criar o AppShell (sidebar desktop + drawer mobile)

**Files:**
- Create: `components/layout/app-shell.tsx`

**Interfaces:**
- Consumes: `NavItems` (Task 5), `ADMIN_NAV`/`TEACHER_NAV` (Task 4), `LogoutButton` (Task 6).
- Produces: componente `AppShell({ role: "admin" | "teacher", userName: string, children: React.ReactNode })` — consumido pela Task 8 (`app/(admin)/layout.tsx` e `app/(teacher)/layout.tsx`).

- [ ] **Step 1: Criar `components/layout/app-shell.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

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
```

- [ ] **Step 2: Type-check e lint**

Run: `npx tsc --noEmit`
Expected: sem erros

Run: `npx eslint components/layout/app-shell.tsx`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add components/layout/app-shell.tsx
git commit -m "feat: componente AppShell com sidebar desktop e drawer mobile"
```

---

### Task 8: Aplicar o AppShell nos layouts autenticados

**Files:**
- Modify: `app/(admin)/layout.tsx`
- Modify: `app/(teacher)/layout.tsx`

**Interfaces:**
- Consumes: `AppShell` (Task 7), `requireRole` de `@/lib/permissions` (já existe).

- [ ] **Step 1: Substituir todo o conteúdo de `app/(admin)/layout.tsx`**

```tsx
import { requireRole } from "@/lib/permissions";
import { AppShell } from "@/components/layout/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("admin");

  return (
    <AppShell role="admin" userName={profile.name}>
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 2: Substituir todo o conteúdo de `app/(teacher)/layout.tsx`**

```tsx
import { requireRole } from "@/lib/permissions";
import { AppShell } from "@/components/layout/app-shell";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("teacher");

  return (
    <AppShell role="teacher" userName={profile.name}>
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 3: Type-check e lint**

Run: `npx tsc --noEmit`
Expected: sem erros

Run: `npx eslint "app/(admin)/layout.tsx" "app/(teacher)/layout.tsx"`
Expected: sem erros

- [ ] **Step 4: Verificação visual em três larguras**

Abrir `http://localhost:3000/dashboard` (login `admin@nexusdojo.dev` / `TestSenha123!`) e, usando as ferramentas de dispositivo do navegador (ou redimensionando a janela):
- 1280px: sidebar fixa à esquerda visível, com todos os grupos.
- 768px: sidebar ainda visível (breakpoint `md:`).
- 390px: sidebar escondida, barra superior com hambúrguer; tocar no hambúrguer abre o drawer com os mesmos itens; tocar fora fecha.

Repetir login como `professor@nexusdojo.dev` e confirmar que o menu mostra só "Dashboard".

Confirmar que `/attendance/<qualquer-id>` continua sem sidebar/drawer (rota fora dos grupos `(admin)`/`(teacher)`).

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/layout.tsx" "app/(teacher)/layout.tsx"
git commit -m "feat: aplica o AppShell nos layouts admin e professor"
```

---

### Task 9: Atualizar MetricCard e SummaryList para o padrão de card do novo sistema

**Files:**
- Modify: `components/dashboard/metric-card.tsx`
- Modify: `components/dashboard/summary-list.tsx`

**Interfaces:**
- Consumes: nada de tasks anteriores (só troca classes internas).
- Produces: mesma API pública (`MetricCard({ label, value, href?, variant? })`, `SummaryList({ title, items, emptyMessage?, viewAllHref? })`) — nenhum consumidor precisa mudar.

- [ ] **Step 1: Editar `components/dashboard/metric-card.tsx` — aumentar padding do card**

Trocar:
```
      "rounded-lg border border-border bg-card p-4",
```
Por:
```
      "rounded-lg border border-border bg-card p-6",
```

- [ ] **Step 2: Editar `components/dashboard/summary-list.tsx` — aumentar padding do card**

Trocar:
```
    <div className="rounded-lg border border-border bg-card p-4">
```
Por:
```
    <div className="rounded-lg border border-border bg-card p-6">
```

- [ ] **Step 3: Type-check e lint**

Run: `npx tsc --noEmit`
Expected: sem erros

Run: `npx eslint components/dashboard/metric-card.tsx components/dashboard/summary-list.tsx`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/metric-card.tsx components/dashboard/summary-list.tsx
git commit -m "feat: aumenta padding interno dos cards de dashboard"
```

---

### Task 10: Remover atalhos manuais do dashboard do admin (substituídos pelo menu)

**Files:**
- Modify: `app/(admin)/dashboard/page.tsx`

**Interfaces:**
- Consumes: nenhuma nova — só remove código.

- [ ] **Step 1: Remover o import de `Link` e `buttonVariants` (não usados mais neste arquivo)**

Trocar:
```
import Link from "next/link";
import { getCurrentUserProfile } from "@/modules/users/queries";
import { buttonVariants } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
```
Por:
```
import { getCurrentUserProfile } from "@/modules/users/queries";
import { MetricCard } from "@/components/dashboard/metric-card";
```

- [ ] **Step 2: Remover o bloco de atalhos manuais no final do JSX**

Remover inteiramente o bloco (da linha `<div className="flex flex-wrap gap-3">` até o `</div>` que o fecha, imediatamente antes do `</div>` final do componente):

```
      <div className="flex flex-wrap gap-3">
        <Link href="/students" className={buttonVariants({ className: "w-fit" })}>
          Alunos
        </Link>
        <Link href="/leads" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Leads
        </Link>
        <Link
          href="/students/birthdays"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Aniversariantes
        </Link>
        <Link href="/today" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Turmas do dia
        </Link>
        <Link href="/classes" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Turmas
        </Link>
        <Link
          href="/classes/sessions"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Sessões futuras
        </Link>
        <Link href="/teachers" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Professores
        </Link>
        <Link
          href="/teachers/login/new"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Cadastrar login de professor
        </Link>
        <Link
          href="/modalities"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Modalidades
        </Link>
        <Link
          href="/belts"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Faixas
        </Link>
        <Link
          href="/finance/price-tables"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Tabelas de preço
        </Link>
        <Link
          href="/finance/plans"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Planos
        </Link>
        <Link
          href="/finance/installments"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Parcelas
        </Link>
        <Link
          href="/finance/overdue"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Inadimplentes
        </Link>
      </div>
```

- [ ] **Step 2: Type-check e lint**

Run: `npx tsc --noEmit`
Expected: sem erros (confirma que `Link`/`buttonVariants` não são mais referenciados)

Run: `npx eslint "app/(admin)/dashboard/page.tsx"`
Expected: sem erros

- [ ] **Step 3: Verificação visual**

Abrir `/dashboard` e confirmar que os cards de métrica e listas continuam aparecendo normalmente, sem o bloco de botões de atalho no final (agora redundante com o menu lateral).

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/dashboard/page.tsx"
git commit -m "feat: remove atalhos manuais do dashboard (substituidos pelo menu)"
```

---

### Task 11: Ajustar espaçamento de referência em Alunos e Dashboard financeiro

**Files:**
- Modify: `app/(admin)/students/page.tsx`
- Modify: `app/(admin)/finance/dashboard/page.tsx`

**Interfaces:**
- Consumes: nenhuma nova — só ajusta classes de espaçamento para bater com o padding maior (32px) do novo sistema.

- [ ] **Step 1: Editar `app/(admin)/students/page.tsx` — aumentar padding/gap da página e altura do select**

Trocar:
```
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
```
Por:
```
    <div className="flex flex-1 flex-col gap-6 p-8 text-foreground">
```

Trocar:
```
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
```
Por:
```
          className="h-10 rounded-lg border border-border bg-background px-3.5 text-sm"
```

- [ ] **Step 2: Editar `app/(admin)/finance/dashboard/page.tsx` — aumentar padding/gap da página**

Trocar:
```
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
```
Por:
```
    <div className="flex flex-1 flex-col gap-6 p-8 text-foreground">
```

- [ ] **Step 3: Type-check e lint**

Run: `npx tsc --noEmit`
Expected: sem erros

Run: `npx eslint "app/(admin)/students/page.tsx" "app/(admin)/finance/dashboard/page.tsx"`
Expected: sem erros

- [ ] **Step 4: Verificação visual**

Abrir `/students` e `/finance/dashboard`, confirmar mais respiro nas bordas e que o campo de filtro de status tem a mesma altura dos outros inputs (40px).

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/students/page.tsx" "app/(admin)/finance/dashboard/page.tsx"
git commit -m "feat: ajusta espacamento de referencia em alunos e dashboard financeiro"
```

---

### Task 12: Verificação final completa

**Files:**
- Nenhum arquivo novo — só validação.

- [ ] **Step 1: Type-check completo do projeto**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 2: Lint completo do projeto**

Run: `npx eslint app components lib`
Expected: sem erros novos (avisos pré-existentes em `plan-form.tsx`/`theme-toggle.tsx` não se aplicam mais — `theme-toggle.tsx` foi removido)

- [ ] **Step 3: Checklist manual no navegador**

- [ ] Login (`/login`) — canvas creme, botão coral, sem alternador de tema.
- [ ] Dashboard admin em 1280px — sidebar visível com todos os 9 grupos + Financeiro expansível.
- [ ] Dashboard admin em 390px — hambúrguer abre drawer com o mesmo conteúdo; fecha ao navegar.
- [ ] Item ativo do menu corresponde à rota atual; grupo "Financeiro" abre automaticamente ao visitar qualquer subpágina financeira.
- [ ] Dashboard professor (`professor@nexusdojo.dev`) — menu mostra só "Dashboard".
- [ ] `/attendance/<id>` — sem sidebar/drawer, barra mínima preservada.
- [ ] Botão "Sair" desloga e redireciona para `/login`.

- [ ] **Step 4: Reportar ao usuário**

Não fazer commit nesta task — é só verificação. Reportar ao usuário o resultado do checklist manual antes de considerar o plano concluído.
