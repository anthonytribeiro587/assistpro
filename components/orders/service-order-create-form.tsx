'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { serviceOrderSchema, type ServiceOrderFormData } from '@/schemas/service-order';
import { serviceOrderStatusLabels, serviceOrderStatuses } from '@/lib/service-order-data';

export function ServiceOrderCreateForm({ technicians }: { technicians: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [createdNumber, setCreatedNumber] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ServiceOrderFormData>({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      document: '',
      brand: '',
      model: '',
      color: '',
      imei: '',
      serialNumber: '',
      problemDescription: '',
      physicalCondition: '',
      accessories: '',
      technicianId: '',
      estimatedValue: 0,
      approvedValue: '',
      dueDate: '',
      warrantyDays: 90,
      status: 'recebido'
    }
  });

  async function onSubmit(values: ServiceOrderFormData) {
    setMessage('');
    setCreatedNumber(null);

    try {
      const response = await fetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          technicianId: values.technicianId || null,
          approvedValue: values.approvedValue === '' || values.approvedValue === null ? null : values.approvedValue,
          dueDate: values.dueDate || null
        })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        order?: { id: string; number: number };
      };
      if (!response.ok || !payload.ok || !payload.order) {
        throw new Error(payload.error || 'Não foi possível criar a OS.');
      }

      setCreatedNumber(payload.order.number);
      window.setTimeout(() => {
        router.push(`/ordens/${payload.order?.id}`);
        router.refresh();
      }, 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível criar a OS.');
    }
  }

  const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100';
  const labelClass = 'text-xs font-bold text-slate-700';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 xl:grid-cols-[1fr_.72fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Nome do cliente</span>
            <input {...register('customerName')} className={inputClass} placeholder="Nome completo" />
            {errors.customerName ? <small className="mt-1 block text-red-600">{errors.customerName.message}</small> : null}
          </label>
          <label className="block">
            <span className={labelClass}>WhatsApp</span>
            <input {...register('phone')} className={inputClass} placeholder="(51) 99999-9999" />
            {errors.phone ? <small className="mt-1 block text-red-600">{errors.phone.message}</small> : null}
          </label>
          <label className="block">
            <span className={labelClass}>CPF/CNPJ</span>
            <input {...register('document')} className={inputClass} placeholder="Opcional" />
          </label>
          <div className="hidden md:block" />
          <label className="block">
            <span className={labelClass}>Marca</span>
            <input {...register('brand')} className={inputClass} placeholder="Apple, Samsung, Motorola..." />
          </label>
          <label className="block">
            <span className={labelClass}>Modelo</span>
            <input {...register('model')} className={inputClass} placeholder="iPhone 13, Galaxy A54..." />
            {errors.model ? <small className="mt-1 block text-red-600">{errors.model.message}</small> : null}
          </label>
          <label className="block">
            <span className={labelClass}>Cor</span>
            <input {...register('color')} className={inputClass} placeholder="Opcional" />
          </label>
          <label className="block">
            <span className={labelClass}>IMEI</span>
            <input {...register('imei')} className={inputClass} placeholder="Opcional" />
          </label>
          <label className="block md:col-span-2">
            <span className={labelClass}>Número de série</span>
            <input {...register('serialNumber')} className={inputClass} placeholder="Opcional" />
          </label>
          <label className="block md:col-span-2">
            <span className={labelClass}>Problema relatado</span>
            <textarea {...register('problemDescription')} className={`${inputClass} min-h-28`} placeholder="Descreva exatamente o que o cliente informou." />
            {errors.problemDescription ? <small className="mt-1 block text-red-600">{errors.problemDescription.message}</small> : null}
          </label>
          <label className="block">
            <span className={labelClass}>Condição física</span>
            <textarea {...register('physicalCondition')} className={`${inputClass} min-h-20`} placeholder="Riscos, trincas, marcas..." />
          </label>
          <label className="block">
            <span className={labelClass}>Acessórios entregues</span>
            <textarea {...register('accessories')} className={`${inputClass} min-h-20`} placeholder="Capa, carregador, chip..." />
          </label>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <label className="block">
              <span className={labelClass}>Status inicial</span>
              <select {...register('status')} className={inputClass}>
                {serviceOrderStatuses.map((status) => (
                  <option key={status} value={status}>{serviceOrderStatusLabels[status]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Técnico responsável</span>
              <select {...register('technicianId')} className={inputClass}>
                <option value="">Não atribuído</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>{technician.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Valor estimado</span>
              <input {...register('estimatedValue')} type="number" min="0" step="0.01" className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Valor aprovado</span>
              <input {...register('approvedValue')} type="number" min="0" step="0.01" className={inputClass} placeholder="Deixe vazio se ainda não aprovado" />
            </label>
            <label className="block">
              <span className={labelClass}>Previsão de entrega</span>
              <input {...register('dueDate')} type="date" className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Garantia em dias</span>
              <input {...register('warrantyDays')} type="number" min="0" className={inputClass} />
            </label>
          </div>
        </section>

        {message ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</div> : null}
        {createdNumber ? <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> OS #{createdNumber} criada.</div> : null}

        <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-60">
          {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar ordem de serviço'}
        </button>
      </aside>
    </form>
  );
}
