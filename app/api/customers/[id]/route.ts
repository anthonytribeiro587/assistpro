import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedProfile, hasAnyRole } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    phone: z.string().trim().min(10).max(30).optional(),
    document: z.string().trim().max(30).nullable().optional(),
    notes: z.string().trim().max(4000).nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, 'Nenhuma alteração informada.');

function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthenticatedProfile();
  if (!profile) return NextResponse.json({ ok: false, error: 'Sessão não autenticada.' }, { status: 401 });
  if (!hasAnyRole(profile, ['owner', 'admin', 'attendant'])) {
    return NextResponse.json({ ok: false, error: 'Seu perfil não pode editar clientes.' }, { status: 403 });
  }

  const { id } = await context.params;
  const idResult = z.string().uuid().safeParse(id);
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!idResult.success || !parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.success ? 'Cliente inválido.' : parsed.error.issues[0]?.message || 'Dados inválidos.' },
      { status: 400 }
    );
  }

  const changes: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) changes.name = parsed.data.name;
  if (parsed.data.document !== undefined) changes.document = parsed.data.document || null;
  if (parsed.data.notes !== undefined) changes.notes = parsed.data.notes || null;
  if (parsed.data.phone !== undefined) {
    const phone = normalizePhone(parsed.data.phone);
    if (phone.length < 12 || phone.length > 13) {
      return NextResponse.json({ ok: false, error: 'Informe um telefone válido com DDD.' }, { status: 400 });
    }
    changes.phone = phone;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase não configurado.' }, { status: 503 });

  try {
    const updated = await supabase
      .from('customers')
      .update(changes)
      .eq('id', idResult.data)
      .eq('company_id', profile.companyId)
      .select('id,name,phone,document,notes')
      .maybeSingle();

    if (updated.error) throw new Error(updated.error.message);
    if (!updated.data) return NextResponse.json({ ok: false, error: 'Cliente não encontrado.' }, { status: 404 });

    if (changes.phone) {
      await supabase
        .from('whatsapp_conversations')
        .update({ phone: changes.phone })
        .eq('customer_id', idResult.data)
        .eq('company_id', profile.companyId);
    }

    return NextResponse.json({ ok: true, customer: updated.data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Não foi possível editar o cliente.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthenticatedProfile();
  if (!profile) return NextResponse.json({ ok: false, error: 'Sessão não autenticada.' }, { status: 401 });
  if (!hasAnyRole(profile, ['owner', 'admin'])) {
    return NextResponse.json({ ok: false, error: 'Somente administradores podem excluir clientes.' }, { status: 403 });
  }

  const { id } = await context.params;
  const idResult = z.string().uuid().safeParse(id);
  if (!idResult.success) return NextResponse.json({ ok: false, error: 'Cliente inválido.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase não configurado.' }, { status: 503 });

  try {
    const orders = await supabase
      .from('service_orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', idResult.data)
      .eq('company_id', profile.companyId);

    if (orders.error) throw new Error(orders.error.message);
    if ((orders.count || 0) > 0) {
      return NextResponse.json(
        { ok: false, error: 'Este cliente possui ordens de serviço. Exclua ou transfira as OS antes de remover o cadastro.' },
        { status: 409 }
      );
    }

    await supabase
      .from('whatsapp_conversations')
      .update({ customer_id: null })
      .eq('customer_id', idResult.data)
      .eq('company_id', profile.companyId);

    const deleted = await supabase
      .from('customers')
      .delete()
      .eq('id', idResult.data)
      .eq('company_id', profile.companyId);

    if (deleted.error) throw new Error(deleted.error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Não foi possível excluir o cliente.' },
      { status: 500 }
    );
  }
}
