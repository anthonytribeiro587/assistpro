import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedProfile } from '@/lib/supabase-server';

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

export type ServiceOrderRow = {
  id: string;
  number: number;
  status: DatabaseServiceOrderStatus;
  problemDescription: string;
  physicalCondition: string;
  accessories: string;
  estimatedValue: number;
  approvedValue: number | null;
  entryDate: string;
  dueDate: string | null;
  deliveredAt: string | null;
  warrantyDays: number;
  customerId: string;
  customerName: string;
  phone: string;
  document: string;
  deviceId: string;
  brand: string;
  model: string;
  color: string;
  imei: string;
  serialNumber: string;
  technicianId: string | null;
  technicianName: string;
};

function relation(value: unknown) {
  return (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | null;
}

function normalizeStatus(value: unknown): DatabaseServiceOrderStatus {
  const normalized = String(value || 'recebido') as DatabaseServiceOrderStatus;
  return serviceOrderStatuses.includes(normalized) ? normalized : 'recebido';
}

function mapOrder(order: Record<string, unknown>): ServiceOrderRow {
  const customer = relation(order.customers);
  const device = relation(order.devices);
  const technician = relation(order.profiles);

  return {
    id: String(order.id),
    number: Number(order.number || 0),
    status: normalizeStatus(order.status),
    problemDescription: String(order.problem_description || ''),
    physicalCondition: String(order.physical_condition || ''),
    accessories: String(order.accessories || ''),
    estimatedValue: Number(order.estimated_value || 0),
    approvedValue: order.approved_value === null || order.approved_value === undefined
      ? null
      : Number(order.approved_value),
    entryDate: String(order.entry_date || ''),
    dueDate: order.due_date ? String(order.due_date) : null,
    deliveredAt: order.delivered_at ? String(order.delivered_at) : null,
    warrantyDays: Number(order.warranty_days || 90),
    customerId: String(order.customer_id || customer?.id || ''),
    customerName: String(customer?.name || 'Cliente não informado'),
    phone: String(customer?.phone || ''),
    document: String(customer?.document || ''),
    deviceId: String(order.device_id || device?.id || ''),
    brand: String(device?.brand || ''),
    model: String(device?.model || 'Aparelho não informado'),
    color: String(device?.color || ''),
    imei: String(device?.imei || ''),
    serialNumber: String(device?.serial_number || ''),
    technicianId: order.technician_id ? String(order.technician_id) : null,
    technicianName: String(technician?.full_name || 'Não atribuído')
  };
}

export async function loadServiceOrders(limit = 300): Promise<{ rows: ServiceOrderRow[]; error?: string }> {
  const profile = await getAuthenticatedProfile();
  if (!profile) return { rows: [], error: 'Seu usuário ainda não possui perfil na empresa.' };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { rows: [], error: 'Supabase administrativo não configurado.' };

  try {
    const result = await supabase
      .from('service_orders')
      .select(
        'id,number,status,problem_description,physical_condition,accessories,estimated_value,approved_value,entry_date,due_date,delivered_at,warranty_days,customer_id,device_id,technician_id,customers(id,name,phone,document),devices(id,brand,model,color,imei,serial_number),profiles!service_orders_technician_id_fkey(full_name)'
      )
      .eq('company_id', profile.companyId)
      .order('entry_date', { ascending: false })
      .limit(limit);

    if (result.error) throw new Error(result.error.message);
    return { rows: (result.data || []).map((item) => mapOrder(item as Record<string, unknown>)) };
  } catch (error) {
    return {
      rows: [],
      error: error instanceof Error ? error.message : 'Não foi possível carregar as ordens de serviço.'
    };
  }
}

export async function loadServiceOrder(id: string): Promise<{ row: ServiceOrderRow | null; error?: string }> {
  const profile = await getAuthenticatedProfile();
  if (!profile) return { row: null, error: 'Seu usuário ainda não possui perfil na empresa.' };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { row: null, error: 'Supabase administrativo não configurado.' };

  try {
    const result = await supabase
      .from('service_orders')
      .select(
        'id,number,status,problem_description,physical_condition,accessories,estimated_value,approved_value,entry_date,due_date,delivered_at,warranty_days,customer_id,device_id,technician_id,customers(id,name,phone,document),devices(id,brand,model,color,imei,serial_number),profiles!service_orders_technician_id_fkey(full_name)'
      )
      .eq('id', id)
      .eq('company_id', profile.companyId)
      .maybeSingle();

    if (result.error) throw new Error(result.error.message);
    return { row: result.data ? mapOrder(result.data as Record<string, unknown>) : null };
  } catch (error) {
    return {
      row: null,
      error: error instanceof Error ? error.message : 'Não foi possível carregar a ordem de serviço.'
    };
  }
}

export async function loadServiceOrderOptions() {
  const profile = await getAuthenticatedProfile();
  if (!profile) return { technicians: [] as Array<{ id: string; name: string }> };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { technicians: [] as Array<{ id: string; name: string }> };

  const result = await supabase
    .from('profiles')
    .select('id,full_name,role')
    .eq('company_id', profile.companyId)
    .order('full_name');

  return {
    technicians: (result.data || []).map((item) => ({ id: String(item.id), name: String(item.full_name) }))
  };
}
