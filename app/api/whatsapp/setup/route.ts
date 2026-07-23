import { NextRequest, NextResponse } from 'next/server';
import {
  configureEvolutionWebhook,
  getEvolutionConnectionState,
  getEvolutionConfig
} from '@/lib/evolution';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedProfile, hasAnyRole } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

function configured(value?: string) {
  return Boolean(String(value || '').trim());
}

function webhookUrl(request: NextRequest) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error('WHATSAPP_WEBHOOK_SECRET não está configurado.');

  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const origin = configuredOrigin || request.nextUrl.origin;
  const endpoint = new URL('/api/whatsapp/orchestrator', origin);
  endpoint.searchParams.set('secret', secret);
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

async function requireAdmin() {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return {
      profile: null,
      response: NextResponse.json(
        { ok: false, error: 'Seu usuário ainda não possui perfil na empresa.' },
        { status: 403 }
      )
    };
  }

  if (!hasAnyRole(profile, ['owner', 'admin'])) {
    return {
      profile,
      response: NextResponse.json(
        { ok: false, error: 'Apenas proprietário ou administrador pode configurar o WhatsApp.' },
        { status: 403 }
      )
    };
  }

  return { profile, response: null };
}

async function diagnostics(request: NextRequest, webhookConfigured = false, webhookError: string | null = null) {
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

  let endpoint = '/api/whatsapp/orchestrator?secret=***';
  try {
    endpoint = webhookUrl(request).replace(/\?secret=.*/, '?secret=***');
  } catch {
    // A ausência do segredo já aparece no diagnóstico.
  }

  return {
    ok: coreReady,
    project: 'assistpro',
    environment,
    evolution,
    evolutionError,
    supabase,
    webhook: {
      endpoint,
      configuredByThisRequest: webhookConfigured,
      error: webhookError
    },
    capabilities: {
      mode:
        environment.makeWebhookUrl && environment.makeWebhookApiKey
          ? 'make-ai-orchestrator'
          : 'safe-rules-fallback',
      callbackReady: environment.makeCallbackSecret,
      audioReply: environment.elevenLabsApiKey && environment.elevenLabsVoiceId,
      createsOrderBeforeDelivery: false
    }
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

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

  return NextResponse.json(
    await diagnostics(request, webhookConfigured, webhookError),
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const endpoint = webhookUrl(request);
    await configureEvolutionWebhook(endpoint);
    return NextResponse.json(
      {
        ...(await diagnostics(request, true, null)),
        message: 'Webhook da Evolution configurado com segurança.'
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
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
