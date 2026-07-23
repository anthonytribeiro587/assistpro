export const serviceOrderStatuses = [
  'recebido',
  'analise',
  'orcamento_enviado',
  'aguardando_aprovacao',
  'em_execucao',
  'aguardando_peca',
  'testes',
  'pronto',
  'entregue',
  'cancelado'
] as const;

export type DatabaseServiceOrderStatus = (typeof serviceOrderStatuses)[number];

export const serviceOrderStatusLabels: Record<DatabaseServiceOrderStatus, string> = {
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

export const serviceOrderStatusClasses: Record<DatabaseServiceOrderStatus, string> = {
  recebido: 'bg-slate-100 text-slate-700 ring-slate-200',
  analise: 'bg-blue-50 text-blue-700 ring-blue-100',
  orcamento_enviado: 'bg-violet-50 text-violet-700 ring-violet-100',
  aguardando_aprovacao: 'bg-amber-50 text-amber-700 ring-amber-100',
  em_execucao: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  aguardando_peca: 'bg-orange-50 text-orange-700 ring-orange-100',
  testes: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  pronto: 'bg-green-50 text-green-700 ring-green-100',
  entregue: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  cancelado: 'bg-red-50 text-red-700 ring-red-100'
};
