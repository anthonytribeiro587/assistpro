import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();

  // Ponto de entrada da Evolution API.
  // Próximos passos:
  // 1. Identificar número do cliente.
  // 2. Salvar mensagem no Supabase.
  // 3. Procurar cliente/OS vinculada.
  // 4. Se for pergunta simples, responder com IA.
  // 5. Se for orçamento, reclamação ou caso sensível, transferir para humano.

  console.log('Evolution webhook recebido:', payload);

  return NextResponse.json({ ok: true });
}
