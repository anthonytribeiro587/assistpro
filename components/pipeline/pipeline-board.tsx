'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Loader2, MessageCircle, Search } from 'lucide-react';
import type { InboxConversation } from '@/lib/whatsapp-inbox';
import {
  normalizePipelineStage,
  pipelineStages,
  type PipelineStage
} from '@/lib/pipeline';

type PipelineConversation = InboxConversation & { stage: PipelineStage };

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return phone;
}

function relativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function PipelineBoard({ conversations }: { conversations: InboxConversation[] }) {
  const [items, setItems] = useState<PipelineConversation[]>(() =>
    conversations.map((conversation) => ({
      ...conversation,
      stage: normalizePipelineStage(conversation.status)
    }))
  );
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      [item.customerName, item.phone, item.lastMessage?.content]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [items, query]);

  async function moveConversation(conversationId: string, stage: PipelineStage) {
    const previous = items;
    setError('');
    setSavingId(conversationId);
    setItems((current) =>
      current.map((item) => (item.id === conversationId ? { ...item, stage, status: stage } : item))
    );

    try {
      const response = await fetch(`/api/pipeline/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage })
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Não foi possível atualizar a etapa.');
    } catch (requestError) {
      setItems(previous);
      setError(requestError instanceof Error ? requestError.message : 'Falha ao atualizar o funil.');
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500 md:max-w-md">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Buscar cliente, telefone ou mensagem"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1.5">{filtered.length} atendimentos</span>
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">Atualização manual por etapa</span>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : null}

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1540px] grid-cols-7 gap-3">
          {pipelineStages.map((stage) => {
            const stageItems = filtered.filter((item) => item.stage === stage.id);
            return (
              <section key={stage.id} className="flex min-h-[520px] flex-col rounded-2xl border border-slate-200 bg-slate-100/80">
                <header className="border-b border-slate-200 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900">{stage.shortLabel}</h2>
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                      {stageItems.length}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{stage.description}</p>
                </header>

                <div className="flex-1 space-y-2 p-2.5">
                  {stageItems.map((conversation) => (
                    <article key={conversation.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <strong className="block truncate text-sm text-slate-950">{conversation.customerName}</strong>
                          <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">{formatPhone(conversation.phone)}</span>
                        </div>
                        {savingId === conversation.id ? <Loader2 className="h-4 w-4 animate-spin text-violet-600" /> : null}
                      </div>

                      <p className="mt-2 line-clamp-3 min-h-12 text-xs leading-4 text-slate-600">
                        {conversation.lastMessage?.content || 'Conversa iniciada sem mensagem registrada.'}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                        <span>{relativeDate(conversation.lastMessageAt)}</span>
                        {conversation.humanTakeover ? <span className="font-bold text-amber-700">Humano</span> : null}
                      </div>

                      <label className="mt-3 block">
                        <span className="sr-only">Alterar etapa</span>
                        <select
                          value={conversation.stage}
                          disabled={savingId === conversation.id}
                          onChange={(event) => void moveConversation(conversation.id, event.target.value as PipelineStage)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-400"
                        >
                          {pipelineStages.map((option) => (
                            <option key={option.id} value={option.id}>{option.label}</option>
                          ))}
                        </select>
                      </label>

                      <Link
                        href={`/whatsapp?conversation=${conversation.id}`}
                        className="mt-2 flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
                      >
                        <span className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> Abrir conversa</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </article>
                  ))}

                  {!stageItems.length ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-4 text-center text-xs text-slate-400">
                      Nenhum atendimento nesta etapa.
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
