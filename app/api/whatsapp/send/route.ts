import { NextResponse } from 'next/server';
import { sendTextMessage } from '@/lib/evolution';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body.phone || '').replace(/\D/g, '');
    const message = String(body.message || '').trim();

    if (!phone || !message) {
      return NextResponse.json({ error: 'Telefone e mensagem são obrigatórios.' }, { status: 400 });
    }

    const result = await sendTextMessage({ phone, message });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
