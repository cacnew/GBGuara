-- Completa o catalogo de faixas de Jiu-Jitsu conforme o sistema geral de
-- graduacao da IBJJF, mantendo a decisao de graduacao 100% manual.
--
-- Esta migration nao cria regras de bloqueio por idade, tempo minimo ou
-- professor aprovador. Ela apenas garante que o sistema tenha todas as
-- faixas que o professor pode escolher.

create or replace function public.create_default_school_setup()
returns trigger
language plpgsql
as $$
declare
  v_jiu_jitsu_id uuid;
  v_belt_system_adulto_id uuid;
  v_belt_system_kids_id uuid;
begin
  insert into public.modalities (school_id, name, slug) values
    (new.id, 'Jiu-Jitsu', 'jiu_jitsu'),
    (new.id, 'No-Gi', 'no_gi'),
    (new.id, 'Muay Thai', 'muay_thai'),
    (new.id, 'Boxe', 'boxe'),
    (new.id, 'Defesa Pessoal', 'defesa_pessoal'),
    (new.id, 'Wrestling', 'wrestling'),
    (new.id, 'Funcional', 'funcional');

  select id into v_jiu_jitsu_id
  from public.modalities
  where school_id = new.id and slug = 'jiu_jitsu';

  insert into public.belt_systems (school_id, modality_id, name, audience)
  values (new.id, v_jiu_jitsu_id, 'Jiu-Jitsu Adulto', 'adulto')
  returning id into v_belt_system_adulto_id;

  insert into public.belt_systems (school_id, modality_id, name, audience)
  values (new.id, v_jiu_jitsu_id, 'Jiu-Jitsu Kids', 'kids')
  returning id into v_belt_system_kids_id;

  insert into public.belts (school_id, belt_system_id, name, color_hex, ordering, max_degrees) values
    (new.id, v_belt_system_adulto_id, 'Branca', '#F4F4F5', 1, 4),
    (new.id, v_belt_system_adulto_id, 'Azul', '#2563EB', 2, 4),
    (new.id, v_belt_system_adulto_id, 'Roxa', '#7C3AED', 3, 4),
    (new.id, v_belt_system_adulto_id, 'Marrom', '#78350F', 4, 4),
    (new.id, v_belt_system_adulto_id, 'Preta', '#18181B', 5, 6),
    (new.id, v_belt_system_adulto_id, 'Vermelha e preta', '#7F1D1D', 6, 7),
    (new.id, v_belt_system_adulto_id, 'Vermelha e branca', '#DC2626', 7, 8),
    (new.id, v_belt_system_adulto_id, 'Vermelha', '#C8102E', 8, 10),
    (new.id, v_belt_system_kids_id, 'Branca', '#F4F4F5', 1, 4),
    (new.id, v_belt_system_kids_id, 'Cinza e branca', '#D1D5DB', 2, 4),
    (new.id, v_belt_system_kids_id, 'Cinza', '#9CA3AF', 3, 4),
    (new.id, v_belt_system_kids_id, 'Cinza e preta', '#6B7280', 4, 4),
    (new.id, v_belt_system_kids_id, 'Amarela e branca', '#FEF3C7', 5, 4),
    (new.id, v_belt_system_kids_id, 'Amarela', '#FACC15', 6, 4),
    (new.id, v_belt_system_kids_id, 'Amarela e preta', '#EAB308', 7, 4),
    (new.id, v_belt_system_kids_id, 'Laranja e branca', '#FED7AA', 8, 4),
    (new.id, v_belt_system_kids_id, 'Laranja', '#F97316', 9, 4),
    (new.id, v_belt_system_kids_id, 'Laranja e preta', '#EA580C', 10, 4),
    (new.id, v_belt_system_kids_id, 'Verde e branca', '#BBF7D0', 11, 4),
    (new.id, v_belt_system_kids_id, 'Verde', '#16A34A', 12, 4),
    (new.id, v_belt_system_kids_id, 'Verde e preta', '#15803D', 13, 4);

  insert into public.financial_accounts (school_id, name, type) values
    (new.id, 'Caixa', 'cash'),
    (new.id, 'Conta Bancaria', 'bank'),
    (new.id, 'Pix', 'pix'),
    (new.id, 'Cartao', 'card');

  return new;
end;
$$;

do $$
declare
  v_system record;
begin
  for v_system in
    select id, school_id
    from public.belt_systems
    where name = 'Jiu-Jitsu Adulto'
  loop
    update public.belts
    set ordering = ordering + 100
    where belt_system_id = v_system.id;

    update public.belts
    set name = 'Vermelha e preta'
    where belt_system_id = v_system.id
      and name = 'Coral'
      and not exists (
        select 1 from public.belts
        where belt_system_id = v_system.id and name = 'Vermelha e preta'
      );

    insert into public.belts (school_id, belt_system_id, name, color_hex, ordering, max_degrees) values
      (v_system.school_id, v_system.id, 'Branca', '#F4F4F5', 1, 4),
      (v_system.school_id, v_system.id, 'Azul', '#2563EB', 2, 4),
      (v_system.school_id, v_system.id, 'Roxa', '#7C3AED', 3, 4),
      (v_system.school_id, v_system.id, 'Marrom', '#78350F', 4, 4),
      (v_system.school_id, v_system.id, 'Preta', '#18181B', 5, 6),
      (v_system.school_id, v_system.id, 'Vermelha e preta', '#7F1D1D', 6, 7),
      (v_system.school_id, v_system.id, 'Vermelha e branca', '#DC2626', 7, 8),
      (v_system.school_id, v_system.id, 'Vermelha', '#C8102E', 8, 10)
    on conflict (belt_system_id, name) do nothing;

    update public.belts
    set ordering = v.ordering,
        color_hex = v.color_hex,
        max_degrees = v.max_degrees
    from (values
      ('Branca', '#F4F4F5', 1, 4),
      ('Azul', '#2563EB', 2, 4),
      ('Roxa', '#7C3AED', 3, 4),
      ('Marrom', '#78350F', 4, 4),
      ('Preta', '#18181B', 5, 6),
      ('Vermelha e preta', '#7F1D1D', 6, 7),
      ('Vermelha e branca', '#DC2626', 7, 8),
      ('Vermelha', '#C8102E', 8, 10)
    ) as v(name, color_hex, ordering, max_degrees)
    where belts.belt_system_id = v_system.id
      and belts.name = v.name;
  end loop;

  for v_system in
    select id, school_id
    from public.belt_systems
    where name = 'Jiu-Jitsu Kids'
  loop
    update public.belts
    set ordering = ordering + 100
    where belt_system_id = v_system.id;

    insert into public.belts (school_id, belt_system_id, name, color_hex, ordering, max_degrees) values
      (v_system.school_id, v_system.id, 'Branca', '#F4F4F5', 1, 4),
      (v_system.school_id, v_system.id, 'Cinza e branca', '#D1D5DB', 2, 4),
      (v_system.school_id, v_system.id, 'Cinza', '#9CA3AF', 3, 4),
      (v_system.school_id, v_system.id, 'Cinza e preta', '#6B7280', 4, 4),
      (v_system.school_id, v_system.id, 'Amarela e branca', '#FEF3C7', 5, 4),
      (v_system.school_id, v_system.id, 'Amarela', '#FACC15', 6, 4),
      (v_system.school_id, v_system.id, 'Amarela e preta', '#EAB308', 7, 4),
      (v_system.school_id, v_system.id, 'Laranja e branca', '#FED7AA', 8, 4),
      (v_system.school_id, v_system.id, 'Laranja', '#F97316', 9, 4),
      (v_system.school_id, v_system.id, 'Laranja e preta', '#EA580C', 10, 4),
      (v_system.school_id, v_system.id, 'Verde e branca', '#BBF7D0', 11, 4),
      (v_system.school_id, v_system.id, 'Verde', '#16A34A', 12, 4),
      (v_system.school_id, v_system.id, 'Verde e preta', '#15803D', 13, 4)
    on conflict (belt_system_id, name) do nothing;

    update public.belts
    set ordering = v.ordering,
        color_hex = v.color_hex,
        max_degrees = v.max_degrees
    from (values
      ('Branca', '#F4F4F5', 1, 4),
      ('Cinza e branca', '#D1D5DB', 2, 4),
      ('Cinza', '#9CA3AF', 3, 4),
      ('Cinza e preta', '#6B7280', 4, 4),
      ('Amarela e branca', '#FEF3C7', 5, 4),
      ('Amarela', '#FACC15', 6, 4),
      ('Amarela e preta', '#EAB308', 7, 4),
      ('Laranja e branca', '#FED7AA', 8, 4),
      ('Laranja', '#F97316', 9, 4),
      ('Laranja e preta', '#EA580C', 10, 4),
      ('Verde e branca', '#BBF7D0', 11, 4),
      ('Verde', '#16A34A', 12, 4),
      ('Verde e preta', '#15803D', 13, 4)
    ) as v(name, color_hex, ordering, max_degrees)
    where belts.belt_system_id = v_system.id
      and belts.name = v.name;
  end loop;
end;
$$;
