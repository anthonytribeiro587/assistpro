import type { LucideIcon } from 'lucide-react';
import { BarChart3, Columns3, Home, MessageCircle, Settings, UsersRound, Wrench } from 'lucide-react';

export type ServiceOrderStatus =
  | 'received'
  | 'diagnosis'
  | 'quote_sent'
  | 'waiting_approval'
  | 'in_progress'
  | 'waiting_part'
  | 'quality_test'
  | 'ready'
  | 'delivered'
  | 'canceled';

export type ServiceOrder = {
  id: string;
  customer: string;
  phone: string;
  device: string;
  deviceDetails: string;
  imei: string;
  issue: string;
  status: ServiceOrderStatus;
  technician: string;
  amount: number;
  cost: number;
  entryDate: string;
  dueDate: string;
  elapsed: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const statusLabels: Record<ServiceOrderStatus, string> = {
  received: 'Aparelho recebido',
  diagnosis: 'Em análise',
  quote_sent: 'Orçamento enviado',
  waiting_approval: 'Aguardando aprovação',
  in_progress: 'Em execução',
  waiting_part: 'Aguardando peça',
  quality_test: 'Teste de qualidade',
  ready: 'Pronto para retirada',
  delivered: 'Entregue',
  canceled: 'Cancelado'
};

export const statusTone: Record<ServiceOrderStatus, string> = {
  received: 'bg-slate-100 text-slate-700 ring-slate-200',
  diagnosis: 'bg-blue-50 text-blue-700 ring-blue-100',
  quote_sent: 'bg-violet-50 text-violet-700 ring-violet-100',
  waiting_approval: 'bg-amber-50 text-amber-700 ring-amber-100',
  in_progress: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  waiting_part: 'bg-orange-50 text-orange-700 ring-orange-100',
  quality_test: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  ready: 'bg-green-50 text-green-700 ring-green-100',
  delivered: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  canceled: 'bg-red-50 text-red-700 ring-red-100'
};

export const navGroups: NavGroup[] = [
  {
    label: 'Operação',
    items: [
      { label: 'Visão geral', href: '/dashboard', icon: Home },
      { label: 'Ordens de serviço', href: '/ordens', icon: Wrench },
      { label: 'Clientes', href: '/clientes', icon: UsersRound }
    ]
  },
  {
    label: 'Atendimento',
    items: [
      { label: 'Funil de clientes', href: '/pipeline', icon: Columns3 },
      { label: 'WhatsApp', href: '/whatsapp', icon: MessageCircle }
    ]
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Relatórios', href: '/relatorios', icon: BarChart3 },
      { label: 'Administração', href: '/configuracoes', icon: Settings }
    ]
  }
];

export const navItems = navGroups.flatMap((group) => group.items);

export const serviceOrders: ServiceOrder[] = [
  {
    id: 'OS #2025-00132',
    customer: 'João Silva',
    phone: '(11) 98765-4321',
    device: 'iPhone 11',
    deviceDetails: 'iPhone 11 • Preto • 64GB',
    imei: '356789101112131',
    issue: 'Tela quebrada / touch não funciona',
    status: 'in_progress',
    technician: 'Lucas R.',
    amount: 350,
    cost: 220,
    entryDate: '23/05/2025 10:30',
    dueDate: '27/05/2025',
    elapsed: 'Aberta há 1h 20m'
  },
  {
    id: 'OS #2025-00131',
    customer: 'Maria Santos',
    phone: '(11) 98654-3210',
    device: 'Samsung A54',
    deviceDetails: 'Samsung A54 • Não carrega',
    imei: '985612340009871',
    issue: 'Aparelho não carrega e esquenta na tomada',
    status: 'waiting_approval',
    technician: 'Renan P.',
    amount: 280,
    cost: 120,
    entryDate: '23/05/2025 10:25',
    dueDate: '26/05/2025',
    elapsed: 'Aguardando cliente'
  },
  {
    id: 'OS #2025-00130',
    customer: 'Carlos Souza',
    phone: '(11) 97654-2109',
    device: 'Motorola G60',
    deviceDetails: 'Motorola G60 • Conector de carga',
    imei: '667812309984451',
    issue: 'Conector de carga com mau contato',
    status: 'waiting_part',
    technician: 'Lucas R.',
    amount: 220,
    cost: 80,
    entryDate: '23/05/2025 09:58',
    dueDate: '28/05/2025',
    elapsed: 'Peça encomendada'
  },
  {
    id: 'OS #2025-00129',
    customer: 'Ana Paula',
    phone: '(11) 96543-2108',
    device: 'iPhone 8',
    deviceDetails: 'iPhone 8 • Bateria',
    imei: '109872345612300',
    issue: 'Bateria descarregando rápido',
    status: 'ready',
    technician: 'Renan P.',
    amount: 180,
    cost: 70,
    entryDate: '23/05/2025 09:15',
    dueDate: '23/05/2025',
    elapsed: 'Pronto para retirada'
  }
];

export const customers = [
  { name: 'João Silva', phone: '(11) 98765-4321', orders: 3, lastOrder: 'iPhone 11', status: 'Em atendimento' },
  { name: 'Maria Santos', phone: '(11) 98654-3210', orders: 1, lastOrder: 'Samsung A54', status: 'Aguardando aprovação' },
  { name: 'Carlos Souza', phone: '(11) 97654-2109', orders: 2, lastOrder: 'Motorola G60', status: 'Aguardando peça' },
  { name: 'Ana Paula', phone: '(11) 96543-2108', orders: 5, lastOrder: 'iPhone 8', status: 'Cliente recorrente' }
];

export const conversations = [
  { name: 'João Silva', orderId: 'OS #2025-00132', message: 'Me envia o link de aprovação?', time: '11:32', unread: 2, avatar: 'JS' },
  { name: 'Maria Santos', orderId: 'OS #2025-00131', message: 'Ok, vou aguardar', time: '11:20', unread: 1, avatar: 'MS' },
  { name: '(11) 98654-3210', orderId: 'Pré-atendimento', message: 'Quero saber sobre troca de bateria', time: '10:58', unread: 1, avatar: 'CL' },
  { name: 'Carlos Souza', orderId: 'OS #2025-00130', message: 'Pode ser hoje?', time: '10:45', unread: 0, avatar: 'CS' }
];

export const timeline: ServiceOrderStatus[] = [
  'received',
  'diagnosis',
  'quote_sent',
  'waiting_approval',
  'in_progress',
  'waiting_part',
  'quality_test',
  'ready',
  'delivered'
];
