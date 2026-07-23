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
insert into public.profiles (id, company_id, full_name, role)
select
  user_row.id,
  company_row.id,
  coalesce(nullif(user_row.raw_user_meta_data ->> 'full_name', ''), split_part(user_row.email, '@', 1), 'Usuário'),
  case
    when not exists (select 1 from public.profiles) then 'owner'::public.user_role
    else 'attendant'::public.user_role
  end
from auth.users user_row
cross join lateral (
  select id from public.companies order by created_at asc limit 1
) company_row
where not exists (
  select 1 from public.profiles profile where profile.id = user_row.id
);
