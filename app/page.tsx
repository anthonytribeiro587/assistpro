import type { ElementType } from 'react';
import { ArrowRight, Bot, CalendarClock, CheckCircle2, CircleDollarSign, Clock, MessageCircle, Mic2, Plus, Search, ShieldCheck, Smartphone, UserRound, Wrench } from 'lucide-react';
import { conversations, serviceOrders, statusLabels, type ServiceOrderStatus } from '@/lib/mock-data';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const statusTone: Record<ServiceOrderStatus, string> = {
  recebido: 'bg-slate-500/15 text-slate-200',
  analise: 'bg-blue-500/15 text-blue-200',
  orcamento_enviado: 'bg-purple-500/15 text-purple-200',
  aguardando_aprovacao: 'bg-yellow-500/15 text-yellow-200',
  em_execucao: 'bg-emerald-500/15 text-emerald-200',
  aguardando_peca: 'bg-orange-500/15 text-orange-200',
  testes: 'bg-cyan-500/15 text-cyan-200',
  pronto: 'bg-green-500/15 text-green-200',
  entregue: 'bg-zinc-500/15 text-zinc-200',
  cancelado: 'bg-red-500/15 text-red-200'
};

const timeline: ServiceOrderStatus[] = ['recebido', 'analise', 'orcamento_enviado', 'aguardando_aprovacao', 'em_execucao', 'testes', 'pronto', 'entregue'];

function KpiCard({ title, value, helper, icon: Icon }: { title: string; value: string; helper: string; icon: ElementType }) {
  return (
    <div className="rounded-3xl border border-line bg-panel/80 p-5 shadow-glow backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <strong className="mt-2 block text-3xl font-semibold tracking-tight">{value}</strong>
        </div>
        <div className="rounded-2xl bg-brand/15 p-3 text-brandSoft">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ServiceOrderStatus }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone[status]}`}>{statusLabels[status]}</span>;
}

function OrderList() {
  return (
    <section id="os" className="rounded-[2rem] border border-line bg-panel/70 p-5 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brandSoft">Operação</p>
          <h2 className="mt-1 text-2xl font-semibold">Ordens de serviço</h2>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold shadow-glow transition hover:bg-brandSoft">
          <Plus className="h-4 w-4" /> Nova OS
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-ink/60 px-4 py-3 text-slate-400">
        <Search className="h-4 w-4" />
        <span className="text-sm">Buscar por cliente, aparelho ou número da OS</span>
      </div>

      <div className="mt-5 space-y-3">
        {serviceOrders.map((order) => (
          <article key={order.id} className="rounded-3xl border border-line bg-panelSoft/80 p-4 transition hover:border-brand/60">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-slate-300">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{order.id}</strong>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{order.customer} • {order.device}</p>
                  <p className="mt-1 text-xs text-slate-500">{order.issue}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-semibold text-emerald-300">{money.format(order.amount)}</p>
                <p className="text-xs text-slate-500">Previsão: {order.dueDate}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function OrderDetails() {
  const order = serviceOrders[0];
  const currentIndex = timeline.indexOf(order.status);

  return (
    <section className="rounded-[2rem] border border-line bg-panel/70 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brandSoft">Detalhe da OS</p>
          <h2 className="mt-1 text-2xl font-semibold">{order.id}</h2>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-line bg-panelSoft p-4">
          <p className="text-xs text-slate-500">Cliente</p>
          <p className="mt-1 font-semibold">{order.customer}</p>
          <p className="text-sm text-emerald-300">{order.phone}</p>
        </div>
        <div className="rounded-3xl border border-line bg-panelSoft p-4">
          <p className="text-xs text-slate-500">Aparelho</p>
          <p className="mt-1 font-semibold">{order.device}</p>
          <p className="text-sm text-slate-400">IMEI / série será cadastrado na OS</p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-line bg-panelSoft p-4">
        <p className="text-xs text-slate-500">Defeito relatado</p>
        <p className="mt-1 text-slate-200">{order.issue}</p>
      </div>

      <div className="mt-5 space-y-4">
        {timeline.map((status, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <div key={status} className="flex gap-3">
              <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-success' : active ? 'bg-warning text-ink' : 'bg-zinc-700 text-zinc-400'}`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Wrench className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>
              <div>
                <p className={active ? 'font-semibold text-white' : done ? 'text-slate-200' : 'text-slate-500'}>{statusLabels[status]}</p>
                <p className="text-xs text-slate-500">Atualização automática para o cliente pode sair daqui.</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WhatsappPanel() {
  return (
    <section id="whatsapp" className="rounded-[2rem] border border-line bg-panel/70 p-5 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brandSoft">WhatsApp</p>
          <h2 className="mt-1 text-2xl font-semibold">Atendente IA</h2>
        </div>
        <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
          <MessageCircle className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <div key={conversation.name} className="rounded-3xl border border-line bg-panelSoft p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-brandSoft">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{conversation.name}</p>
                    <p className="text-xs text-slate-500">{conversation.orderId}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{conversation.time}</span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{conversation.message}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-line bg-ink/70 p-4">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Assistente JR Celular</p>
              <p className="text-xs text-emerald-300">online • modo seguro</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="max-w-[82%] rounded-3xl rounded-tl-md bg-panelSoft p-4 text-sm text-slate-200">
              Olá! Sou o atendente virtual da JR Celular. Me diga o modelo do aparelho e o problema para eu te ajudar.
            </div>
            <div className="ml-auto max-w-[82%] rounded-3xl rounded-tr-md bg-emerald-600/80 p-4 text-sm">
              Quero trocar a tela do iPhone 11. Quanto fica?
            </div>
            <div className="max-w-[82%] rounded-3xl rounded-tl-md bg-panelSoft p-4 text-sm text-slate-200">
              Consigo te passar uma estimativa e, para confirmar o valor, vou abrir um pré-atendimento para a equipe validar a peça.
            </div>
            <div className="flex max-w-[82%] items-center gap-3 rounded-3xl bg-panelSoft p-4">
              <button className="rounded-full bg-brand p-2"><Mic2 className="h-4 w-4" /></button>
              <div className="h-2 flex-1 rounded-full bg-line">
                <div className="h-2 w-2/3 rounded-full bg-brandSoft" />
              </div>
              <span className="text-xs text-slate-400">0:18</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const items: Array<{ title: string; text: string; icon: ElementType }> = [
    { title: 'MVP de OS', text: 'Clientes, aparelhos, orçamento, etapas, histórico e relatórios básicos.', icon: Smartphone },
    { title: 'Evolution API', text: 'Envio de status, consulta de OS e atendimento pelo WhatsApp.', icon: MessageCircle },
    { title: 'IA com segurança', text: 'Responde dúvidas, entende áudio e transfere casos delicados para humano.', icon: ShieldCheck },
    { title: 'Voz autorizada', text: 'Resposta em áudio com voz do JR somente em fluxos aprovados.', icon: Mic2 }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="rounded-3xl border border-line bg-panel/70 p-5">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm text-slate-500">Fase {index + 1}</span>
              <Icon className="h-5 w-5 text-brandSoft" />
            </div>
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
          </div>
        );
      })}
    </section>
  );
}

export default function Home() {
  const openOrders = serviceOrders.filter((order) => !['entregue', 'cancelado'].includes(order.status)).length;
  const revenue = serviceOrders.reduce((acc, order) => acc + order.amount, 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 rounded-[2rem] border border-line bg-panel/60 p-5 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brandSoft">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> MVP AssistPro
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            OS da assistência + WhatsApp com IA em um só painel.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-400">
            Protótipo funcional para a JR Celular: controle operacional primeiro, automação de atendimento depois, e voz do JR como camada premium com autorização.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="#os" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-200">
            Ver OS <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#whatsapp" className="inline-flex items-center gap-2 rounded-2xl border border-line px-5 py-3 text-sm font-semibold transition hover:border-brand/70">
            WhatsApp IA
          </a>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="OS abertas" value={String(openOrders)} helper="Acompanhar gargalos da operação" icon={CalendarClock} />
        <KpiCard title="Em execução" value="12" helper="Serviços com técnico responsável" icon={Wrench} />
        <KpiCard title="Aguardando cliente" value="7" helper="Orçamentos pendentes de aprovação" icon={Clock} />
        <KpiCard title="Faturamento previsto" value={money.format(revenue)} helper="Somatório das OS em aberto" icon={CircleDollarSign} />
      </section>

      <Roadmap />

      <div className="grid gap-8 xl:grid-cols-[1.05fr_.95fr]">
        <OrderList />
        <OrderDetails />
      </div>

      <WhatsappPanel />
    </main>
  );
}
