'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Edit3,
  Loader2,
  MoreHorizontal,
  Search,
  Smartphone,
  Trash2,
  X
} from 'lucide-react';
import {
  serviceOrderStatusClasses,
  serviceOrderStatusLabels,
  serviceOrderStatuses,
  type DatabaseServiceOrderStatus,
  type ServiceOrderRow
} from '@/lib/service-order-data';
import { formatMoney } from '@/lib/format';

type TechnicianOption = { id: string; name: string };

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return phone;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function dateInputValue(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function StatusPill({ status }: { status: DatabaseServiceOrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${serviceOrderStatusClasses[status]}`}>
      {serviceOrderStatusLabels[status]}
    </span>
  );
}

export function ServiceOrdersTable({
  initialRows,
  technicians
}: {
  initialRows: ServiceOrderRow[];
  technicians: TechnicianOption[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DatabaseServiceOrderStatus>('all');
  const [editing, setEditing] = useState<ServiceOrderRow | null>(null);
  const [deleting, setDeleting] = useState<ServiceOrderRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesQuery =
        !normalized ||
        [
          String(order.number),
          order.customerName,
          order.phone,
          order.brand,
          order.model,
          order.problemDescription,
          order.technicianName
        ].some((value) => value.toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [query, rows, statusFilter]);

  const counts = useMemo(() => ({
    all: rows.length,
    open: rows.filter((order) => !['entregue', 'cancelado'].includes(order.status)).length,
    progress: rows.filter((order) => ['em_execucao', 'testes'].includes(order.status)).length,
    waiting: rows.filter((order) => ['orcamento_enviado', 'aguardando_aprovacao', 'aguardando_peca'].includes(order.status)).length,
    done: rows.filter((order) => ['pronto', 'entregue'].includes(order.status)).length
  }), [rows]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');

    try {
      const response = await fetch(`/api/service-orders/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: String(form.get('customerName') || ''),
          phone: String(form.get('phone') || ''),
          brand: String(form.get('brand') || ''),
          model: String(form.get('model') || ''),
          problemDescription: String(form.get('problemDescription') || ''),
          status: String(form.get('status') || 'recebido'),
          technicianId: String(form.get('technicianId') || '') || null,
          estimatedValue: Number(form.get('estimatedValue') || 0),
          approvedValue: String(form.get('approvedValue') || '') === '' ? null : Number(form.get('approvedValue')),
          dueDate: String(form.get('dueDate') || '') || null,
          warrantyDays: Number(form.get('warrantyDays') || 90)
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Não foi possível salvar a OS.');
      setEditing(null);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha ao salvar a OS.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/service-orders/${deleting.id}`, { method: 'DELETE' });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Não foi possível excluir a OS.');
      setRows((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha ao excluir a OS.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Buscar por OS, cliente, telefone, aparelho ou técnico"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | DatabaseServiceOrderStatus)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="all">Todos os status</option>
            {serviceOrderStatuses.map((status) => (
              <option key={status} value={status}>{serviceOrderStatusLabels[status]}</option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {[
            ['Todas', counts.all],
            ['Abertas', counts.open],
            ['Em execução', counts.progress],
            ['Aguardando', counts.waiting],
            ['Finalizadas', counts.done]
          ].map(([label, value]) => (
            <span key={String(label)} className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              {label} {value}
            </span>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      ) : null}

      <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">OS</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Aparelho</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Técnico</th>
              <th className="px-4 py-3">Previsão</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((order) => (
              <tr key={order.id} className="transition hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <Link href={`/ordens/${order.id}`} className="font-extrabold text-violet-700">OS #{order.number}</Link>
                  <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(order.entryDate)}</p>
                </td>
                <td className="px-4 py-3">
                  <strong className="block text-slate-950">{order.customerName}</strong>
                  <p className="text-xs text-slate-500">{formatPhone(order.phone)}</p>
                </td>
                <td className="max-w-[280px] px-4 py-3">
                  <p className="font-semibold text-slate-900">{[order.brand, order.model].filter(Boolean).join(' ')}</p>
                  <p className="truncate text-xs text-slate-500">{order.problemDescription}</p>
                </td>
                <td className="px-4 py-3"><StatusPill status={order.status} /></td>
                <td className="px-4 py-3 text-slate-600">{order.technicianName}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(order.dueDate)}</td>
                <td className="px-4 py-3 text-right font-extrabold text-slate-950">
                  {formatMoney(order.approvedValue ?? order.estimatedValue)}
                </td>
                <td className="px-3 py-3">
                  <details className="relative">
                    <summary className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </summary>
                    <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <button onClick={() => setEditing(order)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        <Edit3 className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button onClick={() => setDeleting(order)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </button>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? <div className="p-10 text-center text-sm text-slate-500">Nenhuma OS encontrada.</div> : null}
      </section>

      <section className="space-y-2 lg:hidden">
        {filtered.map((order) => (
          <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><Smartphone className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/ordens/${order.id}`} className="font-extrabold text-violet-700">OS #{order.number}</Link>
                  <StatusPill status={order.status} />
                </div>
                <p className="mt-2 font-bold text-slate-950">{order.customerName}</p>
                <p className="text-xs text-slate-500">{[order.brand, order.model].filter(Boolean).join(' ')} • {formatPhone(order.phone)}</p>
                <p className="mt-2 line-clamp-2 text-xs text-slate-600">{order.problemDescription}</p>
                <div className="mt-3 flex items-center justify-between">
                  <strong className="text-sm text-slate-950">{formatMoney(order.approvedValue ?? order.estimatedValue)}</strong>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(order)} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleting(order)} className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div><p className="text-[10px] font-black uppercase tracking-wide text-violet-600">Editar OS #{editing.number}</p><h2 className="text-lg font-extrabold text-slate-950">Dados do atendimento</h2></div>
              <button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </header>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <label className="block"><span className="text-xs font-bold text-slate-700">Cliente</span><input name="customerName" defaultValue={editing.customerName} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Telefone</span><input name="phone" defaultValue={editing.phone} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Marca</span><input name="brand" defaultValue={editing.brand} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Modelo</span><input name="model" defaultValue={editing.model} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" /></label>
              <label className="block md:col-span-2"><span className="text-xs font-bold text-slate-700">Problema relatado</span><textarea name="problemDescription" defaultValue={editing.problemDescription} required className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Status</span><select name="status" defaultValue={editing.status} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none">{serviceOrderStatuses.map((status) => <option key={status} value={status}>{serviceOrderStatusLabels[status]}</option>)}</select></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Técnico</span><select name="technicianId" defaultValue={editing.technicianId || ''} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"><option value="">Não atribuído</option>{technicians.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Valor estimado</span><input name="estimatedValue" type="number" min="0" step="0.01" defaultValue={editing.estimatedValue} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Valor aprovado</span><input name="approvedValue" type="number" min="0" step="0.01" defaultValue={editing.approvedValue ?? ''} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Previsão</span><input name="dueDate" type="date" defaultValue={dateInputValue(editing.dueDate)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Garantia em dias</span><input name="warrantyDays" type="number" min="0" defaultValue={editing.warrantyDays} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none" /></label>
            </div>
            <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Cancelar</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar alterações</button></footer>
          </form>
        </div>
      ) : null}

      {deleting ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
            <h2 className="mt-4 text-lg font-extrabold text-slate-950">Excluir OS #{deleting.number}?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">A ordem e o aparelho vinculado serão removidos. O cliente e o histórico do WhatsApp serão preservados.</p>
            {error ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeleting(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Cancelar</button><button onClick={() => void remove()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Excluir</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
