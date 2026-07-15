import { Phone, Plus, Search, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { customers } from '@/lib/app-data';

export default function CustomersPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Cadastro"
        title="Clientes"
        description="Base de clientes vinculada às OS, conversas do WhatsApp e histórico de aparelhos."
        action={<button className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-black text-white shadow-glow"><Plus className="h-4 w-4" /> Novo cliente</button>}
      />

      <section className="rounded-[1.75rem] border border-line bg-white p-4 shadow-card">
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-app px-4 py-3 text-muted">
          <Search className="h-4 w-4" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Buscar cliente por nome ou telefone" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {customers.map((customer) => (
          <article key={customer.phone} className="rounded-[1.5rem] border border-line bg-white p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brandLight text-brand"><UserRound className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-black text-ink">{customer.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted"><Phone className="h-4 w-4" /> {customer.phone}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-app p-3"><span className="text-muted">OS</span><strong className="block text-ink">{customer.orders}</strong></div>
                  <div className="rounded-2xl bg-app p-3"><span className="text-muted">Último</span><strong className="block truncate text-ink">{customer.lastOrder}</strong></div>
                </div>
                <span className="mt-4 inline-flex rounded-full bg-brandLight px-3 py-1 text-xs font-bold text-brand">{customer.status}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
