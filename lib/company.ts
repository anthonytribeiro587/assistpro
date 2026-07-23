import type { SupabaseClient } from '@supabase/supabase-js';

export async function getAssistProCompanyId(supabase: SupabaseClient) {
  const configured = process.env.ASSISTPRO_COMPANY_ID?.trim();
  if (configured) return configured;

  const existing = await supabase
    .from('companies')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id as string;

  const inserted = await supabase
    .from('companies')
    .insert({ name: 'JR Celular', trade_name: 'JR Celular' })
    .select('id')
    .single();

  if (inserted.error || !inserted.data?.id) {
    throw new Error(inserted.error?.message || 'Não foi possível localizar a empresa do AssistPro.');
  }

  return inserted.data.id as string;
}
