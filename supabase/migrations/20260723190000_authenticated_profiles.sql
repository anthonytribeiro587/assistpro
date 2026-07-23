-- Vincula usuários do Supabase Auth à empresa do AssistPro.
-- Mantém o RLS funcional para acessos futuros feitos com a chave pública.

create or replace function public.handle_new_assistpro_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_company_id uuid;
begin
  select id
    into target_company_id
  from public.companies
  order by created_at asc
  limit 1;

  if target_company_id is null then
    insert into public.companies (name, trade_name)
    values ('JR Celular', 'JR Celular')
    returning id into target_company_id;
  end if;

  insert into public.profiles (id, company_id, full_name, role)
  values (
    new.id,
    target_company_id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'Usuário'),
    case
      when not exists (select 1 from public.profiles) then 'owner'::public.user_role
      else 'attendant'::public.user_role
    end
  )
  on conflict (id) do update
    set company_id = excluded.company_id,
        full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assistpro on auth.users;
create trigger on_auth_user_created_assistpro
after insert on auth.users
for each row execute procedure public.handle_new_assistpro_user();

-- Cria perfil para usuários que já existiam antes desta migration.
with pending_users as (
  select
    user_row.id,
    user_row.email,
    user_row.raw_user_meta_data,
    row_number() over (order by user_row.created_at asc, user_row.id) as position
  from auth.users user_row
  where not exists (
    select 1 from public.profiles profile where profile.id = user_row.id
  )
), company_row as (
  select id from public.companies order by created_at asc limit 1
), profile_state as (
  select exists(select 1 from public.profiles) as already_has_profile
)
insert into public.profiles (id, company_id, full_name, role)
select
  pending_users.id,
  company_row.id,
  coalesce(
    nullif(pending_users.raw_user_meta_data ->> 'full_name', ''),
    split_part(pending_users.email, '@', 1),
    'Usuário'
  ),
  case
    when not profile_state.already_has_profile and pending_users.position = 1
      then 'owner'::public.user_role
    else 'attendant'::public.user_role
  end
from pending_users
cross join company_row
cross join profile_state;
