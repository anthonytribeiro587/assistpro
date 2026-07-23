import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedProfile } from '@/lib/supabase-server';
import { normalizePipelineStage, pipelineStageLabel, type PipelineStage } from '@/lib/pipeline';

export type CustomerDirectoryRow = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
  totalOrders: number;
  activeOrders: number;
  lastDevice: string;
  lastInteractionAt: string;
  conversationId: string | null;
  pipelineStage: PipelineStage;
  pipelineLabel: string;
  humanTakeover: boolean;
};

function relationDevice(value: unknown) {
  const item = Array.isArray(value) ? value[0] : value;
  if (!item || typeof item !== 'object') return '';
  const record = item as { brand?: unknown; model?: unknown };
  return [record.brand, record.model].filter(Boolean).map(String).join(' ');
}

export async function loadCustomerDirectory(): Promise<{
  rows: CustomerDirectoryRow[];
  error?: string;
}> {
  const profile = await getAuthenticatedProfile();
  if (!profile) return { rows: [], error: 'Seu usuário ainda não possui perfil na empresa.' };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { rows: [], error: 'Supabase administrativo não configurado.' };

  try {
    const [customersResult, ordersResult, conversationsResult] = await Promise.all([
      supabase
        .from('customers')
        .select('id,name,phone,notes,created_at')
        .eq('company_id', profile.companyId)
        .order('created_at', { ascending: false }),
      supabase
        .from('service_orders')
        .select('customer_id,status,entry_date,devices(brand,model)')
        .eq('company_id', profile.companyId)
        .order('entry_date', { ascending: false }),
      supabase
        .from('whatsapp_conversations')
        .select('id,customer_id,status,human_takeover,last_message_at')
        .eq('company_id', profile.companyId)
        .order('last_message_at', { ascending: false })
    ]);

    if (customersResult.error) throw new Error(customersResult.error.message);
    if (ordersResult.error) throw new Error(ordersResult.error.message);
    if (conversationsResult.error) throw new Error(conversationsResult.error.message);

    const ordersByCustomer = new Map<string, Array<{ status: string; entryDate: string; device: string }>>();
    for (const order of ordersResult.data || []) {
      const customerId = String(order.customer_id || '');
      if (!customerId) continue;
      const list = ordersByCustomer.get(customerId) || [];
      list.push({
        status: String(order.status || ''),
        entryDate: String(order.entry_date || ''),
        device: relationDevice(order.devices)
      });
      ordersByCustomer.set(customerId, list);
    }

    const conversationByCustomer = new Map<string, {
      id: string;
      status: string;
      humanTakeover: boolean;
      lastMessageAt: string;
    }>();
    for (const conversation of conversationsResult.data || []) {
      const customerId = String(conversation.customer_id || '');
      if (!customerId || conversationByCustomer.has(customerId)) continue;
      conversationByCustomer.set(customerId, {
        id: String(conversation.id),
        status: String(conversation.status || ''),
        humanTakeover: Boolean(conversation.human_takeover),
        lastMessageAt: String(conversation.last_message_at || '')
      });
    }

    const closedStatuses = new Set(['entregue', 'cancelado']);
    const rows = (customersResult.data || []).map((customer) => {
      const customerId = String(customer.id);
      const orders = ordersByCustomer.get(customerId) || [];
      const conversation = conversationByCustomer.get(customerId);
      const stage = normalizePipelineStage(conversation?.status);
      const lastOrder = orders[0];
      const dates = [String(customer.created_at || ''), lastOrder?.entryDate || '', conversation?.lastMessageAt || '']
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      return {
        id: customerId,
        name: String(customer.name || 'Cliente sem nome'),
        phone: String(customer.phone || ''),
        notes: String(customer.notes || ''),
        createdAt: String(customer.created_at || ''),
        totalOrders: orders.length,
        activeOrders: orders.filter((order) => !closedStatuses.has(order.status)).length,
        lastDevice: lastOrder?.device || '—',
        lastInteractionAt: dates[0] || '',
        conversationId: conversation?.id || null,
        pipelineStage: stage,
        pipelineLabel: pipelineStageLabel(stage),
        humanTakeover: Boolean(conversation?.humanTakeover)
      } satisfies CustomerDirectoryRow;
    });

    return { rows };
  } catch (error) {
    return {
      rows: [],
      error: error instanceof Error ? error.message : 'Não foi possível carregar os clientes.'
    };
  }
}
