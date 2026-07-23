'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Edit3,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Trash2,
  X
} from 'lucide-react';
import type { CustomerDirectoryRow } from '@/lib/customer-directory';
import { pipelineStageMeta, pipelineStages, type PipelineStage } from '@/lib/pipeline';

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

export function CustomerTable({ rows: initialRows }: { rows: CustomerDirectoryRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<'all' | PipelineStage>('all');
  const [editing, setEditing] = useState<CustomerDirectoryRow | null>(null);
  const [deleting, setDeleting] = useState<CustomerDirectoryRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStage = stage === 'all' || row.pipelineStage === stage;
      const matchesQuery =
        !normalized ||
        [row.name, row.phone, row.document, row.lastDevice, row.notes]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      return matchesStage && matchesQuery;
    });
  }, [query, rows, stage]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');

    try {
      const response = await fetch(`/api/customers/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(form.get('name') || ''),
          phone: String(form.get('phone') || ''),
          document: String(form.get('document') || '') || null,
          notes: String(form.get('notes') || '') || null
        })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        customer?: { name: string; phone: string; document?: string | null; notes?: string | null };
      };
      if (!response.ok || !payload.ok || !payload.customer) {
        throw new Error(payload.error || 'Não foi possível salvar o cliente.');
      }

      setRows((current) => current.map((row) =>
        row.id === editing.id
          ? {
              ...row,
              name: payload.customer?.name || row.name,
              phone: payload.customer?.phone || row.phone,
              document: payload.customer?.document || '',
              notes: payload.customer?.notes || ''
            }
          : row
      ));
      setEditing(null);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha ao salvar o cliente.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    setError('');

    try {
      const response = await fetch(`/api/customers/${deleting.id}`, { method: 'DELETE' });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Não foi possível excluir o cliente.');
      setRows((current) => current.filter((row) => row.id !== deleting.id));
      setDeleting(null);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha ao excluir o cliente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500 md:max-w-md">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Buscar nome, telefone, documento ou aparelho"
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

        {error ? <div className="border-b border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}

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
                <th className="px-4 py-3 text-right font-extrabold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => {
                const stageMeta = pipelineStageMeta(row.pipelineStage);
                return (
                  <tr key={row.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="min-w-[170px]">
                        <strong className="block text-sm text-slate-950">{row.name}</strong>
                        <span className="mt-0.5 block max-w-[260px] truncate text-xs text-slate-500">
                          {row.document || row.notes || 'Sem observações cadastradas'}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">{formatPhone(row.phone)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${stageMeta.badgeClass}`}>
                        {row.pipelineLabel}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      <strong>{row.activeOrders}</strong> ativa{row.activeOrders === 1 ? '' : 's'}
                      <span className="ml-1 text-xs text-slate-400">({row.totalOrders} total)</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.lastDevice}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatDate(row.lastInteractionAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {row.conversationId ? (
                          <Link
                            href={`/whatsapp?conversation=${row.conversationId}`}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                            aria-label="Abrir conversa"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Link>
                        ) : null}
                        <button
                          onClick={() => { setError(''); setEditing(row); }}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                          aria-label="Editar cliente"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setError(''); setDeleting(row); }}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                          aria-label="Excluir cliente"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!filtered.length ? (
          <div className="border-t border-slate-200 p-8 text-center text-sm text-slate-500">
            Nenhum cliente encontrado com os filtros atuais.
          </div>
        ) : null}
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div><p className="text-[10px] font-black uppercase tracking-wide text-violet-600">Cadastro</p><h2 className="text-lg font-extrabold text-slate-950">Editar cliente</h2></div>
              <button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </header>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <label className="block md:col-span-2"><span className="text-xs font-bold text-slate-700">Nome</span><input name="name" defaultValue={editing.name} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Telefone</span><input name="phone" defaultValue={editing.phone} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">CPF/CNPJ</span><input name="document" defaultValue={editing.document} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" /></label>
              <label className="block md:col-span-2"><span className="text-xs font-bold text-slate-700">Observações</span><textarea name="notes" defaultValue={editing.notes} className="mt-1.5 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" /></label>
            </div>
            {error ? <div className="mx-5 mb-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div> : null}
            <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Cancelar</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar</button></footer>
          </form>
        </div>
      ) : null}

      {deleting ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
            <h2 className="mt-4 text-lg font-extrabold text-slate-950">Excluir {deleting.name}?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">O cadastro só será removido quando não possuir nenhuma ordem de serviço vinculada. O histórico do WhatsApp será preservado.</p>
            {error ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeleting(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Cancelar</button><button onClick={() => void remove()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Excluir</button></div>
          </div>
        </div>
      ) : null}
    </>
  );
}
