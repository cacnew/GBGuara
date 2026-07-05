-- Seeds de demonstração do NexusDojo (Fase 7.5).
--
-- Só roda em `supabase db reset` (ambiente local). Cria uma escola
-- piloto completa para validar o MVP 1A de ponta a ponta: 1 escola
-- (unidade/modalidades/faixas/contas financeiras já vêm do trigger
-- `create_default_school_setup`, Fases 1.2/2.1/2.2/5.3), 2 professores,
-- 30 alunos, 5 turmas, 2 tabelas de preço com 4 planos cada, contratos
-- variados (parcelas pagas/pendentes/vencidas), presenças e graduações.
--
-- Login de demonstração (admin/professor) continua sendo criado pelos
-- fluxos normais de onboarding/criação de login de professor — este
-- seed só popula dados de negócio, não `auth.users`.

do $$
declare
  v_school_id uuid;
  v_unit_id uuid;
  v_mod_jj uuid;
  v_mod_muaythai uuid;
  v_belt_system_adulto uuid;
  v_teacher1_id uuid;
  v_teacher2_id uuid;
  v_pt1_id uuid;
  v_pt2_id uuid;
  v_plan_ids uuid[];
  v_student_id uuid;
  v_student_ids uuid[] := '{}';
  v_belt_ids uuid[];
  v_cg_ids uuid[] := '{}';
  v_cg_id uuid;
  v_cs_id uuid;
  v_contract_id uuid;
  v_admin_user_id uuid;
  i int;
begin
  -- Escola piloto (idempotente: não duplica se já existir).
  select id into v_school_id from public.schools where name = 'Gracie Barra Demo';
  if v_school_id is null then
    insert into public.schools (name) values ('Gracie Barra Demo')
    returning id into v_school_id;
  end if;

  select id into v_unit_id from public.units where school_id = v_school_id limit 1;
  select id into v_mod_jj from public.modalities where school_id = v_school_id and slug = 'jiu_jitsu';
  select id into v_mod_muaythai from public.modalities where school_id = v_school_id and slug = 'muay_thai';
  select id into v_belt_system_adulto from public.belt_systems
    where school_id = v_school_id and audience = 'adulto';

  select array_agg(id order by ordering) into v_belt_ids
    from public.belts where belt_system_id = v_belt_system_adulto;

  select id into v_admin_user_id from public.users
    where school_id = v_school_id and role = 'admin' limit 1;

  -- 2 professores.
  insert into public.teachers (school_id, name, email, status)
  values (v_school_id, 'Professor Rafael Mendes', 'rafael.mendes@demo.nexusdojo.dev', 'active')
  returning id into v_teacher1_id;

  insert into public.teachers (school_id, name, email, status)
  values (v_school_id, 'Professora Camila Duarte', 'camila.duarte@demo.nexusdojo.dev', 'active')
  returning id into v_teacher2_id;

  -- 5 turmas.
  insert into public.class_groups
    (school_id, unit_id, modality_id, main_teacher_id, name, week_days, start_time, end_time, status)
  values
    (v_school_id, v_unit_id, v_mod_jj, v_teacher1_id, 'Jiu-Jitsu Adulto - Manhã', array[1,3,5], '07:00', '08:00', 'active'),
    (v_school_id, v_unit_id, v_mod_jj, v_teacher1_id, 'Jiu-Jitsu Adulto - Noite', array[2,4], '19:00', '20:30', 'active'),
    (v_school_id, v_unit_id, v_mod_jj, v_teacher2_id, 'Jiu-Jitsu Kids', array[2,4,6], '17:00', '18:00', 'active'),
    (v_school_id, v_unit_id, v_mod_muaythai, v_teacher2_id, 'Muay Thai', array[1,3,5], '20:00', '21:00', 'active'),
    (v_school_id, v_unit_id, v_mod_jj, v_teacher1_id, 'Open Mat Sábado', array[6], '10:00', '12:00', 'active');

  select array_agg(id) into v_cg_ids from public.class_groups where school_id = v_school_id;

  -- 2 tabelas de preço com 4 planos cada.
  insert into public.price_tables (school_id, name, valid_from, status)
  values (v_school_id, 'Tabela 2026', '2026-01-01', 'active')
  returning id into v_pt1_id;

  insert into public.price_tables (school_id, name, valid_from, valid_until, status)
  values (v_school_id, 'Tabela 2025 (legado)', '2025-01-01', '2025-12-31', 'legacy')
  returning id into v_pt2_id;

  insert into public.plans (school_id, price_table_id, name, plan_duration, duration_months, base_price, unlimited, setup_fee, status)
  values
    (v_school_id, v_pt1_id, 'Mensal Ilimitado', 'monthly', 1, 250, true, 100, 'active'),
    (v_school_id, v_pt1_id, 'Trimestral Ilimitado', 'quarterly', 3, 690, true, 100, 'active'),
    (v_school_id, v_pt1_id, 'Anual Ilimitado', 'annual', 12, 2400, true, 100, 'active'),
    (v_school_id, v_pt1_id, '2x por semana', 'monthly', 1, 180, false, 100, 'active'),
    (v_school_id, v_pt2_id, 'Mensal Ilimitado 2025', 'monthly', 1, 220, true, 80, 'legacy'),
    (v_school_id, v_pt2_id, 'Trimestral Ilimitado 2025', 'quarterly', 3, 600, true, 80, 'legacy'),
    (v_school_id, v_pt2_id, 'Anual Ilimitado 2025', 'annual', 12, 2100, true, 80, 'legacy'),
    (v_school_id, v_pt2_id, '2x por semana 2025', 'monthly', 1, 160, false, 80, 'legacy');

  select array_agg(id) into v_plan_ids from public.plans where price_table_id = v_pt1_id;

  -- 30 alunos, com faixa/grau variados.
  for i in 1..30 loop
    insert into public.students (
      school_id, unit_id, name, birth_date, phone, status,
      current_belt_id, current_degree, enrollment_date
    ) values (
      v_school_id,
      v_unit_id,
      'Aluno Demo ' || i,
      (date '1990-01-01' + (i * 137) * interval '1 day')::date,
      '119' || lpad(i::text, 8, '0'),
      'ativo',
      v_belt_ids[1 + (i % array_length(v_belt_ids, 1))],
      i % 4,
      (current_date - ((30 - i) * 12) * interval '1 day')::date
    )
    returning id into v_student_id;

    v_student_ids := array_append(v_student_ids, v_student_id);

    -- Contrato para os primeiros 24 alunos (os últimos 6 ficam "sem contrato").
    if i <= 24 then
      insert into public.contracts (
        school_id, financial_responsible_type, financial_responsible_id,
        plan_id, price_table_id, start_date, original_price, final_price,
        installments_count, installment_amount, first_due_date
      ) values (
        v_school_id, 'student', v_student_id,
        v_plan_ids[1 + (i % array_length(v_plan_ids, 1))], v_pt1_id,
        (current_date - 60 * interval '1 day')::date,
        250, 250, 3, 83.33,
        (current_date - 60 * interval '1 day')::date
      )
      returning id into v_contract_id;

      insert into public.contract_students (school_id, contract_id, student_id)
      values (v_school_id, v_contract_id, v_student_id);

      update public.students set current_contract_id = v_contract_id where id = v_student_id;

      -- Varia o status das parcelas para dar sinal de demonstração:
      -- 1/3 dos alunos com parcela vencida, 1/3 com pagamento parcial,
      -- 1/3 em dia (trigger já gerou as 3 parcelas como 'pending').
      if i % 3 = 0 then
        update public.contract_installments
        set status = 'pending', due_date = (current_date - 20 * interval '1 day')::date
        where contract_id = v_contract_id and installment_number = 1;
      elsif i % 3 = 1 then
        update public.contract_installments
        set status = 'partially_paid', paid_amount = 40, remaining_amount = 43.33,
            payment_date = (current_date - 5 * interval '1 day')::date, payment_method = 'pix'
        where contract_id = v_contract_id and installment_number = 1;
      else
        update public.contract_installments
        set status = 'paid', paid_amount = 83.33, remaining_amount = 0,
            payment_date = (current_date - 5 * interval '1 day')::date, payment_method = 'pix'
        where contract_id = v_contract_id and installment_number = 1;
      end if;
    end if;

    -- Graduação para metade dos alunos.
    if i % 2 = 0 then
      insert into public.graduation_history (
        school_id, student_id, modality_id, new_belt_id, new_degree, graduation_date
      ) values (
        v_school_id, v_student_id, v_mod_jj,
        v_belt_ids[1 + (i % array_length(v_belt_ids, 1))], i % 4,
        (current_date - 30 * interval '1 day')::date
      );
    end if;
  end loop;

  -- Sessões + presenças: últimas 4 ocorrências de cada turma, com os
  -- primeiros 15 alunos comparecendo de forma intercalada.
  foreach v_cg_id in array v_cg_ids loop
    for i in 0..3 loop
      insert into public.class_sessions (school_id, class_group_id, date, status)
      values (v_school_id, v_cg_id, (current_date - (i * 7) * interval '1 day')::date, 'realizada')
      returning id into v_cs_id;

      if v_admin_user_id is not null then
        insert into public.attendances (school_id, class_session_id, student_id, registered_by_user_id, status)
        select v_school_id, v_cs_id, v_student_ids[s], v_admin_user_id, 'presente'
        from generate_series(1, 15) as s
        where (s + i) % 3 != 0
        on conflict (class_session_id, student_id) do nothing;
      end if;
    end loop;
  end loop;
end $$;
