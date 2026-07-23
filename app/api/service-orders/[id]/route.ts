import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceOrderStatuses } from '@/lib/service-order-data';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedProfile, hasAnyRole } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const updateSchema = z
  .object({
    customerName: z.string().trim().min(2).max(160).optional(),
    phone: z.string().trim().min(10).max(30).optional(),
    document: z.string().trim().max(30).nullable().optional(),
    brand: z.string().trim().max(80).nullable().optional(),
    model: z.string().trim().min(2).max(120).optional(),
    color: z.string().trim().max(60).nullable().optional(),
    imei: z.string().trim().max(80).nullable().optional(),
    serialNumber: z.string().trim().max(100).nullable().optional(),
    problemDescription: z.string().trim().min(5).max(4000).optional(),
    physicalCondition: z.string().trim().max(2000).nullable().optional(),
    accessories: z.string().trim().max(1000).nullable().optional(),
    technicianId: z.string().uuid().nullable().optional(),
    estimatedValue: z.coerce.number().min(0).max(1_000_000).optional(),
    approvedValue: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
    dueDate: z.string().trim().nullable().optional(),
    warrantyDays: z.coerce.number().int().min(0).max(3650).optional(),
    status: z.enum(serviceOrderStatuses).optional()
  })
  .refine((value) => Object.keys(value).length > 0, 'Nenhuma alteração informada.');

function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function parseDate(value?: string | null) {
  if (value === null || value === '') return null;
  if (value === undefined) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthenticatedProfile();
  if (!profile) return NextResponse.json({ ok: false, error: 'Sessão não autenticada.' }, { status: 401 });
  if (!hasAnyRole(profile, ['owner', 'admin', 'attendant', 'technician'])) {
    return NextResponse.json({ ok: false, error: 'Seu perfil não pode editar OS.' }, { status: 403 });
  }

  const { id } = await context.params;
  const idResult = z.string().uuid().safeParse(id);
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!idResult.success || !parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.success ? 'OS inválida.' : parsed.error.issues[0]?.message || 'Dados inválidos.' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase não configurado.' }, { status: 503 });

  try {
    const currentResult = await supabase
      .from('service_orders')
      .select('id,customer_id,device_id,status')
      .eq('id', idResult.data)
      .eq('company_id', profile.companyId)
      .maybeSingle();

    if (currentResult.error || !currentResult.data) {
      return NextResponse.json({ ok: false, error: 'OS não encontrada.' }, { status: 404 });
    }

    const current = currentResult.data;
    const input = parsed.data;

    const customerChanges: Record<string, unknown> = {};
    if (input.customerName !== undefined) customerChanges.name = input.customerName;
    if (input.phone !== undefined) {
      const phone = normalizePhone(input.phone);
      if (phone.length < 12 || phone.length > 13) {
        return NextResponse.json({ ok: false, error: 'Informe um telefone válido com DDD.' }, { status: 400 });
      }
      customerChanges.phone = phone;
    }
    if (input.document !== undefined) customerChanges.document = input.document || null;

    if (Object.keys(customerChanges).length) {
      const updatedCustomer = await supabase
        .from('customers')
        .update(customerChanges)
        .eq('id', current.customer_id)
        .eq('company_id', profile.companyId);
      if (updatedCustomer.error) throw new Error(updatedCustomer.error.message);
    }

    const deviceChanges: Record<string, unknown> = {};
    if (input.brand !== undefined) deviceChanges.brand = input.brand || null;
    if (input.model !== undefined) deviceChanges.model = input.model;
    if (input.color !== undefined) deviceChanges.color = input.color || null;
    if (input.imei !== undefined) deviceChanges.imei = input.imei || null;
    if (input.serialNumber !== undefined) deviceChanges.serial_number = input.serialNumber || null;

    if (Object.keys(deviceChanges).length) {
      const updatedDevice = await supabase
        .from('devices')
        .update(deviceChanges)
        .eq('id', current.device_id)
        .eq('company_id', profile.companyId);
      if (updatedDevice.error) throw new Error(updatedDevice.error.message);
    }

    const orderChanges: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.problemDescription !== undefined) orderChanges.problem_description = input.problemDescription;
    if (input.physicalCondition !== undefined) orderChanges.physical_condition = input.physicalCondition || null;
    if (input.accessories !== undefined) orderChanges.accessories = input.accessories || null;
    if (input.technicianId !== undefined) orderChanges.technician_id = input.technicianId || null;
    if (input.estimatedValue !== undefined) orderChanges.estimated_value = input.estimatedValue;
    if (input.approvedValue !== undefined) orderChanges.approved_value = input.approvedValue;
    if (input.dueDate !== undefined) orderChanges.due_date = parseDate(input.dueDate);
    if (input.warrantyDays !== undefined) orderChanges.warranty_days = input.warrantyDays;
    if (input.status !== undefined) {
      orderChanges.status = input.status;
      if (input.status === 'entregue') orderChanges.delivered_at = new Date().toISOString();
      if (String(current.status) === 'entregue' && input.status !== 'entregue') orderChanges.delivered_at = null;
    }

    const updatedOrder = await supabase
      .from('service_orders')
      .update(orderChanges)
      .eq('id', idResult.data)
      .eq('company_id', profile.companyId)
      .select('id,number,status')
      .single();

    if (updatedOrder.error) throw new Error(updatedOrder.error.message);

    if (input.status && input.status !== current.status) {
      await supabase.from('service_order_events').insert({
        company_id: profile.companyId,
        service_order_id: idResult.data,
        from_status: current.status,
        to_status: input.status,
        description: 'Status atualizado pelo CRM.',
        created_by: profile.id
      });
    }

    if (input.phone !== undefined) {
      await supabase
        .from('whatsapp_conversations')
        .update({ phone: normalizePhone(input.phone) })
        .eq('service_order_id', idResult.data)
        .eq('company_id', profile.companyId);
    }

    return NextResponse.json({ ok: true, order: updatedOrder.data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Não foi possível editar a OS.' },
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
    return NextResponse.json({ ok: false, error: 'Somente administradores podem excluir OS.' }, { status: 403 });
  }

  const { id } = await context.params;
  const idResult = z.string().uuid().safeParse(id);
  if (!idResult.success) return NextResponse.json({ ok: false, error: 'OS inválida.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase não configurado.' }, { status: 503 });

  try {
    const current = await supabase
      .from('service_orders')
      .select('id,device_id')
      .eq('id', idResult.data)
      .eq('company_id', profile.companyId)
      .maybeSingle();

    if (current.error || !current.data) {
      return NextResponse.json({ ok: false, error: 'OS não encontrada.' }, { status: 404 });
    }

    await supabase
      .from('whatsapp_conversations')
      .update({ service_order_id: null })
      .eq('service_order_id', idResult.data)
      .eq('company_id', profile.companyId);

    const deleted = await supabase
      .from('service_orders')
      .delete()
      .eq('id', idResult.data)
      .eq('company_id', profile.companyId);
    if (deleted.error) throw new Error(deleted.error.message);

    if (current.data.device_id) {
      await supabase
        .from('devices')
        .delete()
        .eq('id', current.data.device_id)
        .eq('company_id', profile.companyId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Não foi possível excluir a OS.' },
      { status: 500 }
    );
  }
}
