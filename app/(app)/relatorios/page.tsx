import { BarChart3, CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { formatMoney } from '@/lib/format';

const metrics = [
  { label: 'OS abertas', value: '32' },
  { label: 'Concluídas', value: '24' },
  { label: 'Faturamento', value: formatMoney(8450) },
  { label: 'Ticket médio', value: formatMoney(352.08) }
];

const services = [
  { label: 'Telas', percent: '45%', width: 'w-[45%]' },
  { label: 'Baterias', percent: '25%', width: 'w-[25%]' },
  { label: 'Conectores', percent: '15%', width: 'w-[15%]' },
  { label: 'Outros', percent: '15%', width: 'w-[15%]' }
];

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Gestão" title="Relatórios" description="Indicadores para acompanhar resultado, gargalos e tipos de serviço mais vendidos." />

      <section className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
        <div className="flex items-center justify-between rounded-2xl border border-line bg-app px-4 py-3 text-sm font-bold text-muted">
          <span>23/05/2025 - 23/05/2025</span>
          <CalendarDays className="h-5 w-5" />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-line bg-app p-4">
              <p className="text-sm font-bold text-muted">{metric.label}</p>
              <strong className="mt-2 block text-2xl font-black text-brand">{metric.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <article className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-brand" /><h2 className="text-xl font-black text-ink">Gráfico de serviços</h2></div>
          <div className="mt-6 grid place-items-center">
            <div className="grid h-52 w-52 place-items-center rounded-full bg-[conic-gradient(#6d28d9_0_45%,#06b6d4_45%_70%,#22c55e_70%_85%,#f59e0b_85%_100%)]">
              <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center text-sm font-black text-ink">Serviços</div>
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
          <h2 className="text-xl font-black text-ink">Por tipo de serviço</h2>
          <div className="mt-5 space-y-4">
            {services.map((service) => (
              <div key={service.label}>
                <div className="mb-2 flex justify-between text-sm"><strong>{service.label}</strong><span className="font-bold text-muted">{service.percent}</span></div>
                <div className="h-3 rounded-full bg-app"><div className={`h-full rounded-full bg-brand ${service.width}`} /></div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
