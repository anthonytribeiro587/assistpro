-- Parametrizações operacionais do atendimento com IA
-- Execute no SQL Editor do Supabase ou aplique com Supabase CLI.

create table if not exists public.ai_business_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  business_name text not null default 'JR Celular',
  phone text,
  address_line text not null default '',
  neighborhood text not null default '',
  city text not null default '',
  state text not null default '',
  postal_code text not null default '',
  maps_url text,
  timezone text not null default 'America/Sao_Paulo',
  appointments_enabled boolean not null default false,
  walk_in_enabled boolean not null default true,
  ai_enabled boolean not null default true,
  audio_enabled boolean not null default true,
  outside_hours_reply_enabled boolean not null default true,
  human_handoff_enabled boolean not null default true,
  stock_followup_enabled boolean not null default true,
  quote_estimate text not null default 'Confirmado após a avaliação presencial do aparelho.',
  default_repair_estimate text not null default 'O prazo depende do diagnóstico e da disponibilidade da peça.',
  outside_hours_message text not null default '',
  human_handoff_message text not null default '',
  stock_pending_message text not null default '',
  custom_instructions text not null default '',
  business_hours jsonb not null default '[
    {"day":"monday","label":"Segunda-feira","enabled":true,"open":"09:00","close":"18:00"},
    {"day":"tuesday","label":"Terça-feira","enabled":true,"open":"09:00","close":"18:00"},
    {"day":"wednesday","label":"Quarta-feira","enabled":true,"open":"09:00","close":"18:00"},
    {"day":"thursday","label":"Quinta-feira","enabled":true,"open":"09:00","close":"18:00"},
    {"day":"friday","label":"Sexta-feira","enabled":true,"open":"09:00","close":"18:00"},
    {"day":"saturday","label":"Sábado","enabled":true,"open":"09:00","close":"13:00"},
    {"day":"sunday","label":"Domingo","enabled":false,"open":"09:00","close":"13:00"}
  ]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_business_settings_hours_array check (jsonb_typeof(business_hours) = 'array')
);

alter table public.ai_business_settings enable row level security;

drop policy if exists "ai settings company isolation" on public.ai_business_settings;
create policy "ai settings company isolation" on public.ai_business_settings
for all
using (company_id = public.current_company_id())
with check (company_id = public.current_company_id());

insert into public.ai_business_settings (
  company_id,
  business_name,
  address_line,
  neighborhood,
  city,
  state,
  postal_code,
  timezone,
  appointments_enabled,
  walk_in_enabled,
  ai_enabled,
  audio_enabled,
  outside_hours_reply_enabled,
  human_handoff_enabled,
  stock_followup_enabled,
  quote_estimate,
  default_repair_estimate,
  outside_hours_message,
  human_handoff_message,
  stock_pending_message,
  custom_instructions
)
select
  id,
  coalesce(nullif(trade_name, ''), name, 'JR Celular'),
  'Av. Sapucaia, 1877',
  'Primor',
  'Sapucaia do Sul',
  'RS',
  '93210-240',
  'America/Sao_Paulo',
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  'Confirmado após a avaliação presencial do aparelho.',
  'O prazo depende do diagnóstico e da disponibilidade da peça.',
  'No momento a JR Celular está fechada. Sua mensagem ficou registrada e a equipe poderá continuar o atendimento no próximo horário de funcionamento.',
  'Claro. A equipe da JR Celular pode continuar o atendimento por aqui assim que estiver disponível.',
  'Perfeito! Assim que a equipe confirmar a disponibilidade e o valor, o retorno será feito por aqui.',
  'Não oferecer agendamento. Para assistência, orientar o cliente a levar o aparelho durante o horário de atendimento.'
from public.companies
on conflict (company_id) do nothing;

create index if not exists idx_ai_business_settings_updated_at
  on public.ai_business_settings(updated_at desc);
