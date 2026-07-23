'use client';

import { DragEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, GripVertical, Loader2, MessageCircle, Search } from 'lucide-react';
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
  const [draggedId, setDraggedId] = useState('');
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
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
    const current = items.find((item) => item.id === conversationId);
    if (!current || current.stage === stage || savingId) return;

    const previous = items;
    setError('');
    setSavingId(conversationId);
    setItems((list) =>
      list.map((item) => (item.id === conversationId ? { ...item, stage, status: stage } : item))
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
      setDraggedId('');
      setDragOverStage(null);
    }
  }

  function beginDrag(event: DragEvent<HTMLElement>, conversationId: string) {
    setDraggedId(conversationId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', conversationId);
  }

  function allowDrop(event: DragEvent<HTMLElement>, stage: PipelineStage) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  }

  function drop(event: DragEvent<HTMLElement>, stage: PipelineStage) {
    event.preventDefault();
    const conversationId = event.dataTransfer.getData('text/plain') || draggedId;
    if (conversationId) void moveConversation(conversationId, stage);
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
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">Arraste os cartões entre as etapas</span>
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
            const highlighted = dragOverStage === stage.id && Boolean(draggedId);

            return (
              <section
                key={stage.id}
                onDragOver={(event) => allowDrop(event, stage.id)}
                onDragLeave={() => setDragOverStage((current) => (current === stage.id ? null : current))}
                onDrop={(event) => drop(event, stage.id)}
                className={`flex min-h-[520px] flex-col rounded-2xl border transition ${stage.columnClass} ${
                  highlighted ? 'ring-2 ring-violet-400 ring-offset-2' : ''
                }`}
              >
                <header className={`rounded-t-2xl border-b border-black/5 px-3 py-3 ${stage.headerClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-extrabold">{stage.shortLabel}</h2>
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white/80 px-1.5 text-[11px] font-black text-slate-700 ring-1 ring-black/5">
                      {stageItems.length}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 opacity-75">{stage.description}</p>
                </header>

                <div className="flex-1 space-y-2 p-2.5">
                  {stageItems.map((conversation) => (
                    <article
                      key={conversation.id}
                      draggable={savingId !== conversation.id}
                      onDragStart={(event) => beginDrag(event, conversation.id)}
                      onDragEnd={() => {
                        setDraggedId('');
                        setDragOverStage(null);
                      }}
                      className={`rounded-xl border border-white/70 bg-white p-3 shadow-sm transition ${
                        draggedId === conversation.id ? 'scale-[.98] opacity-50' : 'hover:-translate-y-0.5 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <strong className="block truncate text-sm text-slate-950">{conversation.customerName}</strong>
                          <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">{formatPhone(conversation.phone)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          {savingId === conversation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                          ) : (
                            <GripVertical className="h-4 w-4 cursor-grab" aria-label="Arrastar atendimento" />
                          )}
                        </div>
                      </div>

                      <p className="mt-2 line-clamp-3 min-h-12 text-xs leading-4 text-slate-600">
                        {conversation.lastMessage?.content || 'Conversa iniciada sem mensagem registrada.'}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                        <span>{relativeDate(conversation.lastMessageAt)}</span>
                        {conversation.humanTakeover ? <span className="font-bold text-amber-700">Humano</span> : null}
                      </div>

                      <select
                        value={conversation.stage}
                        disabled={savingId === conversation.id}
                        onChange={(event) => void moveConversation(conversation.id, event.target.value as PipelineStage)}
                        className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-400"
                        aria-label="Alterar etapa"
                      >
                        {pipelineStages.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>

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
                    <div className={`rounded-xl border border-dashed p-4 text-center text-xs ${
                      highlighted ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-slate-300 bg-white/60 text-slate-400'
                    }`}>
                      {highlighted ? 'Solte o atendimento aqui.' : 'Nenhum atendimento nesta etapa.'}
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
