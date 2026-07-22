import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendEvolutionText } from '@/lib/evolution';

type AiContext = {
  customerName?: string;
  phone?: string;
  deviceModel?: string;
  issue?: string;
  awaiting?: 'device' | 'issue' | 'name' | 'phone' | null;
};

type AiReply = {
  intent?: string;
  context?: AiContext;
  response?: string;
  serviceOrder?: {
    customerName: string;
    phone: string;
    deviceModel: string;
    issue: string;
  };
  error?: string;
};

type InboundMessage = {
  phone: string;
  pushName: string;
  text: string;
  messageType: string;
  providerMessageId?: string;
  createdAt: string;
};

type StoredSession = {
  active: boolean;
  context: AiContext;
};

const CONTEXT_PREFIX = 'AI_CONTEXT:';

function compactText(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeCommand(value: string) {
  return compactText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhone(value: unknown) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function parseFromMe(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value || '').toLowerCase().trim();
  return ['true', '1', 'yes', 'sim'].includes(normalized);
}

function normalizeItems(payload: any): any[] {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(payload?.messages)) return payload.messages;
  if (data?.key || data?.message || data?.id) return [data];
  if (payload?.key || payload?.message || payload?.id) return [payload];
  return [];
}

function extractText(item: any) {
  const source = item?.data || item || {};
  const message = source?.message || item?.message || source;
  return compactText(
    message?.conversation ||
      message?.extendedTextMessage?.text ||
      message?.imageMessage?.caption ||
      message?.videoMessage?.caption ||
      message?.documentMessage?.caption ||
      message?.buttonsResponseMessage?.selectedDisplayText ||
      message?.templateButtonReplyMessage?.selectedDisplayText ||
      message?.listResponseMessage?.title ||
      message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      ''
  );
}

function parseInbound(item: any, payload: any): InboundMessage | undefined {
  const source = item?.data || item || {};
  const key = source?.key || source?.message?.key || item?.key || {};
  const remoteJid = String(
    key?.remoteJid ||
      source?.remoteJid ||
      source?.jid ||
      source?.from ||
      source?.sender ||
      ''
  );

  if (
    !remoteJid ||
    remoteJid.includes('@g.us') ||
    remoteJid.includes('@broadcast') ||
    remoteJid.includes('@newsletter') ||
    remoteJid === 'status@broadcast'
  ) {
    return undefined;
  }

  if (parseFromMe(key?.fromMe) || parseFromMe(source?.fromMe) || parseFromMe(item?.fromMe)) {
    return undefined;
  }

  const text = extractText(item);
  const phone = normalizePhone(remoteJid.split('@')[0]);
  if (!phone || !text) return undefined;

  const timestamp = Number(
    source?.messageTimestamp || source?.timestamp || payload?.date_time || Date.now() / 1000
  );

  return {
    phone,
    pushName: compactText(
      source?.pushName || source?.verifiedBizName || source?.notifyName || phone
    ),
    text,
    messageType:
      source?.messageType ||
      source?.type ||
      Object.keys(source?.message || item?.message || {})[0] ||
      'text',
    providerMessageId: key?.id || source?.id || item?.id || undefined,
    createdAt: new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000).toISOString()
  };
}

function providedSecret(request: NextRequest) {
  return (
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-assistpro-webhook-secret') ||
    request.headers.get('x-webhook-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  );
}

function safeCustomerName(pushName: string, phone: string) {
  const name = compactText(pushName);
  if (!name || name === phone || /^\d+$/.test(name)) return 'Cliente WhatsApp';
  return name.slice(0, 80);
}

async function getCompanyId(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>, phone: string) {
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
    .insert({ name: 'JR Celular', trade_name: 'JR Celular', whatsapp_number: phone })
    .select('id')
    .single();

  if (inserted.error || !inserted.data?.id) {
    throw new Error(inserted.error?.message || 'Não foi possível localizar a empresa do AssistPro.');
  }

  return inserted.data.id as string;
}

async function ensureCustomer(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  companyId: string,
  inbound: InboundMessage
) {
  const existing = await supabase
    .from('customers')
    .select('id,name,phone')
    .eq('company_id', companyId)
    .eq('phone', inbound.phone)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    const currentName = compactText(existing.data.name);
    const betterName = safeCustomerName(inbound.pushName, inbound.phone);
    if ((!currentName || currentName === inbound.phone || currentName === 'Cliente WhatsApp') && betterName !== 'Cliente WhatsApp') {
      await supabase.from('customers').update({ name: betterName }).eq('id', existing.data.id);
    }
    return { ...existing.data, name: betterName !== 'Cliente WhatsApp' ? betterName : currentName };
  }

  const inserted = await supabase
    .from('customers')
    .insert({
      company_id: companyId,
      name: safeCustomerName(inbound.pushName, inbound.phone),
      phone: inbound.phone,
      notes: 'Contato criado automaticamente pelo WhatsApp.'
    })
    .select('id,name,phone')
    .single();

  if (inserted.error || !inserted.data?.id) {
    throw new Error(inserted.error?.message || 'Não foi possível criar o cliente.');
  }

  return inserted.data;
}

async function ensureConversation(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  companyId: string,
  customerId: string,
  phone: string
) {
  const existing = await supabase
    .from('whatsapp_conversations')
    .select('id,service_order_id,status,human_takeover')
    .eq('company_id', companyId)
    .eq('phone', phone)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    await supabase
      .from('whatsapp_conversations')
      .update({ customer_id: customerId, status: 'open', last_message_at: new Date().toISOString() })
      .eq('id', existing.data.id);
    return existing.data;
  }

  const inserted = await supabase
    .from('whatsapp_conversations')
    .insert({ company_id: companyId, customer_id: customerId, phone, status: 'open' })
    .select('id,service_order_id,status,human_takeover')
    .single();

  if (inserted.error || !inserted.data?.id) {
    throw new Error(inserted.error?.message || 'Não foi possível criar a conversa.');
  }

  return inserted.data;
}

async function isDuplicate(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  conversationId: string,
  providerMessageId?: string
) {
  if (!providerMessageId) return false;
  const existing = await supabase
    .from('whatsapp_messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('media_url', `evolution:${providerMessageId}`)
    .limit(1)
    .maybeSingle();
  return Boolean(existing.data?.id);
}

async function saveMessage(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  input: {
    companyId: string;
    conversationId: string;
    direction: 'inbound' | 'outbound';
    messageType: 'text' | 'audio' | 'image' | 'system';
    content: string;
    aiGenerated?: boolean;
    providerMessageId?: string | null;
    createdAt?: string;
  }
) {
  const result = await supabase.from('whatsapp_messages').insert({
    company_id: input.companyId,
    conversation_id: input.conversationId,
    direction: input.direction,
    message_type: input.messageType,
    content: input.content,
    media_url: input.providerMessageId ? `evolution:${input.providerMessageId}` : null,
    ai_generated: Boolean(input.aiGenerated),
    created_at: input.createdAt || new Date().toISOString()
  });

  if (result.error) throw new Error(result.error.message);

  await supabase
    .from('whatsapp_conversations')
    .update({ last_message_at: input.createdAt || new Date().toISOString() })
    .eq('id', input.conversationId);
}

async function loadSession(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  conversationId: string
): Promise<StoredSession | undefined> {
  const result = await supabase
    .from('whatsapp_messages')
    .select('content')
    .eq('conversation_id', conversationId)
    .eq('message_type', 'system')
    .like('content', `${CONTEXT_PREFIX}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const content = result.data?.content;
  if (!content?.startsWith(CONTEXT_PREFIX)) return undefined;

  try {
    return JSON.parse(content.slice(CONTEXT_PREFIX.length)) as StoredSession;
  } catch {
    return undefined;
  }
}

async function saveSession(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  companyId: string,
  conversationId: string,
  session: StoredSession
) {
  await saveMessage(supabase, {
    companyId,
    conversationId,
    direction: 'outbound',
    messageType: 'system',
    content: `${CONTEXT_PREFIX}${JSON.stringify(session)}`,
    aiGenerated: true
  });
}

async function askAssistProAi(request: NextRequest, message: string, context: AiContext) {
  const endpoint = new URL('/api/ai/respond', request.nextUrl.origin);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
    cache: 'no-store'
  });
  const payload = (await response.json().catch(() => ({}))) as AiReply;
  if (!response.ok || payload.error) {
    throw new Error(payload.error || 'A IA do AssistPro não respondeu.');
  }
  return payload;
}

function splitDevice(deviceModel: string) {
  const cleaned = compactText(deviceModel);
  const lower = cleaned.toLowerCase();
  if (lower.includes('iphone')) return { brand: 'Apple', model: cleaned };
  if (lower.includes('galaxy') || lower.includes('samsung')) return { brand: 'Samsung', model: cleaned };
  if (lower.includes('moto') || lower.includes('motorola')) return { brand: 'Motorola', model: cleaned };
  if (lower.includes('redmi') || lower.includes('xiaomi') || lower.includes('poco')) return { brand: 'Xiaomi', model: cleaned };
  return { brand: null, model: cleaned };
}

async function createRealServiceOrder(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  input: {
    companyId: string;
    customerId: string;
    conversationId: string;
    serviceOrder: NonNullable<AiReply['serviceOrder']>;
  }
) {
  const parsedDevice = splitDevice(input.serviceOrder.deviceModel);
  const device = await supabase
    .from('devices')
    .insert({
      company_id: input.companyId,
      customer_id: input.customerId,
      brand: parsedDevice.brand,
      model: parsedDevice.model
    })
    .select('id')
    .single();

  if (device.error || !device.data?.id) {
    throw new Error(device.error?.message || 'Não foi possível cadastrar o aparelho.');
  }

  const order = await supabase
    .from('service_orders')
    .insert({
      company_id: input.companyId,
      customer_id: input.customerId,
      device_id: device.data.id,
      status: 'recebido',
      problem_description: input.serviceOrder.issue,
      physical_condition: 'Triagem inicial realizada pelo WhatsApp.'
    })
    .select('id,number,status')
    .single();

  if (order.error || !order.data?.id) {
    throw new Error(order.error?.message || 'Não foi possível criar a ordem de serviço.');
  }

  await supabase.from('service_order_events').insert({
    company_id: input.companyId,
    service_order_id: order.data.id,
    from_status: null,
    to_status: 'recebido',
    description: 'OS criada automaticamente após triagem pelo WhatsApp.'
  });

  await supabase
    .from('whatsapp_conversations')
    .update({ service_order_id: order.data.id })
    .eq('id', input.conversationId);

  return order.data as { id: string; number: number; status: string };
}

async function replyAndStore(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  input: {
    companyId: string;
    conversationId: string;
    phone: string;
    text: string;
  }
) {
  const sent = await sendEvolutionText(input.phone, input.text);
  await saveMessage(supabase, {
    companyId: input.companyId,
    conversationId: input.conversationId,
    direction: 'outbound',
    messageType: 'text',
    content: input.text,
    aiGenerated: true,
    providerMessageId: sent.providerMessageId
  });
}

async function processInbound(request: NextRequest, inbound: InboundMessage) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase do AssistPro não está configurado no servidor.');

  const companyId = await getCompanyId(supabase, inbound.phone);
  const customer = await ensureCustomer(supabase, companyId, inbound);
  const conversation = await ensureConversation(supabase, companyId, customer.id, inbound.phone);

  if (await isDuplicate(supabase, conversation.id, inbound.providerMessageId)) {
    return { duplicate: true };
  }

  await saveMessage(supabase, {
    companyId,
    conversationId: conversation.id,
    direction: 'inbound',
    messageType: 'text',
    content: inbound.text,
    providerMessageId: inbound.providerMessageId,
    createdAt: inbound.createdAt
  });

  const command = normalizeCommand(inbound.text);
  const activation = ['teste jr', 'teste jr celular', 'ativar jr'].includes(command);
  const exit = ['sair jr', 'encerrar teste jr', 'parar teste jr'].includes(command);
  const previous = await loadSession(supabase, conversation.id);

  if (exit && previous?.active) {
    await saveSession(supabase, companyId, conversation.id, { active: false, context: previous.context });
    await replyAndStore(supabase, {
      companyId,
      conversationId: conversation.id,
      phone: inbound.phone,
      text: 'Teste encerrado. O atendimento automático da JR Celular foi pausado para esta conversa.'
    });
    return { handled: true, stage: 'closed' };
  }

  if (!activation && !previous?.active) {
    return { handled: false, reason: 'trial_not_active' };
  }

  const baseContext: AiContext = activation
    ? {
        customerName: safeCustomerName(inbound.pushName, inbound.phone),
        phone: inbound.phone,
        awaiting: null
      }
    : previous?.context || {
        customerName: safeCustomerName(inbound.pushName, inbound.phone),
        phone: inbound.phone,
        awaiting: null
      };

  const ai = await askAssistProAi(
    request,
    activation ? 'Quero iniciar a triagem do meu aparelho.' : inbound.text,
    baseContext
  );

  if (!ai.context || !ai.response) {
    throw new Error('A IA retornou uma resposta incompleta.');
  }

  if (ai.intent === 'create_order' && ai.serviceOrder) {
    const realOrder = await createRealServiceOrder(supabase, {
      companyId,
      customerId: customer.id,
      conversationId: conversation.id,
      serviceOrder: ai.serviceOrder
    });
    const realResponse = `Perfeito, ${ai.serviceOrder.customerName}. A triagem foi concluída e a OS #${realOrder.number} foi criada para o ${ai.serviceOrder.deviceModel}. A equipe técnica vai revisar o aparelho e confirmar diagnóstico, prazo e orçamento.`;

    await saveSession(supabase, companyId, conversation.id, { active: false, context: ai.context });
    await replyAndStore(supabase, {
      companyId,
      conversationId: conversation.id,
      phone: inbound.phone,
      text: realResponse
    });
    return { handled: true, stage: 'order_created', orderNumber: realOrder.number };
  }

  const responseText = activation ? `🧪 Modo de teste JR Celular ativado. ${ai.response}` : ai.response;
  await saveSession(supabase, companyId, conversation.id, { active: true, context: ai.context });
  await replyAndStore(supabase, {
    companyId,
    conversationId: conversation.id,
    phone: inbound.phone,
    text: responseText
  });

  return { handled: true, stage: ai.context.awaiting || ai.intent || 'intake' };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'AssistPro Evolution webhook',
    activationCommand: 'TESTE JR'
  });
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (expectedSecret && providedSecret(request) !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'Webhook não autorizado.' }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const event = String(payload?.event || '').toLowerCase();
  if (event && !event.includes('messages') && !event.includes('send_message')) {
    return NextResponse.json({ ok: true, ignored: true, event });
  }

  const results = [];
  for (const item of normalizeItems(payload)) {
    const inbound = parseInbound(item, payload);
    if (!inbound) continue;

    try {
      results.push({ phone: inbound.phone, ...(await processInbound(request, inbound)) });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao processar mensagem.';
      console.error('AssistPro Evolution webhook error', message);
      results.push({ phone: inbound.phone, handled: false, error: message });
    }
  }

  return NextResponse.json({ ok: true, received: results.length, results });
}
