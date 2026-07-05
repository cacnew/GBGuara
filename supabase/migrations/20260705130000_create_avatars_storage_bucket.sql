-- Fase 8.1: bucket de Storage para fotos de alunos e professores,
-- substituindo os campos `photo_url` manuais por upload real.
--
-- Bucket público (leitura livre, sem custo de signed URL) — fotos de
-- perfil não são dado sensível. Escrita restrita ao usuário autenticado
-- da mesma escola, via prefixo `{school_id}/...` no path do objeto,
-- reaproveitando `public.current_school_id()` (Fase 1.3).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users can upload avatars for their own school"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_school_id()::text
  );

create policy "users can update avatars for their own school"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_school_id()::text
  );

create policy "users can delete avatars for their own school"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_school_id()::text
  );
