export type ServiceOrderStatus =
  | 'recebido'
  | 'analise'
  | 'orcamento_enviado'
  | 'aguardando_aprovacao'
  | 'em_execucao'
  | 'aguardando_peca'
  | 'testes'
  | 'pronto'
  | 'entregue'
  | 'cancelado';

export const statusLabels: Record<ServiceOrderStatus, string> = {
  recebido: 'Aparelho recebido',
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

export const serviceOrders = [
  {
    id: 'OS #2026-00132',
    customer: 'João Silva',
    phone: '(51) 98765-4321',
    device: 'iPhone 11',
    issue: 'Tela quebrada / touch não funciona',
    status: 'em_execucao' as ServiceOrderStatus,
    technician: 'Lucas R.',
    amount: 520,
    entryDate: '15/07/2026',
    dueDate: '17/07/2026'
  },
  {
    id: 'OS #2026-00131',
    customer: 'Maria Santos',
    phone: '(51) 98654-3210',
    device: 'Samsung A54',
    issue: 'Não carrega',
    status: 'aguardando_aprovacao' as ServiceOrderStatus,
    technician: 'Renan P.',
    amount: 180,
    entryDate: '15/07/2026',
    dueDate: '16/07/2026'
  },
  {
    id: 'OS #2026-00130',
    customer: 'Carlos Souza',
    phone: '(51) 97654-2109',
    device: 'Motorola G60',
    issue: 'Conector de carga',
    status: 'aguardando_peca' as ServiceOrderStatus,
    technician: 'Lucas R.',
    amount: 150,
    entryDate: '14/07/2026',
    dueDate: '18/07/2026'
  },
  {
    id: 'OS #2026-00129',
    customer: 'Ana Paula',
    phone: '(51) 96543-2108',
    device: 'iPhone 8',
    issue: 'Bateria descarregando rápido',
    status: 'pronto' as ServiceOrderStatus,
    technician: 'Renan P.',
    amount: 220,
    entryDate: '14/07/2026',
    dueDate: '15/07/2026'
  }
];

export const conversations = [
  { name: 'João Silva', message: 'Meu aparelho já ficou pronto?', time: '11:32', unread: 2, orderId: 'OS #2026-00132' },
  { name: 'Maria Santos', message: 'Ok, vou aguardar', time: '11:20', unread: 0, orderId: 'OS #2026-00131' },
  { name: 'Cliente novo', message: 'Quero saber valor para trocar bateria', time: '10:58', unread: 1, orderId: 'Pré-atendimento' },
  { name: 'Carlos Souza', message: 'Pode ser', time: '10:45', unread: 0, orderId: 'OS #2026-00130' }
];
