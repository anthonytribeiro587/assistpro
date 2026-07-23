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

function deploymentEnvironment() {
  return process.env.VERCEL_ENV?.trim() || process.env.NODE_ENV || 'unknown';
}

function buildWebhookUrl(request: NextRequest) {
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (!expectedSecret) throw new Error('WHATSAPP_WEBHOOK_SECRET não está configurado.');

  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;
  const endpoint = new URL('/api/whatsapp/orchestrator', origin);
  endpoint.searchParams.set('secret', expectedSecret);
  return endpoint.toString();
}

async function requireAdministrator() {
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
        { ok: false, error: 'Apenas proprietário ou administrador pode acessar integrações.' },
        { status: 403 }
      )
    };
  }

  return { profile, response: null };
}

async function integrationSnapshot(profileRole: string) {
  let evolution: {
    configured: boolean;
    connected: boolean;
    state: string | null;
    error: string | null;
  } = {
    configured: false,
    connected: false,
    state: null,
    error: null
  };

  try {
    getEvolutionConfig();
    const state = await getEvolutionConnectionState();
    evolution = {
      configured: true,
      connected: state.connected,
      state: state.state ? String(state.state) : null,
      error: state.ok ? null : `Evolution respondeu HTTP ${state.status}.`
    };
  } catch (error) {
    evolution.error = error instanceof Error ? error.message : 'Falha ao consultar a Evolution.';
  }

  const environment = deploymentEnvironment();

  return {
    ok: true,
    role: profileRole,
    environment,
    canManage: true,
    canConfigureWebhook: environment === 'production',
    evolution,
    make: {
      webhookConfigured: configured(process.env.MAKE_WEBHOOK_URL),
      apiKeyConfigured: configured(process.env.MAKE_WEBHOOK_API_KEY),
      callbackConfigured: configured(process.env.MAKE_CALLBACK_SECRET)
    },
    supabase: {
      publicClientConfigured:
        configured(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        configured(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      adminClientConfigured: Boolean(getSupabaseAdmin())
    },
    webhook: {
      secretConfigured: configured(process.env.WHATSAPP_WEBHOOK_SECRET),
      endpoint: '/api/whatsapp/orchestrator?secret=***'
    },
    ai: {
      businessContextConfigured: Boolean(getSupabaseAdmin()),
      prerecordedAudioEnabled: Boolean(getSupabaseAdmin()),
      generatedVoiceConfigured:
        configured(process.env.ELEVENLABS_API_KEY) && configured(process.env.ELEVENLABS_VOICE_ID)
    }
  };
}

export async function GET() {
  const auth = await requireAdministrator();
  if (auth.response || !auth.profile) return auth.response;

  const snapshot = await integrationSnapshot(auth.profile.role);
  return NextResponse.json(snapshot, {
    headers: { 'Cache-Control': 'no-store, max-age=0' }
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdministrator();
  if (auth.response || !auth.profile) return auth.response;

  if (deploymentEnvironment() !== 'production') {
    return NextResponse.json(
      {
        ok: false,
        error: 'A configuração do webhook só pode ser alterada no ambiente de produção.'
      },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => ({}));
  if (body?.action !== 'configure_whatsapp_webhook') {
    return NextResponse.json({ ok: false, error: 'Ação administrativa inválida.' }, { status: 400 });
  }

  try {
    const webhookUrl = buildWebhookUrl(request);
    await configureEvolutionWebhook(webhookUrl);
    const snapshot = await integrationSnapshot(auth.profile.role);

    return NextResponse.json({
      ...snapshot,
      message: 'Webhook da Evolution configurado com o endpoint seguro do AssistPro.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível configurar o WhatsApp.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
