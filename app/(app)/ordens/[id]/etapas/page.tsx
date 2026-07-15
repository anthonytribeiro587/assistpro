import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { serviceOrders, statusLabels, timeline, type ServiceOrderStatus } from '@/lib/app-data';

const completed: ServiceOrderStatus[] = ['received', 'diagnosis', 'quote_sent'];

export default async function OrderStepsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = serviceOrders.find((item) => item.id.includes(id)) ?? serviceOrders[0];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Linha do tempo"
        title="Etapas da OS"
        description={`${order.id} • acompanhe e atualize o avanço do serviço.`}
        action={<Link href={`/ordens/${id}`} className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink"><ArrowLeft className="h-4 w-4" /> Voltar</Link>}
      />

      <section className="mx-auto max-w-2xl rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
        <div className="space-y-1">
          {timeline.map((status, index) => {
            const done = completed.includes(status);
            const current = status === order.status;
            return (
              <div key={status} className="relative flex gap-4 pb-7 last:pb-0">
                {index < timeline.length - 1 ? <span className="absolute left-[17px] top-9 h-full w-px bg-line" /> : null}
                <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ${done ? 'bg-success text-white' : current ? 'bg-brand text-white' : 'bg-app text-muted ring-1 ring-line'}`}>
                  {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1 rounded-2xl border border-line bg-app p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-ink">{statusLabels[status]}</strong>
                    {current ? <span className="rounded-full bg-brandLight px-3 py-1 text-xs font-bold text-brand">Atual</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">23/05/2025 {index < 3 ? `1${index}:30` : '—'} {done ? 'por Lucas R.' : current ? 'em andamento' : 'aguardando'}</p>
                </div>
              </div>
            );
          })}
        </div>
        <button className="mt-6 w-full rounded-2xl bg-brand px-5 py-4 text-sm font-black text-white shadow-glow">Atualizar etapa</button>
      </section>
    </div>
  );
}
