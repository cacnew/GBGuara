# Ficha do Aluno em Abas — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para executar tarefa a tarefa. Passos usam checkbox (`- [ ]`).
>
> **Adaptação ao projeto:** este repositório não tem suíte de testes automatizada (sem Jest/Vitest/Playwright configurado como test runner). Os passos de verificação usam `npx tsc --noEmit`, `npm run lint` e checagem visual manual no navegador — os mesmos critérios já usados em todo o `TASK.md` — em vez de testes unitários.

**Goal:** Transformar a página `/students/[id]/edit` (hoje uma coluna única com scroll longo) em uma interface com abas, para o admin ir direto ao assunto (dados pessoais, responsáveis, financeiro, graduação, frequência) sem precisar rolar a página.

**Architecture:** A página continua um Server Component (`page.tsx`) fazendo exatamente as mesmas queries de hoje — nada muda na busca de dados. Um novo componente client (`student-edit-tabs.tsx`) recebe cada seção já renderizada como prop (`ReactNode`) e organiza a exibição em abas usando um novo primitivo `components/ui/tabs.tsx`, construído sobre `@base-ui/react/tabs` (mesmo padrão do `button.tsx` já existente no projeto — wrapper fino com `cn`/`cva`). Painéis usam `keepMounted` para não perder edição em andamento (ex: aluno começou a editar "Dados pessoais", trocou de aba sem salvar, volta e o formulário ainda está como deixou).

**Tech Stack:** Next.js App Router (Server + Client Components), `@base-ui/react/tabs`, Tailwind CSS, `lucide-react` (ícones nas abas), TypeScript.

## Global Constraints

- Nenhuma query nova nem mudança de schema — é puramente reorganização visual.
- O cabeçalho da página (título "Editar aluno" + botão "Associar plano") continua fora das abas, sempre visível.
- Cada seção mantém seu próprio botão de salvar independente — nenhuma aba tem "salvar tudo" compartilhado (mesma arquitetura de hoje, cada `*-section.tsx` já é autocontido).
- Painéis usam `keepMounted` (todas as abas ficam montadas no DOM, só escondidas via CSS) para não descartar edição em andamento ao trocar de aba.
- `npx tsc --noEmit` e `npm run lint` devem rodar limpos antes de cada commit.
- Mensagens/labels em português, consistente com o resto do app.
- Cada tarefa termina com commit (`feat: ...`), sem push automático — push só quando o usuário pedir.

---

### Task 1: Criar o primitivo `components/ui/tabs.tsx`

**Files:**
- Create: `components/ui/tabs.tsx`

**Interfaces:**
- Produces: `Tabs` (wrapper de `Tabs.Root`, aceita `defaultValue`), `TabsList` (wrapper de `Tabs.List`), `TabsTrigger` (wrapper de `Tabs.Tab`, aceita `value` e `children`), `TabsContent` (wrapper de `Tabs.Panel`, aceita `value`, `children`, força `keepMounted` como padrão). Todos aceitam `className` opcional.

- [ ] **Step 1: Criar o arquivo `components/ui/tabs.tsx`**

```tsx
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex w-full gap-1 overflow-x-auto border-b border-border",
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[selected]:border-primary data-[selected]:text-foreground",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  keepMounted = true,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      keepMounted={keepMounted}
      className={cn("focus-visible:outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `components/ui/tabs.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ui/tabs.tsx
git commit -m "feat: adiciona primitivo Tabs (base-ui) ao design system"
```

---

### Task 2: Criar `student-edit-tabs.tsx` (client component que organiza as abas)

**Files:**
- Create: `app/(admin)/students/[id]/edit/student-edit-tabs.tsx`

**Interfaces:**
- Consumes: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` de `@/components/ui/tabs` (Task 1).
- Produces: componente `StudentEditTabs` com props `{ personalTab: React.ReactNode; guardiansTab: React.ReactNode; financialTab: React.ReactNode; graduationTab: React.ReactNode; attendanceTab: React.ReactNode }` — usado por `page.tsx` (Task 3).

- [ ] **Step 1: Criar o arquivo**

```tsx
"use client";

import {
  User,
  Users,
  Wallet,
  GraduationCap,
  CalendarClock,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function StudentEditTabs({
  personalTab,
  guardiansTab,
  financialTab,
  graduationTab,
  attendanceTab,
}: {
  personalTab: React.ReactNode;
  guardiansTab: React.ReactNode;
  financialTab: React.ReactNode;
  graduationTab: React.ReactNode;
  attendanceTab: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="dados" className="w-full max-w-2xl">
      <TabsList>
        <TabsTrigger value="dados">
          <User className="mr-1.5 size-4" />
          Dados pessoais
        </TabsTrigger>
        <TabsTrigger value="responsaveis">
          <Users className="mr-1.5 size-4" />
          Responsáveis
        </TabsTrigger>
        <TabsTrigger value="financeiro">
          <Wallet className="mr-1.5 size-4" />
          Financeiro
        </TabsTrigger>
        <TabsTrigger value="graduacao">
          <GraduationCap className="mr-1.5 size-4" />
          Graduação
        </TabsTrigger>
        <TabsTrigger value="frequencia">
          <CalendarClock className="mr-1.5 size-4" />
          Frequência
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="flex flex-col items-center gap-6">
        {personalTab}
      </TabsContent>
      <TabsContent value="responsaveis" className="flex flex-col items-center gap-6">
        {guardiansTab}
      </TabsContent>
      <TabsContent value="financeiro" className="flex flex-col items-center gap-6">
        {financialTab}
      </TabsContent>
      <TabsContent value="graduacao" className="flex flex-col items-center gap-6">
        {graduationTab}
      </TabsContent>
      <TabsContent value="frequencia" className="flex flex-col items-center gap-6">
        {attendanceTab}
      </TabsContent>
    </Tabs>
  );
}
```

*Nota:* `personalTab` deve incluir o `EditStudentForm` + `WhatsAppSend` juntos (ver Task 3) — ambos tratam do contato/dados do aluno.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/students/[id]/edit/student-edit-tabs.tsx"
git commit -m "feat: componente de abas da ficha do aluno"
```

---

### Task 3: Ligar `StudentEditTabs` em `page.tsx`

**Files:**
- Modify: `app/(admin)/students/[id]/edit/page.tsx:83-142` (o `return` do componente)

**Interfaces:**
- Consumes: `StudentEditTabs` (Task 2).

- [ ] **Step 1: Substituir o `return` da página**

Trocar o bloco atual (linhas 83–142) por:

```tsx
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Editar aluno</h1>
        <Link
          href={`/students/${student.id}/contract/new`}
          className={buttonVariants({ size: "sm" })}
        >
          Associar plano
        </Link>
      </div>
      <StudentEditTabs
        personalTab={
          <>
            <EditStudentForm
              id={student.id}
              schoolId={profile.schoolId}
              defaultValues={{
                name: student.name,
                birthDate: student.birth_date ?? "",
                cpf: student.cpf ?? "",
                phone: student.phone ?? "",
                email: student.email ?? "",
                address: student.address ?? "",
                emergencyContact: student.emergency_contact ?? "",
                photoUrl: student.photo_url ?? "",
                status: student.status as StudentInput["status"],
                notes: student.notes ?? "",
              }}
            />
            <div className="w-full max-w-sm">
              <WhatsAppSend
                phone={student.phone}
                onSend={sendWhatsAppToStudent.bind(null, student.id)}
              />
            </div>
          </>
        }
        guardiansTab={
          <GuardiansSection studentId={student.id} guardians={guardians} />
        }
        financialTab={
          <FinancialSection
            studentId={student.id}
            summary={financialSummary}
            accounts={financialAccounts ?? []}
          />
        }
        graduationTab={
          <GraduationSection
            studentId={student.id}
            currentBeltName={student.belts?.name ?? null}
            currentDegree={student.current_degree}
            beltSystems={beltSystems ?? []}
            belts={(belts ?? []).map((b) => ({
              id: b.id,
              beltSystemId: b.belt_system_id,
              name: b.name,
              ordering: b.ordering,
            }))}
            teachers={teachers ?? []}
            attendancesSinceLastGraduation={attendancesSinceLastGraduation ?? 0}
            daysSinceLastGraduation={daysSinceLastGraduation}
          />
        }
        attendanceTab={<AttendanceHistory studentId={student.id} />}
      />
    </div>
  );
}
```

- [ ] **Step 2: Adicionar o import**

No topo do arquivo, junto aos outros imports locais:

```tsx
import { StudentEditTabs } from "./student-edit-tabs";
```

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 4: Verificação manual no navegador**

1. Rodar `npm run dev`, logar como admin, abrir `/students`, clicar em "Editar" em qualquer aluno.
2. Confirmar que as 5 abas aparecem: Dados pessoais, Responsáveis, Financeiro, Graduação, Frequência.
3. Clicar em cada aba e confirmar que o conteúdo correto aparece sem recarregar a página.
4. Editar um campo em "Dados pessoais" sem salvar, trocar para "Financeiro" e voltar — confirmar que o campo editado não foi perdido (efeito do `keepMounted`).
5. Testar em viewport mobile (390×844): confirmar que a lista de abas rola horizontalmente sem quebrar o layout (`overflow-x-auto` do `TabsList`).
6. Confirmar que "Associar plano" continua funcionando a partir do cabeçalho.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/students/[id]/edit/page.tsx"
git commit -m "feat: ficha do aluno em abas (dados, responsaveis, financeiro, graduacao, frequencia)"
```

---

## Self-Review

- **Cobertura:** as 5 seções existentes (`EditStudentForm`+`WhatsAppSend`, `GuardiansSection`, `FinancialSection`, `GraduationSection`, `AttendanceHistory`) têm aba correspondente — nenhuma seção ficou de fora.
- **Sem placeholders:** todo passo tem código completo, nenhum "implementar depois".
- **Consistência de tipos:** `StudentEditTabs` usa os mesmos nomes de prop em Task 2 e Task 3 (`personalTab`, `guardiansTab`, `financialTab`, `graduationTab`, `attendanceTab`).
- **Risco identificado:** `@base-ui/react/tabs` já está instalado como dependência transitiva de `@base-ui/react` (usado hoje só pelo `Button`) — Task 1 não precisa rodar `npm install`. Se o import falhar, confirmar a versão do pacote em `package.json` antes de trocar de abordagem.
