-- Fase 1.5: função usada pelo onboarding público para criar a escola e o
-- primeiro usuário admin em uma única transação no banco.
--
-- O usuário do Supabase Auth (auth.users) é criado antes, via Admin API
-- do GoTrue, a partir de uma Server Action que usa a service_role key —
-- isso não é uma operação de banco, então não entra nesta transação. Se a
-- transação abaixo falhar, a Server Action é responsável por apagar o
-- auth.users órfão (ver app/(public)/onboarding/actions.ts).

create or replace function public.create_school_with_admin(
  p_school_name text,
  p_auth_user_id uuid,
  p_admin_name text,
  p_admin_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid;
begin
  insert into public.schools (name)
  values (p_school_name)
  returning id into v_school_id;

  -- O trigger schools_create_default_unit (Fase 1.2) já cria a unidade
  -- default automaticamente aqui.

  insert into public.users (school_id, auth_user_id, name, email, role)
  values (v_school_id, p_auth_user_id, p_admin_name, p_admin_email, 'admin');

  return v_school_id;
end;
$$;
