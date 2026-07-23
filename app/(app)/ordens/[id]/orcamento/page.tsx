import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CircleDollarSign, MessageCircle, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { formatMoney } from '@/lib/format';
import { loadServiceOrder, serviceOrderStatusLabels } from '@/lib/service-order-data';

export const dynamic = 'force-dynamic';

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadServiceOrder(id);
  if (!result.row) notFound();
  const order = result.row;
  const currentValue = order.approvedValue ?? order.estimatedValue;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Orçamento"
        title={`OS #${order.number}`}
        description="Valores registrados para avaliação e aprovação do cliente."
        action={
          <Link
            href={`/ordens/${id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        }
      />

      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Cliente</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950">{order.customerName}</h2>
            <p className="mt-1 text-sm text-slate-500">{[order.brand, order.model].filter(Boolean).join(' ')}</p>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
            {serviceOrderStatusLabels[order.status]}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-sm font-semibold text-slate-600">Valor estimado</span>
            <strong className="text-lg text-slate-950">{formatMoney(order.estimatedValue)}</strong>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-sm font-semibold text-slate-600">Valor aprovado</span>
            <strong className="text-lg text-slate-950">
              {order.approvedValue === null ? 'Ainda não aprovado' : formatMoney(order.approvedValue)}
            </strong>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-violet-600 p-4 text-white">
            <span className="flex items-center gap-2 text-sm font-bold"><CircleDollarSign className="h-4 w-4" /> Valor atual</span>
            <strong className="text-2xl">{formatMoney(currentValue)}</strong>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Descrição do atendimento</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{order.problemDescription}</p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/ordens"
            className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            Editar valores na lista de OS
          </Link>
          <Link
            href="/whatsapp"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
          </Link>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          Os valores mostrados vêm diretamente da ordem de serviço. Nenhuma peça, desconto ou aprovação é inventada automaticamente.
        </div>
      </section>
    </div>
  );
}
