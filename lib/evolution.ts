type SendTextMessageParams = {
  phone: string;
  message: string;
};

type SendAudioMessageParams = {
  phone: string;
  audioUrl: string;
};

type EvolutionConfig = {
  apiUrl: string;
  apiKey: string;
  instance: string;
};

function cleanBaseUrl(value?: string) {
  return String(value || '').trim().replace(/\/$/, '');
}

export function getEvolutionConfig(): EvolutionConfig {
  const apiUrl = cleanBaseUrl(process.env.EVOLUTION_API_URL);
  const apiKey = process.env.EVOLUTION_API_KEY?.trim() || '';
  const instance = process.env.EVOLUTION_INSTANCE?.trim() || process.env.EVOLUTION_INSTANCE_NAME?.trim() || '';

  if (!apiUrl || !apiKey || !instance) {
    throw new Error('Configuração da Evolution API incompleta.');
  }

  return { apiUrl, apiKey, instance };
}

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.response?.message || payload?.message || payload?.error || `HTTP ${response.status}`;
    throw new Error(Array.isArray(detail) ? detail.join(' | ') : String(detail));
  }
  return payload;
}

export async function sendEvolutionText(number: string, text: string) {
  const { apiUrl, apiKey, instance } = getEvolutionConfig();
  const response = await fetch(`${apiUrl}/message/sendText/${encodeURIComponent(instance)}`, {
    method: 'POST',
    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ number, text, options: { delay: 700, presence: 'composing', linkPreview: false } }),
    cache: 'no-store'
  });
  const payload = await parseResponse(response);
  return {
    payload,
    providerMessageId: payload?.key?.id || payload?.data?.key?.id || payload?.result?.key?.id || payload?.id || payload?.messageId || null
  };
}

export async function sendTextMessage({ phone, message }: SendTextMessageParams) {
  return sendEvolutionText(phone, message);
}

export async function sendAudioMessage({ phone, audioUrl }: SendAudioMessageParams) {
  const { apiUrl, apiKey, instance } = getEvolutionConfig();
  const response = await fetch(`${apiUrl}/message/sendWhatsAppAudio/${encodeURIComponent(instance)}`, {
    method: 'POST',
    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ number: phone, audio: audioUrl }),
    cache: 'no-store'
  });
  return parseResponse(response);
}

export async function getEvolutionConnectionState() {
  const { apiUrl, apiKey, instance } = getEvolutionConfig();
  const response = await fetch(`${apiUrl}/instance/connectionState/${encodeURIComponent(instance)}`, {
    headers: { apikey: apiKey },
    cache: 'no-store'
  });
  const payload = await response.json().catch(() => ({}));
  const state = payload?.instance?.state || payload?.state || payload?.connectionStatus || null;
  return { ok: response.ok, status: response.status, state, connected: String(state || '').toLowerCase() === 'open' };
}

export async function configureEvolutionWebhook(webhookUrl: string) {
  const { apiUrl, apiKey, instance } = getEvolutionConfig();
  const response = await fetch(`${apiUrl}/webhook/set/${encodeURIComponent(instance)}`, {
    method: 'POST',
    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE']
      }
    }),
    cache: 'no-store'
  });
  return parseResponse(response);
}
