type SendTextMessageParams = {
  phone: string;
  message: string;
};

type SendAudioMessageParams = {
  phone: string;
  audioUrl: string;
};

const evolutionUrl = process.env.EVOLUTION_API_URL;
const evolutionApiKey = process.env.EVOLUTION_API_KEY;
const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME;

function assertEvolutionConfig() {
  if (!evolutionUrl || !evolutionApiKey || !evolutionInstance) {
    throw new Error('Configuração da Evolution API incompleta.');
  }
}

export async function sendTextMessage({ phone, message }: SendTextMessageParams) {
  assertEvolutionConfig();

  const response = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: evolutionApiKey as string
    },
    body: JSON.stringify({
      number: phone,
      text: message
    })
  });

  if (!response.ok) {
    throw new Error('Falha ao enviar mensagem pela Evolution API.');
  }

  return response.json();
}

export async function sendAudioMessage({ phone, audioUrl }: SendAudioMessageParams) {
  assertEvolutionConfig();

  const response = await fetch(`${evolutionUrl}/message/sendWhatsAppAudio/${evolutionInstance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: evolutionApiKey as string
    },
    body: JSON.stringify({
      number: phone,
      audio: audioUrl
    })
  });

  if (!response.ok) {
    throw new Error('Falha ao enviar áudio pela Evolution API.');
  }

  return response.json();
}
