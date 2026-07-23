'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Search, SlidersHorizontal } from 'lucide-react';
import type { CustomerDirectoryRow } from '@/lib/customer-directory';
import { pipelineStages, type PipelineStage } from '@/lib/pipeline';

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return phone;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function CustomerTable({ rows }: { rows: CustomerDirectoryRow[] }) {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<'all' | PipelineStage>('all');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStage = stage === 'all' || row.pipelineStage === stage;
      const matchesQuery =
        !normalized ||
        [row.name, row.phone, row.lastDevice, row.notes]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      return matchesStage && matchesQuery;
    });
  }, [query, rows, stage]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500 md:max-w-md">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Buscar por nome, telefone ou aparelho"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value as 'all' | PipelineStage)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400"
          >
            <option value="all">Todas as etapas</option>
            {pipelineStages.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
            {filtered.length} clientes
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-extrabold">Cliente</th>
              <th className="px-4 py-3 font-extrabold">Contato</th>
              <th className="px-4 py-3 font-extrabold">Etapa atual</th>
              <th className="px-4 py-3 font-extrabold">OS</th>
              <th className="px-4 py-3 font-extrabold">Último aparelho</th>
              <th className="px-4 py-3 font-extrabold">Última interação</th>
              <th className="px-4 py-3 text-right font-extrabold">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row) => (
              <tr key={row.id} className="transition hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <div className="min-w-[170px]">
                    <strong className="block text-sm text-slate-950">{row.name}</strong>
                    <span className="mt-0.5 block max-w-[260px] truncate text-xs text-slate-500">
                      {row.notes || 'Sem observações cadastradas'}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">
                  {formatPhone(row.phone)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    row.humanTakeover
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-violet-50 text-violet-700'
                  }`}>
                    {row.pipelineLabel}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  <strong>{row.activeOrders}</strong> ativa{row.activeOrders === 1 ? '' : 's'}
                  <span className="ml-1 text-xs text-slate-400">({row.totalOrders} total)</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.lastDevice}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                  {formatDate(row.lastInteractionAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.conversationId ? (
                    <Link
                      href={`/whatsapp?conversation=${row.conversationId}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Conversa
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Sem conversa</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!filtered.length ? (
        <div className="border-t border-slate-200 p-8 text-center text-sm text-slate-500">
          Nenhum cliente encontrado com os filtros atuais.
        </div>
      ) : null}
    </section>
  );
}
