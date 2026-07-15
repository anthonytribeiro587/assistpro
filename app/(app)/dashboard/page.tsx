import Link from 'next/link';
import { CalendarClock, CheckCircle2, Clock, MessageCircle, Plus, Search, UsersRound, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { conversations, serviceOrders } from '@/lib/app-data';
import { formatMoney } from '@/lib/format';

function Kpi({ title, value, helper, icon: Icon, tone = 'brand' }: { title: string; value: string; helper: string; icon: typeof CalendarClock; tone?: 'brand' | 'green' }) {
  return (
    <article className="rounded-[1.5rem] border border-line bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-muted">{title}</p>
          <strong className="mt-2 block text-3xl font-black text-ink">{value}</strong>
        </div>
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone === 'green' ? 'bg-green-50 text-success' : 'bg-brandLight text-brand'}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted">{helper}</p>
    </article>
  );
}

export default function DashboardPage() {
  const revenue = serviceOrders.reduce((sum, order) => sum + order.amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Protótipo funcional • JR Celular"
        title="Dashboard"
        description="Tela principal do sistema: indicadores, atalhos, últimas OS e mensagens do WhatsApp."
        action={<Link href="/ordens/nova" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-black text-white shadow-glow"><Plus className="h-4 w-4" /> Nova OS</Link>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi title="OS abertas" value="32" helper="acompanhar gargalos" icon={CalendarClock} />
        <Kpi title="Em execução" value="12" helper="serviços com técnico" icon={Wrench} />
        <Kpi title="Aguardando cliente" value="7" helper="orçamentos pendentes" icon={Clock} />
        <Kpi title="Faturamento previsto" value={formatMoney(revenue)} helper="OS abertas e aprovadas" icon={CheckCircle2} tone="green" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1.05fr]">
        <article className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-ink">Olá, JR 👋</h2>
              <p className="text-sm text-muted">Resumo da assistência hoje</p>
            </div>
            <Link href="/whatsapp" className="grid h-11 w-11 place-items-center rounded-2xl bg-brandLight text-brand"><MessageCircle className="h-5 w-5" /></Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Kpi title="OS abertas" value="32" helper="ver todas" icon={CalendarClock} />
            <Kpi title="Aguardando" value="18" helper="cliente ou peça" icon={Clock} />
            <Kpi title="Em execução" value="12" helper="ver todas" icon={Wrench} />
            <Kpi title="Concluídas" value="7" helper="hoje" icon={CheckCircle2} tone="green" />
          </div>

          <div className="mt-5 grid grid-cols-4 gap-3 text-center text-xs font-semibold text-muted">
            {[
              { href: '/ordens/nova', label: 'Nova OS', icon: Plus },
              { href: '/ordens', label: 'Consultar', icon: Search },
              { href: '/clientes', label: 'Clientes', icon: UsersRound },
              { href: '/whatsapp', label: 'Mensagens', icon: MessageCircle }
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl border border-line bg-app p-3">
                <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-brandLight text-brand"><item.icon className="h-4 w-4" /></span>
                {item.label}
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-ink">Ordens de Serviço</h2>
            <Link href="/ordens" className="text-sm font-bold text-brand">Ver todas</Link>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
            {['Todas 32', 'Abertas 6', 'Em execução 12'].map((item, index) => (
              <span key={item} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold ${index === 0 ? 'bg-brand text-white' : 'bg-app text-muted'}`}>{item}</span>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {serviceOrders.map((order) => (
              <Link key={order.id} href={`/ordens/${order.id.replace('OS #', '')}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 transition hover:border-brand">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-app text-muted"><Wrench className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-ink">{order.id}</strong><StatusBadge status={order.status} /></div>
                  <p className="mt-1 truncate text-sm font-semibold text-ink">{order.customer}</p>
                  <p className="truncate text-xs text-muted">{order.deviceDetails}</p>
                </div>
                <strong className="text-sm text-ink">{formatMoney(order.amount)}</strong>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
          <h2 className="text-xl font-black text-ink">Conversas recentes</h2>
          <div className="mt-4 space-y-3">
            {conversations.slice(0, 3).map((conversation) => (
              <Link key={conversation.name} href="/whatsapp/chat" className="flex items-center gap-3 rounded-2xl bg-app p-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brandLight text-xs font-black text-brand">{conversation.avatar}</span>
                <div className="min-w-0 flex-1"><strong className="block truncate text-sm text-ink">{conversation.name}</strong><p className="truncate text-xs text-muted">{conversation.message}</p></div>
                {conversation.unread ? <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">{conversation.unread}</span> : null}
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
          <h2 className="text-xl font-black text-ink">Camadas do produto</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {['OS e orçamento', 'WhatsApp Evolution', 'IA com segurança', 'Voz autorizada'].map((item, index) => (
              <div key={item} className="rounded-2xl border border-line bg-app p-4">
                <span className="text-xs font-black text-brand">Fase {index + 1}</span>
                <p className="mt-2 font-black text-ink">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
