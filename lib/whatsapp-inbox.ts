import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedProfile } from '@/lib/supabase-server';

export type InboxMessage = {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  messageType: 'text' | 'audio' | 'image' | 'system';
  content: string;
  mediaUrl: string | null;
  aiGenerated: boolean;
  createdAt: string;
};

export type InboxConversation = {
  id: string;
  phone: string;
  customerName: string;
  status: string;
  humanTakeover: boolean;
  lastMessageAt: string;
  lastMessage: InboxMessage | null;
  messages: InboxMessage[];
};

function customerNameFromRelation(value: unknown, phone: string) {
  if (Array.isArray(value)) {
    const first = value[0] as { name?: unknown } | undefined;
    return String(first?.name || phone);
  }
  if (value && typeof value === 'object') {
    return String((value as { name?: unknown }).name || phone);
  }
  return phone;
}

export async function loadWhatsappInbox(limit = 80): Promise<{
  conversations: InboxConversation[];
  configured: boolean;
  error?: string;
}> {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return {
      conversations: [],
      configured: true,
      error: 'Seu usuário ainda não possui perfil na empresa.'
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      conversations: [],
      configured: false,
      error: 'Supabase administrativo não configurado.'
    };
  }

  try {
    const conversationResult = await supabase
      .from('whatsapp_conversations')
      .select('id,phone,status,human_takeover,last_message_at,customers(name)')
      .eq('company_id', profile.companyId)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (conversationResult.error) throw new Error(conversationResult.error.message);

    const rows = (conversationResult.data || []) as Array<{
      id: string;
      phone: string;
      status: string;
      human_takeover: boolean;
      last_message_at: string;
      customers?: unknown;
    }>;

    const ids = rows.map((row) => row.id);
    const messagesByConversation = new Map<string, InboxMessage[]>();

    if (ids.length) {
      const messageResult = await supabase
        .from('whatsapp_messages')
        .select('id,conversation_id,direction,message_type,content,media_url,ai_generated,created_at')
        .eq('company_id', profile.companyId)
        .in('conversation_id', ids)
        .neq('message_type', 'system')
        .order('created_at', { ascending: true })
        .limit(1200);

      if (messageResult.error) throw new Error(messageResult.error.message);

      for (const item of messageResult.data || []) {
        const message: InboxMessage = {
          id: String(item.id),
          conversationId: String(item.conversation_id),
          direction: item.direction === 'outbound' ? 'outbound' : 'inbound',
          messageType: ['audio', 'image', 'system'].includes(String(item.message_type))
            ? (item.message_type as InboxMessage['messageType'])
            : 'text',
          content: String(item.content || ''),
          mediaUrl: item.media_url ? String(item.media_url) : null,
          aiGenerated: Boolean(item.ai_generated),
          createdAt: String(item.created_at)
        };
        const list = messagesByConversation.get(message.conversationId) || [];
        list.push(message);
        messagesByConversation.set(message.conversationId, list);
      }
    }

    const conversations = rows.map((row) => {
      const messages = messagesByConversation.get(row.id) || [];
      return {
        id: row.id,
        phone: row.phone,
        customerName: customerNameFromRelation(row.customers, row.phone),
        status: row.status,
        humanTakeover: Boolean(row.human_takeover),
        lastMessageAt: row.last_message_at,
        lastMessage: messages.at(-1) || null,
        messages
      } satisfies InboxConversation;
    });

    return { conversations, configured: true };
  } catch (error) {
    return {
      conversations: [],
      configured: true,
      error: error instanceof Error ? error.message : 'Não foi possível carregar as conversas.'
    };
  }
}
