import { NextRequest, NextResponse } from 'next/server';
import {
  configureEvolutionWebhook,
  getEvolutionConnectionState,
  getEvolutionConfig
} from '@/lib/evolution';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function configured(value?: string) {
  return Boolean(String(value || '').trim());
}

function providedSecret(request: NextRequest, bodySecret?: unknown) {
  return (
    String(bodySecret || '').trim() ||
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-assistpro-webhook-secret') ||
    request.headers.get('x-webhook-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  );
}

function webhookUrl(request: NextRequest) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const origin = configuredOrigin || request.nextUrl.origin;
  const endpoint = new URL('/api/whatsapp/orchestrator', origin);
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (secret) endpoint.searchParams.set('secret', secret);
  return endpoint.toString();
}

async function inspectSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false, reachable: false, companyFound: false };

  const company = await supabase.from('companies').select('id,name').limit(1).maybeSingle();
  return {
    configured: true,
    reachable: !company.error,
    companyFound: Boolean(company.data?.id),
    error: company.error?.message || null
  };
}

export async function GET(request: NextRequest) {
  let webhookConfigured = false;
  let webhookError: string | null = null;

  if (request.nextUrl.searchParams.get('apply') === '1') {
    try {
      await configureEvolutionWebhook(webhookUrl(request));
      webhookConfigured = true;
    } catch (error) {
      webhookError = error instanceof Error ? error.message : 'Não foi possível configurar o webhook.';
    }
  }

  let evolution: Awaited<ReturnType<typeof getEvolutionConnectionState>> | null = null;
  let evolutionError: string | null = null;

  try {
    getEvolutionConfig();
    evolution = await getEvolutionConnectionState();
  } catch (error) {
    evolutionError = error instanceof Error ? error.message : 'Falha ao consultar a Evolution API.';
  }

  const supabase = await inspectSupabase();
  const environment = {
    evolutionApiUrl: configured(process.env.EVOLUTION_API_URL),
    evolutionApiKey: configured(process.env.EVOLUTION_API_KEY),
    evolutionInstance:
      configured(process.env.EVOLUTION_INSTANCE) ||
      configured(process.env.EVOLUTION_INSTANCE_NAME),
    webhookSecret: configured(process.env.WHATSAPP_WEBHOOK_SECRET),
    supabaseUrl: configured(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseServiceRole: configured(process.env.SUPABASE_SERVICE_ROLE_KEY),
    makeWebhookUrl: configured(process.env.MAKE_WEBHOOK_URL),
    makeWebhookApiKey: configured(process.env.MAKE_WEBHOOK_API_KEY),
    makeCallbackSecret: configured(process.env.MAKE_CALLBACK_SECRET),
    geminiApiKey: configured(process.env.GEMINI_API_KEY),
    openAiApiKey: configured(process.env.OPENAI_API_KEY),
    elevenLabsApiKey: configured(process.env.ELEVENLABS_API_KEY),
    elevenLabsVoiceId: configured(process.env.ELEVENLABS_VOICE_ID)
  };

  const coreReady =
    environment.evolutionApiUrl &&
    environment.evolutionApiKey &&
    environment.evolutionInstance &&
    environment.webhookSecret &&
    environment.supabaseUrl &&
    environment.supabaseServiceRole &&
    Boolean(evolution?.connected) &&
    supabase.reachable &&
    !webhookError;

  return NextResponse.json(
    {
      ok: coreReady,
      project: 'assistpro',
      environment,
      evolution,
      evolutionError,
      supabase,
      webhook: {
        endpoint: webhookUrl(request).replace(/\?secret=.*/, '?secret=***'),
        configuredByThisRequest: webhookConfigured,
        error: webhookError,
        setupMethod: 'GET com apply=1 ou POST protegido'
      },
      capabilities: {
        mode:
          environment.makeWebhookUrl && environment.makeWebhookApiKey
            ? 'make-ai-orchestrator'
            : 'safe-rules-fallback',
        callbackReady: environment.makeCallbackSecret,
        naturalLanguageAi: environment.geminiApiKey || environment.openAiApiKey,
        incomingAudioTranscription: environment.openAiApiKey || environment.elevenLabsApiKey,
        audioReply: environment.elevenLabsApiKey && environment.elevenLabsVoiceId,
        createsOrderBeforeDelivery: false
      },
      trial: { activationCommand: 'TESTE JR' }
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();

  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: 'WHATSAPP_WEBHOOK_SECRET não está configurado no AssistPro.' },
      { status: 503 }
    );
  }

  if (providedSecret(request, body?.secret) !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const endpoint = webhookUrl(request);
    await configureEvolutionWebhook(endpoint);
    const evolution = await getEvolutionConnectionState();

    return NextResponse.json({
      ok: evolution.connected,
      webhookConfigured: true,
      endpoint: endpoint.replace(/\?secret=.*/, '?secret=***'),
      evolution
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Não foi possível configurar o webhook.'
      },
      { status: 500 }
    );
  }
}
