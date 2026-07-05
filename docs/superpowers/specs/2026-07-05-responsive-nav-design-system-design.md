# Menu de navegação responsivo + adoção do design system DESIGN-claude.md

Data: 2026-07-05
Status: aprovado, aguardando plano de implementação

## Contexto

O NexusDojo hoje não tem nenhum "chrome" de navegação persistente. Os
layouts `app/(admin)/layout.tsx` e `app/(teacher)/layout.tsx` são apenas
guardas de autenticação (`await requireRole(...)`) que renderizam
`{children}` diretamente — cada página é uma ilha, com links de
"atalho" soltos no fim do dashboard do admin. Não existe sidebar, não
existe menu, não existe barra superior.

O admin tem ~9 seções de topo (Dashboard, Turmas do dia, Alunos, Leads,
Professores, Turmas, Faixas, Modalidades, Financeiro — este último com
6 subpáginas). O professor tem hoje uma única tela.

O usuário pediu duas coisas na mesma atividade:
1. Um menu de navegação responsivo (desktop, tablet, celular) com
   acesso rápido às funcionalidades.
2. Adotar o design system documentado em `DESIGN-claude.md` — uma
   análise do site de marketing do Claude.com (canvas creme, tipografia
   serifada editorial "Copernicus"/Tiempos Headline, CTA coral,
   superfícies escuras usadas só em cards pontuais, não como tema).

Isso contradiz a identidade visual decidida na Fase 0.7 do `TASK.md`
(tema escuro "Tatame Red" como padrão, com alternador claro/escuro) e a
decisão registrada em `docs/DECISIONS.md` de que a tela de chamada é
deliberadamente "sem menu, sem sidebar". Ambos os pontos foram
explicitamente confirmados com o usuário antes deste documento (ver
seção Decisões).

## Decisões confirmadas com o usuário

1. **Adoção do DESIGN-claude.md é literal**, não uma "extração de
   mecânica" sobre a paleta atual. O app passa a usar canvas creme,
   coral, tipografia serifada nos títulos — a paleta escura "Tatame
   Red" é substituída.
2. **Escopo desta rodada**: trocar os tokens base (cores, fontes,
   espaçamento, raios) + construir o shell/menu novo + migrar um
   conjunto de telas de referência. As demais telas herdam os tokens
   novos automaticamente (não usam cores hardcoded) mas não recebem
   polish de layout dedicado nesta rodada — fica para uma rodada
   futura.
3. **Modo escuro é removido.** Canvas creme vira o único tema; não há
   mais alternador claro/escuro. `components/layout/theme-toggle.tsx`
   é removido.
4. **Padrão de menu**: sidebar fixa em desktop/tablet (≥768px) +
   drawer deslizante acionado por botão hambúrguer numa barra superior
   fina em mobile (<768px). Mesma lista de itens nos dois casos.
5. **Tela de chamada continua sem o shell** — mantém a decisão já
   registrada de layout mínimo focado em um clique por presença.

## Tokens (mapeamento DESIGN-claude.md → variáveis shadcn existentes)

O projeto já usa CSS custom properties no padrão shadcn/ui em
`app/globals.css` (`--background`, `--foreground`, `--card`,
`--primary`, `--border`, `--destructive`, etc., dentro de um bloco
`@theme inline` + `:root`). A migração é substituir os valores dessas
variáveis, não a arquitetura:

| Variável shadcn | Valor atual (Tatame Red, dark) | Novo valor (DESIGN-claude.md) |
|---|---|---|
| `--background` | `#0B0B0F` | `#faf9f5` (canvas) |
| `--foreground` | `#F4F4F5` | `#141413` (ink) |
| `--card` | `#18181B` | `#efe9de` (surface-card) |
| `--card-foreground` | `#F4F4F5` | `#141413` |
| `--primary` | `#C8102E` | `#cc785c` (coral) |
| `--primary-foreground` | `#F4F4F5` | `#ffffff` |
| `--muted` | (dark equivalent) | `#f5f0e8` (surface-soft) |
| `--muted-foreground` | (dark equivalent) | `#6c6a64` (muted) |
| `--border` | `#27272A` | `#e6dfd8` (hairline) |
| `--destructive` | (existing red) | `#c64545` (error) |

O bloco `:root` (tema claro, hoje residual/pouco usado) e o bloco
`.dark` são consolidados em um único `:root` — não há mais variante
`.dark`. `app/layout.tsx` remove a `className="dark"` fixa no `<html>`
e o script de leitura de `localStorage["nexusdojo-theme"]`.

**Tipografia**: mantém `Inter` (já é a substituição documentada da
StyreneB) para corpo/labels/nav. Troca `Outfit` (fonte de título atual,
`--font-heading`) por `Cormorant Garamond` via `next/font/google`
(substituição open-source recomendada no próprio `DESIGN-claude.md`
para Copernicus/Tiempos Headline), aplicando peso 400 e
letter-spacing negativo (-0.3 a -1px conforme o tamanho) nos
`font-heading` existentes — não requer mudar as classes já usadas nos
componentes (`font-heading text-2xl font-semibold` etc.), só a fonte
por trás da variável CSS.

**Espaçamento e raios**: adota a escala do doc no `@theme` —
`spacing` 4/8/12/16/24/32/48/96px (mapeados como utilitários extras,
sem remover a escala padrão do Tailwind) e `--radius-*` recalculados a
partir de `--radius: 8px` (equivalente a `rounded.md` do doc) mantendo
a relação hierárquica já existente no `@theme inline` atual
(`sm`/`md`/`lg`/`xl` como frações de `--radius`).

## Componente novo: `AppShell`

`components/layout/app-shell.tsx` (client component) — recebe
`role: "admin" | "teacher"` e `{children}`, e é o único ponto que
decide sidebar vs. drawer por breakpoint (via CSS, não JS — usa
classes responsivas Tailwind, não `matchMedia`, para evitar flash
incorreto no primeiro render).

Estrutura:
- `<NavItems role>` — componente puro que recebe a lista de itens
  (ver seção seguinte) e o pathname atual (via `usePathname()`),
  renderiza os links com ícone (`lucide-react`) + label, destaca o
  item ativo, e expande automaticamente o grupo "Financeiro" quando a
  rota ativa é uma de suas subpáginas.
- Desktop/tablet (`md:` e acima): `<NavItems>` fica dentro de um
  `<aside>` fixo de 260px à esquerda, sempre visível, sem estado de
  aberto/fechado.
- Mobile (abaixo de `md:`): `<NavItems>` fica dentro de um `<Sheet>`
  (drawer) que abre/fecha via `useState` local, acionado por um botão
  hambúrguer numa `<header>` fixa de 56px. O drawer fecha
  automaticamente ao navegar (`useEffect` ouvindo `pathname`).

`AppShell` é aplicado dentro de `app/(admin)/layout.tsx` e
`app/(teacher)/layout.tsx`, envolvendo `{children}`. A rota de chamada
(`app/attendance/[sessionId]/page.tsx`) fica fora dos grupos
`(admin)`/`(teacher)` — como já está hoje — e portanto não recebe o
`AppShell`; mantém sua própria barra mínima já existente.

## Itens do menu

```
Admin:
  Dashboard                → /dashboard
  Turmas do dia            → /today
  Alunos                   → /students
    Aniversariantes        → /students/birthdays
  Leads                    → /leads
  Professores              → /teachers
  Turmas                   → /classes
    Sessões futuras        → /classes/sessions
  Faixas                   → /belts
  Modalidades              → /modalities
  Financeiro (grupo)
    Dashboard financeiro    → /finance/dashboard
    Tabelas de preço        → /finance/price-tables
    Planos                  → /finance/plans
    Parcelas                → /finance/installments
    Inadimplentes           → /finance/overdue
    Receita por período     → /finance/reports

Professor:
  Dashboard                → /professor
```

Cada item usa um ícone `lucide-react` semanticamente próximo (ex:
`LayoutDashboard`, `Users`, `UserPlus` para Leads, `GraduationCap` para
Faixas, `Wallet` para Financeiro). Botão de logout fixo no rodapé do
menu em ambos os papéis.

## Telas migradas nesta rodada (visual dedicado)

- `app/(admin)/layout.tsx`, `app/(teacher)/layout.tsx` — envolvem
  `{children}` com `<AppShell>`.
- `app/(admin)/dashboard/page.tsx` — remove os links de "atalho"
  manuais do rodapé (substituídos pelo menu); mantém os cards de
  métrica.
- `app/(teacher)/professor/page.tsx` — idem.
- `app/(admin)/students/page.tsx` — referência de padrão para telas de
  listagem/tabela.
- `app/(admin)/finance/dashboard/page.tsx` — referência de padrão para
  cards de métrica.
- `components/ui/button.tsx`, `input.tsx`, `label.tsx` — ajuste de
  padding/raio/tipografia para bater com `button-primary`/`text-input`
  do `DESIGN-claude.md`.
- `components/dashboard/metric-card.tsx`, `summary-list.tsx` — usados
  por múltiplos dashboards, ganham o tratamento `feature-card`-like
  (fundo `surface-card`, raio `lg`, padding `xl`).
- `components/layout/theme-toggle.tsx` — removido (arquivo e toda
  referência a ele).

## Telas não migradas nesta rodada

As ~35 telas restantes (leads, professores, turmas, faixas,
modalidades, todas as subtelas financeiras exceto o dashboard, wizard
de contrato, fichas de aluno/professor, chamada, etc.) continuam
funcionais sem alteração de arquivo — elas usam classes utilitárias
(`bg-card`, `border-border`, `text-muted-foreground`, `bg-background`)
e não cores hardcoded, então herdam os novos tokens automaticamente
via CSS. Não recebem ajuste fino de layout/espaçamento nesta rodada.

**Risco aceito**: como não usam cores fixas, o risco de quebra visual é
baixo, mas o polish (tipografia serifada nos títulos locais, paddings
maiores, etc.) só chega nessas telas numa rodada futura.

## Fora de escopo (explícito)

- Migração das ~35 telas restantes ao novo visual detalhado.
- Qualquer mudança de fluxo/funcionalidade — é puramente visual +
  estrutural de navegação.
- Ícone/glifo de marca do Anthropic (o "spike-mark") — não é aplicável
  à marca NexusDojo; o cabeçalho do menu usa o nome "NexusDojo" em
  texto, sem glifo substituto.
- Alteração do manifest/ícones PWA (Fase 8.6) — cores do ícone do app
  continuam as atuais; não fazem parte deste documento.

## Testes / verificação

- `npx tsc --noEmit` e `npx eslint` limpos.
- Verificação visual manual em três larguras: 390px (mobile), 768px
  (tablet), 1280px (desktop) — sidebar visível nas duas maiores,
  drawer funcional na menor.
- Confirmar que `/attendance/[sessionId]` continua sem o shell novo.
- Confirmar que o item de menu ativo corresponde à rota atual,
  inclusive com o grupo "Financeiro" abrindo automaticamente quando
  aplicável.
- Sem alternador de tema visível em nenhuma tela.
