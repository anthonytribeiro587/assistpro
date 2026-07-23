import {
  serviceOrderStatuses,
  type DatabaseServiceOrderStatus
} from '@/lib/service-order-constants';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedProfile } from '@/lib/supabase-server';

export {
  serviceOrderStatusClasses,
  serviceOrderStatusLabels,
  serviceOrderStatuses,
  type DatabaseServiceOrderStatus
} from '@/lib/service-order-constants';

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
