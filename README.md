# AssistPro

Sistema web para assistência técnica com controle de ordens de serviço, clientes, aparelhos, orçamentos e preparação para integração com WhatsApp/Evolution API.

## Objetivo do MVP

O AssistPro nasce para a JR Celular, mas já foi estruturado pensando em futuramente virar SaaS para outras assistências técnicas.

## Funcionalidades já estruturadas

- Dashboard operacional responsivo
- Lista de ordens de serviço
- Detalhe de OS com linha do tempo de status
- Painel de atendimentos WhatsApp
- Simulação de chat com IA e áudio
- Estrutura inicial para Evolution API
- Schema Supabase multiempresa com RLS
- Layout mobile-first em dark mode

## Próximas integrações

- Autenticação Supabase real
- CRUD completo de clientes, aparelhos e OS
- Storage para fotos do aparelho
- Evolution API recebendo e enviando mensagens reais
- IA para classificar intenção do cliente
- Transcrição de áudio do cliente
- Resposta em áudio com voz autorizada do JR
- Relatórios financeiros e produtividade dos técnicos

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Vercel
- Evolution API

## Como rodar

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e preencha as variáveis do Supabase e Evolution.

## Banco de dados

Rode o arquivo `supabase/schema.sql` no SQL Editor do Supabase.

## Deploy

1. Crie o projeto no Supabase.
2. Rode o schema SQL.
3. Crie um projeto na Vercel conectado a este repositório.
4. Configure as variáveis de ambiente.
5. Faça o deploy.
