import Link from 'next/link';
import {
  Bot,
  CheckCheck,
  Columns3,
  MessageCircle,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { ConversationList } from '@/components/whatsapp/conversation-list';
import { InboxRefresh } from '@/components/whatsapp/inbox-refresh';
import { MessageThread } from '@/components/whatsapp/message-thread';
import { PipelineStageSelect } from '@/components/whatsapp/pipeline-stage-select';
import { ReplyComposer } from '@/components/whatsapp/reply-composer';
import { loadWhatsappInbox, type InboxMessage } from '@/lib/whatsapp-inbox';

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
  const messageKey = selected
    ? `${selected.id}:${selected.messages.at(-1)?.id || selected.lastMessageAt}`
    : 'empty';

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-[600px] flex-col gap-3">
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
        <ConversationList conversations={inbox.conversations} selectedId={selected?.id} />

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
                      {formatPhone(selected.phone)} • atualizado {dateLabel(selected.lastMessageAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PipelineStageSelect conversationId={selected.id} initialStage={selected.status} />
                  <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 2xl:inline-flex">
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

              <MessageThread messageKey={messageKey}>
                {selected.messages.length ? (
                  selected.messages.map((message) => <MessageBubble key={message.id} message={message} />)
                ) : (
                  <p className="rounded-xl bg-white/80 p-4 text-center text-sm text-slate-500">
                    Ainda não há mensagens salvas nesta conversa.
                  </p>
                )}
              </MessageThread>

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
