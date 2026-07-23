export const pipelineStages = [
  {
    id: 'contato_iniciado',
    label: 'Contato iniciado',
    shortLabel: 'Novo contato',
    description: 'Cliente entrou em contato e ainda precisa ser direcionado.'
  },
  {
    id: 'necessidade_identificada',
    label: 'Necessidade identificada',
    shortLabel: 'Necessidade',
    description: 'Assistência, produto ou acompanhamento já foram identificados.'
  },
  {
    id: 'cotacao_pendente',
    label: 'Cotação pendente',
    shortLabel: 'Cotação',
    description: 'A equipe precisa consultar preço, peça ou disponibilidade.'
  },
  {
    id: 'responder_orcamento',
    label: 'Responder com orçamento',
    shortLabel: 'Responder',
    description: 'Informação pronta para ser enviada ao cliente.'
  },
  {
    id: 'aguardando_cliente',
    label: 'Aguardando cliente',
    shortLabel: 'Aguardando',
    description: 'Proposta enviada e aguardando retorno do cliente.'
  },
  {
    id: 'encaminhado_loja',
    label: 'Encaminhado para a loja',
    shortLabel: 'Loja',
    description: 'Cliente orientado a levar o aparelho ou comparecer à loja.'
  },
  {
    id: 'concluido',
    label: 'Concluído',
    shortLabel: 'Concluído',
    description: 'Atendimento comercial ou pré-atendimento finalizado.'
  }
] as const;

export type PipelineStage = (typeof pipelineStages)[number]['id'];

export const pipelineStageIds = pipelineStages.map((stage) => stage.id) as [
  PipelineStage,
  ...PipelineStage[]
];

export function normalizePipelineStage(value?: string | null): PipelineStage {
  const normalized = String(value || '').trim().toLowerCase();
  if (pipelineStages.some((stage) => stage.id === normalized)) return normalized as PipelineStage;

  if (['closed', 'done', 'finished', 'resolved', 'concluido'].includes(normalized)) return 'concluido';
  if (['human', 'human_takeover', 'encaminhado', 'handoff'].includes(normalized)) return 'encaminhado_loja';
  if (['waiting', 'waiting_customer', 'aguardando'].includes(normalized)) return 'aguardando_cliente';
  if (['quote', 'quote_sent', 'orcamento'].includes(normalized)) return 'responder_orcamento';

  return 'contato_iniciado';
}

export function pipelineStageLabel(value?: string | null) {
  const stage = normalizePipelineStage(value);
  return pipelineStages.find((item) => item.id === stage)?.label || 'Contato iniciado';
}
