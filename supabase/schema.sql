-- AssistPro MVP - Supabase schema
-- Rode este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create type public.user_role as enum ('owner', 'admin', 'attendant', 'technician');
create type public.service_order_status as enum (
  'recebido',
  'analise',
  'orcamento_enviado',
  'aguardando_aprovacao',
  'em_execucao',
  'aguardando_peca',
  'testes',
  'pronto',
  'entregue',
  'cancelado'
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade_name text,
  whatsapp_number text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'attendant',
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  phone text not null,
  document text,
  notes text,
  created_at timestamptz not null default now(),
  unique (company_id, phone)
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  brand text,
  model text not null,
  color text,
  imei text,
  serial_number text,
  unlock_info text,
  created_at timestamptz not null default now()
);

create table public.service_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  device_id uuid not null references public.devices(id),
  number bigint generated always as identity,
  status public.service_order_status not null default 'recebido',
  problem_description text not null,
  physical_condition text,
  accessories text,
  technician_id uuid references public.profiles(id),
  estimated_value numeric(12, 2) default 0,
  approved_value numeric(12, 2),
  entry_date timestamptz not null default now(),
  due_date timestamptz,
  delivered_at timestamptz,
  warranty_days integer default 90,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_order_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  from_status public.service_order_status,
  to_status public.service_order_status,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id),
  service_order_id uuid references public.service_orders(id),
  phone text not null,
  status text not null default 'open',
  human_takeover boolean not null default false,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null check (message_type in ('text', 'audio', 'image', 'system')),
  content text,
  media_url text,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.devices enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_order_events enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create policy "profiles see own company" on public.profiles
for select using (company_id = public.current_company_id() or id = auth.uid());

create policy "companies see own" on public.companies
for select using (id = public.current_company_id());

create policy "customers company isolation" on public.customers
for all using (company_id = public.current_company_id())
with check (company_id = public.current_company_id());

create policy "devices company isolation" on public.devices
for all using (company_id = public.current_company_id())
with check (company_id = public.current_company_id());

create policy "service orders company isolation" on public.service_orders
for all using (company_id = public.current_company_id())
with check (company_id = public.current_company_id());

create policy "events company isolation" on public.service_order_events
for all using (company_id = public.current_company_id())
with check (company_id = public.current_company_id());

create policy "conversations company isolation" on public.whatsapp_conversations
for all using (company_id = public.current_company_id())
with check (company_id = public.current_company_id());

create policy "messages company isolation" on public.whatsapp_messages
for all using (company_id = public.current_company_id())
with check (company_id = public.current_company_id());

create index idx_customers_company_phone on public.customers(company_id, phone);
create index idx_service_orders_company_status on public.service_orders(company_id, status);
create index idx_service_order_events_order on public.service_order_events(service_order_id, created_at desc);
create index idx_whatsapp_conversations_phone on public.whatsapp_conversations(company_id, phone);
