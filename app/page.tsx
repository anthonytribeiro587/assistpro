import type { ElementType, ReactNode } from 'react';
import {
  Bell,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Headphones,
  Menu,
  MessageCircle,
  Mic2,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  UserRound,
  UsersRound,
  Wrench
} from 'lucide-react';
import { conversations, serviceOrders, statusLabels, type ServiceOrderStatus } from '@/lib/mock-data';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const statusTone: Record<ServiceOrderStatus, string> = {
  recebido: 'bg-slate-500/15 text-slate-200 ring-slate-400/20',
  analise: 'bg-blue-500/15 text-blue-200 ring-blue-400/20',
  orcamento_enviado: 'bg-purple-500/15 text-purple-200 ring-purple-400/20',
  aguardando_aprovacao: 'bg-yellow-500/15 text-yellow-100 ring-yellow-400/20',
  em_execucao: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/20',
  aguardando_peca: 'bg-orange-500/15 text-orange-200 ring-orange-400/20',
  testes: 'bg-cyan-500/15 text-cyan-200 ring-cyan-400/20',
  pronto: 'bg-green-500/15 text-green-200 ring-green-400/20',
  entregue: 'bg-zinc-500/15 text-zinc-200 ring-zinc-400/20',
  cancelado: 'bg-red-500/15 text-red-200 ring-red-400/20'
};

const timeline: ServiceOrderStatus[] = [
  'recebido',
  'analise',
  'orcamento_enviado',
  'aguardando_aprovacao',
  'em_execucao',
  'testes',
  'pronto',
  'entregue'
];

const navItems = [
  { label: 'Início', icon: Smartphone, active: true },
  { label: 'OS', icon: Wrench },
  { label: 'Clientes', icon: UsersRound },
  { label: 'WhatsApp', icon: MessageCircle },
  { label: 'Mais', icon: Menu }
];

function StatusBadge({ status }: { status: ServiceOrderStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${statusTone[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

function KpiCard({ title, value, helper, icon: Icon }: { title: string; value: string; helper: string; icon: ElementType }) {
  return (
    <div className="rounded-[1.65rem] border border-white/10 bg-card/80 p-4 shadow-soft backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium text-slate-400">{title}</p>
          <strong className="mt-2 block text-2xl font-bold tracking-tight text-white">{value}</strong>
        </div>
        <div className="rounded-2xl bg-brand/15 p-3 text-brandSoft">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{helper}</p>
    </div>
  );
}

function PhoneShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`relative rounded-[2rem] border border-white/10 bg-phone p-4 shadow-phone ${className}`}>{children}</section>;
}

function HeaderBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070911]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-white to-brand text-xl font-black text-[#111018] shadow-glow">
            JR
          </div>
          <div>
            <p className="text-sm font-bold leading-none text-white">AssistPro</p>
            <span className="text-xs text-slate-500">JR Celular • operação ao vivo</span>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400 md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,.7)]" />
          Evolution preparada
        </div>

        <div className="flex items-center gap-2">
          <button className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300">
            <Bell className="h-4 w-4" />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 lg:hidden">
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] rounded-[2rem] border border-white/10 bg-card/80 p-3 shadow-soft backdrop-blur-xl lg:block">
      <div className="flex h-full w-20 flex-col items-center justify-between">
        <div className="space-y-3">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`group flex h-14 w-14 flex-col items-center justify-center rounded-2xl text-[10px] transition ${
                item.active ? 'bg-brand text-white shadow-glow' : 'text-slate-500 hover:bg-white/[0.04] hover:text-white'
              }`}
              title={item.label}
            >
              <item.icon className="mb-1 h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-sm font-bold text-brandSoft">JR</div>
      </div>
    </aside>
  );
}

function DashboardPhone() {
  return (
    <PhoneShell className="min-h-[640px]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-white">Olá, JR 👋</p>
          <span className="text-xs text-slate-500">Resumo da assistência hoje</span>
        </div>
        <div className="flex gap-2">
          <button className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-slate-300"><Bell className="h-4 w-4" /></button>
          <button className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-slate-300"><Menu className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard title="OS abertas" value="32" helper="ver todas" icon={CalendarClock} />
        <KpiCard title="Aguardando" value="18" helper="cliente ou peça" icon={Clock} />
        <KpiCard title="Em execução" value="12" helper="com técnico" icon={Wrench} />
        <KpiCard title="Concluídas" value="7" helper="hoje" icon={CheckCircle2} />
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Atalhos rápidos</p>
          <MoreHorizontal className="h-4 w-4 text-slate-500" />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3 text-center text-[10px] text-slate-400">
          {[
            { label: 'Nova OS', icon: Plus },
            { label: 'Consultar', icon: Search },
            { label: 'Clientes', icon: UsersRound },
            { label: 'Mensagens', icon: MessageCircle }
          ].map((item) => (
            <button key={item.label} className="space-y-2">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-brand/20 text-brandSoft">
                <item.icon className="h-4 w-4" />
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs text-slate-400">Faturamento do dia</p>
        <strong className="mt-2 block text-2xl font-bold text-brandSoft">R$ 2.450,00</strong>
        <p className="mt-1 text-xs text-emerald-400">+29,6% vs. ontem</p>
      </div>
    </PhoneShell>
  );
}

function OrdersPhone() {
  return (
    <PhoneShell className="min-h-[640px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Ordens de Serviço</h2>
        <button className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05]"><Search className="h-4 w-4 text-slate-400" /></button>
      </div>

      <div className="mb-4 flex gap-2 overflow-hidden text-[11px]">
        {['Todas 32', 'Abertas 6', 'Em execução 12'].map((item, index) => (
          <span key={item} className={`whitespace-nowrap rounded-full px-3 py-2 font-semibold ${index === 0 ? 'bg-brand text-white' : 'bg-white/[0.05] text-slate-400'}`}>
            {item}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {serviceOrders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 text-slate-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <strong className="block truncate text-sm text-white">{order.id}</strong>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-1 truncate text-xs text-slate-300">{order.customer}</p>
                <p className="truncate text-[11px] text-slate-500">{order.device} • {order.issue}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </div>
          </article>
        ))}
      </div>
    </PhoneShell>
  );
}

function DetailsPhone() {
  const order = serviceOrders[0];

  return (
    <PhoneShell className="min-h-[640px]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brandSoft">Detalhes</p>
          <h2 className="mt-1 text-xl font-bold text-white">{order.id}</h2>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05]"><UserRound className="h-5 w-5 text-slate-300" /></div>
            <div>
              <p className="font-semibold text-white">{order.customer}</p>
              <span className="text-xs text-slate-500">{order.phone}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-xs text-slate-500">Aparelho</p>
          <p className="mt-1 font-semibold text-white">{order.device}</p>
          <p className="mt-3 text-xs text-slate-500">Defeito relatado</p>
          <p className="mt-1 text-sm text-slate-200">{order.issue}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-slate-500">Entrada</p>
            <p className="mt-1 text-sm font-semibold text-white">{order.entryDate}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-slate-500">Previsão</p>
            <p className="mt-1 text-sm font-semibold text-white">{order.dueDate}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-xs text-slate-500">Valor do serviço</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <strong className="text-2xl text-white">{money.format(order.amount)}</strong>
            <button className="rounded-2xl bg-brand px-4 py-3 text-xs font-bold text-white">Ver orçamento</button>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

function TimelinePhone() {
  return (
    <PhoneShell className="min-h-[640px]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Etapas do serviço</h2>
        <ShieldCheck className="h-5 w-5 text-brandSoft" />
      </div>
      <div>
        {timeline.map((status, index) => {
          const done = index <= 3;
          const active = index === 4;
          return (
            <div key={status} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`grid h-8 w-8 place-items-center rounded-full ${done ? 'bg-emerald-500 text-white' : active ? 'bg-yellow-400 text-slate-950' : 'bg-white/[0.08] text-slate-500'}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Wrench className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                {index !== timeline.length - 1 && <div className={`h-10 w-px ${done ? 'bg-emerald-500/50' : 'bg-white/10'}`} />}
              </div>
              <div className="pb-5">
                <p className={`text-sm font-semibold ${done || active ? 'text-white' : 'text-slate-500'}`}>{statusLabels[status]}</p>
                <span className="text-xs text-slate-500">23/05/2026 {index + 9}:30</span>
              </div>
            </div>
          );
        })}
      </div>
      <button className="mt-4 w-full rounded-2xl bg-brand py-4 text-sm font-bold text-white shadow-glow">Atualizar etapa</button>
    </PhoneShell>
  );
}

function WhatsAppPhone() {
  return (
    <PhoneShell className="min-h-[640px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Atendimentos</h2>
        <MoreHorizontal className="h-5 w-5 text-slate-500" />
      </div>
      <div className="mb-4 flex gap-2 text-[11px]">
        {['Todas 8', 'Não lidas 3', 'Em atendimento 2'].map((item, index) => (
          <span key={item} className={`rounded-full px-3 py-2 font-semibold ${index === 0 ? 'bg-brand text-white' : 'bg-white/[0.05] text-slate-400'}`}>{item}</span>
        ))}
      </div>
      <div className="space-y-3">
        {conversations.map((item) => (
          <article key={item.name} className="flex items-center gap-3 rounded-2xl bg-white/[0.035] p-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-bold text-white">{item.name.slice(0, 1)}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                <span className="text-[10px] text-slate-500">{item.time}</span>
              </div>
              <p className="truncate text-xs text-slate-500">{item.message}</p>
            </div>
            {item.unread > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">{item.unread}</span>}
          </article>
        ))}
      </div>
      <button className="absolute bottom-8 right-8 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_rgba(37,211,102,.3)]">
        <MessageCircle className="h-6 w-6" />
      </button>
    </PhoneShell>
  );
}

function ChatPhone() {
  return (
    <PhoneShell className="min-h-[640px] overflow-hidden">
      <div className="-m-4 mb-4 border-b border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand to-brandDark font-bold text-white">
            JR
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#11131d] bg-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">JR Celular</p>
            <span className="text-xs text-emerald-400">Atendente virtual ativo</span>
          </div>
          <Headphones className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="max-w-[82%] rounded-2xl rounded-tl-md bg-white/[0.08] p-3 text-sm text-slate-100">
          Olá! 👋 Eu sou o atendente virtual da JR Celular. Como posso te ajudar hoje?
          <p className="mt-1 text-right text-[10px] text-slate-500">11:30</p>
        </div>
        <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-md bg-[#0f6b3f] p-3 text-sm text-white">
          Quero saber o valor pra trocar a tela do iPhone 11
          <p className="mt-1 text-right text-[10px] text-emerald-100/70">11:31 ✓✓</p>
        </div>
        <div className="max-w-[86%] rounded-2xl rounded-tl-md bg-white/[0.08] p-3">
          <div className="flex items-center gap-3 text-sm text-white">
            <button className="grid h-10 w-10 place-items-center rounded-full bg-brand"><Mic2 className="h-4 w-4" /></button>
            <div className="h-1 flex-1 rounded-full bg-slate-700"><div className="h-full w-2/3 rounded-full bg-brandSoft" /></div>
            <span className="text-xs text-slate-400">0:18</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">Áudio gerado com voz autorizada</p>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0d1018] p-2">
        <span className="flex-1 px-3 text-xs text-slate-500">Digite sua mensagem</span>
        <button className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white"><Send className="h-4 w-4" /></button>
      </div>
    </PhoneShell>
  );
}

function AudioCard() {
  return (
    <PhoneShell className="min-h-[420px] text-center">
      <div className="mx-auto mt-4 grid h-32 w-32 place-items-center rounded-full border border-brand/50 bg-brand/10 shadow-glow">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-950 text-3xl font-black text-white">JR</div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-1 text-brandSoft">
        {Array.from({ length: 22 }).map((_, index) => (
          <span key={index} className="w-1 rounded-full bg-current" style={{ height: `${10 + ((index * 7) % 34)}px` }} />
        ))}
      </div>
      <p className="mt-7 text-sm font-semibold text-white">Mensagem de áudio</p>
      <p className="mt-1 text-xs text-slate-400">Voz do JR • fluxo aprovado</p>
      <div className="mx-auto mt-5 h-1 w-52 rounded-full bg-slate-800"><div className="h-full w-1/2 rounded-full bg-brand" /></div>
      <button className="mx-auto mt-8 grid h-20 w-20 place-items-center rounded-full bg-brand text-white shadow-glow">
        <Mic2 className="h-8 w-8" />
      </button>
    </PhoneShell>
  );
}

function MobileBottomNav() {
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 rounded-[1.5rem] border border-white/10 bg-[#0b0d15]/95 px-3 py-2 shadow-phone backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => (
          <button key={item.label} className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] ${item.active ? 'text-brandSoft' : 'text-slate-500'}`}>
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-app text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-36 top-0 h-[520px] w-[520px] rounded-full bg-brand/20 blur-[130px]" />
        <div className="absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[130px]" />
      </div>

      <HeaderBar />

      <div className="relative mx-auto flex max-w-7xl gap-5 px-4 pb-28 pt-5 lg:px-6 lg:pb-12">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <section className="mb-5 flex flex-col justify-between gap-4 rounded-[2rem] border border-white/10 bg-card/80 p-5 shadow-soft backdrop-blur-xl md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-xs font-semibold text-brandSoft">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Protótipo funcional • JR Celular
              </span>
              <h1 className="mt-4 text-2xl font-black tracking-tight text-white md:text-3xl">Painel de OS + WhatsApp IA</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                Interface mobile-first para controlar ordens de serviço e automatizar atendimento sem perder o jeito da assistência.
              </p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-glow">
              <Plus className="h-4 w-4" /> Nova OS
            </button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="OS abertas" value="32" helper="acompanhar gargalos" icon={CalendarClock} />
            <KpiCard title="Em execução" value="12" helper="serviços com técnico" icon={Wrench} />
            <KpiCard title="Aguardando cliente" value="7" helper="orçamentos pendentes" icon={Clock} />
            <KpiCard title="Faturamento previsto" value="R$ 8.450" helper="OS abertas e aprovadas" icon={CircleDollarSign} />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
            <DashboardPhone />
            <OrdersPhone />
            <DetailsPhone />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1fr_1fr]">
            <TimelinePhone />
            <WhatsAppPhone />
            <ChatPhone />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-2">
            <AudioCard />
            <div className="rounded-[2rem] border border-white/10 bg-card/80 p-5 shadow-soft backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brandSoft">Relatórios</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Resumo do período</h2>
                </div>
                <Bot className="h-6 w-6 text-brandSoft" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <KpiCard title="Concluídas" value="24" helper="no período" icon={CheckCircle2} />
                <KpiCard title="Ticket médio" value="R$ 352" helper="por serviço" icon={CircleDollarSign} />
              </div>
              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
                <p className="text-sm font-semibold text-white">Próxima etapa real</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Depois desta interface, conectamos Supabase no CRUD e ligamos a Evolution para enviar status de OS pelo WhatsApp.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <MobileBottomNav />
    </main>
  );
}
