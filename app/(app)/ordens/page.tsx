import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ServiceOrdersTable } from '@/components/orders/service-orders-table';
import { PageHeader } from '@/components/ui/page-header';
import { loadServiceOrderOptions, loadServiceOrders } from '@/lib/service-order-data';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const [orders, options] = await Promise.all([
    loadServiceOrders(),
    loadServiceOrderOptions()
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Operação"
        title="Ordens de serviço"
        description="Consulte, edite e acompanhe as ordens registradas no Supabase."
        action={
          <Link
            href="/ordens/nova"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" /> Nova OS
          </Link>
        }
      />

      {orders.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          {orders.error}
        </div>
      ) : null}

      <ServiceOrdersTable initialRows={orders.rows} technicians={options.technicians} />
    </div>
  );
}
