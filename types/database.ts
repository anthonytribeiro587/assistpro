export type UserRole = 'owner' | 'admin' | 'attendant' | 'technician';

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

export type Customer = {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  document?: string | null;
  notes?: string | null;
  created_at: string;
};

export type Device = {
  id: string;
  company_id: string;
  customer_id: string;
  brand?: string | null;
  model: string;
  color?: string | null;
  imei?: string | null;
  serial_number?: string | null;
  unlock_info?: string | null;
  created_at: string;
};

export type ServiceOrder = {
  id: string;
  company_id: string;
  customer_id: string;
  device_id: string;
  number: number;
  status: ServiceOrderStatus;
  problem_description: string;
  physical_condition?: string | null;
  accessories?: string | null;
  technician_id?: string | null;
  estimated_value?: number | null;
  approved_value?: number | null;
  entry_date: string;
  due_date?: string | null;
  delivered_at?: string | null;
  warranty_days: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};
