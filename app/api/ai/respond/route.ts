import { NextResponse } from 'next/server';

const humanHandoffKeywords = ['reclamar', 'garantia', 'processo', 'procon', 'desconto', 'não gostei', 'ficou ruim', 'quero falar com'];
const orderKeywords = ['os', 'ordem', 'ficou pronto', 'status', 'andamento', 'aparelho'];
const quoteKeywords = ['valor', 'quanto', 'preço', 'orçamento', 'trocar', 'arrumar', 'consertar'];

function includesAny(message: string, keywords: string[]) {
  return keywords.some((keyword) => message.includes(keyword));
}

export async function POST(request: Request) {
  const body = await request.json();
  const message = String(body.message || '').toLowerCase().trim();

  if (!message) {
    return NextResponse.json({ error: 'Mensagem obrigatória.' }, { status: 400 });
  }

  if (includesAny(message, humanHandoffKeywords)) {
    return NextResponse.json({
      intent: 'human_handoff',
      shouldSendAudio: false,
      response: 'Vou chamar uma pessoa da equipe para te atender melhor nesse caso, tudo bem?'
    });
  }

  if (includesAny(message, orderKeywords)) {
    return NextResponse.json({
      intent: 'order_status',
      shouldSendAudio: true,
      response: 'Consigo consultar para você. Me envie o número da OS ou o telefone cadastrado no atendimento.'
    });
  }

  if (includesAny(message, quoteKeywords)) {
    return NextResponse.json({
      intent: 'quote_request',
      shouldSendAudio: true,
      response: 'Consigo te ajudar com uma estimativa. Me envie o modelo do aparelho, o defeito e, se possível, uma foto ou vídeo do problema.'
    });
  }

  return NextResponse.json({
    intent: 'general',
    shouldSendAudio: true,
    response: 'Olá! Sou o atendente virtual da assistência. Me diga o modelo do aparelho e o problema para eu direcionar seu atendimento.'
  });
}
