import Link from 'next/link';
import { ArrowLeft, Camera, FileText, MessageCircle, MoreHorizontal, Pencil, Smartphone, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { serviceOrders } from '@/lib/app-data';
import { formatMoney } from '@/lib/format';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = serviceOrders.find((item) => item.id.includes(id)) ?? serviceOrders[0];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Detalhe da OS"
        title={order.id}
        description="Visualize dados do cliente, aparelho, defeito, valores e ações rápidas."
        action={<Link href="/ordens" className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink"><ArrowLeft className="h-4 w-4" /> Voltar</Link>}
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_.45fr]">
        <article className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={order.status} />
            <span className="rounded-full bg-app px-3 py-1 text-xs font-bold text-muted">{order.elapsed}</span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-app p-4">
              <div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-muted" /><div><p className="text-xs font-bold text-muted">Cliente</p><strong>{order.customer}</strong><p className="text-sm text-muted">{order.phone}</p></div></div>
            </div>
            <div className="rounded-2xl border border-line bg-app p-4">
              <div className="flex items-center gap-3"><Smartphone className="h-5 w-5 text-muted" /><div><p className="text-xs font-bold text-muted">Aparelho</p><strong>{order.device}</strong><p className="text-sm text-muted">IMEI: {order.imei}</p></div></div>
            </div>
            <div className="rounded-2xl border border-line bg-app p-4 md:col-span-2">
              <p className="text-xs font-bold text-muted">Problema relatado</p>
              <p className="mt-1 font-semibold text-ink">{order.issue}</p>
            </div>
            <div className="rounded-2xl border border-line bg-app p-4"><p className="text-xs font-bold text-muted">Entrada</p><strong>{order.entryDate}</strong></div>
            <div className="rounded-2xl border border-line bg-app p-4"><p className="text-xs font-bold text-muted">Previsão</p><strong>{order.dueDate}</strong></div>
            <div className="rounded-2xl border border-line bg-app p-4"><p className="text-xs font-bold text-muted">Técnico responsável</p><strong>{order.technician}</strong></div>
            <div className="rounded-2xl border border-line bg-app p-4"><p className="text-xs font-bold text-muted">Valor do serviço</p><strong className="text-xl text-brand">{formatMoney(order.amount)}</strong></div>
          </div>
        </article>

        <aside className="space-y-4">
          <Link href={`/ordens/${id}/orcamento`} className="flex items-center justify-between rounded-[1.5rem] border border-line bg-white p-4 shadow-card">
            <span className="flex items-center gap-3 font-black text-ink"><FileText className="h-5 w-5 text-brand" /> Ver orçamento</span>
            <span className="text-brand">Abrir</span>
          </Link>
          <Link href={`/ordens/${id}/etapas`} className="flex items-center justify-between rounded-[1.5rem] border border-line bg-white p-4 shadow-card">
            <span className="flex items-center gap-3 font-black text-ink"><MoreHorizontal className="h-5 w-5 text-brand" /> Atualizar etapas</span>
            <span className="text-brand">Abrir</span>
          </Link>
          <Link href="/whatsapp/chat" className="flex items-center justify-between rounded-[1.5rem] border border-line bg-white p-4 shadow-card">
            <span className="flex items-center gap-3 font-black text-ink"><MessageCircle className="h-5 w-5 text-brand" /> Conversar no WhatsApp</span>
            <span className="text-brand">Abrir</span>
          </Link>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Histórico', icon: MoreHorizontal },
              { label: 'Fotos', icon: Camera },
              { label: 'Editar', icon: Pencil }
            ].map((item) => (
              <button key={item.label} className="rounded-2xl border border-line bg-white p-4 text-xs font-bold text-muted shadow-card">
                <item.icon className="mx-auto mb-2 h-5 w-5 text-brand" />
                {item.label}
              </button>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
