import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { OrderStatusUpdater } from '@/components/orders/order-status-updater';
import { PageHeader } from '@/components/ui/page-header';
import { loadServiceOrderEvents } from '@/lib/service-order-events';
import {
  serviceOrderStatusLabels,
  serviceOrderStatuses
} from '@/lib/service-order-data';
import { loadServiceOrder } from '@/lib/service-order-server';

export const dynamic = 'force-dynamic';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export default async function OrderStepsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orderResult, eventsResult] = await Promise.all([
    loadServiceOrder(id),
    loadServiceOrderEvents(id)
  ]);
  if (!orderResult.row) notFound();
  const order = orderResult.row;
  const currentIndex = serviceOrderStatuses.indexOf(order.status);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Linha do tempo"
        title={`Etapas da OS #${order.number}`}
        description="Atualize o status e consulte as movimentações registradas no Supabase."
        action={
          <Link
            href={`/ordens/${id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-1">
            {serviceOrderStatuses.map((status, index) => {
              const done = index < currentIndex && !['cancelado'].includes(order.status);
              const current = status === order.status;
              const event = [...eventsResult.rows].reverse().find((item) => item.toStatus === status);

              return (
                <div key={status} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < serviceOrderStatuses.length - 1 ? (
                    <span className={`absolute left-[17px] top-9 h-full w-px ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                  ) : null}
                  <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : current
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'
                  }`}>
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-4 w-4" />}
                  </span>
                  <div className={`min-w-0 flex-1 rounded-xl border p-4 ${current ? 'border-violet-200 bg-violet-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-slate-950">{serviceOrderStatusLabels[status]}</strong>
                      {current ? <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-700">Atual</span> : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {event ? `${formatDate(event.createdAt)} • ${event.createdBy}` : done ? 'Etapa concluída' : current ? 'Em andamento' : 'Ainda não iniciada'}
                    </p>
                    {event?.description ? <p className="mt-2 text-xs leading-5 text-slate-600">{event.description}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-violet-600">Status atual</p>
            <h2 className="mt-1 text-base font-extrabold text-slate-950">{serviceOrderStatusLabels[order.status]}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Ao alterar, o sistema registra a movimentação no histórico da OS.</p>
            <div className="mt-4"><OrderStatusUpdater orderId={order.id} initialStatus={order.status} /></div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Histórico registrado</p>
            <strong className="mt-1 block text-2xl text-slate-950">{eventsResult.rows.length}</strong>
            <p className="mt-1 text-xs text-slate-500">movimentações salvas</p>
          </div>

          {eventsResult.error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">{eventsResult.error}</div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
