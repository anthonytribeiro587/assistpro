import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendAudioMessage, sendEvolutionText } from '@/lib/evolution';

export const dynamic = 'force-dynamic';

type MakeResponseBody = {
  phone?: unknown;
  text?: unknown;
  audioUrl?: unknown;
  sendTextWithAudio?: unknown;
};

function providedSecret(request: NextRequest) {
  return (
    request.headers.get('x-assistpro-make-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.nextUrl.searchParams.get('secret') ||
    ''
  );
}

function normalizePhone(value: unknown) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'sim', 'yes'].includes(String(value || '').toLowerCase().trim());
}

function validateAudioUrl(value: unknown) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const url = new URL(raw);
  if (url.protocol !== 'https:') throw new Error('O áudio deve estar disponível por uma URL HTTPS.');
  return url.toString();
}

async function findConversation(phone: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const companyId = process.env.ASSISTPRO_COMPANY_ID?.trim();
  let query = supabase
    .from('whatsapp_conversations')
    .select('id,company_id')
    .eq('phone', phone)
    .order('last_message_at', { ascending: false })
    .limit(1);

  if (companyId) query = query.eq('company_id', companyId);
  const result = await query.maybeSingle();
  return result.data || null;
}

async function persistOutput(input: { phone: string; text?: string; audioUrl?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { persisted: false, reason: 'supabase_not_configured' };

  const conversation = await findConversation(input.phone);
  if (!conversation?.id || !conversation.company_id) {
    return { persisted: false, reason: 'conversation_not_found' };
  }

  const rows = [];
  if (input.text) {
    rows.push({
      company_id: conversation.company_id,
      conversation_id: conversation.id,
      direction: 'outbound',
      message_type: 'text',
      content: input.text,
      media_url: null,
      ai_generated: true
    });
  }
  if (input.audioUrl) {
    rows.push({
      company_id: conversation.company_id,
      conversation_id: conversation.id,
      direction: 'outbound',
      message_type: 'audio',
      content: input.text || 'Resposta em áudio gerada pela IA.',
      media_url: input.audioUrl,
      ai_generated: true
    });
  }

  if (!rows.length) return { persisted: false, reason: 'nothing_to_persist' };
  const inserted = await supabase.from('whatsapp_messages').insert(rows);
  if (inserted.error) throw new Error(inserted.error.message);

  await supabase
    .from('whatsapp_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation.id);

  return { persisted: true, conversationId: conversation.id };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'AssistPro Make response callback',
    accepts: ['text', 'audioUrl']
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
    return NextResponse.json({ ok: false, error: 'Callback não autorizado.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as MakeResponseBody;
    const phone = normalizePhone(body.phone);
    const text = String(body.text || '').trim().slice(0, 4000);
    const audioUrl = validateAudioUrl(body.audioUrl);

    if (!phone || (!text && !audioUrl)) {
      return NextResponse.json(
        { ok: false, error: 'Informe phone e pelo menos text ou audioUrl.' },
        { status: 400 }
      );
    }

    const sendTextWithAudio = parseBoolean(body.sendTextWithAudio);
    const delivery: Record<string, unknown> = {};

    if (audioUrl) delivery.audio = await sendAudioMessage({ phone, audioUrl });
    if (text && (!audioUrl || sendTextWithAudio)) {
      delivery.text = await sendEvolutionText(phone, text);
    }

    const persistence = await persistOutput({
      phone,
      text: text || undefined,
      audioUrl: audioUrl || undefined
    });

    return NextResponse.json({ ok: true, delivery, persistence });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível enviar a resposta do Make.';
    console.error('AssistPro Make callback error', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
