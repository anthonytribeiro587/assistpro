# AssistPro — n8n, IA e respostas em áudio

## Situação atual

O webhook do WhatsApp entra primeiro no AssistPro, que valida o segredo e decide o modo de execução:

- `N8N_WEBHOOK_URL` + `N8N_WEBHOOK_SECRET` configurados: encaminha ao n8n.
- sem n8n configurado: usa somente o fluxo determinístico de pré-triagem segura.

O fluxo determinístico é uma contingência. Ele não deve ser apresentado como IA.

## Arquitetura-alvo

```text
WhatsApp
  -> Evolution API
  -> AssistPro /api/whatsapp/orchestrator
  -> n8n
       -> normalização da mensagem
       -> download/transcrição quando a entrada for áudio
       -> recuperação do contexto da conversa
       -> Gemini/OpenAI para compreender e redigir
       -> validação de segurança e decisão de handoff
       -> ElevenLabs para gerar a resposta em áudio
       -> upload temporário do áudio em Storage
  -> AssistPro /api/n8n/respond
  -> Evolution API
  -> WhatsApp do cliente
```

## Responsabilidades

### AssistPro

- validar webhooks e callbacks por segredo;
- manter credenciais fora do navegador;
- registrar clientes, conversas, mensagens e pré-triagens;
- impedir criação de OS antes do recebimento físico;
- enviar texto ou áudio pela Evolution;
- manter fallback seguro quando o n8n estiver indisponível.

### n8n

- orquestrar o atendimento;
- interpretar texto livre e áudio;
- manter o prompt e as regras operacionais versionados;
- chamar o modelo de linguagem;
- gerar o áudio e chamar o callback do AssistPro;
- encaminhar para humano quando houver risco, reclamação, garantia, preço fechado ou baixa confiança.

## Fluxo sugerido no n8n

1. **Webhook** recebe o envelope do AssistPro.
2. **IF** valida `x-assistpro-n8n-secret`.
3. **Code** extrai telefone, nome, tipo da mensagem, ID e conteúdo.
4. **Switch** separa texto e áudio.
5. Para áudio: **HTTP Request** baixa a mídia e envia para transcrição.
6. **Supabase** busca contexto e últimas mensagens da conversa.
7. **AI Agent / modelo de chat** produz JSON estruturado:

```json
{
  "intent": "remote_test | test_result | handoff | safety",
  "replyText": "texto natural e curto",
  "replyAsAudio": true,
  "issueCategory": "charging",
  "resolved": false,
  "requiresHuman": false,
  "safeAction": "continue | stop_using | visit_store"
}
```

8. **IF** aplica regras rígidas de segurança antes de enviar.
9. Se `replyAsAudio=true`, **HTTP Request** chama ElevenLabs e salva o MP3/Opus em URL HTTPS temporária.
10. **HTTP Request** chama `/api/n8n/respond` com o segredo e o texto/áudio.
11. **Supabase** registra execução, modelo, latência e eventual erro.

## Prompt obrigatório

O atendente deve:

- falar como atendente da JR Celular, de modo natural e direto;
- fazer uma pergunta por vez;
- sugerir apenas testes simples, reversíveis e seguros;
- nunca mandar abrir o aparelho, usar metal, líquido, arroz, calor ou ar comprimido;
- nunca afirmar diagnóstico, preço, prazo, peça disponível ou garantia sem validação humana;
- em líquido, bateria estufada, fumaça, cheiro de queimado ou calor anormal: mandar interromper uso/carga e encaminhar;
- não criar OS antes de o aparelho ser recebido e conferido;
- registrar pré-triagem e fazer handoff quando os testes não resolverem;
- entender negações corretamente: `não resolveu` nunca pode ser tratado como `resolveu`.

## Variáveis

```env
N8N_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL=eleven_flash_v2_5
```

## Áudio

Para reproduzir a voz do responsável da JR Celular, usar somente uma voz criada com autorização expressa e gravações fornecidas por ele. O áudio gerado deve ser curto, normalmente entre 10 e 35 segundos, e o texto equivalente deve continuar registrado no banco para auditoria e acessibilidade.

## Callback do AssistPro

O n8n envia a resposta para:

```text
POST /api/n8n/respond
x-assistpro-n8n-secret: <segredo>
```

Exemplo:

```json
{
  "phone": "5551999999999",
  "text": "Entendi. Vamos fazer um teste simples antes de você levar o aparelho.",
  "audioUrl": "https://storage.exemplo/resposta.ogg",
  "sendTextWithAudio": false
}
```

O callback aceita texto, áudio ou ambos, envia pela Evolution e registra a saída na conversa do AssistPro.
