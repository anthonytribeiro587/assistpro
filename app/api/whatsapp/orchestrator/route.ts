import { NextRequest, NextResponse } from 'next/server';
import {
  businessContextToAgentInput,
  buildBusinessContext,
  DEFAULT_AI_BUSINESS_SETTINGS,
  loadAiBusinessSettings
} from '@/lib/ai-business-settings';
import { getAssistProCompanyId } from '@/lib/company';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedProfile } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type NormalizedInboundMessage = {
  event: 'messages.upsert';
  phone: string;
  conversationId: string;
  remoteJid: string;
  pushName: string;
  messageText: string;
  messageType: string;
  providerMessageId: string | null;
  createdAt: string;
};

function compactText(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ');
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

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return ['true', '1', 'yes', 'sim'].includes(String(value || '').trim().toLowerCase());
}

function normalizePhone(value: unknown) {
  let digits = String(value || '').split('@')[0].replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function normalizeEventName(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/[.\-\s]+/g, '_');
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

function extractMessageText(message: any) {
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

function detectMessageType(source: any, message: any) {
  if (source?.messageType) return String(source.messageType);
  const key = Object.keys(message || {}).find((name) => name.endsWith('Message'));
  return key || (message?.conversation ? 'conversation' : 'unknown');
}

function normalizedTimestamp(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return new Date().toISOString();
  const milliseconds = numeric > 10_000_000_000 ? numeric : numeric * 1000;
  return new Date(milliseconds).toISOString();
}

function extractIncomingMessage(payload: any): {
  message?: NormalizedInboundMessage;
  ignoredReason?: string;
} {
  const eventName = normalizeEventName(payload?.event || payload?.type);
  if (eventName !== 'messages_upsert' && eventName !== 'message_upsert') {
    return { ignoredReason: eventName || 'event_not_supported' };
  }

  for (const item of normalizeItems(payload)) {
    const source = item?.data || item || {};
    const key = source?.key || source?.message?.key || item?.key || {};
    if (parseBoolean(key?.fromMe ?? source?.fromMe ?? item?.fromMe)) continue;

    const remoteJid = compactText(
      key?.remoteJid || source?.remoteJid || source?.jid || source?.from || item?.remoteJid
    );
    if (
      !remoteJid ||
      remoteJid.includes('@g.us') ||
      remoteJid.includes('@broadcast') ||
      remoteJid.includes('@newsletter') ||
      remoteJid === 'status@broadcast'
    ) {
      continue;
    }

    const message = source?.message || item?.message || {};
    const messageText = extractMessageText(message);
    if (!messageText) continue;

    const senderJid = [source?.sender, source?.participant, key?.participant, remoteJid].find(
      (value) => typeof value === 'string' && value.includes('@s.whatsapp.net')
    );
    const phone = normalizePhone(senderJid || remoteJid);
    if (!phone) continue;

    return {
      message: {
        event: 'messages.upsert',
        phone,
        conversationId: phone,
        remoteJid,
        pushName: compactText(source?.pushName || source?.verifiedBizName || item?.pushName),
        messageText,
        messageType: detectMessageType(source, message),
        providerMessageId: compactText(key?.id || source?.id || item?.id) || null,
        createdAt: normalizedTimestamp(
          source?.messageTimestamp || source?.timestamp || payload?.date_time
        )
      }
    };
  }

  return { ignoredReason: 'outgoing_or_non_text_message' };
}

async function persistInbound(inbound: NormalizedInboundMessage) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { persisted: false, duplicate: false };

  const companyId = await getAssistProCompanyId(supabase);
  const existingCustomer = await supabase
    .from('customers')
    .select('id,name')
    .eq('company_id', companyId)
    .eq('phone', inbound.phone)
    .maybeSingle();

  let customerId = existingCustomer.data?.id as string | undefined;
  if (!customerId) {
    const created = await supabase
      .from('customers')
      .upsert(
        {
          company_id: companyId,
          phone: inbound.phone,
          name: inbound.pushName || `Cliente ${inbound.phone.slice(-4)}`,
          notes: 'Contato criado automaticamente pelo WhatsApp.'
        },
        { onConflict: 'company_id,phone', ignoreDuplicates: false }
      )
      .select('id')
      .single();
    if (created.error || !created.data?.id) {
      throw new Error(created.error?.message || 'Falha ao criar cliente.');
    }
    customerId = created.data.id;
  }

  const existingConversation = await supabase
    .from('whatsapp_conversations')
    .select('id')
    .eq('company_id', companyId)
    .eq('phone', inbound.phone)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversationId = existingConversation.data?.id as string | undefined;
  if (!conversationId) {
    const created = await supabase
      .from('whatsapp_conversations')
      .insert({ company_id: companyId, customer_id: customerId, phone: inbound.phone, status: 'open' })
      .select('id')
      .single();
    if (created.error || !created.data?.id) {
      throw new Error(created.error?.message || 'Falha ao criar conversa.');
    }
    conversationId = created.data.id;
  }

  if (inbound.providerMessageId) {
    const duplicate = await supabase
      .from('whatsapp_messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('media_url', `evolution:${inbound.providerMessageId}`)
      .limit(1)
      .maybeSingle();
    if (duplicate.data?.id) return { persisted: true, duplicate: true, conversationId };
  }

  const inserted = await supabase.from('whatsapp_messages').insert({
    company_id: companyId,
    conversation_id: conversationId,
    direction: 'inbound',
    message_type: 'text',
    content: inbound.messageText,
    media_url: inbound.providerMessageId ? `evolution:${inbound.providerMessageId}` : null,
    ai_generated: false,
    created_at: inbound.createdAt
  });
  if (inserted.error) throw new Error(inserted.error.message);

  await supabase
    .from('whatsapp_conversations')
    .update({ customer_id: customerId, status: 'open', last_message_at: inbound.createdAt })
    .eq('id', conversationId)
    .eq('company_id', companyId);

  return { persisted: true, duplicate: false, conversationId };
}

function validatedMakeUrl() {
  const raw = process.env.MAKE_WEBHOOK_URL?.trim();
  if (!raw) return null;
  const url = new URL(raw);
  if (url.protocol !== 'https:') throw new Error('MAKE_WEBHOOK_URL deve utilizar HTTPS.');
  return url;
}

async function loadBusinessContext() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return buildBusinessContext(DEFAULT_AI_BUSINESS_SETTINGS);
  try {
    const companyId = await getAssistProCompanyId(supabase);
    const result = await loadAiBusinessSettings(supabase, companyId);
    return buildBusinessContext(result.settings);
  } catch {
    return buildBusinessContext(DEFAULT_AI_BUSINESS_SETTINGS);
  }
}

async function forwardToMake(
  request: NextRequest,
  inbound: NormalizedInboundMessage,
  makeUrl: URL
) {
  const apiKey = process.env.MAKE_WEBHOOK_API_KEY?.trim();
  if (!apiKey) throw new Error('MAKE_WEBHOOK_API_KEY não está configurada.');

  const businessContext = await loadBusinessContext();
  const agentInput = businessContextToAgentInput(inbound.messageText, businessContext);
  const response = await fetch(makeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-make-apikey': apiKey },
    body: JSON.stringify({
      source: 'assistpro',
      receivedAt: new Date().toISOString(),
      callbackUrl: new URL('/api/make/respond', request.nextUrl.origin).toString(),
      ...inbound,
      businessContext,
      agentInput
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000)
  });

  const text = await response.text();
  let result: unknown = text;
  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    // O Make pode retornar texto simples.
  }

  if (!response.ok) {
    const detail =
      typeof result === 'object' && result
        ? (result as { message?: unknown; error?: unknown }).message ||
          (result as { message?: unknown; error?: unknown }).error
        : result;
    throw new Error(String(detail || `Make respondeu HTTP ${response.status}.`));
  }

  return NextResponse.json({ ok: true, mode: 'make', result });
}

async function forwardToSafeFallback(request: NextRequest, payload: unknown) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error('WHATSAPP_WEBHOOK_SECRET não está configurado.');

  const endpoint = new URL('/api/whatsapp/remote-triage', request.nextUrl.origin);
  endpoint.searchParams.set('secret', secret);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000)
  });
  const result = await response.json().catch(() => ({}));
  return NextResponse.json({ ...result, mode: 'safe-rules-fallback' }, { status: response.status });
}

export async function GET() {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Sessão administrativa necessária.' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    service: 'AssistPro WhatsApp orchestrator',
    mode: process.env.MAKE_WEBHOOK_URL ? 'make' : 'safe-rules-fallback',
    makeConfigured: Boolean(process.env.MAKE_WEBHOOK_URL && process.env.MAKE_WEBHOOK_API_KEY),
    callbackConfigured: Boolean(process.env.MAKE_CALLBACK_SECRET),
    inputNormalization: true,
    forwardsOnlyInboundMessages: true,
    inboundPersistence: Boolean(getSupabaseAdmin()),
    businessContextConfigured: Boolean(getSupabaseAdmin()),
    audioConfigured: Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID)
  });
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: 'Webhook bloqueado: WHATSAPP_WEBHOOK_SECRET não configurado.' },
      { status: 503 }
    );
  }
  if (providedSecret(request) !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'Webhook não autorizado.' }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  try {
    const makeUrl = validatedMakeUrl();
    if (!makeUrl) return await forwardToSafeFallback(request, payload);

    const normalized = extractIncomingMessage(payload);
    if (!normalized.message) {
      return NextResponse.json({
        ok: true,
        mode: 'make',
        ignored: true,
        reason: normalized.ignoredReason || 'event_ignored'
      });
    }

    const persistence = await persistInbound(normalized.message);
    if (persistence.duplicate) {
      return NextResponse.json({ ok: true, mode: 'make', ignored: true, reason: 'duplicate_message' });
    }

    return await forwardToMake(request, normalized.message, makeUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha no orquestrador do WhatsApp.';
    console.error('AssistPro WhatsApp orchestrator error', message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
