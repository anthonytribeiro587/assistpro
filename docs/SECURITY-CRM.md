# Segurança do CRM AssistPro

## Camadas implementadas

- Login real com Supabase Auth.
- Sessão persistida em cookies pelo `@supabase/ssr`.
- Middleware protegendo páginas administrativas e APIs internas.
- Validação adicional da sessão no layout do CRM.
- Webhooks externos separados das rotas administrativas e protegidos por segredo.
- `SUPABASE_SERVICE_ROLE_KEY`, Evolution API e segredos do Make utilizados somente no servidor.
- Alterações de parâmetros da IA exigem sessão válida e `ASSISTPRO_ADMIN_SECRET`.
- Cabeçalhos contra framing, MIME sniffing e permissões indevidas.
- Deduplicação de mensagens recebidas por identificador da Evolution.
- Persistência do inbox no Supabase antes de encaminhar a mensagem ao Make.

## Ativação

1. Garanta as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` na Vercel.
2. Mantenha `SUPABASE_SERVICE_ROLE_KEY`, `EVOLUTION_API_KEY`, `WHATSAPP_WEBHOOK_SECRET`, `MAKE_WEBHOOK_API_KEY`, `MAKE_CALLBACK_SECRET` e `ASSISTPRO_ADMIN_SECRET` apenas como variáveis de servidor.
3. Execute `supabase/migrations/20260723190000_authenticated_profiles.sql`.
4. Use um usuário criado em Supabase Authentication para entrar no CRM.
5. Confirme que o webhook da Evolution continua apontando para `/api/whatsapp/orchestrator` com o segredo configurado.

## Observação

O projeto atual está configurado para uma única empresa. A estrutura já mantém `company_id` e RLS para uma futura evolução multiempresa, mas a seleção da empresa deve ser revisada antes de transformar o AssistPro em SaaS público.
