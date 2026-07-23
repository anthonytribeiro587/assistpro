import { NextRequest, NextResponse } from 'next/server';
import {
  aiBusinessSettingsToRow,
  loadAiBusinessSettings,
  sanitizeAiBusinessSettings
} from '@/lib/ai-business-settings';
import { getAssistProCompanyId } from '@/lib/company';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function providedAdminSecret(request: NextRequest) {
  return (
    request.headers.get('x-assistpro-admin-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  );
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Supabase administrativo não configurado.' },
      { status: 503 }
    );
  }

  try {
    const companyId = await getAssistProCompanyId(supabase);
    const result = await loadAiBusinessSettings(supabase, companyId);

    return NextResponse.json(
      {
        ok: true,
        companyId,
        ...result,
        writeProtectionConfigured: Boolean(process.env.ASSISTPRO_ADMIN_SECRET?.trim())
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível carregar as configurações.';
    console.error('AssistPro AI settings GET error', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const expectedSecret = process.env.ASSISTPRO_ADMIN_SECRET?.trim();
  if (!expectedSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ASSISTPRO_ADMIN_SECRET não configurado. A gravação está bloqueada por segurança.'
      },
      { status: 503 }
    );
  }

  if (providedAdminSecret(request) !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'Código administrativo inválido.' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Supabase administrativo não configurado.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const settings = sanitizeAiBusinessSettings(body?.settings);
    const companyId = await getAssistProCompanyId(supabase);

    const saved = await supabase
      .from('ai_business_settings')
      .upsert(
        {
          company_id: companyId,
          ...aiBusinessSettingsToRow(settings),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'company_id' }
      )
      .select('*')
      .single();

    if (saved.error) {
      const missingTable = ['42P01', 'PGRST205'].includes(saved.error.code || '');
      return NextResponse.json(
        {
          ok: false,
          migrationRequired: missingTable,
          error: missingTable
            ? 'A tabela de parametrizações ainda não foi criada no Supabase.'
            : saved.error.message
        },
        { status: missingTable ? 503 : 500 }
      );
    }

    const result = await loadAiBusinessSettings(supabase, companyId);
    return NextResponse.json({ ok: true, companyId, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível salvar as configurações.';
    console.error('AssistPro AI settings PUT error', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
