'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Search, UserRound } from 'lucide-react';
import type { InboxConversation } from '@/lib/whatsapp-inbox';
import { pipelineStageLabel } from '@/lib/pipeline';

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

export function ConversationList({
  conversations,
  selectedId
}: {
  conversations: InboxConversation[];
  selectedId?: string;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations;
    return conversations.filter((conversation) =>
      [conversation.customerName, conversation.phone, conversation.lastMessage?.content]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [conversations, query]);

  return (
    <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white xl:border-b-0 xl:border-r">
      <div className="border-b border-slate-200 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-xs outline-none"
            placeholder="Buscar nome, telefone ou mensagem"
            aria-label="Buscar conversa"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px]">
          <span className="rounded-full bg-violet-50 px-2.5 py-1 font-black text-violet-700">
            {filtered.length} de {conversations.length}
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Conectado
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filtered.length ? (
          filtered.map((conversation) => {
            const active = selectedId === conversation.id;
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
              <p className="mt-3 text-sm font-bold text-slate-700">
                {conversations.length ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa registrada'}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {conversations.length ? 'Tente outro nome, telefone ou trecho da mensagem.' : 'Novas mensagens aparecerão aqui.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
