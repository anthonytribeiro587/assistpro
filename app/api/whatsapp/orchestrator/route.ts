import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function providedSecret(request: NextRequest) {
  return (
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-assistpro-webhook-secret') ||
    request.headers.get('x-webhook-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  );
}

function normalizeCommand(value: unknown) {
  return String(value || '')
    .trim()
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

function validatedN8nUrl() {
  const raw = process.env.N8N_WEBHOOK_URL?.trim();
  if (!raw) return null;

  const url = new URL(raw);
  const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !isLocal) {
    throw new Error('N8N_WEBHOOK_URL deve utilizar HTTPS.');
  }
  return url;
}

async function forwardToN8n(request: NextRequest, payload: unknown, n8nUrl: URL) {
  const secret = process.env.N8N_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error('N8N_WEBHOOK_SECRET não está configurado.');

  const response = await fetch(n8nUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-assistpro-n8n-secret': secret
    },
    body: JSON.stringify({
      source: 'assistpro',
      receivedAt: new Date().toISOString(),
      callbackUrl: new URL('/api/n8n/respond', request.nextUrl.origin).toString(),
      payload
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.message || result?.error || `n8n respondeu HTTP ${response.status}.`);
  }

  return NextResponse.json({ ok: true, mode: 'n8n', result });
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
    mode: process.env.N8N_WEBHOOK_URL ? 'n8n' : 'safe-rules-fallback',
    n8nConfigured: Boolean(process.env.N8N_WEBHOOK_URL && process.env.N8N_WEBHOOK_SECRET),
    audioConfigured: Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID)
  });
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (expectedSecret && providedSecret(request) !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'Webhook não autorizado.' }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));

  try {
    const n8nUrl = validatedN8nUrl();
    if (n8nUrl) return await forwardToN8n(request, payload, n8nUrl);
    return await forwardToSafeFallback(request, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha no orquestrador do WhatsApp.';
    console.error('AssistPro WhatsApp orchestrator error', message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
