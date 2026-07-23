import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedProfile } from '@/lib/supabase-server';
import type { DatabaseServiceOrderStatus } from '@/lib/service-order-data';

export type ServiceOrderEventRow = {
  id: string;
  fromStatus: DatabaseServiceOrderStatus | null;
  toStatus: DatabaseServiceOrderStatus | null;
  description: string;
  createdAt: string;
  createdBy: string;
};

function relationName(value: unknown) {
  const item = Array.isArray(value) ? value[0] : value;
  if (!item || typeof item !== 'object') return 'Sistema';
  return String((item as { full_name?: unknown }).full_name || 'Sistema');
}

export async function loadServiceOrderEvents(serviceOrderId: string): Promise<{
  rows: ServiceOrderEventRow[];
  error?: string;
}> {
  const profile = await getAuthenticatedProfile();
  if (!profile) return { rows: [], error: 'Sessão não autenticada.' };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { rows: [], error: 'Supabase não configurado.' };

  try {
    const result = await supabase
      .from('service_order_events')
      .select('id,from_status,to_status,description,created_at,profiles!service_order_events_created_by_fkey(full_name)')
      .eq('company_id', profile.companyId)
      .eq('service_order_id', serviceOrderId)
      .order('created_at', { ascending: true });

    if (result.error) throw new Error(result.error.message);

    return {
      rows: (result.data || []).map((item) => ({
        id: String(item.id),
        fromStatus: item.from_status as DatabaseServiceOrderStatus | null,
        toStatus: item.to_status as DatabaseServiceOrderStatus | null,
        description: String(item.description || ''),
        createdAt: String(item.created_at || ''),
        createdBy: relationName(item.profiles)
      }))
    };
  } catch (error) {
    return {
      rows: [],
      error: error instanceof Error ? error.message : 'Não foi possível carregar o histórico.'
    };
  }
}
