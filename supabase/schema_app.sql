-- AssistPro - schema completo da aplicação
-- Use em um projeto novo do Supabase ou adapte como migration se o schema antigo já foi executado.

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade_name text,
  whatsapp_number text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  role text not null default 'attendant' check (role in ('owner','admin','attendant','technician')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  document text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone)
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  brand text,
  model text not null,
  color text,
  imei text,
  serial_number text,
  passcode_hint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  device_id uuid not null references public.devices(id),
  os_number bigint generated always as identity,
  status text not null default 'received' check (status in ('received','diagnosis','quote_sent','waiting_approval','in_progress','waiting_part','quality_test','ready','delivered','canceled')),
  issue text not null,
  technician_id uuid references public.profiles(id),
  entry_at timestamptz not null default now(),
  due_at timestamptz,
  approved_at timestamptz,
  delivered_at timestamptz,
  total_amount numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, os_number)
);

create table if not exists public.service_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  description text not null,
  item_type text not null default 'service' check (item_type in ('service','part','discount')),
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.service_order_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  from_status text,
  to_status text,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.service_order_files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  file_path text not null,
  file_type text not null,
  label text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id),
  service_order_id uuid references public.service_orders(id),
  phone text not null,
  status text not null default 'open' check (status in ('open','waiting_human','closed')),
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  content_type text not null default 'text' check (content_type in ('text','audio','image','file')),
  body text,
  media_url text,
  provider_message_id text,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_tenant on public.profiles(tenant_id);
create index if not exists idx_customers_tenant_phone on public.customers(tenant_id, phone);
create index if not exists idx_devices_customer on public.devices(customer_id);
create index if not exists idx_service_orders_tenant_status on public.service_orders(tenant_id, status);
create index if not exists idx_service_order_events_order on public.service_order_events(service_order_id, created_at desc);
create index if not exists idx_whatsapp_conversations_tenant_phone on public.whatsapp_conversations(tenant_id, phone);

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.devices enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_order_items enable row level security;
alter table public.service_order_events enable row level security;
alter table public.service_order_files enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;

create or replace function public.current_tenant_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create policy "profiles same tenant" on public.profiles
  for select using (tenant_id = public.current_tenant_id());

create policy "customers same tenant" on public.customers
  for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

create policy "devices same tenant" on public.devices
  for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

create policy "orders same tenant" on public.service_orders
  for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

create policy "order items same tenant" on public.service_order_items
  for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

create policy "order events same tenant" on public.service_order_events
  for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

create policy "order files same tenant" on public.service_order_files
  for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

create policy "whatsapp conversations same tenant" on public.whatsapp_conversations
  for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

create policy "whatsapp messages same tenant" on public.whatsapp_messages
  for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
