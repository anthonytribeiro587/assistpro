import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedProfile, hasAnyRole } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { serviceOrderStatuses } from '@/lib/service-order-data';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  customerName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(10).max(30),
  document: z.string().trim().max(30).optional().default(''),
  brand: z.string().trim().max(80).optional().default(''),
  model: z.string().trim().min(2).max(120),
  color: z.string().trim().max(60).optional().default(''),
  imei: z.string().trim().max(80).optional().default(''),
  serialNumber: z.string().trim().max(100).optional().default(''),
  problemDescription: z.string().trim().min(5).max(4000),
  physicalCondition: z.string().trim().max(2000).optional().default(''),
  accessories: z.string().trim().max(1000).optional().default(''),
  technicianId: z.string().uuid().nullable().optional(),
  estimatedValue: z.coerce.number().min(0).max(1_000_000).default(0),
  approvedValue: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
  dueDate: z.string().trim().nullable().optional(),
  warrantyDays: z.coerce.number().int().min(0).max(3650).default(90),
  status: z.enum(serviceOrderStatuses).default('recebido')
});

function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function POST(request: NextRequest) {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Sessão não autenticada.' }, { status: 401 });
  }
  if (!hasAnyRole(profile, ['owner', 'admin', 'attendant'])) {
    return NextResponse.json({ ok: false, error: 'Seu perfil não pode criar OS.' }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || 'Dados inválidos.' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase não configurado.' }, { status: 503 });
  }

  const input = parsed.data;
  const phone = normalizePhone(input.phone);
  if (phone.length < 12 || phone.length > 13) {
    return NextResponse.json({ ok: false, error: 'Informe um telefone válido com DDD.' }, { status: 400 });
  }

  let createdDeviceId: string | null = null;

  try {
    const customerResult = await supabase
      .from('customers')
      .upsert(
        {
          company_id: profile.companyId,
          name: input.customerName,
          phone,
          document: input.document || null
        },
        { onConflict: 'company_id,phone', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (customerResult.error || !customerResult.data?.id) {
      throw new Error(customerResult.error?.message || 'Não foi possível salvar o cliente.');
    }

    const customerId = String(customerResult.data.id);
    const deviceResult = await supabase
      .from('devices')
      .insert({
        company_id: profile.companyId,
        customer_id: customerId,
        brand: input.brand || null,
        model: input.model,
        color: input.color || null,
        imei: input.imei || null,
        serial_number: input.serialNumber || null
      })
      .select('id')
      .single();

    if (deviceResult.error || !deviceResult.data?.id) {
      throw new Error(deviceResult.error?.message || 'Não foi possível salvar o aparelho.');
    }
    createdDeviceId = String(deviceResult.data.id);

    const orderResult = await supabase
      .from('service_orders')
      .insert({
        company_id: profile.companyId,
        customer_id: customerId,
        device_id: createdDeviceId,
        status: input.status,
        problem_description: input.problemDescription,
        physical_condition: input.physicalCondition || null,
        accessories: input.accessories || null,
        technician_id: input.technicianId || null,
        estimated_value: input.estimatedValue,
        approved_value: input.approvedValue ?? null,
        due_date: parseDate(input.dueDate),
        warranty_days: input.warrantyDays,
        created_by: profile.id
      })
      .select('id,number,status')
      .single();

    if (orderResult.error || !orderResult.data?.id) {
      throw new Error(orderResult.error?.message || 'Não foi possível criar a OS.');
    }

    const orderId = String(orderResult.data.id);
    await supabase.from('service_order_events').insert({
      company_id: profile.companyId,
      service_order_id: orderId,
      from_status: null,
      to_status: input.status,
      description: 'Ordem de serviço criada pelo CRM.',
      created_by: profile.id
    });

    await supabase
      .from('whatsapp_conversations')
      .update({
        customer_id: customerId,
        service_order_id: orderId,
        status: 'concluido'
      })
      .eq('company_id', profile.companyId)
      .eq('phone', phone);

    return NextResponse.json({
      ok: true,
      order: {
        id: orderId,
        number: Number(orderResult.data.number || 0),
        status: String(orderResult.data.status)
      }
    });
  } catch (error) {
    if (createdDeviceId) {
      await supabase
        .from('devices')
        .delete()
        .eq('id', createdDeviceId)
        .eq('company_id', profile.companyId);
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Não foi possível criar a OS.' },
      { status: 500 }
    );
  }
}
