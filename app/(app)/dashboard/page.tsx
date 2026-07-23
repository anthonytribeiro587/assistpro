import Link from 'next/link';
import {
  CheckCircle2,
  Clock3,
  MessageCircle,
  Plus,
  UsersRound,
  Wrench
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { loadDashboardData } from '@/lib/dashboard-data';
import { formatMoney } from '@/lib/format';
import { pipelineStages } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

const orderStatusLabels: Record<string, string> = {
  recebido: 'Recebido',
  analise: 'Em análise',
  orcamento_enviado: 'Orçamento enviado',
  aguardando_aprovacao: 'Aguardando aprovação',
  em_execucao: 'Em execução',
  aguardando_peca: 'Aguardando peça',
  testes: 'Em testes',
  pronto: 'Pronto para retirada',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
};

function Kpi({
  title,
  value,
  helper,
  icon: Icon,
  tone = 'violet'
}: {
  title: string;
  value: string;
  helper: string;
  icon: typeof Wrench;
  tone?: 'violet' | 'green' | 'amber' | 'blue';
}) {
  const toneClass = {
    violet: 'bg-violet-50 text-violet-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700'
  }[tone];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500">{title}</p>
          <strong className="mt-1.5 block text-2xl font-extrabold tracking-tight text-slate-950">{value}</strong>
          <p className="mt-1 text-[11px] text-slate-400">{helper}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export default async function DashboardPage() {
  const data = await loadDashboardData();
  const attentionStages = pipelineStages.filter((stage) =>
    ['contato_iniciado', 'cotacao_pendente', 'responder_orcamento', 'aguardando_cliente'].includes(stage.id)
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Operação"
        title="Visão geral"
        description="Indicadores de atendimento, ordens de serviço e conversas que exigem ação da equipe."
        action={
          <Link
            href="/ordens/nova"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" /> Nova OS
          </Link>
        }
      />

      {data.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          {data.error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi title="OS abertas" value={String(data.openOrders)} helper="todas as etapas ativas" icon={Wrench} />
        <Kpi title="Em execução" value={String(data.inProgressOrders)} helper="serviço ou testes" icon={CheckCircle2} tone="green" />
        <Kpi title="Aguardando ação" value={String(data.waitingOrders)} helper="cliente, orçamento ou peça" icon={Clock3} tone="amber" />
        <Kpi title="Prontas" value={String(data.readyOrders)} helper="aguardando retirada" icon={CheckCircle2} tone="blue" />
        <Kpi title="Clientes" value={String(data.customerCount)} helper="cadastros na base" icon={UsersRound} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">Ordens recentes</h2>
              <p className="mt-0.5 text-xs text-slate-500">Últimas movimentações registradas no sistema.</p>
            </div>
            <Link href="/ordens" className="text-xs font-bold text-violet-700">Ver todas</Link>
          </header>

          <div className="divide-y divide-slate-100">
            {data.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/ordens/${order.id}`}
                className="grid gap-2 px-4 py-3 transition hover:bg-slate-50 sm:grid-cols-[110px_1fr_150px_100px] sm:items-center"
              >
                <strong className="text-xs text-slate-950">OS #{order.number}</strong>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{order.customer}</p>
                  <p className="truncate text-xs text-slate-500">{order.device}</p>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                  {orderStatusLabels[order.status] || order.status}
                </span>
                <strong className="text-left text-xs text-slate-700 sm:text-right">
                  {order.amount ? formatMoney(order.amount) : 'Sem valor'}
                </strong>
              </Link>
            ))}

            {!data.recentOrders.length ? (
              <div className="p-8 text-center text-sm text-slate-500">Nenhuma ordem de serviço registrada.</div>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">Fila de atendimento</h2>
              <p className="mt-0.5 text-xs text-slate-500">Conversas agrupadas pela próxima ação.</p>
            </div>
            <Link href="/pipeline" className="text-xs font-bold text-violet-700">Abrir funil</Link>
          </div>

          <div className="mt-3 space-y-2">
            {attentionStages.map((stage) => (
              <Link
                key={stage.id}
                href="/pipeline"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-violet-300"
              >
                <div>
                  <strong className="block text-sm text-slate-800">{stage.label}</strong>
                  <span className="text-[11px] text-slate-500">{stage.description}</span>
                </div>
                <span className="grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-xs font-black text-violet-700 ring-1 ring-slate-200">
                  {data.pipelineCounts[stage.id]}
                </span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-950">Conversas recentes</h2>
            <p className="mt-0.5 text-xs text-slate-500">Últimos contatos recebidos pelo WhatsApp.</p>
          </div>
          <Link href="/whatsapp" className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700">
            <MessageCircle className="h-3.5 w-3.5" /> Abrir inbox
          </Link>
        </header>

        <div className="grid gap-px bg-slate-100 md:grid-cols-2 xl:grid-cols-5">
          {data.conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/whatsapp?conversation=${conversation.id}`}
              className="min-w-0 bg-white p-3 transition hover:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="truncate text-sm text-slate-900">{conversation.customerName}</strong>
                <span className="shrink-0 text-[10px] text-slate-400">{formatDate(conversation.lastMessageAt)}</span>
              </div>
              <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-slate-500">
                {conversation.lastMessage?.content || 'Conversa iniciada'}
              </p>
            </Link>
          ))}

          {!data.conversations.length ? (
            <div className="col-span-full bg-white p-8 text-center text-sm text-slate-500">Nenhuma conversa registrada.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
