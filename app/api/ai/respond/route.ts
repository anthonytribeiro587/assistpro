import { NextResponse } from 'next/server';

type IntakeField = 'device' | 'issue' | 'name' | 'phone' | null;

type IntakeContext = {
  customerName?: string;
  phone?: string;
  deviceModel?: string;
  issue?: string;
  awaiting?: IntakeField;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ServiceOrderDraft = {
  number: string;
  customerName: string;
  phone: string;
  deviceModel: string;
  issue: string;
  status: 'Triagem concluída';
  createdAt: string;
};

const humanHandoffKeywords = [
  'reclamar',
  'garantia',
  'processo',
  'procon',
  'não gostei',
  'ficou ruim',
  'quero falar com alguém',
  'quero falar com uma pessoa',
  'atendente humano'
];

const orderStatusKeywords = ['status da os', 'minha os', 'ficou pronto', 'está pronto', 'andamento do conserto'];

function normalizeText(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13 ? digits : undefined;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractName(message: string, awaiting?: IntakeField) {
  const explicitName = message.match(/(?:meu nome (?:é|e)|me chamo|sou)\s+([a-zà-ÿ][a-zà-ÿ\s'-]{1,50})/i)?.[1];
  const candidate = explicitName ?? (awaiting === 'name' ? message : '');

  if (!candidate || /\d/.test(candidate)) {
    return undefined;
  }

  const cleaned = candidate.replace(/[.!?,;:]+$/g, '').trim();
  const words = cleaned.split(/\s+/);

  if (words.length > 5 || cleaned.length < 2 || cleaned.length > 60) {
    return undefined;
  }

  return titleCase(cleaned);
}

function extractDevice(message: string, awaiting?: IntakeField) {
  const patterns = [
    /\biphone\s*(?:se|x[rs]?|\d{1,2})(?:\s*(?:pro|max|plus|mini))?\b/i,
    /\b(?:samsung\s*)?(?:galaxy\s*)?[asmz]\s?\d{2,3}(?:\s*(?:ultra|fe|plus))?\b/i,
    /\b(?:moto|motorola)\s+[a-z0-9+\- ]{1,24}\b/i,
    /\b(?:redmi|xiaomi|poco)\s+[a-z0-9+\- ]{1,24}\b/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern)?.[0];
    if (match) {
      return match.replace(/\s+/g, ' ').trim();
    }
  }

  if (awaiting !== 'device') {
    return undefined;
  }

  const cleaned = message.replace(/[.!?,;:]+$/g, '').trim();
  return cleaned.length >= 2 && cleaned.length <= 50 ? cleaned : undefined;
}

function extractIssue(message: string, awaiting?: IntakeField) {
  const issuePatterns: Array<[RegExp, string]> = [
    [/caiu.*(?:água|agua)|molhou|oxid/i, 'Possível dano por líquido/oxidação'],
    [/não liga|nao liga|morto|sem sinal de vida/i, 'Aparelho não liga'],
    [/tela.*(?:quebrada|trincada|preta|apagada)|display|touch/i, 'Problema na tela/display'],
    [/bateria|descarrega|não segura carga|nao segura carga/i, 'Problema de bateria'],
    [/não (?:está )?carrega(?:ndo|r)?|nao (?:esta )?carrega(?:ndo|r)?|conector|carregamento/i, 'Problema de carregamento'],
    [/câmera|camera|foco/i, 'Problema na câmera'],
    [/microfone|alto.?falante|sem som|áudio|audio/i, 'Problema de áudio'],
    [/travando|lento|reinicia|loop|software/i, 'Falha de software/desempenho']
  ];

  for (const [pattern, label] of issuePatterns) {
    if (pattern.test(message)) {
      return label;
    }
  }

  if (awaiting !== 'issue') {
    return undefined;
  }

  const cleaned = message.replace(/[.!?,;:]+$/g, '').trim();
  return cleaned.length >= 4 && cleaned.length <= 180 ? cleaned : undefined;
}

function includesAny(message: string, keywords: string[]) {
  const normalized = message.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function getProgress(context: IntakeContext) {
  const completed = [context.deviceModel, context.issue, context.customerName, context.phone].filter(Boolean).length;
  return completed * 25;
}

function nextQuestion(context: IntakeContext) {
  if (!context.deviceModel) {
    return {
      awaiting: 'device' as const,
      response: 'Para começar a triagem, qual é a marca e o modelo do aparelho? Exemplo: iPhone 13, Galaxy A54 ou Moto G84.'
    };
  }

  if (!context.issue) {
    return {
      awaiting: 'issue' as const,
      response: `Entendi, é um ${context.deviceModel}. O que aconteceu com o aparelho e quais sintomas ele apresenta?`
    };
  }

  if (!context.customerName) {
    return {
      awaiting: 'name' as const,
      response: 'Já registrei o aparelho e o problema. Qual é o seu nome para eu preparar a ordem de serviço?'
    };
  }

  if (!context.phone) {
    return {
      awaiting: 'phone' as const,
      response: `Obrigado, ${context.customerName}. Qual é o número de WhatsApp com DDD para vincular à OS?`
    };
  }

  return null;
}

function createOrder(context: Required<Pick<IntakeContext, 'customerName' | 'phone' | 'deviceModel' | 'issue'>>): ServiceOrderDraft {
  const suffix = String(Date.now()).slice(-5);

  return {
    number: `JR-${new Date().getFullYear()}-${suffix}`,
    customerName: context.customerName,
    phone: context.phone,
    deviceModel: context.deviceModel,
    issue: context.issue,
    status: 'Triagem concluída',
    createdAt: new Date().toISOString()
  };
}

function readOutputText(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const response = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (response.output_text?.trim()) {
    return response.output_text.trim();
  }

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === 'output_text' && item.text?.trim())
    ?.text?.trim();
}

async function polishWithOpenAI(fallback: string, context: IntakeContext, history: ChatMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { text: fallback, provider: 'demo-rules' as const };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5',
        store: false,
        max_output_tokens: 140,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'Você é o atendente virtual da JR Celular, assistência técnica em Sapucaia do Sul. Reescreva a resposta-base de forma humana, objetiva e acolhedora. Não invente preços, diagnósticos, prazos, estoque ou garantias. Não pule a pergunta indicada e não diga que o aparelho já foi consertado. Use no máximo 55 palavras.'
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  respostaBase: fallback,
                  dadosColetados: context,
                  ultimasMensagens: history.slice(-6)
                })
              }
            ]
          }
        ]
      }),
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      return { text: fallback, provider: 'demo-rules' as const };
    }

    const payload = await response.json();
    return { text: readOutputText(payload) || fallback, provider: 'openai' as const };
  } catch {
    return { text: fallback, provider: 'demo-rules' as const };
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: unknown;
      context?: IntakeContext;
      history?: ChatMessage[];
    };

    const message = normalizeText(body.message);
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const previousContext = body.context ?? {};

    if (!message) {
      return NextResponse.json({ error: 'Mensagem obrigatória.' }, { status: 400 });
    }

    if (includesAny(message, humanHandoffKeywords)) {
      return NextResponse.json({
        intent: 'human_handoff',
        shouldSendAudio: false,
        provider: 'demo-rules',
        progress: getProgress(previousContext),
        context: { ...previousContext, awaiting: null },
        response: 'Vou pausar a automação e encaminhar esta conversa para uma pessoa da equipe da JR Celular.'
      });
    }

    if (includesAny(message, orderStatusKeywords)) {
      return NextResponse.json({
        intent: 'order_status',
        shouldSendAudio: true,
        provider: 'demo-rules',
        progress: getProgress(previousContext),
        context: { ...previousContext, awaiting: null },
        response: 'Consigo consultar o andamento. Envie o número da OS ou o telefone usado no cadastro.'
      });
    }

    const nextContext: IntakeContext = {
      ...previousContext,
      phone: previousContext.phone ?? normalizePhone(message),
      customerName: previousContext.customerName ?? extractName(message, previousContext.awaiting),
      deviceModel: previousContext.deviceModel ?? extractDevice(message, previousContext.awaiting),
      issue: previousContext.issue ?? extractIssue(message, previousContext.awaiting)
    };

    const question = nextQuestion(nextContext);

    if (question) {
      nextContext.awaiting = question.awaiting;
      const polished = await polishWithOpenAI(question.response, nextContext, [...history, { role: 'user', content: message }]);

      return NextResponse.json({
        intent: 'intake',
        shouldSendAudio: true,
        provider: polished.provider,
        progress: getProgress(nextContext),
        context: nextContext,
        response: polished.text
      });
    }

    const completeContext = nextContext as Required<Pick<IntakeContext, 'customerName' | 'phone' | 'deviceModel' | 'issue'>>;
    const serviceOrder = createOrder(completeContext);
    const fallback = `Perfeito, ${completeContext.customerName}. A triagem foi concluída e a OS ${serviceOrder.number} foi criada para o ${completeContext.deviceModel}. A equipe agora pode revisar o caso e confirmar diagnóstico, prazo e orçamento.`;
    const polished = await polishWithOpenAI(fallback, { ...nextContext, awaiting: null }, [...history, { role: 'user', content: message }]);

    return NextResponse.json({
      intent: 'create_order',
      shouldSendAudio: true,
      provider: polished.provider,
      progress: 100,
      context: { ...nextContext, awaiting: null },
      serviceOrder,
      response: polished.text
    });
  } catch {
    return NextResponse.json({ error: 'Não foi possível processar o atendimento agora.' }, { status: 500 });
  }
}
