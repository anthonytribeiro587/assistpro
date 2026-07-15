'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/ui/page-header';
import { serviceOrderSchema, type ServiceOrderFormData } from '@/schemas/service-order';

export default function NewOrderPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ServiceOrderFormData>({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: { customerName: '', phone: '', device: '', imei: '', issue: '', technician: 'Lucas R.', amount: 0, dueDate: '' }
  });

  async function onSubmit() {
    setSuccess(false);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSuccess(true);
    setTimeout(() => router.push('/ordens'), 650);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Cadastro"
        title="Nova ordem de serviço"
        description="Registre o cliente, o aparelho, o defeito relatado e a previsão de entrega."
        action={<Link href="/ordens" className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink"><ArrowLeft className="h-4 w-4" /> Voltar</Link>}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
        <section className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
          <h2 className="text-xl font-black text-ink">Dados do atendimento</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-ink">Nome do cliente</span>
              <input {...register('customerName')} className="mt-2 w-full rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none focus:border-brand" placeholder="João Silva" />
              {errors.customerName ? <small className="text-danger">{errors.customerName.message}</small> : null}
            </label>
            <label className="block">
              <span className="text-sm font-bold text-ink">WhatsApp</span>
              <input {...register('phone')} className="mt-2 w-full rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none focus:border-brand" placeholder="(11) 99999-9999" />
              {errors.phone ? <small className="text-danger">{errors.phone.message}</small> : null}
            </label>
            <label className="block">
              <span className="text-sm font-bold text-ink">Aparelho</span>
              <input {...register('device')} className="mt-2 w-full rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none focus:border-brand" placeholder="iPhone 11" />
              {errors.device ? <small className="text-danger">{errors.device.message}</small> : null}
            </label>
            <label className="block">
              <span className="text-sm font-bold text-ink">IMEI / Série</span>
              <input {...register('imei')} className="mt-2 w-full rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none focus:border-brand" placeholder="Opcional" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-ink">Problema relatado</span>
              <textarea {...register('issue')} className="mt-2 min-h-28 w-full rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none focus:border-brand" placeholder="Tela quebrada, touch não funciona..." />
              {errors.issue ? <small className="text-danger">{errors.issue.message}</small> : null}
            </label>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
            <h2 className="text-xl font-black text-ink">Orçamento inicial</h2>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-ink">Técnico responsável</span>
                <input {...register('technician')} className="mt-2 w-full rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none focus:border-brand" />
                {errors.technician ? <small className="text-danger">{errors.technician.message}</small> : null}
              </label>
              <label className="block">
                <span className="text-sm font-bold text-ink">Valor previsto</span>
                <input {...register('amount')} type="number" className="mt-2 w-full rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none focus:border-brand" />
                {errors.amount ? <small className="text-danger">{errors.amount.message}</small> : null}
              </label>
              <label className="block">
                <span className="text-sm font-bold text-ink">Previsão</span>
                <input {...register('dueDate')} type="date" className="mt-2 w-full rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none focus:border-brand" />
                {errors.dueDate ? <small className="text-danger">{errors.dueDate.message}</small> : null}
              </label>
            </div>
          </section>

          <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-4 text-sm font-black text-white shadow-glow disabled:opacity-70">
            {isSubmitting ? 'Salvando...' : 'Salvar OS'}
          </button>
          {success ? <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-success"><CheckCircle2 className="h-5 w-5" /> OS criada com sucesso.</div> : null}
        </aside>
      </form>
    </div>
  );
}
