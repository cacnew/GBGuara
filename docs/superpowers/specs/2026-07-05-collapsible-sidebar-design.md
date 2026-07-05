# Sidebar colapsável (grupos + menu inteiro)

Data: 2026-07-05
Status: aprovado, aguardando plano de implementação

## Contexto

O menu de navegação (Fase anterior: `2026-07-05-responsive-nav-design-system`)
já tem sidebar fixa em desktop/tablet e drawer em mobile. Hoje só o grupo
"Financeiro" é colapsável (`collapsible: true` em `nav-config.ts`); os
demais grupos com subitens (Alunos→Aniversariantes, Turmas→Sessões
futuras, Professores→Cadastrar login) sempre mostram o subitem fixo. A
sidebar em si não tem como ser escondida — ocupa 256px permanentemente
em desktop/tablet.

## Decisões confirmadas com o usuário

1. Todos os grupos com subitens (não só Financeiro) ganham a mesma seta
   de expandir/recolher.
2. A sidebar inteira (desktop/tablet apenas — mobile mantém o drawer
   como está) pode ser escondida por completo via um ícone, com
   animação de deslizar (largura 256px → 0). Quando escondida, um botão
   flutuante fixo no canto superior esquerdo reaparece para reabri-la.
3. Dois estados persistem em `localStorage`: se a sidebar está
   recolhida (`nexusdojo-sidebar-collapsed`) e quais grupos estão
   expandidos (`nexusdojo-sidebar-open-groups`, lista de labels).
   Restaurados na montagem do componente (client-side only — SSR
   renderiza o estado padrão, sem flash perceptível dado que é uma
   sidebar, não conteúdo above-the-fold crítico).

## Mudanças

### `components/layout/nav-config.ts`
Adicionar `collapsible: true` aos grupos "Alunos", "Turmas" e
"Professores" (hoje só "Financeiro" tem). Nenhuma mudança de estrutura
de tipos.

### `components/layout/nav-items.tsx`
Nenhuma mudança de lógica — o componente já lê `group.collapsible` e já
teria a seta renderizada para qualquer grupo que a tenha; ganhar a seta
nos 3 grupos adicionais é consequência direta da mudança em
`nav-config.ts`. Único ajuste: persistir/restaurar quais grupos estão
abertos via `localStorage`, chave `nexusdojo-sidebar-open-groups`
(array de `group.label`), lido na montagem e escrito a cada toggle
manual (não sobrescreve a auto-expansão por rota ativa).

### `components/layout/app-shell.tsx`
- Novo estado `sidebarCollapsed` (boolean), inicializado lendo
  `localStorage.getItem("nexusdojo-sidebar-collapsed")`, persistido a
  cada mudança.
- `<aside>`: classe de largura passa de `w-64` fixo para condicional
  (`w-64` ou `w-0 overflow-hidden`), com `transition-all duration-200`
  para o efeito de deslizar. Conteúdo interno (`NavItems`,
  `LogoutButton`, nome do usuário) permanece montado mas fica
  visualmente cortado quando `w-0` (evita re-render ao reabrir).
- Botão de toggle (`PanelLeftClose`/`PanelLeftOpen` de `lucide-react`)
  no topo do `<aside>`, ao lado do texto "NexusDojo".
- Botão flutuante de reabrir: renderizado condicionalmente
  (`sidebarCollapsed && role identifica desktop`) como elemento
  `fixed left-3 top-3 z-40 hidden md:flex` (só aparece em telas
  ≥768px, já que em mobile a sidebar nem é renderizada — o `hidden
  md:flex` já existente na aside cobre isso).
- Escopo explícito: essa mudança é só para desktop/tablet. O drawer
  mobile (`drawerOpen`) não ganha um modo "colapsado para ícones" — só
  os grupos dentro dele ganham a mesma seta de expandir/recolher (item
  1 desta spec), que já é compartilhado entre sidebar e drawer via
  `<NavItems>`.

## Fora de escopo

- Modo "ícone apenas" (rail estreito) — usuário escolheu esconder
  totalmente, não encolher para ícones.
- Qualquer mudança no comportamento do drawer mobile além de herdar a
  seta de expandir/recolher nos grupos (já é o mesmo componente
  `NavItems`).
- Tooltips ao passar o mouse sobre ícones — não se aplica, já que o
  modo escolhido não é "ícone apenas".

## Testes / verificação

- `npx tsc --noEmit` e `npx eslint` limpos.
- Verificação manual em 1280px: clicar no ícone de recolher esconde a
  sidebar com animação; botão flutuante aparece e reabre com a mesma
  animação invertida.
- Recarregar a página com a sidebar recolhida mantém o estado
  recolhido (via localStorage).
- Expandir um grupo (ex: "Alunos"), recarregar a página, confirmar que
  continua expandido.
- Confirmar que em 390px (mobile) nada muda no comportamento do drawer
  — só os grupos "Alunos"/"Turmas"/"Professores" ganham a seta.
