import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ServiceOrderCreateForm } from '@/components/orders/service-order-create-form';
import { PageHeader } from '@/components/ui/page-header';
import { loadServiceOrderOptions } from '@/lib/service-order-server';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  const options = await loadServiceOrderOptions();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Cadastro"
        title="Nova ordem de serviço"
        description="Registre cliente, aparelho, defeito, responsável e valores do atendimento."
        action={
          <Link
            href="/ordens"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        }
      />

      <ServiceOrderCreateForm technicians={options.technicians} />
    </div>
  );
}
