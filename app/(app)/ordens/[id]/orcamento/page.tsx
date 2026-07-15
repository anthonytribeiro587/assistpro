import Link from 'next/link';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { serviceOrders } from '@/lib/app-data';
import { formatMoney } from '@/lib/format';

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = serviceOrders.find((item) => item.id.includes(id)) ?? serviceOrders[0];
  const service = Math.max(order.amount - order.cost, 0);
  const discount = 20;
  const total = order.amount - discount;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Orçamento"
        title={`Orçamento • ${order.id}`}
        description="Envie o link de aprovação, registre valores e acompanhe o retorno do cliente."
        action={<Link href={`/ordens/${id}`} className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink"><ArrowLeft className="h-4 w-4" /> Voltar</Link>}
      />

      <section className="mx-auto max-w-2xl rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-4"><span className="font-bold text-ink">Serviço</span><strong>{formatMoney(service)}</strong></div>
          <div className="flex items-center justify-between border-b border-line pb-4"><span className="font-bold text-ink">Peça • Tela {order.device}</span><strong>{formatMoney(order.cost)}</strong></div>
          <div className="flex items-center justify-between border-b border-line pb-4"><span className="font-bold text-ink">Subtotal</span><strong>{formatMoney(order.amount)}</strong></div>
          <div className="flex items-center justify-between border-b border-line pb-4"><span className="font-bold text-ink">Desconto</span><strong className="text-success">- {formatMoney(discount)}</strong></div>
          <div className="flex items-center justify-between rounded-2xl bg-brandLight p-4"><span className="font-black text-brand">Total</span><strong className="text-2xl text-brand">{formatMoney(total)}</strong></div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand px-4 py-3 text-sm font-black text-brand"><Send className="h-4 w-4" /> Link de aprovação</button>
          <Link href="/whatsapp/chat" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-black text-white shadow-glow"><MessageCircle className="h-4 w-4" /> WhatsApp</Link>
        </div>

        <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
          <strong>Status do orçamento:</strong> Aguardando aprovação • enviado em 23/05/2025 11:30.
        </div>
      </section>
    </div>
  );
}
