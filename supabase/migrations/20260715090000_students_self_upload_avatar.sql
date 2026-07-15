-- Fase 10.4: upload de foto self-service pelo aluno em `/aluno/perfil`.
--
-- O bucket `avatars` (Fase 8.1) só liberava insert/update/delete via
-- `current_school_id()`, que resolve pela tabela `users` — nula para uma
-- sessão de aluno (aluno autentica direto por `students.auth_user_id`, sem
-- linha em `users`). Sem isso, o upload do próprio aluno seria bloqueado
-- silenciosamente pela RLS do Storage.
--
-- Escopo restrito ao próprio arquivo do aluno: além da escola
-- (`current_student_school_id()`, Fase 9.6), o nome do arquivo precisa
-- começar com o próprio `student_id` (convenção já usada pelo
-- `AvatarUpload`: `{schoolId}/{entityType}/{entityId}-{timestamp}.{ext}`).

create policy "students can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_student_school_id()::text
    and (storage.foldername(name))[2] = 'students'
    and storage.filename(name) like public.current_student_id()::text || '-%'
  );

create policy "students can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_student_school_id()::text
    and (storage.foldername(name))[2] = 'students'
    and storage.filename(name) like public.current_student_id()::text || '-%'
  );
