import Link from 'next/link';
import { Filter, Plus, Search, Smartphone } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { serviceOrders } from '@/lib/app-data';
import { formatMoney } from '@/lib/format';

export default function OrdersPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operação"
        title="Lista de OS"
        description="Consulte, filtre e acompanhe todas as ordens de serviço da assistência."
        action={<Link href="/ordens/nova" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-black text-white shadow-glow"><Plus className="h-4 w-4" /> Nova OS</Link>}
      />

      <section className="rounded-[1.75rem] border border-line bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-line bg-app px-4 py-3 text-muted">
            <Search className="h-4 w-4" />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Buscar por número, cliente ou aparelho" />
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink">
            <Filter className="h-4 w-4" /> Filtros
          </button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {['Todas 32', 'Abertas 6', 'Em execução 12', 'Aguardando 8', 'Concluídas 7'].map((item, index) => (
            <button key={item} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${index === 0 ? 'bg-brand text-white shadow-soft' : 'bg-app text-muted'}`}>{item}</button>
          ))}
        </div>
      </section>

      <section className="hidden overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-app text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-4">OS</th>
              <th className="px-5 py-4">Cliente</th>
              <th className="px-5 py-4">Aparelho</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Técnico</th>
              <th className="px-5 py-4 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {serviceOrders.map((order) => (
              <tr key={order.id} className="hover:bg-app/70">
                <td className="px-5 py-4"><Link href={`/ordens/${order.id.replace('OS #', '')}`} className="font-black text-brand">{order.id}</Link></td>
                <td className="px-5 py-4"><strong className="text-ink">{order.customer}</strong><p className="text-xs text-muted">{order.phone}</p></td>
                <td className="px-5 py-4"><p className="font-semibold text-ink">{order.device}</p><p className="text-xs text-muted">{order.issue}</p></td>
                <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                <td className="px-5 py-4 text-muted">{order.technician}</td>
                <td className="px-5 py-4 text-right font-black text-ink">{formatMoney(order.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-3 lg:hidden">
        {serviceOrders.map((order) => (
          <Link key={order.id} href={`/ordens/${order.id.replace('OS #', '')}`} className="block rounded-[1.5rem] border border-line bg-white p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-app text-muted"><Smartphone className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><strong className="text-ink">{order.id}</strong><StatusBadge status={order.status} /></div>
                <p className="mt-2 font-bold text-ink">{order.customer}</p>
                <p className="text-sm text-muted">{order.deviceDetails}</p>
                <div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted">{order.entryDate}</span><strong>{formatMoney(order.amount)}</strong></div>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
