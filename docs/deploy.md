# Deploy do AssistPro

## 1. Supabase

1. Crie um projeto novo no Supabase.
2. Abra SQL Editor.
3. Rode o arquivo `supabase/schema.sql`.
4. Copie a URL do projeto e a anon key.
5. Guarde a service role key somente em ambiente seguro de servidor.

## 2. Vercel

1. Importe o repositório `anthonytribeiro587/assistpro`.
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `EVOLUTION_API_URL`
   - `EVOLUTION_API_KEY`
   - `EVOLUTION_INSTANCE_NAME`
3. Faça o deploy.

## 3. Evolution API

Use a mesma Evolution de testes inicialmente.

Webhook sugerido:

```text
https://SEU-DOMINIO.vercel.app/api/webhooks/evolution
```

## 4. Ordem recomendada de desenvolvimento

1. Autenticação Supabase.
2. CRUD de clientes.
3. CRUD de aparelhos.
4. CRUD de OS.
5. Histórico de mudança de status.
6. Envio de mensagens de status via WhatsApp.
7. IA para perguntas frequentes.
8. Voz autorizada do JR.
