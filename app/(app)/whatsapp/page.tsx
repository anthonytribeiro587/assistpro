import Link from 'next/link';
import { Bot, CheckCheck, MessageCircle, Phone, Search, ShieldCheck, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { InboxRefresh } from '@/components/whatsapp/inbox-refresh';
import { ReplyComposer } from '@/components/whatsapp/reply-composer';
import { loadWhatsappInbox, type InboxMessage } from '@/lib/whatsapp-inbox';

export const dynamic = 'force-dynamic';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join('') || 'CL';
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return phone;
}

function time(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function MessageBubble({ message }: { message: InboxMessage }) {
  const outbound = message.direction === 'outbound';
  const playableAudio = message.messageType === 'audio' && message.mediaUrl?.startsWith('https://');

  return (
    <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[72%] ${outbound ? 'rounded-br-md bg-emerald-100 text-slate-900' : 'rounded-bl-md bg-white text-slate-900'}`}>
        {playableAudio ? <audio controls preload="none" src={message.mediaUrl || undefined} className="mb-2 max-w-full" /> : null}
        {message.messageType === 'audio' && !playableAudio ? <p className="mb-1 text-xs font-black uppercase tracking-wide text-violet-700">Mensagem de voz</p> : null}
        <p className="whitespace-pre-wrap break-words leading-5">{message.content || (message.messageType === 'audio' ? 'Áudio enviado' : 'Mensagem sem conteúdo')}</p>
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
          {message.aiGenerated ? <Bot className="h-3 w-3" /> : null}
          {time(message.createdAt)}
          {outbound ? <CheckCheck className="h-3 w-3" /> : null}
        </div>
      </div>
    </div>
  );
}

export default async function WhatsappPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const params = await searchParams;
  const inbox = await loadWhatsappInbox();
  const selected = inbox.conversations.find((item) => item.id === params.conversation) || inbox.conversations[0] || null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Atendimento • WhatsApp"
        title="Central de conversas"
        description="Mensagens reais recebidas pela Evolution e registradas no Supabase, com respostas humanas e automáticas no mesmo histórico."
        action={<InboxRefresh />}
      />

      {inbox.error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{inbox.error}</div>
      ) : null}

      <section className="grid min-h-[680px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white xl:border-b-0 xl:border-r">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500">
              <Search className="h-4 w-4" />
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Buscar nome ou telefone" aria-label="Buscar conversa" />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="rounded-full bg-violet-50 px-3 py-1.5 font-black text-violet-700">{inbox.conversations.length} conversas</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Evolution ativa</span>
            </div>
          </div>

          <div className="max-h-[610px] overflow-y-auto p-2">
            {inbox.conversations.length ? inbox.conversations.map((conversation) => {
              const active = selected?.id === conversation.id;
              return (
                <Link
                  key={conversation.id}
                  href={`/whatsapp?conversation=${conversation.id}`}
                  className={`flex items-start gap-3 rounded-2xl p-3 transition ${active ? 'bg-violet-50 ring-1 ring-violet-200' : 'hover:bg-slate-50'}`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-black ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{initials(conversation.customerName)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="truncate text-sm text-slate-950">{conversation.customerName}</strong>
                      <span className="shrink-0 text-[10px] text-slate-400">{time(conversation.lastMessageAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{formatPhone(conversation.phone)}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{conversation.lastMessage?.content || 'Conversa iniciada'}</p>
                    {conversation.humanTakeover ? <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700"><UserRound className="h-3 w-3" /> Atendimento humano</span> : null}
                  </div>
                </Link>
              );
            }) : (
              <div className="grid min-h-64 place-items-center p-6 text-center">
                <div><MessageCircle className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">Nenhuma conversa registrada</p><p className="mt-1 text-xs leading-5 text-slate-500">As próximas mensagens recebidas no WhatsApp aparecerão aqui.</p></div>
              </div>
            )}
          </div>
        </aside>

        <article className="flex min-w-0 flex-col bg-[#efeae2]">
          {selected ? (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-xs font-black text-violet-700">{initials(selected.customerName)}</span>
                  <div className="min-w-0"><strong className="block truncate text-sm text-slate-950">{selected.customerName}</strong><p className="truncate text-xs text-slate-500">{formatPhone(selected.phone)} • atualizado {dateLabel(selected.lastMessageAt)}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5" /> Histórico protegido</span>
                  <a href={`tel:+${selected.phone}`} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600" aria-label="Ligar"><Phone className="h-4 w-4" /></a>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                {selected.messages.length ? selected.messages.map((message) => <MessageBubble key={message.id} message={message} />) : <p className="rounded-xl bg-white/80 p-4 text-center text-sm text-slate-500">Ainda não há mensagens salvas nesta conversa.</p>}
              </div>

              <ReplyComposer conversationId={selected.id} />
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center">
              <div className="max-w-sm rounded-3xl bg-white p-8 shadow-sm"><MessageCircle className="mx-auto h-10 w-10 text-violet-300" /><h2 className="mt-4 text-xl font-black text-slate-950">Inbox conectado</h2><p className="mt-2 text-sm leading-6 text-slate-500">Selecione uma conversa para visualizar o histórico e responder pelo número conectado à Evolution.</p></div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
