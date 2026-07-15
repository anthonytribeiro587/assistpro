# AssistPro

Sistema web para assistência técnica com controle de ordens de serviço, clientes, aparelhos, orçamentos e preparação para integração com WhatsApp/Evolution API.

## Objetivo do MVP

O AssistPro nasce para a JR Celular, mas já foi estruturado pensando em futuramente virar SaaS para outras assistências técnicas.

### Funcionalidades da primeira versão

- Dashboard operacional
- Cadastro de clientes
- Cadastro e acompanhamento de ordens de serviço
- Controle de etapas da OS
- Orçamento e aprovação
- Histórico de movimentações
- Tela de atendimentos WhatsApp simulada/preparada
- Estrutura Supabase com RLS
- Layout responsivo para celular

### Próximas integrações

- Evolution API para WhatsApp
- Consulta automática de OS pelo WhatsApp
- IA para atendimento em texto e áudio
- Voz autorizada do proprietário
- Relatórios financeiros e produtividade dos técnicos

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

## Como rodar

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e preencha as variáveis do Supabase e Evolution.

## Banco de dados

O arquivo `supabase/schema.sql` contém a estrutura inicial do banco.
