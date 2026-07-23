import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CustomerTable } from '@/components/customers/customer-table';
import { PageHeader } from '@/components/ui/page-header';
import { loadCustomerDirectory } from '@/lib/customer-directory';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const directory = await loadCustomerDirectory();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Operação"
        title="Clientes"
        description="Consulte contatos, histórico de OS e etapa atual do atendimento em uma única tabela."
        action={
          <Link
            href="/ordens/nova"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" /> Nova OS
          </Link>
        }
      />

      {directory.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          {directory.error}
        </div>
      ) : null}

      <CustomerTable rows={directory.rows} />
    </div>
  );
}
