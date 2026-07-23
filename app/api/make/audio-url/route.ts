import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const AUDIO_BUCKET = 'assistpro-audios';
const AUDIO_URL_EXPIRES_IN_SECONDS = 10 * 60;

const AUDIO_PATHS = {
  saudacao: 'jr-celular/01-saudacao-geral.ogg',
  avaliacao: 'jr-celular/02-convite-avaliacao.ogg',
  preco: 'jr-celular/03-explicacao-preco.ogg',
  produto: 'jr-celular/04-atendimento-produto.ogg',
  estoque: 'jr-celular/05-consulta-estoque.ogg',
  encerramento: 'jr-celular/06-encerramento-convite.ogg'
} as const;

type AudioKey = keyof typeof AUDIO_PATHS;

type AudioUrlRequestBody = {
  audioKey?: unknown;
};

function providedSecret(request: NextRequest) {
  return (
    request.headers.get('x-assistpro-make-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.nextUrl.searchParams.get('secret') ||
    ''
  );
}

function normalizeAudioKey(value: unknown): AudioKey | null {
  const key = String(value || '')
    .trim()
    .toLowerCase();

  return Object.prototype.hasOwnProperty.call(AUDIO_PATHS, key) ? (key as AudioKey) : null;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'AssistPro private audio URL',
    audioKeys: Object.keys(AUDIO_PATHS),
    expiresInSeconds: AUDIO_URL_EXPIRES_IN_SECONDS
  });
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.MAKE_CALLBACK_SECRET?.trim();

  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: 'MAKE_CALLBACK_SECRET não configurado.' },
      { status: 503 }
    );
  }

  if (providedSecret(request) !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'Solicitação não autorizada.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AudioUrlRequestBody;
    const audioKey = normalizeAudioKey(body.audioKey);

    if (!audioKey) {
      return NextResponse.json(
        {
          ok: false,
          error: 'audioKey inválido.',
          allowedAudioKeys: Object.keys(AUDIO_PATHS)
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Supabase administrativo não configurado.' },
        { status: 503 }
      );
    }

    const path = AUDIO_PATHS[audioKey];
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(path, AUDIO_URL_EXPIRES_IN_SECONDS);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || 'Não foi possível gerar a URL temporária do áudio.');
    }

    return NextResponse.json(
      {
        ok: true,
        audioKey,
        audioUrl: data.signedUrl,
        expiresInSeconds: AUDIO_URL_EXPIRES_IN_SECONDS
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível obter o áudio.';
    console.error('AssistPro private audio URL error', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
