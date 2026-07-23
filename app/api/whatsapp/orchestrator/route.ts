import { NextRequest, NextResponse } from 'next/server';
import {
  businessContextToAgentInput,
  buildBusinessContext,
  DEFAULT_AI_BUSINESS_SETTINGS,
  loadAiBusinessSettings
} from '@/lib/ai-business-settings';
import { getAssistProCompanyId } from '@/lib/company';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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

function providedSecret(request: NextRequest) {
  return (
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-assistpro-webhook-secret') ||
    request.headers.get('x-webhook-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  );
}

function compactText(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeCommand(value: unknown) {
  return compactText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isExplicitNegativeResult(value: unknown) {
  const command = normalizeCommand(value);
  return [
    'nao resolveu',
    'nao funcionou',
    'continua igual',
    'mesma coisa',
    'segue igual',
    'ainda nao',
    'nao carregou',
    'continua sem funcionar'
  ].some((phrase) => command === phrase || command.startsWith(`${phrase} `));
}

function rewriteTextField(container: Record<string, unknown>, field: string) {
  const current = container[field];
  if (typeof current !== 'string' || !isExplicitNegativeResult(current)) return false;
  container[field] = 'continua igual';
  return true;
}

function rewriteMessage(message: unknown) {
  if (!message || typeof message !== 'object') return false;
  const source = message as Record<string, unknown>;
  let rewritten = rewriteTextField(source, 'conversation');

  const nestedFields = [
    ['extendedTextMessage', 'text'],
    ['imageMessage', 'caption'],
    ['videoMessage', 'caption'],
    ['documentMessage', 'caption'],
    ['buttonsResponseMessage', 'selectedDisplayText'],
    ['templateButtonReplyMessage', 'selectedDisplayText']
  ] as const;

  for (const [parent, field] of nestedFields) {
    const nested = source[parent];
    if (nested && typeof nested === 'object') {
      rewritten = rewriteTextField(nested as Record<string, unknown>, field) || rewritten;
    }
  }

  const listResponse = source.listResponseMessage;
  if (listResponse && typeof listResponse === 'object') {
    const list = listResponse as Record<string, unknown>;
    rewritten = rewriteTextField(list, 'title') || rewritten;
    const single = list.singleSelectReply;
    if (single && typeof single === 'object') {
      rewritten = rewriteTextField(single as Record<string, unknown>, 'selectedRowId') || rewritten;
    }
  }

  return rewritten;
}

function rewriteNegativeResult(payload: unknown) {
  const clone = structuredClone(payload) as any;
  let rewritten = false;

  const processItem = (item: any) => {
    const source = item?.data || item || {};
    rewritten = rewriteMessage(source?.message || item?.message || source) || rewritten;
  };

  if (Array.isArray(clone?.data)) clone.data.forEach(processItem);
  else if (Array.isArray(clone?.data?.messages)) clone.data.messages.forEach(processItem);
  else if (Array.isArray(clone?.messages)) clone.messages.forEach(processItem);
  else processItem(clone?.data || clone);

  return { payload: clone, rewritten };
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
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[.\-\s]+/g, '_');
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

  const items = normalizeItems(payload);
  if (!items.length) return { ignoredReason: 'empty_event' };

  for (const item of items) {
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

function validatedMakeUrl() {
  const raw = process.env.MAKE_WEBHOOK_URL?.trim();
  if (!raw) return null;

  const url = new URL(raw);
  if (url.protocol !== 'https:') {
    throw new Error('MAKE_WEBHOOK_URL deve utilizar HTTPS.');
  }
  return url;
}

async function readMakeResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function loadBusinessContext() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return buildBusinessContext(DEFAULT_AI_BUSINESS_SETTINGS);

  try {
    const companyId = await getAssistProCompanyId(supabase);
    const result = await loadAiBusinessSettings(supabase, companyId);
    return buildBusinessContext(result.settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao carregar contexto da empresa.';
    console.error('AssistPro business context error', message);
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
    headers: {
      'Content-Type': 'application/json',
      'x-make-apikey': apiKey
    },
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

  const result = await readMakeResponse(response);
  if (!response.ok) {
    const detail =
      typeof result === 'object' && result
        ? (result as any).message || (result as any).error
        : result;
    throw new Error(detail || `Make respondeu HTTP ${response.status}.`);
  }

  return NextResponse.json({ ok: true, mode: 'make', result });
}

async function forwardToSafeFallback(request: NextRequest, payload: unknown) {
  const { payload: normalizedPayload, rewritten } = rewriteNegativeResult(payload);
  const endpoint = new URL('/api/whatsapp/remote-triage', request.nextUrl.origin);
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (secret) endpoint.searchParams.set('secret', secret);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedPayload),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000)
  });

  const result = await response.json().catch(() => ({}));
  return NextResponse.json(
    { ...result, mode: 'safe-rules-fallback', negativeResultNormalized: rewritten },
    { status: response.status }
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'AssistPro WhatsApp orchestrator',
    mode: process.env.MAKE_WEBHOOK_URL ? 'make' : 'safe-rules-fallback',
    makeConfigured: Boolean(
      process.env.MAKE_WEBHOOK_URL && process.env.MAKE_WEBHOOK_API_KEY
    ),
    callbackConfigured: Boolean(process.env.MAKE_CALLBACK_SECRET),
    inputNormalization: true,
    forwardsOnlyInboundMessages: true,
    businessContextConfigured: Boolean(getSupabaseAdmin()),
    audioConfigured: Boolean(
      process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID
    )
  });
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (expectedSecret && providedSecret(request) !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'Webhook não autorizado.' }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));

  try {
    const makeUrl = validatedMakeUrl();
    if (makeUrl) {
      const normalized = extractIncomingMessage(payload);
      if (!normalized.message) {
        return NextResponse.json({
          ok: true,
          mode: 'make',
          ignored: true,
          reason: normalized.ignoredReason || 'event_ignored'
        });
      }
      return await forwardToMake(request, normalized.message, makeUrl);
    }
    return await forwardToSafeFallback(request, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha no orquestrador do WhatsApp.';
    console.error('AssistPro WhatsApp orchestrator error', message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
