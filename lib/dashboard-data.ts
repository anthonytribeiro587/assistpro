import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedProfile } from '@/lib/supabase-server';
import { loadWhatsappInbox, type InboxConversation } from '@/lib/whatsapp-inbox';
import { normalizePipelineStage, pipelineStages, type PipelineStage } from '@/lib/pipeline';

export type DashboardOrder = {
  id: string;
  number: number;
  customer: string;
  device: string;
  status: string;
  amount: number;
  entryDate: string;
};

export type DashboardData = {
  openOrders: number;
  inProgressOrders: number;
  waitingOrders: number;
  readyOrders: number;
  customerCount: number;
  recentOrders: DashboardOrder[];
  conversations: InboxConversation[];
  pipelineCounts: Record<PipelineStage, number>;
  error?: string;
};

function relationName(value: unknown, fallback: string) {
  const item = Array.isArray(value) ? value[0] : value;
  if (!item || typeof item !== 'object') return fallback;
  return String((item as { name?: unknown }).name || fallback);
}

function relationDevice(value: unknown) {
  const item = Array.isArray(value) ? value[0] : value;
  if (!item || typeof item !== 'object') return 'Aparelho não informado';
  const record = item as { brand?: unknown; model?: unknown };
  return [record.brand, record.model].filter(Boolean).map(String).join(' ') || 'Aparelho não informado';
}

export async function loadDashboardData(): Promise<DashboardData> {
  const emptyCounts = Object.fromEntries(
    pipelineStages.map((stage) => [stage.id, 0])
  ) as Record<PipelineStage, number>;

  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return {
      openOrders: 0,
      inProgressOrders: 0,
      waitingOrders: 0,
      readyOrders: 0,
      customerCount: 0,
      recentOrders: [],
      conversations: [],
      pipelineCounts: emptyCounts,
      error: 'Seu usuário ainda não possui perfil na empresa.'
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      openOrders: 0,
      inProgressOrders: 0,
      waitingOrders: 0,
      readyOrders: 0,
      customerCount: 0,
      recentOrders: [],
      conversations: [],
      pipelineCounts: emptyCounts,
      error: 'Supabase administrativo não configurado.'
    };
  }

  try {
    const [ordersResult, customersResult, inbox] = await Promise.all([
      supabase
        .from('service_orders')
        .select('id,number,status,estimated_value,approved_value,entry_date,customers(name),devices(brand,model)')
        .eq('company_id', profile.companyId)
        .order('entry_date', { ascending: false })
        .limit(80),
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', profile.companyId),
      loadWhatsappInbox(16)
    ]);

    if (ordersResult.error) throw new Error(ordersResult.error.message);
    if (customersResult.error) throw new Error(customersResult.error.message);

    const orders = ordersResult.data || [];
    const openStatuses = new Set([
      'recebido',
      'analise',
      'orcamento_enviado',
      'aguardando_aprovacao',
      'em_execucao',
      'aguardando_peca',
      'testes',
      'pronto'
    ]);
    const waitingStatuses = new Set(['orcamento_enviado', 'aguardando_aprovacao', 'aguardando_peca']);
    const progressStatuses = new Set(['em_execucao', 'testes']);

    const pipelineCounts = { ...emptyCounts };
    for (const conversation of inbox.conversations) {
      pipelineCounts[normalizePipelineStage(conversation.status)] += 1;
    }

    return {
      openOrders: orders.filter((order) => openStatuses.has(String(order.status))).length,
      inProgressOrders: orders.filter((order) => progressStatuses.has(String(order.status))).length,
      waitingOrders: orders.filter((order) => waitingStatuses.has(String(order.status))).length,
      readyOrders: orders.filter((order) => String(order.status) === 'pronto').length,
      customerCount: customersResult.count || 0,
      recentOrders: orders.slice(0, 6).map((order) => ({
        id: String(order.id),
        number: Number(order.number || 0),
        customer: relationName(order.customers, 'Cliente não informado'),
        device: relationDevice(order.devices),
        status: String(order.status || 'recebido'),
        amount: Number(order.approved_value || order.estimated_value || 0),
        entryDate: String(order.entry_date || '')
      })),
      conversations: inbox.conversations.slice(0, 5),
      pipelineCounts,
      error: inbox.error
    };
  } catch (error) {
    return {
      openOrders: 0,
      inProgressOrders: 0,
      waitingOrders: 0,
      readyOrders: 0,
      customerCount: 0,
      recentOrders: [],
      conversations: [],
      pipelineCounts: emptyCounts,
      error: error instanceof Error ? error.message : 'Não foi possível carregar o painel.'
    };
  }
}
