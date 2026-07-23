import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAssistProCompanyId } from '@/lib/company';
import { sendEvolutionText } from '@/lib/evolution';

export const dynamic = 'force-dynamic';

const inputSchema = z.object({
  conversationId: z.string().uuid(),
  text: z.string().trim().min(1).max(3000)
});

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Sessão não autenticada.' }, { status: 401 });

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Dados inválidos.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase não configurado.' }, { status: 503 });

  try {
    const companyId = await getAssistProCompanyId(supabase);
    const result = await supabase
      .from('whatsapp_conversations')
      .select('id,phone')
      .eq('id', parsed.data.conversationId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (result.error || !result.data) {
      return NextResponse.json({ ok: false, error: 'Conversa não encontrada.' }, { status: 404 });
    }

    const delivery = await sendEvolutionText(result.data.phone, parsed.data.text);
    const saved = await supabase.from('whatsapp_messages').insert({
      company_id: companyId,
      conversation_id: result.data.id,
      direction: 'outbound',
      message_type: 'text',
      content: parsed.data.text,
      media_url: delivery.providerMessageId ? `evolution:${delivery.providerMessageId}` : null,
      ai_generated: false
    });

    if (saved.error) throw new Error(saved.error.message);

    await supabase
      .from('whatsapp_conversations')
      .update({ last_message_at: new Date().toISOString(), status: 'open' })
      .eq('id', result.data.id)
      .eq('company_id', companyId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Não foi possível enviar.' },
      { status: 500 }
    );
  }
}
