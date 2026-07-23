import Link from 'next/link';
import {
  Bot,
  CheckCheck,
  Columns3,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { InboxRefresh } from '@/components/whatsapp/inbox-refresh';
import { ReplyComposer } from '@/components/whatsapp/reply-composer';
import { loadWhatsappInbox, type InboxMessage } from '@/lib/whatsapp-inbox';
import { pipelineStageLabel } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase())
      .join('') || 'CL'
  );
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
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function MessageBubble({ message }: { message: InboxMessage }) {
  const outbound = message.direction === 'outbound';
  const playableAudio = message.messageType === 'audio' && message.mediaUrl?.startsWith('https://');

  return (
    <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-xl px-3 py-2 text-[13px] shadow-sm sm:max-w-[74%] ${
          outbound
            ? 'rounded-br-sm bg-emerald-100 text-slate-900'
            : 'rounded-bl-sm bg-white text-slate-900'
        }`}
      >
        {playableAudio ? (
          <audio controls preload="none" src={message.mediaUrl || undefined} className="mb-2 max-w-full" />
        ) : null}
        {message.messageType === 'audio' && !playableAudio ? (
          <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-violet-700">Mensagem de voz</p>
        ) : null}
        <p className="whitespace-pre-wrap break-words leading-5">
          {message.content || (message.messageType === 'audio' ? 'Áudio enviado' : 'Mensagem sem conteúdo')}
        </p>
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[9px] text-slate-500">
          {message.aiGenerated ? <Bot className="h-3 w-3" /> : null}
          {time(message.createdAt)}
          {outbound ? <CheckCheck className="h-3 w-3" /> : null}
        </div>
      </div>
    </div>
  );
}

export default async function WhatsappPage({
  searchParams
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const params = await searchParams;
  const inbox = await loadWhatsappInbox();
  const selected =
    inbox.conversations.find((item) => item.id === params.conversation) || inbox.conversations[0] || null;

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-[620px] flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-600">Atendimento</p>
          <h1 className="mt-0.5 text-lg font-extrabold text-slate-950">WhatsApp</h1>
          <p className="text-xs text-slate-500">Conversas recebidas e respostas enviadas pela instância conectada.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <Columns3 className="h-4 w-4" /> Abrir funil
          </Link>
          <InboxRefresh />
        </div>
      </div>

      {inbox.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          {inbox.error}
        </div>
      ) : null}

      <section className="grid min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white xl:border-b-0 xl:border-r">
          <div className="border-b border-slate-200 p-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500">
              <Search className="h-4 w-4" />
              <input
                className="w-full bg-transparent text-xs outline-none"
                placeholder="Buscar nome ou telefone"
                aria-label="Buscar conversa"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="rounded-full bg-violet-50 px-2.5 py-1 font-black text-violet-700">
                {inbox.conversations.length} conversas
              </span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Conectado
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {inbox.conversations.length ? (
              inbox.conversations.map((conversation) => {
                const active = selected?.id === conversation.id;
                return (
                  <Link
                    key={conversation.id}
                    href={`/whatsapp?conversation=${conversation.id}`}
                    className={`flex items-start gap-2.5 rounded-xl p-2.5 transition ${
                      active ? 'bg-violet-50 ring-1 ring-violet-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[10px] font-black ${
                        active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {initials(conversation.customerName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="truncate text-xs text-slate-950">{conversation.customerName}</strong>
                        <span className="shrink-0 text-[9px] text-slate-400">{time(conversation.lastMessageAt)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                        {formatPhone(conversation.phone)}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-slate-500">
                        {conversation.lastMessage?.content || 'Conversa iniciada'}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                          {pipelineStageLabel(conversation.status)}
                        </span>
                        {conversation.humanTakeover ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700">
                            <UserRound className="h-2.5 w-2.5" /> Humano
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="grid min-h-52 place-items-center p-6 text-center">
                <div>
                  <MessageCircle className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">Nenhuma conversa registrada</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Novas mensagens aparecerão aqui.</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <article className="flex min-h-0 min-w-0 flex-col bg-[#efeae2]">
          {selected ? (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-100 text-[10px] font-black text-violet-700">
                    {initials(selected.customerName)}
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-sm text-slate-950">{selected.customerName}</strong>
                    <p className="truncate text-[10px] text-slate-500">
                      {formatPhone(selected.phone)} • {pipelineStageLabel(selected.status)} • {dateLabel(selected.lastMessageAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 sm:inline-flex">
                    <ShieldCheck className="h-3 w-3" /> Histórico salvo
                  </span>
                  <a
                    href={`tel:+${selected.phone}`}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600"
                    aria-label="Ligar"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 sm:p-4">
                {selected.messages.length ? (
                  selected.messages.map((message) => <MessageBubble key={message.id} message={message} />)
                ) : (
                  <p className="rounded-xl bg-white/80 p-4 text-center text-sm text-slate-500">
                    Ainda não há mensagens salvas nesta conversa.
                  </p>
                )}
              </div>

              <ReplyComposer conversationId={selected.id} />
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center">
              <div className="max-w-sm rounded-2xl bg-white p-6 shadow-sm">
                <MessageCircle className="mx-auto h-9 w-9 text-violet-300" />
                <h2 className="mt-3 text-base font-extrabold text-slate-950">Selecione uma conversa</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">O histórico e o campo de resposta aparecerão aqui.</p>
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
