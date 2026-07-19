-- Fase 12.12: status ativo/inativo em `medal_events` (mesmo padrão de
-- `modalities`) — evento inativo some das listas de escolha nos
-- formulários de lançamento (12.4/12.6/12.11), mas continua aparecendo no
-- filtro de evento do ranking (12.7) e no histórico do dossiê (12.8), sem
-- perder nenhum dado histórico.

alter table public.medal_events
  add column if not exists status text not null default 'active'
    check (status in ('active', 'inactive'));
