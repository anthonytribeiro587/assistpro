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

async function forwardToMake(request: NextRequest, payload: unknown, makeUrl: URL) {
  const apiKey = process.env.MAKE_WEBHOOK_API_KEY?.trim();
  if (!apiKey) throw new Error('MAKE_WEBHOOK_API_KEY não está configurada.');

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
      payload
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
    if (makeUrl) return await forwardToMake(request, payload, makeUrl);
    return await forwardToSafeFallback(request, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha no orquestrador do WhatsApp.';
    console.error('AssistPro WhatsApp orchestrator error', message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
