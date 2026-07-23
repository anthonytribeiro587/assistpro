import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedProfile } from '@/lib/supabase-server';

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

export async function GET() {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Sessão administrativa necessária.' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    service: 'AssistPro legacy Evolution webhook',
    deprecated: true,
    forwardsTo: '/api/whatsapp/orchestrator'
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
  const endpoint = new URL('/api/whatsapp/orchestrator', request.nextUrl.origin);
  endpoint.searchParams.set('secret', expectedSecret);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(35_000)
    });
    const result = await response.json().catch(() => ({}));
    return NextResponse.json(
      { ...result, legacyEndpoint: true },
      { status: response.status, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao encaminhar o webhook.';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
