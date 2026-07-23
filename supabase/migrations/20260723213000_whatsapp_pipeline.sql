-- Mantém a etapa operacional da conversa mesmo quando integrações antigas enviam status "open".
-- Execute esta migration no SQL Editor do Supabase antes de usar o funil em produção.

create or replace function public.normalize_assistpro_pipeline_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status is null or new.status = '' or new.status = 'open' then
      new.status := 'contato_iniciado';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status = 'open' and old.status in (
    'contato_iniciado',
    'necessidade_identificada',
    'cotacao_pendente',
    'responder_orcamento',
    'aguardando_cliente',
    'encaminhado_loja',
    'concluido'
  ) then
    new.status := old.status;
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_assistpro_pipeline_status_trigger
on public.whatsapp_conversations;

create trigger normalize_assistpro_pipeline_status_trigger
before insert or update of status on public.whatsapp_conversations
for each row execute procedure public.normalize_assistpro_pipeline_status();

update public.whatsapp_conversations
set status = 'contato_iniciado'
where status is null or status = '' or status = 'open';

alter table public.whatsapp_conversations
alter column status set default 'contato_iniciado';

create index if not exists idx_whatsapp_conversations_company_status
on public.whatsapp_conversations(company_id, status, last_message_at desc);
