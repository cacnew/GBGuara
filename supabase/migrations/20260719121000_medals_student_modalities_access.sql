-- Fase 12.4: aluno precisa escolher a modalidade real da própria
-- participação ao lançar uma medalha — `modalities` só tinha policy de
-- select para staff (Fase 2.1). Mesmo padrão de correção já aplicado a
-- class_groups/class_sessions/teachers/belts na Fase 9.6 (dado de
-- catálogo, não sensível).
create policy "students can select own school modalities"
  on public.modalities for select
  using (school_id = public.current_student_school_id());
