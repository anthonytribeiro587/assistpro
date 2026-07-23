import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pipelineStageIds } from '@/lib/pipeline';
import { getAuthenticatedProfile, hasAnyRole } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const inputSchema = z.object({
  stage: z.enum(pipelineStageIds)
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Sessão não autenticada.' }, { status: 401 });
  }

  if (!hasAnyRole(profile, ['owner', 'admin', 'attendant'])) {
    return NextResponse.json(
      { ok: false, error: 'Seu perfil não pode alterar o funil de atendimento.' },
      { status: 403 }
    );
  }

  const { conversationId } = await context.params;
  const id = z.string().uuid().safeParse(conversationId);
  const payload = inputSchema.safeParse(await request.json().catch(() => null));

  if (!id.success || !payload.success) {
    return NextResponse.json({ ok: false, error: 'Dados inválidos.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase não configurado.' }, { status: 503 });
  }

  const updated = await supabase
    .from('whatsapp_conversations')
    .update({ status: payload.data.stage })
    .eq('id', id.data)
    .eq('company_id', profile.companyId)
    .select('id,status')
    .maybeSingle();

  if (updated.error) {
    return NextResponse.json({ ok: false, error: updated.error.message }, { status: 500 });
  }

  if (!updated.data) {
    return NextResponse.json({ ok: false, error: 'Conversa não encontrada.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, conversation: updated.data });
}
