import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FileText,
  ListChecks,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  UserRound,
  Wrench
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import {
  serviceOrderStatusClasses,
  serviceOrderStatusLabels
} from '@/lib/service-order-data';
import { loadServiceOrder } from '@/lib/service-order-server';
import { formatMoney } from '@/lib/format';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null) {
  if (!value) return 'Não informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não informada';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return phone;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadServiceOrder(id);
  if (!result.row) notFound();
  const order = result.row;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Ordem de serviço"
        title={`OS #${order.number}`}
        description="Dados registrados para atendimento, orçamento e acompanhamento técnico."
        action={
          <Link
            href="/ordens"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        }
      />

      {result.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{result.error}</div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${serviceOrderStatusClasses[order.status]}`}>
              {serviceOrderStatusLabels[order.status]}
            </span>
            <span className="text-xs font-semibold text-slate-500">Entrada em {formatDate(order.entryDate)}</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-4 w-4 text-violet-600" />
                <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Cliente</p><strong className="mt-1 block text-sm text-slate-950">{order.customerName}</strong><p className="mt-0.5 text-xs text-slate-500">{formatPhone(order.phone)}</p>{order.document ? <p className="mt-0.5 text-xs text-slate-500">Documento: {order.document}</p> : null}</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-4 w-4 text-violet-600" />
                <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Aparelho</p><strong className="mt-1 block text-sm text-slate-950">{[order.brand, order.model].filter(Boolean).join(' ')}</strong><p className="mt-0.5 text-xs text-slate-500">{order.color || 'Cor não informada'}</p>{order.imei ? <p className="mt-0.5 text-xs text-slate-500">IMEI: {order.imei}</p> : null}</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Problema relatado</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{order.problemDescription}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Condição física</p>
              <p className="mt-2 text-sm text-slate-700">{order.physicalCondition || 'Não informada'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Acessórios entregues</p>
              <p className="mt-2 text-sm text-slate-700">{order.accessories || 'Nenhum informado'}</p>
            </div>
          </div>
        </article>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-950"><Wrench className="h-4 w-4 text-violet-600" /><strong className="text-sm">Responsável</strong></div>
            <p className="mt-2 text-sm text-slate-600">{order.technicianName}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-950"><CircleDollarSign className="h-4 w-4 text-violet-600" /><strong className="text-sm">Valores</strong></div>
            <div className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><span className="text-slate-500">Estimado</span><strong>{formatMoney(order.estimatedValue)}</strong></div><div className="flex justify-between gap-3"><span className="text-slate-500">Aprovado</span><strong>{order.approvedValue === null ? 'Pendente' : formatMoney(order.approvedValue)}</strong></div></div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-950"><CalendarDays className="h-4 w-4 text-violet-600" /><strong className="text-sm">Prazos</strong></div>
            <div className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><span className="text-slate-500">Previsão</span><strong className="text-right">{formatDate(order.dueDate)}</strong></div><div className="flex justify-between gap-3"><span className="text-slate-500">Garantia</span><strong>{order.warrantyDays} dias</strong></div></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href={`/ordens/${id}/orcamento`} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"><FileText className="h-4 w-4" /> Orçamento</Link>
            <Link href={`/ordens/${id}/etapas`} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"><ListChecks className="h-4 w-4" /> Etapas</Link>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide"><ShieldCheck className="h-4 w-4" /> Registro protegido</p>
            <p className="mt-2 text-xs leading-5">As alterações de status são registradas no histórico da OS. Edição e exclusão ficam disponíveis na lista administrativa.</p>
          </div>

          <Link href="/whatsapp" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700">
            <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
          </Link>
        </aside>
      </section>
    </div>
  );
}
