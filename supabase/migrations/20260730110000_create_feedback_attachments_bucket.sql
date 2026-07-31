-- Fase 17.2: bucket de Storage para o anexo opcional do "Fale Conosco",
-- reaproveitando o mesmo padrão da Fase 8.1 (`avatars`) — bucket público
-- (sem helper de signed URL no projeto), escrita restrita por prefixo de
-- pasta no path do objeto. Diferente de `avatars`, aqui o anexo pode ser
-- qualquer tipo de arquivo (não só imagem), por isso sem
-- `allowed_mime_types` e com limite maior (10MB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-attachments',
  'feedback-attachments',
  true,
  10485760, -- 10MB
  null
)
on conflict (id) do nothing;

create policy "feedback attachments are publicly readable"
  on storage.objects for select
  using (bucket_id = 'feedback-attachments');

-- Aluno só envia anexo dentro da própria pasta
-- ({school_id}/feedback/{student_id}-...), mesmo padrão de
-- `20260715090000_students_self_upload_avatar.sql`. Sem `main_teacher_id`
-- no path (o anexo é do aluno, não de um professor específico).
create policy "students can upload own feedback attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'feedback-attachments'
    and (storage.foldername(name))[1] = public.current_student_school_id()::text
    and (storage.foldername(name))[2] = 'feedback'
    and storage.filename(name) like public.current_student_id()::text || '-%'
  );

-- Staff (admin/professor) também poderá anexar arquivo ao responder
-- (Fase 17.3) — mesmo padrão de `current_school_id()` das policies de
-- `avatars` para staff.
create policy "staff can upload feedback attachments for own school"
  on storage.objects for insert
  with check (
    bucket_id = 'feedback-attachments'
    and (storage.foldername(name))[1] = public.current_school_id()::text
  );
