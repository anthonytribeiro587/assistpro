export const pipelineStages = [
  {
    id: 'contato_iniciado',
    label: 'Contato iniciado',
    shortLabel: 'Novo contato',
    description: 'Cliente entrou em contato e ainda precisa ser direcionado.',
    columnClass: 'border-slate-200 bg-slate-100/80',
    headerClass: 'bg-slate-200/70 text-slate-800',
    badgeClass: 'bg-slate-200 text-slate-700'
  },
  {
    id: 'necessidade_identificada',
    label: 'Necessidade identificada',
    shortLabel: 'Necessidade',
    description: 'Assistência, produto ou acompanhamento já foram identificados.',
    columnClass: 'border-blue-200 bg-blue-50/70',
    headerClass: 'bg-blue-100 text-blue-900',
    badgeClass: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'cotacao_pendente',
    label: 'Cotação pendente',
    shortLabel: 'Cotação',
    description: 'A equipe precisa consultar preço, peça ou disponibilidade.',
    columnClass: 'border-amber-200 bg-amber-50/70',
    headerClass: 'bg-amber-100 text-amber-900',
    badgeClass: 'bg-amber-100 text-amber-700'
  },
  {
    id: 'responder_orcamento',
    label: 'Responder com orçamento',
    shortLabel: 'Responder',
    description: 'Informação pronta para ser enviada ao cliente.',
    columnClass: 'border-violet-200 bg-violet-50/70',
    headerClass: 'bg-violet-100 text-violet-900',
    badgeClass: 'bg-violet-100 text-violet-700'
  },
  {
    id: 'aguardando_cliente',
    label: 'Aguardando cliente',
    shortLabel: 'Aguardando',
    description: 'Proposta enviada e aguardando retorno do cliente.',
    columnClass: 'border-orange-200 bg-orange-50/70',
    headerClass: 'bg-orange-100 text-orange-900',
    badgeClass: 'bg-orange-100 text-orange-700'
  },
  {
    id: 'encaminhado_loja',
    label: 'Encaminhado para a loja',
    shortLabel: 'Loja',
    description: 'Cliente orientado a levar o aparelho ou comparecer à loja.',
    columnClass: 'border-emerald-200 bg-emerald-50/70',
    headerClass: 'bg-emerald-100 text-emerald-900',
    badgeClass: 'bg-emerald-100 text-emerald-700'
  },
  {
    id: 'concluido',
    label: 'Concluído',
    shortLabel: 'Concluído',
    description: 'Atendimento comercial ou pré-atendimento finalizado.',
    columnClass: 'border-green-200 bg-green-50/70',
    headerClass: 'bg-green-100 text-green-900',
    badgeClass: 'bg-green-100 text-green-700'
  }
] as const;

export type PipelineStage = (typeof pipelineStages)[number]['id'];

export const pipelineStageIds = pipelineStages.map((stage) => stage.id) as [
  PipelineStage,
  ...PipelineStage[]
];

const stageRank = Object.fromEntries(
  pipelineStages.map((stage, index) => [stage.id, index])
) as Record<PipelineStage, number>;

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

export function pipelineStageMeta(value?: string | null) {
  const stage = normalizePipelineStage(value);
  return pipelineStages.find((item) => item.id === stage) || pipelineStages[0];
}

export function advancePipelineStage(current: string | null | undefined, proposed: PipelineStage) {
  const normalizedCurrent = normalizePipelineStage(current);
  if (normalizedCurrent === 'concluido' && proposed !== 'contato_iniciado') return proposed;
  return stageRank[proposed] > stageRank[normalizedCurrent] ? proposed : normalizedCurrent;
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function deriveInboundPipelineStage(textValue: unknown): PipelineStage {
  const text = String(textValue || '').trim().toLowerCase();

  if (
    includesAny(text, [
      'quanto custa',
      'qual o valor',
      'preço',
      'preco',
      'orçamento',
      'orcamento',
      'tem disponível',
      'tem disponivel',
      'disponibilidade',
      'estoque'
    ])
  ) {
    return 'cotacao_pendente';
  }

  if (
    includesAny(text, [
      'bateria',
      'tela',
      'não carrega',
      'nao carrega',
      'não liga',
      'nao liga',
      'conserto',
      'reparo',
      'defeito',
      'assistência',
      'assistencia',
      'película',
      'pelicula',
      'capinha',
      'carregador',
      'cabo',
      'fone',
      'celular',
      'acessório',
      'acessorio',
      'ordem de serviço',
      'ordem de servico',
      'status do aparelho'
    ])
  ) {
    return 'necessidade_identificada';
  }

  return 'contato_iniciado';
}

export function deriveOutboundPipelineStage(input: {
  text?: unknown;
  audioKey?: unknown;
  explicitStage?: unknown;
}): PipelineStage | null {
  const explicit = String(input.explicitStage || '').trim().toLowerCase();
  if (pipelineStages.some((stage) => stage.id === explicit)) return explicit as PipelineStage;

  const audioKey = String(input.audioKey || '').trim().toLowerCase();
  if (audioKey === 'encerramento') return 'concluido';
  if (['avaliacao', 'preco'].includes(audioKey)) return 'encaminhado_loja';
  if (['estoque', 'produto'].includes(audioKey)) return 'cotacao_pendente';

  const text = String(input.text || '').trim().toLowerCase();
  if (!text) return null;

  if (
    includesAny(text, [
      'leva o aparelho',
      'levar o aparelho',
      'trazer o aparelho',
      'avaliação presencial',
      'avaliacao presencial',
      'comparecer à loja',
      'comparecer a loja',
      'passa aqui na jr',
      'até a jr celular',
      'ate a jr celular'
    ])
  ) {
    return 'encaminhado_loja';
  }

  if (
    includesAny(text, [
      'vou verificar',
      'vamos verificar',
      'consultar com a equipe',
      'confirmar com a equipe',
      'verificar disponibilidade',
      'verificar o estoque'
    ])
  ) {
    return 'cotacao_pendente';
  }

  if (
    includesAny(text, [
      'orçamento ficou',
      'orcamento ficou',
      'o valor é',
      'o valor e',
      'fica em r$',
      'total de r$',
      'aprova o orçamento',
      'aprova o orcamento'
    ])
  ) {
    return 'aguardando_cliente';
  }

  if (includesAny(text, ['orçamento pronto', 'orcamento pronto', 'já tenho o valor', 'ja tenho o valor'])) {
    return 'responder_orcamento';
  }

  if (includesAny(text, ['atendimento concluído', 'atendimento concluido', 'qualquer dúvida', 'qualquer duvida'])) {
    return 'concluido';
  }

  return null;
}
