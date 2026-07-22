import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendEvolutionText } from '@/lib/evolution';

type TrialStage =
  | 'awaiting_device'
  | 'awaiting_issue'
  | 'awaiting_test_result'
  | 'awaiting_visit_confirmation'
  | 'closed';

type TrialSession = {
  active: boolean;
  stage: TrialStage;
  customerName: string;
  phone: string;
  deviceModel?: string;
  issue?: string;
  issueCategory?: IssueCategory;
};

type IssueCategory =
  | 'charging'
  | 'no_power'
  | 'screen'
  | 'battery'
  | 'audio'
  | 'camera'
  | 'software'
  | 'liquid'
  | 'hazard'
  | 'other';

type InboundMessage = {
  phone: string;
  pushName: string;
  text: string;
  providerMessageId?: string;
  createdAt: string;
};

const SESSION_PREFIX = 'JR_REMOTE_CONTEXT:';
const ACTIVATION_COMMANDS = ['teste jr', 'teste jr celular', 'ativar jr'];
const EXIT_COMMANDS = ['sair jr', 'encerrar teste jr', 'parar teste jr'];

function compactText(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeCommand(value: string) {
  return compactText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhone(value: unknown) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function parseFromMe(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return ['true', '1', 'yes', 'sim'].includes(String(value || '').toLowerCase().trim());
}

function normalizeItems(payload: any): any[] {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(payload?.messages)) return payload.messages;
  if (data?.key || data?.message || data?.id) return [data];
  if (payload?.key || payload?.message || payload?.id) return [payload];
  return [];
}

function extractText(item: any) {
  const source = item?.data || item || {};
  const message = source?.message || item?.message || source;
  return compactText(
    message?.conversation ||
      message?.extendedTextMessage?.text ||
      message?.imageMessage?.caption ||
      message?.videoMessage?.caption ||
      message?.documentMessage?.caption ||
      message?.buttonsResponseMessage?.selectedDisplayText ||
      message?.templateButtonReplyMessage?.selectedDisplayText ||
      message?.listResponseMessage?.title ||
      message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      ''
  );
}

function parseInbound(item: any, payload: any): InboundMessage | undefined {
  const source = item?.data || item || {};
  const key = source?.key || source?.message?.key || item?.key || {};
  const remoteJid = String(
    key?.remoteJid || source?.remoteJid || source?.jid || source?.from || source?.sender || ''
  );

  if (
    !remoteJid ||
    remoteJid.includes('@g.us') ||
    remoteJid.includes('@broadcast') ||
    remoteJid.includes('@newsletter') ||
    remoteJid === 'status@broadcast'
  ) {
    return undefined;
  }

  if (parseFromMe(key?.fromMe) || parseFromMe(source?.fromMe) || parseFromMe(item?.fromMe)) {
    return undefined;
  }

  const text = extractText(item);
  const phone = normalizePhone(remoteJid.split('@')[0]);
  if (!phone || !text) return undefined;

  const timestamp = Number(
    source?.messageTimestamp || source?.timestamp || payload?.date_time || Date.now() / 1000
  );

  return {
    phone,
    pushName: compactText(
      source?.pushName || source?.verifiedBizName || source?.notifyName || phone
    ),
    text,
    providerMessageId: key?.id || source?.id || item?.id || undefined,
    createdAt: new Date(timestamp > 9_999_999_999 ? timestamp : timestamp * 1000).toISOString()
  };
}

function providedSecret(request: NextRequest) {
  return (
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-assistpro-webhook-secret') ||
    request.headers.get('x-webhook-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  );
}

function safeCustomerName(pushName: string, phone: string) {
  const name = compactText(pushName);
  if (!name || name === phone || /^\d+$/.test(name)) return 'Cliente WhatsApp';
  return name.slice(0, 80);
}

function classifyIssue(issue: string): IssueCategory {
  const normalized = normalizeCommand(issue);

  if (/bateria estuf|estufad|inchad|fumac|fogo|cheiro de queimado|muito quente|superaquec/.test(normalized)) {
    return 'hazard';
  }
  if (/agua|molhou|liquido|umidade|oxid/.test(normalized)) return 'liquid';
  if (/nao carrega|carregamento|conector|cabo|carregador/.test(normalized)) return 'charging';
  if (/nao liga|morto|sem sinal de vida/.test(normalized)) return 'no_power';
  if (/tela|display|touch|imagem|preta|trincad|quebrad/.test(normalized)) return 'screen';
  if (/bateria|descarrega|carga acaba|drena/.test(normalized)) return 'battery';
  if (/microfone|alto falante|alto-falante|sem som|audio|fone/.test(normalized)) return 'audio';
  if (/camera|foco|foto|video/.test(normalized)) return 'camera';
  if (/travando|lento|reinicia|loop|aplicativo|software|armazenamento/.test(normalized)) {
    return 'software';
  }
  return 'other';
}

function restartInstruction(deviceModel: string) {
  const model = normalizeCommand(deviceModel);
  if (/galaxy|samsung/.test(model)) {
    return 'Segure o botão lateral e o volume para baixo juntos por cerca de 10 a 15 segundos.';
  }
  if (/iphone/.test(model)) {
    return 'Se for iPhone 8 ou mais recente: pressione e solte volume +, pressione e solte volume -, depois mantenha o botão lateral até aparecer o logo da Apple.';
  }
  if (/moto|motorola|redmi|xiaomi|poco|android/.test(model)) {
    return 'Mantenha o botão de ligar pressionado por até 20 segundos. Se não reagir, tente botão de ligar + volume para baixo por 10 a 15 segundos.';
  }
  return 'Faça uma reinicialização forçada conforme o modelo. Não abra o aparelho nem pressione peças internas.';
}

function troubleshooting(session: TrialSession) {
  const device = session.deviceModel || 'aparelho';
  const restart = restartInstruction(device);

  switch (session.issueCategory) {
    case 'charging':
      return {
        immediateVisit: false,
        text:
          `Antes de levar o ${device}, faça estes testes seguros:\n\n` +
          '1. Teste outra tomada.\n' +
          '2. Teste um cabo e um carregador que você saiba que funcionam.\n' +
          '3. Retire a capinha e confira se o plugue entra completamente. Não coloque agulha, metal ou líquido no conector.\n' +
          `4. ${restart}\n` +
          '5. Deixe conectado por 20 a 30 minutos e observe se aparece algum sinal de carga.\n\n' +
          'Se esquentar demais, tiver cheiro estranho ou a bateria estiver estufada, desconecte e não continue testando. Depois me diga: resolveu, não resolveu ou aconteceu algo diferente?'
      };
    case 'no_power':
      return {
        immediateVisit: false,
        text:
          `Vamos testar o ${device} sem abrir o aparelho:\n\n` +
          '1. Use outro cabo, carregador e tomada que estejam funcionando.\n' +
          '2. Deixe carregando por pelo menos 30 minutos.\n' +
          `3. ${restart}\n` +
          '4. Observe se ele vibra, emite som ou mostra algum símbolo na tela.\n\n' +
          'Se houve queda, contato com líquido, aquecimento forte ou bateria estufada, pare os testes. Depois me diga o resultado.'
      };
    case 'screen':
      return {
        immediateVisit: false,
        text:
          `Para verificar a tela do ${device}:\n\n` +
          `1. ${restart}\n` +
          '2. Ligue para o aparelho e veja se ele toca ou vibra.\n' +
          '3. Conecte o carregador e observe sons ou vibrações.\n' +
          '4. Se a tela estiver trincada, não pressione e evite continuar usando.\n\n' +
          'Esses testes não confirmam diagnóstico; apenas ajudam a saber se o aparelho continua ligado. Depois me diga o que aconteceu.'
      };
    case 'battery':
      return {
        immediateVisit: false,
        text:
          `Tente estas verificações no ${device}:\n\n` +
          '1. Reinicie o aparelho.\n' +
          '2. Abra as configurações de bateria e veja qual aplicativo está consumindo mais.\n' +
          '3. Atualize o sistema e os aplicativos.\n' +
          '4. Teste por algumas horas com brilho reduzido e Bluetooth/GPS desligados quando não estiver usando.\n\n' +
          'Se a tampa estiver levantando, a bateria estiver estufada ou o aparelho esquentar muito, desligue e não carregue. Depois me diga se melhorou.'
      };
    case 'audio':
      return {
        immediateVisit: false,
        text:
          `Faça estes testes no ${device}:\n\n` +
          '1. Reinicie o aparelho.\n' +
          '2. Desative o Bluetooth para garantir que o som não esteja indo para outro dispositivo.\n' +
          '3. Teste uma ligação, um áudio gravado e um vídeo.\n' +
          '4. Verifique se a saída de som não está coberta pela capinha. Não introduza objetos nas grades.\n\n' +
          'Me diga em qual desses testes o áudio falhou.'
      };
    case 'camera':
      return {
        immediateVisit: false,
        text:
          `Antes de levar o ${device}:\n\n` +
          '1. Reinicie o aparelho.\n' +
          '2. Limpe apenas a parte externa da lente com pano macio e seco.\n' +
          '3. Teste a câmera no aplicativo original e em outro aplicativo.\n' +
          '4. Confira se há atualização do sistema disponível.\n\n' +
          'Depois me diga se a imagem continua preta, tremendo, desfocada ou se aparece alguma mensagem de erro.'
      };
    case 'software':
      return {
        immediateVisit: false,
        text:
          `Vamos tentar alguns passos no ${device}:\n\n` +
          '1. Reinicie o aparelho.\n' +
          '2. Confira se há espaço livre; tente manter pelo menos 10% do armazenamento disponível.\n' +
          '3. Atualize o sistema e os aplicativos.\n' +
          '4. Observe se o problema acontece em um aplicativo específico.\n\n' +
          'Não restaure o aparelho nem apague dados agora. Me diga se melhorou ou se continua igual.'
      };
    case 'liquid':
      return {
        immediateVisit: true,
        text:
          `Como houve possível contato do ${device} com líquido, não tente carregar nem ligar repetidamente. Não use arroz, secador, calor ou ar comprimido. Se estiver ligado, desligue apenas se conseguir fazer isso normalmente. O recomendado é levar para avaliação o quanto antes. A OS só será criada quando o aparelho for recebido. Posso deixar essa pré-triagem registrada e encaminhar para atendimento? Responda SIM ou NÃO.`
      };
    case 'hazard':
      return {
        immediateVisit: true,
        text:
          `Por segurança, pare de usar e de carregar o ${device}. Não pressione, perfure ou tente abrir a bateria. Mantenha o aparelho longe de calor e materiais inflamáveis e leve para avaliação. A OS só será criada após o recebimento do aparelho. Posso registrar a pré-triagem e encaminhar para atendimento? Responda SIM ou NÃO.`
      };
    default:
      return {
        immediateVisit: false,
        text:
          `Antes de levar o ${device}, reinicie o aparelho, confira atualizações e teste novamente a função que apresentou problema. Não abra o aparelho, não use líquidos e não apague seus dados. Me conte exatamente o que mudou após o teste: resolveu, não resolveu ou apareceu outro sintoma?`
      };
  }
}

function isResolved(command: string) {
  return [
    'resolveu',
    'funcionou',
    'voltou',
    'agora foi',
    'carregou',
    'deu certo',
    'sim resolveu',
    'sim funcionou'
  ].some((item) => command === item || command.includes(item));
}

function isNotResolved(command: string) {
  return [
    'nao resolveu',
    'nao funcionou',
    'continua igual',
    'continua',
    'mesma coisa',
    'segue igual',
    'ainda nao',
    'nao carregou',
    'nao liga'
  ].some((item) => command === item || command.includes(item));
}

function isYes(command: string) {
  return ['sim', 'pode', 'quero', 'pode registrar', 'vou levar', 'pode encaminhar'].some(
    (item) => command === item || command.includes(item)
  );
}

function isNo(command: string) {
  return ['nao', 'agora nao', 'nao quero', 'deixa'].some(
    (item) => command === item || command.includes(item)
  );
}

async function getCompanyId(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const configured = process.env.ASSISTPRO_COMPANY_ID?.trim();
  if (configured) return configured;

  const existing = await supabase
    .from('companies')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id as string;

  const inserted = await supabase
    .from('companies')
    .insert({ name: 'JR Celular', trade_name: 'JR Celular' })
    .select('id')
    .single();

  if (inserted.error || !inserted.data?.id) {
    throw new Error(inserted.error?.message || 'Não foi possível localizar a empresa do AssistPro.');
  }
  return inserted.data.id as string;
}

async function ensureCustomer(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  companyId: string,
  inbound: InboundMessage
) {
  const existing = await supabase
    .from('customers')
    .select('id,name,phone')
    .eq('company_id', companyId)
    .eq('phone', inbound.phone)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) return existing.data;

  const inserted = await supabase
    .from('customers')
    .insert({
      company_id: companyId,
      name: safeCustomerName(inbound.pushName, inbound.phone),
      phone: inbound.phone,
      notes: 'Contato criado automaticamente pela pré-triagem do WhatsApp.'
    })
    .select('id,name,phone')
    .single();

  if (inserted.error || !inserted.data?.id) {
    throw new Error(inserted.error?.message || 'Não foi possível criar o cliente.');
  }
  return inserted.data;
}

async function ensureConversation(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  companyId: string,
  customerId: string,
  phone: string
) {
  const existing = await supabase
    .from('whatsapp_conversations')
    .select('id,human_takeover')
    .eq('company_id', companyId)
    .eq('phone', phone)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    await supabase
      .from('whatsapp_conversations')
      .update({ customer_id: customerId, status: 'open', last_message_at: new Date().toISOString() })
      .eq('id', existing.data.id);
    return existing.data;
  }

  const inserted = await supabase
    .from('whatsapp_conversations')
    .insert({ company_id: companyId, customer_id: customerId, phone, status: 'open' })
    .select('id,human_takeover')
    .single();

  if (inserted.error || !inserted.data?.id) {
    throw new Error(inserted.error?.message || 'Não foi possível criar a conversa.');
  }
  return inserted.data;
}

async function isDuplicate(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  conversationId: string,
  providerMessageId?: string
) {
  if (!providerMessageId) return false;
  const existing = await supabase
    .from('whatsapp_messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('media_url', `evolution:${providerMessageId}`)
    .limit(1)
    .maybeSingle();
  return Boolean(existing.data?.id);
}

async function saveMessage(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  input: {
    companyId: string;
    conversationId: string;
    direction: 'inbound' | 'outbound';
    messageType: 'text' | 'system';
    content: string;
    providerMessageId?: string | null;
    createdAt?: string;
  }
) {
  const inserted = await supabase.from('whatsapp_messages').insert({
    company_id: input.companyId,
    conversation_id: input.conversationId,
    direction: input.direction,
    message_type: input.messageType,
    content: input.content,
    media_url: input.providerMessageId ? `evolution:${input.providerMessageId}` : null,
    ai_generated: input.direction === 'outbound',
    created_at: input.createdAt || new Date().toISOString()
  });

  if (inserted.error) throw new Error(inserted.error.message);
  await supabase
    .from('whatsapp_conversations')
    .update({ last_message_at: input.createdAt || new Date().toISOString() })
    .eq('id', input.conversationId);
}

async function loadSession(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  conversationId: string
): Promise<TrialSession | undefined> {
  const result = await supabase
    .from('whatsapp_messages')
    .select('content')
    .eq('conversation_id', conversationId)
    .eq('message_type', 'system')
    .like('content', `${SESSION_PREFIX}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const content = result.data?.content;
  if (!content?.startsWith(SESSION_PREFIX)) return undefined;
  try {
    return JSON.parse(content.slice(SESSION_PREFIX.length)) as TrialSession;
  } catch {
    return undefined;
  }
}

async function saveSession(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  companyId: string,
  conversationId: string,
  session: TrialSession
) {
  await saveMessage(supabase, {
    companyId,
    conversationId,
    direction: 'outbound',
    messageType: 'system',
    content: `${SESSION_PREFIX}${JSON.stringify(session)}`
  });
}

async function replyAndStore(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  input: { companyId: string; conversationId: string; phone: string; text: string }
) {
  const sent = await sendEvolutionText(input.phone, input.text);
  await saveMessage(supabase, {
    companyId: input.companyId,
    conversationId: input.conversationId,
    direction: 'outbound',
    messageType: 'text',
    content: input.text,
    providerMessageId: sent.providerMessageId
  });
}

async function processInbound(inbound: InboundMessage) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase do AssistPro não está configurado no servidor.');

  const companyId = await getCompanyId(supabase);
  const customer = await ensureCustomer(supabase, companyId, inbound);
  const conversation = await ensureConversation(supabase, companyId, customer.id, inbound.phone);

  if (await isDuplicate(supabase, conversation.id, inbound.providerMessageId)) {
    return { duplicate: true };
  }

  await saveMessage(supabase, {
    companyId,
    conversationId: conversation.id,
    direction: 'inbound',
    messageType: 'text',
    content: inbound.text,
    providerMessageId: inbound.providerMessageId,
    createdAt: inbound.createdAt
  });

  const command = normalizeCommand(inbound.text);
  const activation = ACTIVATION_COMMANDS.includes(command);
  const exit = EXIT_COMMANDS.includes(command);
  const previous = await loadSession(supabase, conversation.id);

  if (exit && previous?.active) {
    const session = { ...previous, active: false, stage: 'closed' as const };
    await saveSession(supabase, companyId, conversation.id, session);
    await replyAndStore(supabase, {
      companyId,
      conversationId: conversation.id,
      phone: inbound.phone,
      text: 'Teste encerrado. Nenhuma ordem de serviço foi criada.'
    });
    return { handled: true, stage: 'closed' };
  }

  if (activation) {
    const session: TrialSession = {
      active: true,
      stage: 'awaiting_device',
      customerName: safeCustomerName(inbound.pushName, inbound.phone),
      phone: inbound.phone
    };
    await saveSession(supabase, companyId, conversation.id, session);
    await replyAndStore(supabase, {
      companyId,
      conversationId: conversation.id,
      phone: inbound.phone,
      text:
        '🧪 Modo de teste JR Celular ativado. Primeiro faremos uma pré-triagem remota; nenhuma OS será criada antes de o aparelho ser entregue. Qual é a marca e o modelo do aparelho? Exemplo: Galaxy A54, iPhone 13 ou Moto G84.'
    });
    return { handled: true, stage: session.stage };
  }

  if (!previous?.active) return { handled: false, reason: 'trial_not_active' };

  if (previous.stage === 'awaiting_device') {
    const deviceModel = compactText(inbound.text).slice(0, 80);
    const session: TrialSession = { ...previous, deviceModel, stage: 'awaiting_issue' };
    await saveSession(supabase, companyId, conversation.id, session);
    await replyAndStore(supabase, {
      companyId,
      conversationId: conversation.id,
      phone: inbound.phone,
      text: `Entendi, é um ${deviceModel}. O que aconteceu e quais sintomas ele apresenta?`
    });
    return { handled: true, stage: session.stage };
  }

  if (previous.stage === 'awaiting_issue') {
    const issue = compactText(inbound.text).slice(0, 300);
    const issueCategory = classifyIssue(issue);
    const session: TrialSession = { ...previous, issue, issueCategory, stage: 'awaiting_test_result' };
    const guidance = troubleshooting(session);
    session.stage = guidance.immediateVisit ? 'awaiting_visit_confirmation' : 'awaiting_test_result';
    await saveSession(supabase, companyId, conversation.id, session);
    await replyAndStore(supabase, {
      companyId,
      conversationId: conversation.id,
      phone: inbound.phone,
      text: guidance.text
    });
    return { handled: true, stage: session.stage, issueCategory };
  }

  if (previous.stage === 'awaiting_test_result') {
    if (isResolved(command)) {
      const session: TrialSession = { ...previous, active: false, stage: 'closed' };
      await saveSession(supabase, companyId, conversation.id, session);
      await replyAndStore(supabase, {
        companyId,
        conversationId: conversation.id,
        phone: inbound.phone,
        text:
          'Ótimo! Como o teste resolveu, não abrimos ordem de serviço. Se o problema voltar, mande TESTE JR para iniciar uma nova pré-triagem.'
      });
      return { handled: true, stage: 'resolved_without_order' };
    }

    if (isNotResolved(command)) {
      const session: TrialSession = {
        ...previous,
        stage: 'awaiting_visit_confirmation'
      };
      await saveSession(supabase, companyId, conversation.id, session);
      await replyAndStore(supabase, {
        companyId,
        conversationId: conversation.id,
        phone: inbound.phone,
        text:
          `Como os testes não resolveram, o próximo passo é levar o ${previous.deviceModel || 'aparelho'} para avaliação presencial. Ainda não existe OS, porque o aparelho não foi recebido. Posso registrar esta pré-triagem e encaminhar a conversa para a equipe confirmar o atendimento? Responda SIM ou NÃO.`
      });
      return { handled: true, stage: session.stage };
    }

    if (command.includes('revisar') || (command.includes('como') && command.includes('avaliar'))) {
      await replyAndStore(supabase, {
        companyId,
        conversationId: conversation.id,
        phone: inbound.phone,
        text:
          'Por enquanto ninguém vai abrir ou revisar fisicamente o aparelho. Primeiro são apenas testes remotos e seguros. Se eles não resolverem, você leva o aparelho; aí a equipe recebe, confere o estado físico e só então abre a OS.'
      });
      return { handled: true, stage: previous.stage };
    }

    await replyAndStore(supabase, {
      companyId,
      conversationId: conversation.id,
      phone: inbound.phone,
      text: 'Depois dos testes, me diga uma destas opções: RESOLVEU, NÃO RESOLVEU ou descreva o que aconteceu de diferente.'
    });
    return { handled: true, stage: previous.stage };
  }

  if (previous.stage === 'awaiting_visit_confirmation') {
    if (isYes(command)) {
      const session: TrialSession = { ...previous, active: false, stage: 'closed' };
      await saveSession(supabase, companyId, conversation.id, session);
      await supabase
        .from('whatsapp_conversations')
        .update({ human_takeover: true, status: 'open' })
        .eq('id', conversation.id);
      await saveMessage(supabase, {
        companyId,
        conversationId: conversation.id,
        direction: 'outbound',
        messageType: 'system',
        content: `PRÉ-TRIAGEM REGISTRADA: ${previous.deviceModel || 'Aparelho'} — ${previous.issue || 'Problema não informado'}`
      });
      await replyAndStore(supabase, {
        companyId,
        conversationId: conversation.id,
        phone: inbound.phone,
        text:
          'Pré-triagem registrada e conversa encaminhada para a equipe. A ordem de serviço ainda não foi criada: ela será aberta somente quando o aparelho for entregue e conferido na assistência.'
      });
      return { handled: true, stage: 'handoff_without_order' };
    }

    if (isNo(command)) {
      const session: TrialSession = { ...previous, active: false, stage: 'closed' };
      await saveSession(supabase, companyId, conversation.id, session);
      await replyAndStore(supabase, {
        companyId,
        conversationId: conversation.id,
        phone: inbound.phone,
        text: 'Sem problema. Nenhuma OS foi criada. Quando precisar, mande TESTE JR para começar novamente.'
      });
      return { handled: true, stage: 'closed_without_order' };
    }

    await replyAndStore(supabase, {
      companyId,
      conversationId: conversation.id,
      phone: inbound.phone,
      text: 'Responda SIM para registrar a pré-triagem e encaminhar à equipe, ou NÃO para encerrar sem criar OS.'
    });
    return { handled: true, stage: previous.stage };
  }

  return { handled: false, reason: 'invalid_stage' };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'AssistPro remote triage webhook',
    activationCommand: 'TESTE JR',
    createsOrderBeforeDelivery: false
  });
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (expectedSecret && providedSecret(request) !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'Webhook não autorizado.' }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const event = String(payload?.event || '').toLowerCase();
  if (event && !event.includes('messages') && !event.includes('send_message')) {
    return NextResponse.json({ ok: true, ignored: true, event });
  }

  const results = [];
  for (const item of normalizeItems(payload)) {
    const inbound = parseInbound(item, payload);
    if (!inbound) continue;

    try {
      results.push({ phone: inbound.phone, ...(await processInbound(inbound)) });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao processar mensagem.';
      console.error('AssistPro remote triage webhook error', message);
      results.push({ phone: inbound.phone, handled: false, error: message });
    }
  }

  return NextResponse.json({ ok: true, received: results.length, results });
}
